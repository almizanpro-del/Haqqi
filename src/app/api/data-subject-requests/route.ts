// POST /api/data-subject-requests — submit a data export/deletion/correction request (PDPL)
// GET /api/data-subject-requests — admin: list all requests
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";

export async function GET() {
  const requests = await db.dataSubjectRequest.findMany({
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json({ requests: safeJson(requests) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { requestType, userEmail } = body as { requestType: string; userEmail?: string };

  if (!requestType || !["export", "deletion", "correction"].includes(requestType)) {
    return NextResponse.json({ error: "invalid requestType" }, { status: 400 });
  }

  const user = await getDemoUser();
  const request = await db.dataSubjectRequest.create({
    data: {
      userId: user.id,
      userEmail: userEmail ?? user.email ?? null,
      requestType,
      status: "pending",
    },
  });

  await audit.dataSubjectRequest(request.id, user.id, requestType);

  return NextResponse.json({ request: safeJson(request) });
}

// PATCH — admin updates request status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { requestId, status, fulfillmentNote } = body;

  if (!requestId || !status) {
    return NextResponse.json({ error: "requestId and status required" }, { status: 400 });
  }
  if (!["pending", "processing", "completed", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const updated = await db.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status,
      fulfillmentNote: fulfillmentNote ?? null,
      completedAt: status === "completed" ? new Date() : null,
    },
  });

  return NextResponse.json({ request: safeJson(updated) });
}
