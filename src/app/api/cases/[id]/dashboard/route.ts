// GET /api/cases/[id]/dashboard — unified overview of a case
// Aggregates: case facts, intake stages, calculator estimate, drafts, evidence,
// claim logs (with bad-faith pattern detection), timeline, deadlines, court filings,
// engagement letters, handoff packets.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";
import type { LegalRulesConfig } from "@/lib/legal/seed";

interface BadFaithPattern {
  type: string;
  count: number;
  severity: "low" | "medium" | "high";
  labelAr: string;
  labelEn: string;
  recommendationAr: string;
  recommendationEn: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caseRow = await db.case.findUnique({
    where: { id },
    include: {
      drafts: { orderBy: { createdAt: "desc" } },
      evidence: { orderBy: { uploadedAt: "desc" } },
      claimLogs: { orderBy: { contactDate: "desc" } },
      courtFilings: { orderBy: { createdAt: "desc" } },
      engagementLetters: { orderBy: { createdAt: "desc" }, include: { lawyer: true } },
      handoffPackets: { orderBy: { sentAt: "desc" }, include: { lawyer: true } },
    },
  });

  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const intake = parseJsonField<{ stages: Record<string, Record<string, unknown>> }>(
    caseRow.intakeJson,
    { stages: {} },
  );

  // Run the calculator logic inline (reuse the rules config)
  const rulesRow = await db.legalRulesConfig.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  const rules = rulesRow
    ? parseJsonField<LegalRulesConfig>(rulesRow.rulesJson, {} as LegalRulesConfig)
    : null;

  // Bad-faith pattern detection
  const badFaithByType = new Map<string, number>();
  for (const log of caseRow.claimLogs) {
    if (log.badFaithFlag && log.badFaithFlag !== "none") {
      badFaithByType.set(log.badFaithFlag, (badFaithByType.get(log.badFaithFlag) ?? 0) + 1);
    }
    if (!log.outcome || /no response|لم يرد|لم يتم|silence|ignored/i.test(log.outcome)) {
      badFaithByType.set("delay", (badFaithByType.get("delay") ?? 0) + 1);
    }
  }

  const BAD_FAITH_META: Record<string, Omit<BadFaithPattern, "count">> = {
    delay: {
      type: "delay",
      severity: "medium",
      labelAr: "تأخير متكرر",
      labelEn: "Repeated delays",
      recommendationAr: "وثّق كل تأخير. بعد ١٥ يومًا من رد الشركة، يمكن تقديم شكوى للبنك المركزي.",
      recommendationEn: "Document each delay. After 15 days with no response, file a CBJ complaint.",
    },
    unnecessary_request: {
      type: "unnecessary_request",
      severity: "medium",
      labelAr: "طلبات غير ضرورية",
      labelEn: "Unnecessary requests",
      recommendationAr: "اطلب كتابيًا تبرير كل طلب. لا تُسلّم المستندات الأصلية.",
      recommendationEn: "Request written justification for each request. Do not surrender original documents.",
    },
    lowball: {
      type: "lowball",
      severity: "high",
      labelAr: "عرض متدنٍّ",
      labelEn: "Lowball offer",
      recommendationAr: "قارن العرض بنطاق حاسبة الحقوق. ارفض كتابيًا مع ذكر النطاق التقديري.",
      recommendationEn: "Compare the offer to the Rights Calculator range. Refuse in writing citing the estimated range.",
    },
    misrepresentation: {
      type: "misrepresentation",
      severity: "high",
      labelAr: "تضليل",
      labelEn: "Misrepresentation",
      recommendationAr: "وثّق الادعاء. استشر محاميًا فورًا — قد يكون أساسًا لشكوى لدى البنك المركزي.",
      recommendationEn: "Document the claim. Consult a lawyer immediately — may be grounds for a CBJ complaint.",
    },
  };

  const badFaithPatterns: BadFaithPattern[] = Array.from(badFaithByType.entries())
    .map(([type, count]) => ({
      ...(BAD_FAITH_META[type] ?? BAD_FAITH_META.delay),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Document checklist progress
  const requiredDocTypes = ["police_report", "croquis", "medical", "bill"];
  const uploadedTypes = new Set(caseRow.evidence.map((e) => e.type));
  const checklist = requiredDocTypes.map((type) => ({
    type,
    uploaded: uploadedTypes.has(type),
  }));
  const checklistProgress = (checklist.filter((c) => c.uploaded).length / requiredDocTypes.length) * 100;

  // Drafts summary
  const draftsByStatus = {
    pending_review: caseRow.drafts.filter((d) => d.reviewStatus === "pending_review").length,
    approved: caseRow.drafts.filter((d) => d.reviewStatus === "approved").length,
    rejected: caseRow.drafts.filter((d) => d.reviewStatus === "rejected").length,
    sent: caseRow.drafts.filter((d) => d.reviewStatus === "sent").length,
  };

  // Deadlines
  const accidentDate = caseRow.accidentDate ?? new Date();
  const now = new Date();
  const daysSinceAccident = Math.floor((now.getTime() - accidentDate.getTime()) / (1000 * 60 * 60 * 24));
  const deadlines = rules?.deadlines
    ? {
        statuteOfLimitations: {
          total: rules.deadlines.statuteOfLimitationsDays,
          remaining: Math.max(0, rules.deadlines.statuteOfLimitationsDays - daysSinceAccident),
          percentElapsed: Math.min(100, (daysSinceAccident / rules.deadlines.statuteOfLimitationsDays) * 100),
        },
        insurerResponse: {
          total: rules.deadlines.insurerResponseDays,
          remaining: Math.max(0, rules.deadlines.insurerResponseDays - daysSinceAccident),
          percentElapsed: Math.min(100, (daysSinceAccident / rules.deadlines.insurerResponseDays) * 100),
        },
        cbjComplaint: {
          total: rules.deadlines.cbjComplaintWindowDays,
          remaining: Math.max(0, rules.deadlines.cbjComplaintWindowDays - daysSinceAccident),
          percentElapsed: Math.min(100, (daysSinceAccident / rules.deadlines.cbjComplaintWindowDays) * 100),
        },
      }
    : null;

  return NextResponse.json(safeJson({
    case: caseRow,
    intake,
    rules: rules ? { version: rules.version, deadlines: rules.deadlines } : null,
    deadlines,
    daysSinceAccident,
    badFaithPatterns,
    checklist,
    checklistProgress,
    draftsByStatus,
    drafts: caseRow.drafts,
    evidence: caseRow.evidence,
    claimLogs: caseRow.claimLogs,
    courtFilings: caseRow.courtFilings,
    engagementLetters: caseRow.engagementLetters,
    handoffPackets: caseRow.handoffPackets,
  }));
}
