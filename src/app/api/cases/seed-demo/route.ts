// POST /api/cases/seed-demo
// Creates a demo case with pre-filled intake JSON so the user can immediately try
// the Calculator and Drafting Mode without first completing the AI intake.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function POST() {
  const user = await getDemoUser();

  // Reuse an existing completed demo case if one exists
  const existing = await db.case.findFirst({
    where: { userId: user.id, completed: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return NextResponse.json({ case: safeJson(existing) });

  const accidentDate = new Date();
  accidentDate.setDate(accidentDate.getDate() - 14);

  const intakeJson = {
    stages: {
      triage: {
        lastUserMessage: "تعافيت، لا يوجد خطر على الحياة الآن.",
        lastAssistantReply: "الحمد لله على سلامتك. لننتقل لوقائع الحادث.",
        injuries: "كدمات وكسر بسيط في اليد",
        deaths: false,
      },
      accident_facts: {
        lastUserMessage: "حصل الحادث قبل أسبوعين عند تقاطع الدوار السابع. السيارة الأخرى صدمتني من الخلف، والطرف الآخر مؤمَّن.",
        accidentDate: accidentDate.toISOString().split("T")[0],
        location: "تقاطع الدوار السابع — عمّان",
        accidentType: "اصطدام من الخلف",
        otherPartyInsured: true,
      },
      damages: {
        lastUserMessage: "كسر في اليد اليمنى، فاتورة مستشفى ٨٠٠ دينار، إتلاف المركبة، وفقدت ٥ أيام عمل.",
        medicalBills: 800,
        vehicleDamage: true,
        lostIncomeDays: 5,
        injuries: "كسر في اليد اليمنى",
      },
      claim_history: {
        lastUserMessage: "شركة التأمين عرضت ٦٠٠ دينار فقط، ولم ترد على طلبي بتعويض كامل.",
        insurerName: "الشركة الأردنية للتأمين",
        policyNumber: "JIC-2025-XXXXX",
        claimNumber: "CLM-2025-XXXXX",
        amountOffered: 600,
        status: "lowball",
      },
      goals: {
        lastUserMessage: "أريد تعويضًا عادلًا، ومستعد للتقاضي إن لزم بميزانية ١٠٠٠ دينار للمحامي.",
        desiredOutcome: "تعويض كامل وعادل",
        lawyerBudget: 1000,
        litigationWillingness: true,
      },
      documents: {
        lastUserMessage: "لديّ تقرير الشرطة، الكروكي، صور الحادث، تقرير المستشفى والفاتورة، وكشف راتب.",
        hasPoliceReport: true,
        hasCroquis: true,
        hasPhotos: true,
        hasMedical: true,
        hasBills: true,
        hasSalarySlip: true,
      },
      consent: {
        lastUserMessage: "أوافق، البيانات صحيحة.",
        confirmed: true,
      },
    },
  };

  const newCase = await db.case.create({
    data: {
      userId: user.id,
      intakeJson: intakeJson as any,
      stage: 7,
      completed: true,
      accidentDate,
      location: "تقاطع الدوار السابع — عمّان",
      accidentType: "اصطدام من الخلف",
      injuries: "كسر في اليد اليمنى",
      otherPartyInsured: true,
    },
  });

  return NextResponse.json({ case: safeJson(newCase) });
}
