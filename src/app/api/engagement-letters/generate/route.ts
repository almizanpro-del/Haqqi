// POST /api/engagement-letters/generate
// Fills an engagement letter template with case/lawyer data (PRD §5.3.2 + Appendix A)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { ENGAGEMENT_LETTER_TEMPLATES } from "@/lib/legal/engagement-templates";

interface GenerateRequest {
  lawyerId: string;
  caseId?: string;
  templateType: "contingency" | "hourly_fixed";
  language?: "ar" | "en";
  variables?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateRequest;
  const { lawyerId, caseId, templateType, language = "ar", variables = {} } = body;

  if (!lawyerId || !templateType) {
    return NextResponse.json({ error: "lawyerId and templateType required" }, { status: 400 });
  }

  const lawyer = await db.lawyer.findUnique({ where: { id: lawyerId } });
  if (!lawyer) return NextResponse.json({ error: "lawyer not found" }, { status: 404 });

  const user = await getDemoUser();

  const template = ENGAGEMENT_LETTER_TEMPLATES.find(
    (t) => t.type === templateType && t.language === language,
  );
  if (!template) {
    return NextResponse.json({ error: "template not found" }, { status: 404 });
  }

  // Merge defaults with provided variables
  const mergedVars: Record<string, string> = {
    lawyer_name: lawyer.name,
    lawyer_address: lawyer.firm ?? lawyer.location ?? "—",
    user_name: user.name ?? user.email ?? "—",
    user_id: "—",
    fee_percentage: "15",
    hourly_rate: "50",
    fixed_amount: "500",
    stage: "—",
    scope: language === "ar" ? "تفاوض/صياغة/تقاضي" : "Negotiation/Drafting/Litigation",
    billing_cycle_days: "30",
    payment_due_days: "7",
    ...variables,
  };

  // Replace {{placeholders}}
  let filled = template.content;
  for (const [key, value] of Object.entries(mergedVars)) {
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  const letter = await db.engagementLetter.create({
    data: {
      lawyerId,
      userId: user.id,
      caseId: caseId ?? null,
      templateType,
      content: filled,
      variablesJson: JSON.stringify(mergedVars),
      status: "draft",
    },
  });

  return NextResponse.json({ letter: safeJson(letter) });
}
