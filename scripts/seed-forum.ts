// Seed forum topics for the community forum (PRD §5.3.4)
// Run: bun run /home/z/my-project/scripts/seed-forum.ts
import { db } from "../src/lib/db";

const TOPICS = [
  {
    title: "تجربتي مع شركة تأمين رفضت الدفع",
    category: "insurance",
    body: "مرّ أسبوعان على الحادث ولم ترد شركة التأمين. ما هي الخطوات القانونية؟",
    authorDisplayName: "أبو محمد",
    isPinned: true,
  },
  {
    title: "كم يستغرق رد البنك المركزي على الشكوى؟",
    category: "court",
    body: "قدّمت شكوى للبنك المركزي ضد شركتي، كم تستغرق عادةً المهلة للرد؟",
    authorDisplayName: "سارة",
  },
  {
    title: "نصائح للتعامل مع مشتري المطالبات",
    category: "corruption",
    body: "عرض عليّ شخص شراء مطالبتي بخصم ٣٠٪. كيف أتصدّى لهذا الموقف؟",
    authorDisplayName: "خالد",
  },
  {
    title: "تقرير طبي بعد ٣ أيام من الحادث — هل يقبل؟",
    category: "medical",
    body: "لم أذهب للمستشفى يوم الحادث، بل بعد ٣ أيام. هل يؤثر ذلك على المطالبة؟",
    authorDisplayName: "نور",
  },
  {
    title: "دعم نفسي بعد الحادث",
    category: "support",
    body: "الحادث أثّر فيّ نفسيًا. هل هناك جهات دعم في الأردن تقدّم مساعدة مجانية؟",
    authorDisplayName: "مجهول",
  },
];

const REPLIES = [
  {
    topicIndex: 0,
    body: "حسب تعليمات البنك المركزي، يجب على شركة التأمين الرد خلال ١٥ يومًا. إن انتهت المهلة، يمكنك تقديم شكوى رسمية للبنك المركزي عبر بوابة حماية المستهلك.",
    authorDisplayName: "أحمد العلي — محامٍ",
    isLawyerAnswer: true,
    isModeratorApproved: true,
  },
  {
    topicIndex: 0,
    body: "مرّ بي نفس الموقف. حقي ساعدتني أنظّم أوراقي وقدّمت شكوى، وتم الرد خلال أسبوع.",
    authorDisplayName: "مستخدم سابق",
    isModeratorApproved: true,
  },
  {
    topicIndex: 2,
    body: "شراء المطالبات بخصم مخالف للقانون. لا تقبل العرض، ووثّق المحاولة وبلّغ عنها عبر بوابة الإبلاغ عن الفساد في حقي.",
    authorDisplayName: "أحمد العلي — محامٍ",
    isLawyerAnswer: true,
    isModeratorApproved: true,
  },
];

async function main() {
  console.log("Seeding forum topics…");

  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i];
    const existing = await db.forumTopic.findFirst({ where: { title: t.title } });
    if (existing) continue;
    const created = await db.forumTopic.create({
      data: {
        title: t.title,
        category: t.category,
        body: t.body,
        authorDisplayName: t.authorDisplayName,
        isPinned: t.isPinned ?? false,
      },
    });
    console.log(`  + topic: ${t.title}`);

    // Attach any replies
    const topicReplies = REPLIES.filter((r) => r.topicIndex === i);
    for (const r of topicReplies) {
      await db.forumPost.create({
        data: {
          topicId: created.id,
          body: r.body,
          authorDisplayName: r.authorDisplayName,
          isLawyerAnswer: r.isLawyerAnswer ?? false,
          isModeratorApproved: r.isModeratorApproved ?? false,
        },
      });
      console.log(`    + reply by ${r.authorDisplayName}`);
    }
  }

  // Seed a regulator stat for the demo
  const existingStat = await db.regulatorStat.findFirst();
  if (!existingStat) {
    await db.regulatorStat.create({
      data: {
        period: new Date().toISOString().slice(0, 7),
        insurerName: "الشركة الأردنية للتأمين",
        totalComplaints: 12,
        resolvedFavorably: 7,
        avgResolutionDays: 23,
        badFaithReports: 3,
      },
    });
    await db.regulatorStat.create({
      data: {
        period: new Date().toISOString().slice(0, 7),
        insurerName: "شركة المتوسط للتأمين",
        totalComplaints: 8,
        resolvedFavorably: 5,
        avgResolutionDays: 19,
        badFaithReports: 1,
      },
    });
    console.log("  + regulator stats (2 insurers)");
  }

  console.log("\nForum seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
