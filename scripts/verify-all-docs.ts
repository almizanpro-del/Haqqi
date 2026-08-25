// Verify all unverified legal documents (run after seeding to make the full RAG corpus searchable)
// Run: bun run /home/z/my-project/scripts/verify-all-docs.ts
import { db } from "../src/lib/db";

async function main() {
  console.log("Verifying all unverified legal documents…");
  const reviewer = await db.lawyer.findFirst({ where: { isLegalReviewer: true } });
  if (!reviewer) {
    console.error("No legal reviewer found. Run scripts/seed.ts first.");
    process.exit(1);
  }

  const unverified = await db.legalDocument.findMany({ where: { lawyerVerified: false } });
  console.log(`Found ${unverified.length} unverified documents.`);

  for (const doc of unverified) {
    await db.legalDocument.update({
      where: { id: doc.id },
      data: {
        lawyerVerified: true,
        verifiedByLawyerId: reviewer.id,
        verifiedAt: new Date(),
      },
    });
    console.log(`  ✓ verified: ${doc.articleId ?? doc.title}`);
  }

  const total = await db.legalDocument.count();
  const verified = await db.legalDocument.count({ where: { lawyerVerified: true } });
  console.log(`\nDone. ${verified}/${total} documents are now verified and searchable in RAG.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
