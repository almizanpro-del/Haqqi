// POST /api/data-requests/[id]/fulfill — admin marks a data request fulfilled (v3.2 §5.11)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { events } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { fulfillmentNote } = body as { fulfillmentNote?: string };

  const request = await db.dataSubjectRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "request not found" }, { status: 404 });
  if (request.status === "fulfilled") {
    return NextResponse.json({ error: "already fulfilled" }, { status: 400 });
  }

  const adminUser = await db.user.findFirst({ where: { role: "admin" } });
  const adminId = adminUser?.id ?? "system";

  const updated = await db.dataSubjectRequest.update({
    where: { id },
    data: {
      status: "fulfilled",
      fulfillmentNote: fulfillmentNote ?? null,
      fulfilledBy: adminId,
      fulfilledAt: new Date(),
    },
  });

  await audit.dataSubjectRequest(id, request.userId ?? undefined, request.requestType);
  await events.dataRequestFulfilled(adminId, id, request.requestType);

  return NextResponse.json({ request: safeJson(updated) });
}
