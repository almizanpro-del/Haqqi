// GET /api/regulator/stats — aggregated, anonymized complaint/outcome data (PRD §5.3.3)
// k-anonymity: any bucket with < 5 cases is grouped into "Other" to prevent re-identification.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

const K_ANONYMITY_THRESHOLD = 5;

export async function GET() {
  // Pull from the materialized RegulatorStat table (seeded + would be refreshed nightly in prod)
  // AND compute live aggregates from stories / claim_logs / corruption_reports for the demo.
  const [statRows, stories, claimLogs, corruptionReports] = await Promise.all([
    db.regulatorStat.findMany({ orderBy: { insurerName: "asc" } }),
    db.story.findMany(),
    db.claimLog.findMany({ include: { claim: true } }),
    db.corruptionReport.findMany(),
  ]);

  // Apply k-anonymity to the pre-aggregated stats
  const stats = statRows.map((s) => {
    if (s.totalComplaints < K_ANONYMITY_THRESHOLD) {
      return { insurer: "Other (k-anonymity)", total: s.totalComplaints, badFaith: s.badFaithReports };
    }
    return { insurer: s.insurerName, total: s.totalComplaints, badFaith: s.badFaithReports };
  });

  // Re-aggregate "Other" entries
  const otherAggregated = stats
    .filter((s) => s.insurer === "Other (k-anonymity)")
    .reduce((acc, s) => ({ insurer: "Other (k-anonymity)", total: acc.total + s.total, badFaith: acc.badFaith + s.badFaith }), { insurer: "Other (k-anonymity)", total: 0, badFaith: 0 });

  const finalStats = [
    ...stats.filter((s) => s.insurer !== "Other (k-anonymity)"),
    ...(otherAggregated.total > 0 ? [otherAggregated] : []),
  ];

  return NextResponse.json(safeJson({
    period: new Date().toISOString().slice(0, 7),
    kAnonymityThreshold: K_ANONYMITY_THRESHOLD,
    stats: finalStats,
    totals: {
      stories: stories.length,
      claimInteractions: claimLogs.length,
      corruptionReports: corruptionReports.length,
      badFaithPatterns: claimLogs.filter((l) => l.badFaithFlag && l.badFaithFlag !== "none").length,
    },
    disclaimer: "Aggregated, anonymized data with k-anonymity applied. No individual case data is exposed.",
  }));
}
