// GET /api/review-queue — items pending the legal reviewer's attention (PRD §7.1)
// Includes: pending drafts, unverified legal_documents, inactive legal_templates, inactive legal_rules_config versions
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const [pendingDrafts, unverifiedDocs, inactiveTemplates, inactiveRules] = await Promise.all([
    db.draft.findMany({
      where: { reviewStatus: "pending_review" },
      orderBy: { createdAt: "asc" },
      include: { case: true, user: true, reviewLogs: true },
    }),
    db.legalDocument.findMany({
      where: { lawyerVerified: false },
      orderBy: { createdAt: "asc" },
    }),
    db.legalTemplate.findMany({
      where: { isActive: false },
      orderBy: { createdAt: "asc" },
    }),
    db.legalRulesConfig.findMany({
      where: { isActive: false },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const recentActivity = await db.reviewLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { draft: true },
  });

  return NextResponse.json(
    safeJson({
      pendingDrafts,
      unverifiedDocs,
      inactiveTemplates,
      inactiveRules,
      recentActivity,
    }),
  );
}
