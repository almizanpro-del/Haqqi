// Seed the Haqqi database with initial legal content per PRD §6.2 / §7.2
// Run: bun run /home/z/my-project/scripts/seed.ts
import { db } from "../src/lib/db";
import {
  LEGAL_RULES_CONFIG_V1,
  LEGAL_DOCUMENTS_SEED,
  LEGAL_TEMPLATES_SEED,
  LAWYERS_SEED,
  STORIES_SEED,
} from "../src/lib/legal/seed";

async function main() {
  console.log("Seeding Haqqi database…");

  // 1. Lawyers
  for (const l of LAWYERS_SEED) {
    const existing = await db.lawyer.findFirst({ where: { name: l.name } });
    if (existing) continue;
    await db.lawyer.create({
      data: {
        name: l.name,
        firm: l.firm,
        location: l.location,
        languages: JSON.stringify(l.languages),
        feeModel: l.feeModel,
        expertise: JSON.stringify(l.expertise),
        contactEmail: l.contactEmail,
        contactPhone: l.contactPhone,
        isVerified: l.isVerified,
        isLegalReviewer: l.isLegalReviewer,
      },
    });
    console.log(`  + lawyer: ${l.name}`);
  }

  const reviewer = await db.lawyer.findFirst({ where: { isLegalReviewer: true } });
  const reviewerId = reviewer?.id;

  // 2. Legal rules config v1 — auto-activated so the calculator works out of the box
  const existingRules = await db.legalRulesConfig.findFirst();
  if (!existingRules) {
    await db.legalRulesConfig.create({
      data: {
        version: 1,
        rulesJson: JSON.stringify(LEGAL_RULES_CONFIG_V1),
        isActive: true,
        approvedByLawyerId: reviewerId,
        approvedAt: new Date(),
      },
    });
    console.log("  + legal_rules_config v1 (active)");
  }

  // 3. Legal templates — auto-activated for demo
  for (const t of LEGAL_TEMPLATES_SEED) {
    const exists = await db.legalTemplate.findFirst({ where: { templateType: t.templateType, version: 1 } });
    if (exists) continue;
    await db.legalTemplate.create({
      data: {
        templateType: t.templateType,
        version: 1,
        contentMdx: t.contentMdx,
        isActive: true,
        approvedByLawyerId: reviewerId,
        approvedAt: new Date(),
      },
    });
    console.log(`  + template: ${t.templateType}`);
  }

  // 4. Legal documents (RAG corpus) — some verified, some pending (to demo §7.2 workflow)
  for (let i = 0; i < LEGAL_DOCUMENTS_SEED.length; i++) {
    const d = LEGAL_DOCUMENTS_SEED[i];
    const exists = await db.legalDocument.findFirst({ where: { articleId: d.articleId } });
    if (exists) continue;
    const verified = i < 3; // first 3 verified, last 2 pending — to demo the gate
    await db.legalDocument.create({
      data: {
        title: d.titleAr,
        content: d.contentAr,
        source: d.source,
        articleId: d.articleId,
        topics: JSON.stringify(d.topics),
        language: "ar",
        lawyerVerified: verified,
        verifiedByLawyerId: verified ? reviewerId : null,
        verifiedAt: verified ? new Date() : null,
      },
    });
    console.log(`  + legal_document: ${d.articleId} (verified=${verified})`);
  }

  // 5. Stories
  for (const s of STORIES_SEED) {
    const exists = await db.story.findFirst({ where: { description: s.description } });
    if (exists) continue;
    await db.story.create({
      data: {
        accidentDate: new Date(s.accidentDate),
        insurerName: s.insurerName,
        description: s.description,
        outcome: s.outcome,
        isApproved: s.isApproved,
      },
    });
    console.log(`  + story (approved=${s.isApproved})`);
  }

  // 6. Demo victim user + a sample case so the calculator & drafting work without login
  const demoEmail = "demo@haqqi.jo";
  let demoUser = await db.user.findUnique({ where: { email: demoEmail } });
  if (!demoUser) {
    demoUser = await db.user.create({
      data: { email: demoEmail, role: "victim", language: "ar", name: "مستخدم تجريبي" },
    });
    console.log(`  + demo user: ${demoUser.email}`);
  }

  console.log("\nSeeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
