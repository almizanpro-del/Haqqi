// POST /api/drafts/generate
// Generates a draft from a case intake + template (PRD §5.2.1)
// Output: draft enters `pending_review` automatically (PRD §7.1)
// Every legal claim carries at least one citation from the RAG layer (PRD §5.2.1)
import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getDemoUser, getReviewerLawyer, safeJson, parseJsonField } from "@/lib/api-helpers";
import { redactPii } from "@/lib/pii-redaction";
import { audit } from "@/lib/audit";

interface GenerateRequest {
  caseId: string;
  templateType: string;
  plainArabic?: boolean; // PRD §5.2.1: toggle plain vs legal Arabic
}

const TEMPLATE_LABELS: Record<string, { ar: string; en: string }> = {
  insurer_demand: { ar: "خطاب مطالبة لشركة التأمين", en: "Insurer Demand Letter" },
  cbj_complaint: { ar: "شكوى للبنك المركزي", en: "CBJ Complaint" },
  statement_of_claim: { ar: "صحيفة دعوى", en: "Statement of Claim" },
  settlement_release: { ar: "اتفاق تسوية وتنازل", en: "Settlement & Release Agreement" },
  power_of_attorney: { ar: "توكيل خاص", en: "Limited Power of Attorney" },
  evidence_list: { ar: "قائمة الأدلة والتسلسل الزمني", en: "Evidence List & Chronology" },
  expert_request: { ar: "طلب تعيين خبير", en: "Expert Appointment Request" },
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateRequest;
  const { caseId, templateType, plainArabic = true } = body;
  if (!caseId || !templateType) {
    return NextResponse.json({ error: "caseId and templateType required" }, { status: 400 });
  }

  const caseRow = await db.case.findUnique({ where: { id: caseId } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const template = await db.legalTemplate.findFirst({
    where: { templateType, isActive: true },
    orderBy: { version: "desc" },
  });
  if (!template) return NextResponse.json({ error: "template not found or inactive" }, { status: 404 });

  // Retrieve verified legal documents (RAG corpus — PRD §6.5) for citation retrieval
  const ragDocs = await db.legalDocument.findMany({ where: { lawyerVerified: true } });
  const ragContext = ragDocs
    .map((d) => `- [${d.articleId}] ${d.title}: ${d.content}`)
    .join("\n");

  const intake = parseJsonField<{ stages: Record<string, Record<string, unknown>> }>(
    caseRow.intakeJson,
    { stages: {} },
  );

  const systemPrompt = `You are "Haqqi" (حقي), a bilingual AI legal drafting assistant for car-accident victims in Jordan.

Your job: take the case intake data and the document template below, and produce a finished draft IN ARABIC that:
1. Faithfully uses every fact in the intake data — do NOT invent facts.
2. Cites at least one legal source from the provided RAG corpus, using the article_id in the format [Article: <article_id>].
3. Uses ${plainArabic ? "PLAIN Arabic (عربية مبسطة)" : "LEGAL Arabic (عربية قانونية)"} register.
4. Maintains a respectful, professional tone.
5. Leaves placeholders like {{unfilled}} only for facts the user did not provide.

OUTPUT FORMAT (strict JSON, no markdown fence):
{
  "content": "<the full drafted document in Arabic, ready for the user to review>",
  "citations": [{"source": "<source>", "article_id": "<article_id>", "topic": "<topic>", "language": "ar"}],
  "notes": "<short note to the user about what's still missing or needs confirmation>"
}`;

  const userPrompt = `Template type: ${templateType} (${TEMPLATE_LABELS[templateType]?.ar ?? templateType})
Plain Arabic: ${plainArabic}

CASE INTAKE DATA (JSON):
${JSON.stringify(intake.stages, null, 2)}

TOP-LEVEL CASE FACTS:
- Accident date: ${caseRow.accidentDate?.toISOString?.() ?? "غير محدد"}
- Location: ${caseRow.location ?? "غير محدد"}
- Accident type: ${caseRow.accidentType ?? "غير محدد"}
- Injuries: ${caseRow.injuries ?? "غير محدد"}
- Other party insured: ${caseRow.otherPartyInsured ?? "غير محدد"}

TEMPLATE (MDX with {{placeholders}}):
${template.contentMdx}

RAG LEGAL CORPUS (verified):
${ragContext || "(no verified documents yet)"}

Now produce the draft. Remember: strict JSON only, no markdown fences.`;

  // C5: Redact PII from intake data before sending to LLM
  const redaction = redactPii(userPrompt, "minimal");
  const safePrompt = redaction.found.length > 0 ? redaction.redacted : userPrompt;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: safePrompt },
      ],
      temperature: 0.3,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    } as Record<string, unknown>);

    const raw: string = completion?.choices?.[0]?.message?.content ?? "";
    let parsed: { content?: string; citations?: unknown[]; notes?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { content: raw, citations: [], notes: "" };
    }

    const user = await getDemoUser();
    const reviewer = await getReviewerLawyer();

    // Count existing drafts of this type to bump the version
    const existingCount = await db.draft.count({
      where: { caseId, userId: user.id, templateType },
    });

    const draft = await db.draft.create({
      data: {
        caseId,
        userId: user.id,
        templateType,
        version: existingCount + 1,
        content: parsed.content ?? "",
        plainArabicVersion: plainArabic ? (parsed.content ?? "") : null,
        legalArabicVersion: !plainArabic ? (parsed.content ?? "") : null,
        citations: JSON.stringify(parsed.citations ?? []),
        reviewStatus: "pending_review",
      },
    });

    // Audit log entry (PRD §5.2.1: full audit log of generation/edit/review/send events)
    await db.reviewLog.create({
      data: { draftId: draft.id, action: "generated", actorId: user.id, comments: `template=${templateType} v${template.version}` },
    });

    // C6: Canonical audit log + LLM call audit (with PII redaction count)
    await audit.draftGenerated(draft.id, caseId, user.id, templateType);
    await audit.llmCall("drafting", user.id, redaction.found.length, caseId);

    return NextResponse.json({
      draft: safeJson(draft),
      notes: parsed.notes ?? "",
      reviewerAvailable: !!reviewer,
    });
  } catch (err) {
    console.error("[/api/drafts/generate] error:", err);
    return NextResponse.json({ error: "draft_generation_failed" }, { status: 500 });
  }
}
