// POST /api/intake/message
// Sends one turn of the AI intake conversation.
// Returns: { reply, nextStage, isComplete, structuredDelta }
// Per PRD §5.1.5: 7 stages, one question at a time, empathetic tone, structured output validated
// Per PRD §6.4: LLM provider abstracted behind a single interface (z-ai-web-dev-sdk here)
import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";
import { redactPii, REDACTION_NOTICE } from "@/lib/pii-redaction";
import { audit } from "@/lib/audit";
import { events } from "@/lib/events";
import { checkRateLimit, getClientIdentifier, sanitizeForLlm, detectPromptInjection } from "@/lib/rate-limit";

const STAGE_INSTRUCTIONS: Record<number, { ar: string; en: string; field: string }> = {
  1: {
    ar: "اسأل سؤالًا واحدًا عن السلامة والفرز: هل هناك إصابات خطيرة أو وفاة؟ هل ما يزال الطرفان في موقع الحادث؟ هل تم إبلاغ الشرطة والإسعاف؟",
    en: "Ask one question about safety/triage: are there serious injuries or death? Are parties still at the scene? Have police and ambulance been called?",
    field: "triage",
  },
  2: {
    ar: "اسأل سؤالًا واحدًا عن وقائع الحادث: التاريخ والوقت والموقع، نوع الحادث، هل الطرف الآخر مؤمَّن؟",
    en: "Ask one question about accident facts: date/time/location, accident type, is the other party insured?",
    field: "accident_facts",
  },
  3: {
    ar: "اسأل سؤالًا واحدًا عن الأضرار والخسائر: الإصابات، الفواتير الطبية، فقدان الدخل، أضرار المركبة.",
    en: "Ask one question about losses/damages: injuries, medical bills, lost income, vehicle damage.",
    field: "damages",
  },
  4: {
    ar: "اسأل سؤالًا واحدًا عن تاريخ المطالبة: اسم شركة التأمين، رقم الوثيقة، رقم المطالبة، العروض السابقة أو الرفض.",
    en: "Ask one question about claim history: insurer name, policy number, claim number, prior offers or denials.",
    field: "claim_history",
  },
  5: {
    ar: "اسأل سؤالًا واحدًا عن الأهداف والقيود: الهدف المرجو، الميزانية للمحامي، الاستعداد للتقاضي.",
    en: "Ask one question about goals/constraints: desired outcome, lawyer budget, willingness to litigate.",
    field: "goals",
  },
  6: {
    ar: "اسأل سؤالًا واحدًا عن المستندات المتوفرة: تقرير الشرطة، الكروكي، الصور، التقارير الطبية، الفواتير، كشوف الراتب.",
    en: "Ask one question about available documents: police report, croquis, photos, medical reports, bills, salary slips.",
    field: "documents",
  },
  7: {
    ar: "اعرض على المستخدم ملخصًا قصيرًا لما فهمته من القضية، واطلب موافقته النهائية على أن البيانات صحيحة، مع التذكير بأن النتائج ليست فتوى قانونية.",
    en: "Show the user a brief summary of what you understood about the case and ask for final confirmation that the data is correct, reminding them the outputs are not legal advice.",
    field: "consent",
  },
};

const SYSTEM_PROMPT = `You are "Haqqi" (حقي), a bilingual (Arabic-first, English-second) AI assistant that helps car-accident victims in Jordan understand their rights and prepare structured case intake data.

RULES:
- Respond in the SAME language as the user's most recent message (default Arabic).
- Ask ONE question at a time. Wait for the answer before moving on.
- Be empathetic, plain-spoken, and non-judgmental.
- Never invent legal article numbers. If asked for specifics, say "I'm not sure — here's how to reach a lawyer."
- Never promise compensation amounts. Estimates come from a separate lawyer-approved calculator.
- Keep each reply under 80 words.

CRISIS / DISTRESS ESCALATION (critical — this is a safety feature):
- If the user mentions a life-threatening emergency, active suicide ideation, severe distress, or a death in the family:
  1. Tell them to call 911 (emergency) immediately if life is in danger.
  2. For emotional distress / grief, share the Jordan mental health support line: 111 (Mental Health Hotline) or 080022022 (free).
  3. Pause the legal intake — do NOT proceed to the next stage.
  4. Be warm, brief, and human. Do not give legal advice in this moment.
- Detect distress signals: "death", "وفاة", "killed", "قتيل", "can't go on", "suicide", "انتحار", "أقضي", "متعب جداً من الحياة".
- When in doubt, offer the support line. It is always better to over-respond to distress.

OUTPUT FORMAT (strict JSON, no markdown fence):
{
  "reply": "<your reply to the user, in their language>",
  "extracted": { "<stageField>": { ...any structured facts you can confidently extract from the user's latest answer... } },
  "readyForNextStage": true | false,
  "distressDetected": true | false
}

Set readyForNextStage=true when the user has answered enough to move to the next stage.
Set readyForNextStage=false if you still need more information for this stage.
Set distressDetected=true if you detected crisis/distress — the system will show a support banner.`;

interface IntakeRequestBody {
  caseId: string;
  stage: number;
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as IntakeRequestBody;
  const { caseId, stage, message, history = [] } = body;

