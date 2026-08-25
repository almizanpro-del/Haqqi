// POST /api/calculator/estimate
// Runs the Rights Calculator against the active legal_rules_config (PRD §5.1.1 / §7.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";
import type { LegalRulesConfig, CompensationCategory } from "@/lib/legal/seed";

interface CalculatorRequest {
  caseId: string;
}

interface CalculatorResult {
  total: { min: number; max: number };
  categories: Array<{
    category: CompensationCategory;
    applies: boolean;
    estimated: { min: number; max: number };
    notes: string;
  }>;
  currency: "JOD";
  rulesVersion: number;
}

export async function POST(req: NextRequest) {
  const { caseId } = (await req.json()) as CalculatorRequest;
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });

  const caseRow = await db.case.findUnique({ where: { id: caseId } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const rulesRow = await db.legalRulesConfig.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  if (!rulesRow) return NextResponse.json({ error: "no active legal_rules_config" }, { status: 500 });

  const rules = parseJsonField<LegalRulesConfig>(rulesRow.rulesJson, {} as LegalRulesConfig);
  const intake = parseJsonField<{ stages: Record<string, Record<string, unknown>> }>(
    caseRow.intakeJson,
    { stages: {} },
  );

  const triage = intake.stages?.triage ?? {};
  const af = intake.stages?.accident_facts ?? {};
  const damages = intake.stages?.damages ?? {};
  const docs = intake.stages?.documents ?? {};

  const allText = [
    triage.lastUserMessage, af.lastUserMessage, damages.lastUserMessage, docs.lastUserMessage,
  ].join(" ");

  const hasDeath = /وفاة|death|deceased|قتيل/i.test(allText);
  const hasInjury = /إصابة|injury|injured|جرح|كسر|break|fracture/i.test(allText);
  const hasMedicalBills = /فاتورة|bill|فواتير|medical|طبي/i.test(allText);
  const hasLostIncome = /دخل|income|salary|راتب|عمل|work/i.test(allText);
  const hasVehicleDamage = /مركبة|vehicle|car|سيارة|damage|ضرر/i.test(allText);
  const hasDisability = /عجز|disability|impairment|إعاقة/i.test(allText);

  const applied: CalculatorResult["categories"] = rules.compensationCategories.map((cat) => {
    let applies = false;
    let notes = "";
    switch (cat.key) {
      case "medical":
        applies = hasInjury || hasMedicalBills;
        notes = applies ? "بناءً على الإصابات/الفواتير المذكورة." : "لم تُذكر إصابات أو فواتير طبية.";
        break;
      case "disability":
        applies = hasDisability;
        notes = applies ? "نسبة العجز تُحدد لاحقًا طبيًا." : "لم تُذكر إعاقة دائمة.";
        break;
      case "death":
        applies = hasDeath;
        notes = applies ? "تُقدَّم للورثة. الدية + التعويض الأدبي." : "لا يوجد وفاة.";
        break;
      case "lost_income":
        applies = hasLostIncome;
        notes = applies ? "يتطلب كشف راتب موثق." : "لم يُذكر فقدان دخل.";
        break;
      case "vehicle_damage":
        applies = hasVehicleDamage;
        notes = applies ? "يتطلب تقرير خبير معتمد." : "لم تُذكر أضرار مركبة.";
        break;
      case "moral":
        applies = hasInjury || hasDeath;
        notes = applies ? "تقدير المحكمة حسب جسامة الضرر." : "لا أساس للتعويض الأدبي.";
        break;
      default:
        applies = false;
    }
    return { category: cat, applies, estimated: cat.range, notes };
  });

  const appliedCats = applied.filter((c) => c.applies);
  const total = appliedCats.reduce(
    (acc, c) => ({ min: acc.min + c.estimated.min, max: acc.max + c.estimated.max }),
    { min: 0, max: 0 },
  );

  const result: CalculatorResult = { total, categories: applied, currency: "JOD", rulesVersion: rules.version };
  return NextResponse.json(safeJson(result));
}
