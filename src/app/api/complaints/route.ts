// GET /api/complaints — return complaints directory contacts (PRD §5.1.3)
// (Static directory data — placeholders pending legal counsel confirmation per §7.4)
import { NextResponse } from "next/server";
import { COMPLAINTS_DIRECTORY } from "@/lib/legal/seed";

export async function GET() {
  return NextResponse.json({ directory: COMPLAINTS_DIRECTORY });
}
