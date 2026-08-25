// Anti-corruption education content (PRD §5.2.5)
// Education module on risks of selling/transferring a claim.

export interface CorruptionEducationSection {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  bodyAr: string;
  bodyEn: string;
  warningSigns: { ar: string; en: string }[];
  whatToDo: { ar: string; en: string }[];
}

export const CORRUPTION_EDUCATION_SECTIONS: CorruptionEducationSection[] = [
  {
    id: "claim_buying",
    titleAr: "شراء المطالبات بخصم",
    titleEn: "Claim-buying at a discount",
    icon: "AlertTriangle",
    bodyAr:
      "شراء المطالبات هو اتفاق يقوم فيه طرف ثالث بدفع مبلغ فوري للضحية مقابل التنازل عن مطالبته القانونية ضد شركة التأمين، ثم يتولى الطرف الثالث تحصيل المطالبة الكاملة ويحتفظ بالفرق. هذا الاتفاق غالبًا غير قانوني ويُجرّم الضحية والمشتري معًا، ويُفقد الضحية جزءًا كبيرًا من تعويضه المستحق.",
    bodyEn:
      "Claim-buying is an agreement where a third party pays an immediate amount to the victim in exchange for assigning their legal claim against the insurer. The buyer then collects the full claim and keeps the difference. This agreement is typically illegal and criminalizes both the victim and the buyer, and causes the victim to lose a large portion of their rightful compensation.",
    warningSigns: [
      { ar: "عرض نقدي فوري أقل بكثير من قيمة المطالبة التقديرية", en: "Cash offer significantly below the estimated claim value" },
      { ar: "طلب توقيع تنازل أو توكيل خاص قبل الدفع", en: "Request to sign a release or special power of attorney before payment" },
      { ar: "استعجال غير مبرر وإقناع بأن المطالبة لن تنجح", en: "Unjustified urgency and persuasion that the claim will fail" },
      { ar: "تجنّب ذكر اسم المشتري أو كتابة الاتفاق رسميًا", en: "Avoiding mentioning the buyer's name or formalizing the agreement" },
      { ar: "ظهور الشخص في موقع الحادث أو المستشفى بشكل مريب", en: "Person appearing suspiciously at the accident scene or hospital" },
    ],
    whatToDo: [
      { ar: "لا توقّع أي ورقة قبل استشارة محامٍ موثوق", en: "Do not sign anything before consulting a vetted lawyer" },
      { ar: "وثّق العرض: اسم المشتري، المبلغ، الزمان، المكان", en: "Document the offer: buyer's name, amount, time, place" },
      { ar: "أبلغ عبر بوابة الإبلاغ عن الفساد في حقي", en: "Report via Haqqi's corruption reporting portal" },
      { ar: "تواصل مع البنك المركزي إن كان المشتري مرتبطًا بشركة تأمين", en: "Contact CBJ if the buyer is connected to an insurance company" },
    ],
  },
  {
    id: "broker_middleman",
    titleAr: "الوسطاء غير المرخّصين",
    titleEn: "Unlicensed brokers / middlemen",
    icon: "UserX",
    bodyAr:
      "بعض الأشخاص يقدّمون خدمات \"تسريع المطالبات\" مقابل عمولة، زاعمين أن لديهم علاقات داخل شركات التأمين أو المحاكم. هؤلاء غالبًا غير مرخّصين ويعملون خارج إطار القانون، وقد يطلبون رشاوى أو معلومات شخصية حساسة.",
    bodyEn:
      "Some individuals offer 'claim acceleration' services for a commission, claiming to have connections inside insurance companies or courts. These are typically unlicensed and operate outside the law, and may solicit bribes or sensitive personal information.",
    warningSigns: [
      { ar: "طلب نسبة مئوية من التعويض قبل البدء", en: "Requesting a percentage of compensation before starting" },
      { ar: "ادعاء معرفة موظفين داخل شركة التأمين أو المحاكم", en: "Claiming to know employees inside insurance companies or courts" },
      { ar: "طلب رشوة صريحة \"لتسريع الإجراءات\"", en: "Explicitly soliciting a bribe 'to speed up procedures'" },
      { ar: "عدم تقديم بطاقة مهنية أو رقم ترخيص", en: "Not providing a professional ID or license number" },
    ],
    whatToDo: [
      { ar: "اطلب رقم ترخيص المحاماة وتحقق منه في نقابة المحامين", en: "Request the law license number and verify with the Bar Association" },
      { ar: "لا تدفع أي مبلغ خارج الإيصال الرسمي", en: "Do not pay any amount outside an official receipt" },
      { ar: "ابلغ عن الشخص عبر بوابة الإبلاغ عن الفساد", en: "Report the person via the corruption reporting portal" },
    ],
  },
  {
    id: "bribery",
    titleAr: "الرشاوى للموظفين",
    titleEn: "Bribes to officials",
    icon: "Scale",
    bodyAr:
      "عرض أو دفع رشوة لموظف حكومي (شرطة، محكمة، تأمين) جريمة جنائية يعاقب عليها القانون الأردني بالسجن. حتى المحاولة أو الوساطة في الرشوة تُعدّ جريمة. لا يوجد ما يبرر الرشوة أبدًا، والإجراءات القانونية تتقدم بشكل طبيعي دونها.",
    bodyEn:
      "Offering or paying a bribe to a government official (police, court, insurance) is a criminal offense punishable by imprisonment under Jordanian law. Even attempting or mediating a bribe is a crime. Bribery is never justified, and legal procedures progress normally without it.",
    warningSigns: [
      { ar: "موظف يلمّح إلى \"هدية\" لتسريع معاملتك", en: "An official hinting at a 'gift' to expedite your transaction" },
      { ar: "محامٍ يقترح دفع رشوة كجزء من أتعابه", en: "A lawyer suggesting a bribe as part of their fees" },
      { ar: "وسيط يطلب مبلغًا غير موثّق \"للموظف الفلاني\"", en: "A middleman requesting an undocumented amount 'for so-and-so'" },
    ],
    whatToDo: [
      { ar: "ارفض فورًا ووثّق الطلب (وقت، مكان، أسماء)", en: "Refuse immediately and document the request (time, place, names)" },
      { ar: "ابلغ هيئة النزاهة ومكافحة الفساد عبر رمز 211", en: "Report to the Integrity and Anti-Corruption Commission via 211" },
      { ar: "تواصل مع محامٍ آخر موثوق لتولّي القضية", en: "Engage a different vetted lawyer for your case" },
    ],
  },
  {
    id: "misrepresentation",
    titleAr: "التضليل حول الحقوق",
    titleEn: "Misrepresentation of rights",
    icon: "BookX",
    bodyAr:
      "بعض الجهات قد تُضلّل الضحية عمدًا حول حقوقه: تُقلّل من قيمة التعويض المتوقع، تزعم أن مهلة التقاضي انتهت، أو تُخفي وجود صندوق تعويض ضحايا حوادث السير. هذا التضليل يهدف لدفع الضحية لقبول تسوية أقل من المستحق.",
    bodyEn:
      "Some parties may deliberately mislead the victim about their rights: underestimate the expected compensation, falsely claim the litigation deadline has passed, or hide the existence of the Motor Accidents Compensation Fund. This misrepresentation aims to push the victim into accepting a lower settlement.",
    warningSigns: [
      { ar: "تقدير تعويضي أقل بكثير من نطاق حاسبة الحقوق", en: "Compensation estimate significantly below the Rights Calculator range" },
      { ar: "ادعاء أن \"مهلة ٣ سنوات انتهت\" دون تحقق", en: "Claim that 'the 3-year deadline has passed' without verification" },
      { ar: "إنكار وجود صندوق تعويض ضحايا حوادث السير", en: "Denying the existence of the Motor Accidents Compensation Fund" },
      { ar: "إقناع الضحية بعدم الحاجة لمحامٍ", en: "Persuading the victim that a lawyer is unnecessary" },
    ],
    whatToDo: [
      { ar: "استخدم حاسبة الحقوق في حقي للحصول على نطاق تقديري", en: "Use Haqqi's Rights Calculator to get an estimated range" },
      { ar: "استشر محاميًا موثوقًا للتحقق من أي ادعاء قانوني", en: "Consult a vetted lawyer to verify any legal claim" },
      { ar: "وثّق الادعاءات الكاذبة وابلغ عنها", en: "Document false claims and report them" },
    ],
  },
];
