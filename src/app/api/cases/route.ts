// POST /api/cases — get-or-create a case for the demo user (no-auth MVP)
// GET /api/cases — list demo user's cases
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function GET() {
  const user = await getDemoUser();
  const cases = await db.case.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { drafts: true, evidence: true, claimLogs: true },
  });
  return NextResponse.json({ cases: safeJson(cases) });
}

export async function POST(req: NextRequest) {
  const user = await getDemoUser();
  const body = await req.json().catch(() => ({}));

  // If a case already exists for this user, reuse the most recent incomplete one
  const existing = await db.case.findFirst({
    where: { userId: user.id, completed: false },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return NextResponse.json({ case: safeJson(existing) });
  }

  const newCase = await db.case.create({
    data: {
      userId: user.id,
      intakeJson: JSON.stringify({ stages: {} }),
      stage: 0,
      completed: false,
    },
  });
  return NextResponse.json({ case: safeJson(newCase) });
}
