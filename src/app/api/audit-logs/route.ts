// GET /api/audit-logs — query the canonical audit log (admin only)
// Supports filters: ?actorId=&action=&entityType=&caseId=&limit=
import { NextRequest, NextResponse } from "next/server";
import { getRecentAuditEvents } from "@/lib/audit";
import { safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);
  const filters = {
    actorId: url.searchParams.get("actorId") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    caseId: url.searchParams.get("caseId") ?? undefined,
  };

  const events = await getRecentAuditEvents(limit, filters);
  return NextResponse.json({ events: safeJson(events), count: events.length });
}
