// Helper to get or create the demo victim user (no-auth MVP per PRD §6.3 simplified)
import { db } from "@/lib/db";

export async function getDemoUser() {
  let u = await db.user.findUnique({ where: { email: "demo@haqqi.jo" } });
  if (!u) {
    u = await db.user.create({
      data: { email: "demo@haqqi.jo", role: "victim", language: "ar", name: "مستخدم تجريبي" },
    });
  }
  return u;
}

export async function getReviewerLawyer() {
  return db.lawyer.findFirst({ where: { isLegalReviewer: true } });
}

// JSON-safe serializer for Prisma models with nested Date / stringified JSON fields
export function safeJson<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function parseJsonField<T = unknown>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