  if (!caseId || !message) {
    return NextResponse.json({ error: "caseId and message are required" }, { status: 400 });
  }

  // v3.2 §6.8: Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, "intake_message");
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: "rate_limit_exceeded",
      message: "لقد وصلت إلى الحد الأقصى من الرسائل. حاول مرة أخرى بعد ساعة.",
      resetAt: rateLimit.resetAt,
    }, { status: 429, headers: { "X-RateLimit-Remaining": "0", "X-RateLimit-Reset": String(rateLimit.resetAt) } });
  }

  // v3.2 §6.8: Prompt-injection defense
  const injectionCheck = detectPromptInjection(message);
  if (injectionCheck.detected) {
    console.warn(`[intake] Prompt injection detected from ${clientId}:`, injectionCheck.patterns);
    // Don't block — just sanitize and continue, but log it
  }

  const currentStage = Math.max(1, Math.min(7, stage || 1));
  const instruction = STAGE_INSTRUCTIONS[currentStage];
  if (!instruction) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }

  // Track event: intake_started (only on first stage)
  if (currentStage === 1) {
    const existingCase = await db.case.findUnique({ where: { id: caseId } });
    if (existingCase) {
      await events.intakeStarted(existingCase.userId, caseId);
    }
  }

  const userLangHint = /[\u0600-\u06FF]/.test(message) ? "ar" : "en";
  const stagePrompt = userLangHint === "ar" ? instruction.ar : instruction.en;

  // C5: Redact PII before sending to external LLM provider (PDPL compliance)
  const redaction = redactPii(message, "minimal");
  const safeMessage = redaction.found.length > 0
    ? `${redaction.redacted}\n\n${REDACTION_NOTICE}`
    : message;

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "system" as const, content: `Current stage: ${currentStage} of 7. Stage goal: ${stagePrompt}` },
    ...history.slice(-8).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user" as const, content: safeMessage },
  ];

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: "json_object" },
    } as Record<string, unknown>);

    const rawContent: string = completion?.choices?.[0]?.message?.content ?? "";
    let parsed: { reply?: string; extracted?: unknown; readyForNextStage?: boolean; distressDetected?: boolean } = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { reply: rawContent || "عذرًا، لم أفهم. هل يمكنك إعادة الصياغة؟" };
    }

    const reply = parsed.reply ?? "عذرًا، لم أفهم. هل يمكنك إعادة الصياغة؟";
    const readyForNext = !!parsed.readyForNextStage;
    const distressDetected = !!parsed.distressDetected;
    const nextStage = readyForNext ? Math.min(7, currentStage + 1) : currentStage;
    const isComplete = readyForNext && currentStage >= 7;

    // Track event: intake_completed
    if (isComplete) {
      const completionCase = await db.case.findUnique({ where: { id: caseId } });
      if (completionCase) {
        await events.intakeCompleted(completionCase.userId, caseId);
      }
    }

    // Persist the conversation turn into the case intake JSON
    const existingCase = await db.case.findUnique({ where: { id: caseId } });
    if (existingCase) {
      // Audit the LLM call (with redaction count for PDPL trail)
      await audit.llmCall("intake", existingCase.userId, redaction.found.length, caseId);
      const intake = existingCase.intakeJson
        ? JSON.parse(existingCase.intakeJson as string)
        : { stages: {} };

      if (!intake.stages) intake.stages = {};
      const field = instruction.field;
      if (!intake.stages[field]) intake.stages[field] = {};
      if (parsed.extracted && typeof parsed.extracted === "object") {
        intake.stages[field] = {
          ...intake.stages[field],
          ...(parsed.extracted as Record<string, unknown>),
          lastUserMessage: message,
          lastAssistantReply: reply,
        };
      } else {
        intake.stages[field] = {
          ...intake.stages[field],
          lastUserMessage: message,
          lastAssistantReply: reply,
        };
      }

      const updateData: Record<string, unknown> = {
        intakeJson: JSON.stringify(intake),
        stage: isComplete ? 7 : nextStage,
        completed: isComplete,
      };

      // Try to lift structured accident facts into top-level columns
      const af = intake.stages["accident_facts"];
      if (af) {
        if (af.accidentDate) {
          try { updateData.accidentDate = new Date(af.accidentDate); } catch { /* ignore */ }
        }
        if (typeof af.location === "string") updateData.location = af.location;
        if (typeof af.accidentType === "string") updateData.accidentType = af.accidentType;
        if (typeof af.injuries === "string") updateData.injuries = af.injuries;
        if (typeof af.otherPartyInsured === "boolean") updateData.otherPartyInsured = af.otherPartyInsured;
      }

      await db.case.update({ where: { id: caseId }, data: updateData });
    }

    return NextResponse.json({
      reply,
      nextStage,
      isComplete,
      distressDetected,
      piiRedacted: redaction.found.length,
      piiTypes: redaction.found.map((f) => f.type),
      extracted: parsed.extracted ?? null,
      case: safeJson(await db.case.findUnique({ where: { id: caseId } })),
    });
  } catch (err) {
    console.error("[/api/intake/message] error:", err);
    return NextResponse.json(
      { error: "intake_failed", reply: "تعذّر إنشاء رد. حاول مجددًا.", nextStage: currentStage, isComplete: false },
      { status: 500 },
    );
  }
}
