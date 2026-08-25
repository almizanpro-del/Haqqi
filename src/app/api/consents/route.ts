// GET /api/consents — list current user's consent records
// POST /api/consents — record acceptance of a consent document
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { recordConsent, getUserConsents, CURRENT_CONSENT_VERSIONS, CONSENT_TEXTS, type ConsentType } from "@/lib/consents";

export async function GET() {
  const user = await getDemoUser();
  const records = await getUserConsents(user.id);
  // Also return the current versions so the UI can detect if re-acceptance is needed
  return NextResponse.json({
    records: safeJson(records),
    currentVersions: CURRENT_CONSENT_VERSIONS,
    texts: CONSENT_TEXTS,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { consentType } = body as { consentType: ConsentType };

  if (!consentType || !CURRENT_CONSENT_VERSIONS[consentType]) {
    return NextResponse.json({ error: "invalid consentType" }, { status: 400 });
  }

  const user = await getDemoUser();
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const record = await recordConsent({
    userId: user.id,
    consentType,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ record });
}
