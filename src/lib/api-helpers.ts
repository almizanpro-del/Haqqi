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

// JSON-safe serializer for Prisma models with nested Date / JSON fields
// (Prisma returns Json as parsed objects, but Date objects need serialization for API responses)
export function safeJson<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// Handle both legacy String-encoded JSON (SQLite) and native Postgres types (Json/String[])
// With PostgreSQL, the value is already a parsed object/array — just return it.
// With SQLite (dev fallback), the value is a String and needs parsing.
export function parseJsonField<T = unknown>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  // Already a parsed object/array (PostgreSQL native type)
  return value as T;
}
