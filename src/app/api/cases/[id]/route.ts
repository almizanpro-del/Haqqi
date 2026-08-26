// PATCH /api/cases/[id] — update intake stage / mark complete
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.stage === "number") data.stage = body.stage;
  if (typeof body.completed === "boolean") data.completed = body.completed;
  if (body.intakeJson !== undefined) data.intakeJson = body.intakeJson as any;
  if (body.accidentDate) data.accidentDate = new Date(body.accidentDate);
  if (typeof body.location === "string") data.location = body.location;
  if (typeof body.accidentType === "string") data.accidentType = body.accidentType;
  if (typeof body.injuries === "string") data.injuries = body.injuries;
  if (typeof body.otherPartyInsured === "boolean") data.otherPartyInsured = body.otherPartyInsured;

  const updated = await db.case.update({ where: { id }, data });
  return NextResponse.json({ case: safeJson(updated) });
}
