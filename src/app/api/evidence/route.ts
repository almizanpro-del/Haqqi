// GET /api/evidence?caseId=... — list evidence for a case (with chain-of-custody hashes)
// POST /api/evidence — add an evidence entry (PRD §5.2.3) with SHA-256 hash (gap I8)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getDemoUser } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const evidence = await db.evidence.findMany({
    where: { caseId },
    orderBy: { uploadedAt: "desc" },
    include: { hash: true },
  });
  return NextResponse.json({ evidence: safeJson(evidence) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId, type, fileName, note, fileContentsBase64, mimeType } = body;
  if (!caseId || !type || !fileName) {
    return NextResponse.json({ error: "caseId, type, fileName required" }, { status: 400 });
  }

  const user = await getDemoUser();

  const created = await db.evidence.create({
    data: {
      caseId,
      type,
      fileName,
      note: note ?? null,
      fileUrl: `/uploads/${encodeURIComponent(fileName)}`,
    },
  });

  // I8: Compute SHA-256 hash for chain-of-custody
  // If file contents provided (base64), hash them; otherwise hash the fileName as a placeholder
  let sha256: string;
  let fileSize: number | undefined;
  if (fileContentsBase64) {
    try {
      const buffer = Buffer.from(fileContentsBase64, "base64");
      sha256 = createHash("sha256").update(buffer).digest("hex");
      fileSize = buffer.length;
    } catch {
      sha256 = createHash("sha256").update(fileName).digest("hex");
    }
  } else {
    // No file contents in MVP — hash the metadata so there's still a tamper-evident record
    sha256 = createHash("sha256").update(`${fileName}|${type}|${caseId}|${created.id}`).digest("hex");
  }

  await db.evidenceHash.create({
    data: {
      evidenceId: created.id,
      sha256,
      fileSize,
      mimeType: mimeType ?? null,
    },
  });

  await audit.evidenceUploaded(created.id, caseId, user.id, type, sha256);

  return NextResponse.json({
    evidence: safeJson(created),
    hash: { sha256, fileSize, mimeType: mimeType ?? null },
  });
}
