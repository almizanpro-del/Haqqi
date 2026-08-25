// GET /api/lawyers — list verified lawyers (PRD §5.2.4)
// Supports filters: ?location=...&language=...&feeModel=...&expertise=...
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const location = url.searchParams.get("location");
  const language = url.searchParams.get("language");
  const feeModel = url.searchParams.get("feeModel");
  const expertise = url.searchParams.get("expertise");

  const lawyers = await db.lawyer.findMany({
    where: { isVerified: true },
    include: {
      reviews: { orderBy: { createdAt: "desc" } },
      _count: { select: { handoffPackets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Apply array filters in JS (SQLite doesn't natively query JSON arrays well)
  const filtered = lawyers.filter((l) => {
    const langs = parseJsonField<string[]>(l.languages, []);
    const exps = parseJsonField<string[]>(l.expertise, []);
    if (location && l.location !== location) return false;
    if (language && !langs.includes(language)) return false;
    if (feeModel && l.feeModel !== feeModel) return false;
    if (expertise && !exps.includes(expertise)) return false;
    return true;
  });

  // Compute average rating
  const enriched = filtered.map((l) => {
    const reviews = l.reviews ?? [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    return {
      ...l,
      languages: parseJsonField<string[]>(l.languages, []),
      expertise: parseJsonField<string[]>(l.expertise, []),
      reviews: reviews.slice(0, 5),
      avgRating,
      reviewCount: reviews.length,
      handoffCount: l._count.handoffPackets,
      _count: undefined,
    };
  });

  return NextResponse.json({ lawyers: safeJson(enriched) });
}
