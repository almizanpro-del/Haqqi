// POST /api/lawyers/[id]/verification — submit verification request (bar ID + license)
// GET /api/lawyers/[id]/verification — get verification status
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const verification = await db.lawyerVerification.findUnique({
    where: { lawyerId: id },
  });
  return NextResponse.json({ verification: safeJson(verification) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { barId, licenseNumber, licenseFileUrl, lawFirmName, practiceAreas } = body;

  if (!barId) {
    return NextResponse.json({ error: "barId required (Jordan Bar Association number)" }, { status: 400 });
  }

  const lawyer = await db.lawyer.findUnique({ where: { id } });
  if (!lawyer) return NextResponse.json({ error: "lawyer not found" }, { status: 404 });

  // Upsert verification record
  const existing = await db.lawyerVerification.findUnique({ where: { lawyerId: id } });
  const verification = existing
    ? await db.lawyerVerification.update({
        where: { lawyerId: id },
        data: {
          barId, licenseNumber: licenseNumber ?? null,
          licenseFileUrl: licenseFileUrl ?? null,
          lawFirmName: lawFirmName ?? null,
          practiceAreas: practiceAreas ? JSON.stringify(practiceAreas) : null,
          status: "pending",
          reviewedByAdminId: null,
          reviewNotes: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      })
    : await db.lawyerVerification.create({
        data: {
          lawyerId: id, barId,
          licenseNumber: licenseNumber ?? null,
          licenseFileUrl: licenseFileUrl ?? null,
          lawFirmName: lawFirmName ?? null,
          practiceAreas: practiceAreas ? JSON.stringify(practiceAreas) : null,
          status: "pending",
        },
      });

  return NextResponse.json({ verification: safeJson(verification) });
}
