// GET /api/lawyers/verify — admin: list pending lawyer verifications
// POST /api/lawyers/verify — admin: approve/reject a verification
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";

export async function GET() {
  const pending = await db.lawyerVerification.findMany({
    where: { status: "pending" },
    orderBy: { submittedAt: "asc" },
    include: { lawyer: true },
  });
  return NextResponse.json({ verifications: safeJson(pending) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { verificationId, action, reviewNotes } = body;

  if (!verificationId || !action) {
    return NextResponse.json({ error: "verificationId and action required" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const verification = await db.lawyerVerification.findUnique({
    where: { id: verificationId },
  });
  if (!verification) return NextResponse.json({ error: "verification not found" }, { status: 404 });

  // For MVP: use the first admin user as reviewer
  const adminUser = await db.user.findFirst({ where: { role: "admin" } });
  const adminId = adminUser?.id ?? "system";

  const updated = await db.lawyerVerification.update({
    where: { id: verificationId },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewedByAdminId: adminId,
      reviewNotes: reviewNotes ?? null,
      reviewedAt: new Date(),
    },
  });

  // If approved, flip the lawyer's isVerified flag
  if (action === "approve") {
    await db.lawyer.update({
      where: { id: verification.lawyerId },
      data: { isVerified: true },
    });
    await audit.lawyerVerified(verification.lawyerId, adminId, verification.barId);
  }

  return NextResponse.json({ verification: safeJson(updated) });
}
