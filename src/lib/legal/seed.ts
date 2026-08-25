// Initial Legal Rules Config v1 — drives the Rights Calculator & Workflow Timeline.
// Per PRD §6.2, this is the seed for `legal_rules_config` — to be proposed,
// reviewed by a lawyer (§7.2), then activated. All article numbers are PLACEHOLDERS.

export interface CompensationCategory {
  key: string;
  labelAr: string;
  labelEn: string;
  legalBasisAr: string;
  legalBasisEn: string;
  articleId: string; // placeholder
  range: { min: number; max: number }; // JOD
  documents: string[]; // evidence type keys
}

export interface WorkflowTask {
  id: string;
  labelAr: string;
  labelEn: string;
  daysOffset: number; // from accident date
  reminder: boolean;
  category: "police" | "medical" | "insurer" | "court" | "documents";
}

export interface LegalRulesConfig {
  version: number;
  compensationCategories: CompensationCategory[];
  workflowTasks: WorkflowTask[];
  deadlines: {
    statuteOfLimitationsDays: number;
    insurerResponseDays: number;
    cbjComplaintWindowDays: number;
  };
  notes: { ar: string; en: string };
}

export const LEGAL_RULES_CONFIG_V1: LegalRulesConfig = {
  version: 1,
  notes: {
    ar: "هذه القواعد مبدئية وجميع أرقام المواد عناصر نائبة بانتظار تأكيد المستشار القانوني (القسم ٧.٤).",
    en: "These rules are preliminary; all article numbers are placeholders pending legal counsel confirmation (§7.4).",
  },
  deadlines: {
    statuteOfLimitationsDays: 1095, // ~3 years (placeholder)
    insurerResponseDays: 15,
    cbjComplaintWindowDays: 30,
  },
  compensationCategories: [
    {
      key: "medical",
      labelAr: "المصاريف الطبية وإعادة التأهيل",
      labelEn: "Medical & Rehabilitation Expenses",
      legalBasisAr: "المادة XX من قانون التأمين الإلزامي — تغطية المصاريف الطبية الضرورية.",
      legalBasisEn: "Article XX of the Compulsory Insurance Law — coverage of necessary medical expenses.",
      articleId: "PLACEHOLDER-CML-XX",
      range: { min: 500, max: 25000 },
      documents: ["medical", "bill"],
    },
    {
      key: "disability",
      labelAr: "التعويض عن العجز الكامل أو الجزئي",
      labelEn: "Disability Compensation (Total / Partial)",
      legalBasisAr: "جدول نسب العجز وفق التعليمات التنفيذية — يُحتسب وفق نسبة العجز الطبي.",
      legalBasisEn: "Disability percentage table per executive instructions — calculated by medical impairment rate.",
      articleId: "PLACEHOLDER-DIS-XX",
      range: { min: 3000, max: 60000 },
      documents: ["medical"],
    },
    {
      key: "death",
      labelAr: "تعويض الوفاة (للورثة)",
      labelEn: "Wrongful Death Compensation (for heirs)",
      legalBasisAr: "المادة XX من القانون المدني — الدية والتعويض عن الضرر الأدبي للورثة.",
      legalBasisEn: "Article XX of the Civil Code — diya and moral damages compensation for heirs.",
      articleId: "PLACEHOLDER-CIV-XX",
      range: { min: 20000, max: 50000 },
      documents: ["police_report", "medical"],
    },
    {
      key: "lost_income",
      labelAr: "تعويض فقدان الدخل",
      labelEn: "Lost Income Compensation",
      legalBasisAr: "القانون المدني — تعويض الضرر المادي المباشر الناتج عن الحادث.",
      legalBasisEn: "Civil Code — compensation for direct material damages resulting from the accident.",
      articleId: "PLACEHOLDER-CIV-XX",
      range: { min: 300, max: 15000 },
      documents: ["salary_slip", "medical"],
    },
    {
      key: "vehicle_damage",
      labelAr: "أضرار المركبة",
      labelEn: "Vehicle Damage",
      legalBasisAr: "نظام التأمين الإلزامي — تقدير أضرار المركبة من قبل الخبير المعتمد.",
      legalBasisEn: "Compulsory Insurance Regulation — vehicle damage assessment by accredited expert.",
      articleId: "PLACEHOLDER-CML-XX",
      range: { min: 100, max: 12000 },
      documents: ["photo", "croquis"],
    },
    {
      key: "moral",
      labelAr: "التعويض عن الضرر الأدبي",
      labelEn: "Moral Damages",
      legalBasisAr: "القانون المدني — تعويض الضرر الأدبي وفق تقدير المحكمة.",
      legalBasisEn: "Civil Code — moral damages compensation at court's discretion.",
      articleId: "PLACEHOLDER-CIV-XX",
      range: { min: 500, max: 10000 },
      documents: ["medical"],
    },
  ],
  workflowTasks: [
    { id: "t1", labelAr: "تأمين موقع الحادث والإسعاف", labelEn: "Secure scene & call ambulance", daysOffset: 0, reminder: false, category: "police" },
    { id: "t2", labelAr: "إبلاغ الشرطة ورفع المحضر", labelEn: "Notify police & file report", daysOffset: 0, reminder: true, category: "police" },
    { id: "t3", labelAr: "إبلاغ شركة التأمين كتابةً", labelEn: "Notify insurer in writing", daysOffset: 1, reminder: true, category: "insurer" },
    { id: "t4", labelAr: "الفحص الطبي الأولي", labelEn: "Initial medical examination", daysOffset: 2, reminder: true, category: "medical" },
    { id: "t5", labelAr: "الحصول على الكروكي والتقرير الشرطي", labelEn: "Obtain croquis & police report", daysOffset: 7, reminder: true, category: "police" },
    { id: "t6", labelAr: "جمع الفواتير والتقارير الطبية", labelEn: "Collect medical bills & reports", daysOffset: 14, reminder: true, category: "documents" },
    { id: "t7", labelAr: "متابعة رد شركة التأمين", labelEn: "Follow up on insurer response", daysOffset: 15, reminder: true, category: "insurer" },
    { id: "t8", labelAr: "تقديم شكوى للبنك المركزي إن لزم", labelEn: "File CBJ complaint if needed", daysOffset: 30, reminder: true, category: "court" },
    { id: "t9", labelAr: "التحضير لرفع الدعوى إن لزم", labelEn: "Prepare court filing if needed", daysOffset: 60, reminder: true, category: "court" },
    { id: "t10", labelAr: "مراجعة المحامي للمستندات قبل الإرسال", labelEn: "Lawyer review of documents before sending", daysOffset: 45, reminder: true, category: "documents" },
  ],
};

// Seed RAG corpus — placeholder legal documents (PRD §6.5)
// In production, these would be chunked (200-400 tokens) and embedded.
export const LEGAL_DOCUMENTS_SEED = [
  {
    titleAr: "قانون التأمين الإلزامي على المركبات — المسؤولية المدنية",
    titleEn: "Compulsory Motor Insurance Law — Civil Liability",
    source: "placeholder",
    articleId: "PLACEHOLDER-CML-1",
    topics: ["compulsory_insurance", "civil_liability", "vehicle"],
    contentAr:
      "يجب على كل مالك مركبة عقد تأمين إلزامي يغطي المسؤولية المدنية الناشئة عن استخدام المركبة عن الأضرار التي تلحق بالغير. يُعدّ مخالفةً يعاقب عليها القانون عدم عقد هذا التأمين.",
    contentEn:
      "Every vehicle owner must hold compulsory insurance covering civil liability arising from the use of the vehicle for damages caused to third parties. Failing to hold this insurance is a punishable offense.",
  },
  {
    titleAr: "القانون المدني الأردني — المسؤولية عن الأفعال الضارة",
    titleEn: "Jordan Civil Code — Liability for Harmful Acts",
    source: "placeholder",
    articleId: "PLACEHOLDER-CIV-256",
    topics: ["civil_liability", "damages", "negligence"],
    contentAr:
      "كل فعل أضر بالغير يُلزم مرتكبه بالتعويض. يشمل التعويض الضرر المادي والضرر الأدبي. تقدير التعويض يعتمد على جسامة الخطأ ومدى الضرر.",
    contentEn:
      "Any act causing harm to another obligates the perpetrator to compensation. Compensation includes both material and moral damages. The amount depends on the severity of the fault and the extent of the harm.",
  },
  {
    titleAr: "صندوق تعويض ضحايا حوادث السير — الاختصاص",
    titleEn: "Motor Accidents Compensation Fund — Jurisdiction",
    source: "placeholder",
    articleId: "PLACEHOLDER-MACF-3",
    topics: ["compensation_fund", "uninsured", "hit_and_run"],
    contentAr:
      "يتولى صندوق تعويض ضحايا حوادث السير التعويض عن الأضرار الناشئة في حالات: عدم وجود تأمين ساري، حوادث الفرار، والمركبات غير المعروفة المالكة. يُشترط تقديم المحضر الشرطي.",
    contentEn:
      "The Motor Accidents Compensation Fund handles compensation for damages in cases of: no valid insurance, hit-and-run, and unidentified vehicle owners. A police report is required.",
  },
  {
    titleAr: "قانون أصول المحاكمات المدنية — رفع الدعوى",
    titleEn: "Civil Procedure Code — Filing a Claim",
    source: "placeholder",
    articleId: "PLACEHOLDER-CPC-42",
    topics: ["court", "procedure", "statement_of_claim"],
    contentAr:
      "تُرفع الدعوى بصحيفة تُودع قلم المحكمة المختصة، تتضمن بيانات الخصوم، موضوع الدعوى، الطلبات، وأوجه الدليل. يجب تعيين الخبير من المحكمة عند الحاجة لتقدير الأضرار.",
    contentEn:
      "A claim is filed by a statement deposited at the competent court's registry, including parties' details, claim subject, requests, and evidence. The court may appoint an expert when damage assessment is needed.",
  },
  {
    titleAr: "تعليمات حماية مستهلك قطاع التأمين — البنك المركزي",
    titleEn: "Insurance Sector Consumer Protection Instructions — CBJ",
    source: "placeholder",
    articleId: "PLACEHOLDER-CBJ-CP-7",
    topics: ["cbj", "consumer_protection", "complaints"],
    contentAr:
      "للمستهلك حق تقديم شكوى للبنك المركزي الأردني ضد شركة التأمين في حال: التأخير غير المبرر في السداد، رفض غير مبرر، أو عرض مبلغ متدنٍّ بلا أساس. على البنك الرد خلال ٣٠ يومًا.",
    contentEn:
      "Consumers have the right to file a complaint with the Central Bank of Jordan against an insurer in cases of: unjustified delay in payment, unjustified denial, or lowball offers without basis. The Bank must respond within 30 days.",
  },
  {
    titleAr: "قانون حماية البيانات الشخصية الأردني",
    titleEn: "Jordan Personal Data Protection Law",
    source: "placeholder",
    articleId: "PLACEHOLDER-PDPL-3",
    topics: ["data_protection", "privacy", "consent"],
    contentAr:
      "تلتزم الجهات بمعالجة البيانات الشخصية بشفافية وبناءً على موافقة صريحة من صاحب البيان. يحق للمستخدم طلب الوصول إلى بياناته، تصحيحها، أو حذفها. تخزين البيانات الحساسة (الصحة، المعتقدات) يتطلب موافقة كتابية صريحة.",
    contentEn:
      "Entities must process personal data transparently and based on explicit consent from the data subject. Users have the right to access, correct, or delete their data. Storage of sensitive data (health, beliefs) requires explicit written consent.",
  },
  {
    titleAr: "نظام التأمين الإلزامي — تحديد قيمة التعويض",
    titleEn: "Compulsory Insurance Regulation — Compensation Valuation",
    source: "placeholder",
    articleId: "PLACEHOLDER-CML-12",
    topics: ["compensation", "valuation", "expert"],
    contentAr:
      "تُحدَّد قيمة التعويض عن أضرار المركبة بناءً على تقرير خبير معتمد من شركة التأمين. في حال خلاف على التقدير، يحق للمؤمَّن له طلب تعيين خبير آخر، أو اللجوء إلى المحكمة لتعيين خبير قضائي. لا يجوز لشركة التأمين فرض تقديرها دون مستند معتمد.",
    contentEn:
      "Vehicle damage compensation is determined based on a report by an expert accredited by the insurer. In case of disagreement on the valuation, the insured has the right to request another expert, or resort to the court to appoint a judicial expert. The insurer may not impose its valuation without an accredited document.",
  },
  {
    titleAr: "قانون أصول المحاكمات المدنية — مهلة التقادم",
    titleEn: "Civil Procedure Code — Statute of Limitations",
    source: "placeholder",
    articleId: "PLACEHOLDER-CPC-118",
    topics: ["statute_of_limitations", "deadline", "court"],
    contentAr:
      "تسقط الدعوى بمضي ثلاث سنوات من تاريخ الحادث في قضايا التعويض عن الأضرار الناشئة عن حوادث السير. تبدأ المهلة من تاريخ وقوع الحادث، ولا يجوز وقفها إلا بأسباب قانونية محددة. في حالات القاصرين، قد تُمدّ المهلة.",
    contentEn:
      "A claim lapses after three years from the date of the accident in compensation cases for damages arising from car accidents. The period begins from the date of the accident and may only be suspended for specific legal reasons. For minors, the period may be extended.",
  },
  {
    titleAr: "القانون المدني — الضرر الأدبي",
    titleEn: "Civil Code — Moral Damages",
    source: "placeholder",
    articleId: "PLACEHOLDER-CIV-267",
    topics: ["moral_damages", "compensation", "civil"],
    contentAr:
      "يشمل التعويض الضرر الأدبي الذي يلحق المتضرر من الألم الجسدي والنفسي، فقدان متعة الحياة، والأضرار المعنوية. يُقدّر القاضي هذا التعويض وفق جسامة الضرر ومدى تأثيره على حياة المتضرر. لا يشترط إثبات مادي للضرر الأدبي.",
    contentEn:
      "Compensation includes moral damages suffered by the victim from physical and psychological pain, loss of enjoyment of life, and moral harm. The judge estimates this compensation based on the severity of the harm and its impact on the victim's life. Material proof of moral damages is not required.",
  },
  {
    titleAr: "صندوق تعويض ضحايا حوادث السير — إجراءات التقديم",
    titleEn: "Motor Accidents Compensation Fund — Application Procedures",
    source: "placeholder",
    articleId: "PLACEHOLDER-MACF-7",
    topics: ["compensation_fund", "procedures", "documents"],
    contentAr:
      "يتقدم المتضرر بطلب للصندوق مشفوعًا بـ: محضر الشرطة، التقرير الطبي، صورة عن هوية المتضرر، وبيان بالأضرار. يدرس الصندوق الطلب خلال ٦٠ يومًا ويصدر قراره بالتعويض أو الرفض مع التعليل. يحق للمتضرر الطعن في القرار أمام المحكمة.",
    contentEn:
      "The victim submits an application to the Fund accompanied by: police report, medical report, copy of victim's ID, and statement of damages. The Fund reviews the application within 60 days and issues its decision to compensate or reject with reasoning. The victim has the right to appeal the decision in court.",
  },
  {
    titleAr: "تعليمات التأمين الإلزامي — مهلة التبليغ",
    titleEn: "Compulsory Insurance Instructions — Notification Period",
    source: "placeholder",
    articleId: "PLACEHOLDER-CML-5",
    topics: ["notification", "deadline", "insurer"],
    contentAr:
      "يجب على المؤمَّن له تبليغ شركة التأمين عن الحادث خلال ٣٠ يومًا من تاريخ وقوعه. التأخير في التبليغ دون عذر مقبول قد يؤدي إلى رفض المطالبة. يُفضّل التبليغ كتابةً مع الاحتفاظ بنسخة موقّعة باستلام من الشركة.",
    contentEn:
      "The insured must notify the insurance company of the accident within 30 days of its occurrence. Delay in notification without acceptable excuse may lead to claim denial. Written notification is preferred, retaining a copy signed as received by the company.",
  },
  {
    titleAr: "قانون العمل الأردني — تعويض إصابات العمل أثناء القيادة",
    titleEn: "Jordan Labor Law — Work Injury Compensation While Driving",
    source: "placeholder",
    articleId: "PLACEHOLDER-LAB-32",
    topics: ["work_injury", "compensation", "labor"],
    contentAr:
      "إذا وقع حادث السير أثناء تأدية العمل، يُعتبر إصابة عمل ويحق للموظف التعويض من التأمين الإلزامي ومن التأمين على إصابات العمل معًا. لا يجوز لشركة التأمين التخفيض من التعويض بحجة وجود مصدر آخر للتعويض.",
    contentEn:
      "If a car accident occurs during work performance, it is considered a work injury and the employee is entitled to compensation from compulsory insurance and work injury insurance together. The insurer may not reduce compensation on the grounds of another source of compensation.",
  },
];

// Initial document templates (PRD §6.2 — `legal_templates` table)
export const LEGAL_TEMPLATES_SEED = [
  {
    templateType: "insurer_demand",
    titleAr: "خطاب مطالبة لشركة التأمين",
    titleEn: "Insurer Demand Letter",
    contentMdx: `# خطاب مطالبة

التاريخ: {{date}}
المرسل: {{user_name}}
إلى: {{insurer_name}}

## الموضوع: مطالبة بتعويض عن حادث سير بتاريخ {{accident_date}}

تحية طيبة وبعد،

أرفع لسيادتكم مطالبتي بالتعويض عن الأضرار الناتجة عن حادث السير المؤرخ في {{accident_date}}، والذي تضرر فيه {{damage_summary}}.

بناءً على التأمين الإلزامي ذي الرقم {{policy_number}}، أطلب التعويض عن:
- المصاريف الطبية: {{medical_amount}} د.أ
- أضرار المركبة: {{vehicle_amount}} د.أ
- فقدان الدخل: {{lost_income_amount}} د.أ

المستندات المرفقة:
{{documents_list}}

أرجو الرد خلال المهلة القانونية (١٥ يومًا).

التوقيع: {{user_name}}`,
  },
  {
    templateType: "cbj_complaint",
    titleAr: "شكوى للبنك المركزي الأردني",
    titleEn: "CBJ Complaint",
    contentMdx: `# شكوى للبنك المركزي الأردني

التاريخ: {{date}}
اسم مقدم الشكوى: {{user_name}}
ضد شركة التأمين: {{insurer_name}}

## موضوع الشكوى

أقدم شكواي ضد {{insurer_name}} بسبب: {{complaint_reason}}

## تفاصيل الحادث والمطالبة
- تاريخ الحادث: {{accident_date}}
- رقم وثيقة التأمين: {{policy_number}}
- رقم المطالبة: {{claim_number}}
- تاريخ تقديم المطالبة: {{claim_submission_date}}
- آخر رد من الشركة: {{last_response}}

## الطلبات

أطلب من البنك المركزي التدخل لضمان التزام الشركة بأحكام تعليمات حماية مستهلك قطاع التأمين، وسرعة تسوية المطالبة.

التوقيع: {{user_name}}
الهاتف: {{user_phone}}`,
  },
  {
    templateType: "statement_of_claim",
    titleAr: "صحيفة دعوى",
    titleEn: "Statement of Claim",
    contentMdx: `# صحيفة دعوى

المحكمة: {{court_name}}
رقم القضية: (يُملأ من قلم المحكمة)
تاريخ الإيداع: {{date}}

## بيانات الخصوم
**المدعي:** {{user_name}}، رقم الهوية {{user_id}}
**المدعى عليه:** {{defendant_name}}

## موضوع الدعوى

يطالب المدعي المدعى عليه بالتعويض عن الأضرار الناتجة عن حادث السير بتاريخ {{accident_date}}، والبالغة {{total_claim}} دينارًا أردنيًا، تفصيلها:

1. المصاريف الطبية: {{medical_amount}} د.أ
2. التعويض عن العجز: {{disability_amount}} د.أ
3. فقدان الدخل: {{lost_income_amount}} د.أ
4. الضرر الأدبي: {{moral_amount}} د.أ

## أوجه الدليل
{{evidence_list}}

## الطلبات الختامية

يلتمس المدعي من محكمتكم الموقرة:
1. الحكم بالتعويضات المذكورة أعلاه.
2. إلزام المدعى عليه بالرسوم والمصاريف وأتعاب المحاماة.
3. تعيين خبير ل تقدير الأضرار إن لزم.

وكيل المدعي: {{lawyer_name}}`,
  },
  {
    templateType: "settlement_release",
    titleAr: "اتفاق تسوية وتنازل",
    titleEn: "Settlement & Release Agreement",
    contentMdx: `# اتفاق تسوية وتنازل

بين: {{user_name}} ("المتنازل")
وبين: {{insurer_name}} ("الشركة")

## البنود

1. **مبلغ التسوية:** تدفع الشركة للطرف الأول مبلغ {{settlement_amount}} دينارًا أردنيًا، مقابل تسوية كاملة ونهائية لكل المطالبات الناشئة عن حادث السير بتاريخ {{accident_date}}.

2. **التنازل:** يتنازل الطرف الأول عن أي حق أو مطالبة مستقبلية تتعلق بالحادث المذكور.

3. **السرية:** يلتزم الطرفان بسرية هذا الاتفاق.

4. **الاختصاص:** محاكم الأردن.

توقيع الطرف الأول: ________   التاريخ: ___/___/_____
توقيع الشركة: ________   التاريخ: ___/___/_____`,
  },
  {
    templateType: "power_of_attorney",
    titleAr: "توكيل خاص",
    titleEn: "Limited Power of Attorney",
    contentMdx: `# توكيل خاص

أنا الموقع أدناه {{user_name}}، رقم الهوية {{user_id}}، أ وكّل المحامي/ة {{lawyer_name}} في القضية الناشئة عن حادث السير بتاريخ {{accident_date}}.

## نطاق التوكيل
1. تمثيلي أمام شركات التأمين والبنك المركزي والمحاكم.
2. صياغة المستندات وتقديمها نيابةً عني.
3. قبول التسوية بموافقتي الخطية المسبقة فقط.
4. عدم التنازل عن أي حق بدون إذني الصريح.

التوقيع: ________   التاريخ: ___/___/_____`,
  },
  {
    templateType: "evidence_list",
    titleAr: "قائمة الأدلة والتسلسل الزمني",
    titleEn: "Evidence List & Chronology",
    contentMdx: `# قائمة الأدلة والتسلسل الزمني

**القضية:** {{case_summary}}
**تاريخ الحادث:** {{accident_date}}

## المستندات
{{documents_table}}

## التسلسل الزمني للتفاعلات
{{chronology_table}}

## ملاحظات
{{notes}}`,
  },
  {
    templateType: "expert_request",
    titleAr: "طلب تعيين خبير",
    titleEn: "Expert Appointment Request",
    contentMdx: `# طلب تعيين خبير

إلى محكمة {{court_name}} الموقرة،

في القضية رقم {{case_number}}، يلتمس المدعي تعيين خبير معتمد لتقدير:
1. الأضرار المادية للمركبة.
2. نسبة العجز الطبي (إن لزم).
3. تقدير فقدان الدخل.

وتفضلوا بقبول فائق الاحترام.

وكيل المدعي: {{lawyer_name}}
التاريخ: {{date}}`,
  },
];

// Complaints directory contacts (placeholder pending legal counsel — PRD §7.4)
export const COMPLAINTS_DIRECTORY = {
  insurers: [
    { nameAr: "الشركة الأردنية للتأمين", nameEn: "Jordan Insurance Co.", phone: "+962-6-XXX-XXXX", email: "claims@example.jo" },
    { nameAr: "شركة المتوسط للتأمين", nameEn: "Mediterranean Insurance Co.", phone: "+962-6-XXX-XXXX", email: "claims@example.jo" },
    { nameAr: "الشركة العربية للتأمين", nameEn: "Arab Insurance Co.", phone: "+962-6-XXX-XXXX", email: "claims@example.jo" },
  ],
  cbj: {
    nameAr: "البنك المركزي الأردني — وحدة حماية مستهلك قطاع التأمين",
    nameEn: "Central Bank of Jordan — Insurance Consumer Protection Unit",
    phone: "+962-6-XXX-XXXX",
    email: "insurance.complaints@cbj.gov.jo",
    website: "www.cbj.gov.jo",
    addressAr: "عمان — الأردن",
    addressEn: "Amman — Jordan",
  },
  courts: [
    { nameAr: "محكمة صلح عمان الأولى", nameEn: "Amman First Magistrates Court" },
    { nameAr: "محكمة بدائية عمان", nameEn: "Amman Court of First Instance" },
  ],
};

// Seed lawyers (PRD §6.2 — `lawyers` table)
export const LAWYERS_SEED = [
  {
    name: "أحمد العلي",
    firm: "العالي للمحاماة",
    location: "عمّان",
    languages: ["ar", "en"],
    feeModel: "contingency",
    expertise: ["insurance_claims", "personal_injury"],
    contactEmail: "ali.firm@example.jo",
    contactPhone: "+962-7-XXX-XXXX",
    isVerified: true,
    isLegalReviewer: true, // the engaged legal counsel
  },
  {
    name: "ليلى حداد",
    firm: "حداد وشركاه",
    location: "الزرقاء",
    languages: ["ar"],
    feeModel: "hourly",
    expertise: ["civil_litigation"],
    contactEmail: "haddad@example.jo",
    contactPhone: "+962-7-XXX-XXXX",
    isVerified: true,
    isLegalReviewer: false,
  },
  {
    name: "Omar Khalaf",
    firm: "Khalaf & Partners",
    location: "Irbid",
    languages: ["ar", "en"],
    feeModel: "fixed",
    expertise: ["insurance_claims"],
    contactEmail: "khalaf@example.jo",
    contactPhone: "+962-7-XXX-XXXX",
    isVerified: true,
    isLegalReviewer: false,
  },
];

// Seed anonymous stories (PRD §5.1.4)
export const STORIES_SEED = [
  {
    accidentDate: "2025-11-12",
    insurerName: "—",
    description:
      "تعرضت لحادث سير، وعرضت عليّ شركة التأمين مبلغًا ضئيلًا. بعد أن نظّمت أوراقي باستخدام حقي، أدركت أن العرض أقل بكثير من النطاق التقديري، وتمكنت من الحصول على تعويض أعلى.",
    outcome: "تمت التسوية بمبلغ أعلى بنسبة ٤٠٪",
    isApproved: true,
  },
  {
    accidentDate: "2025-08-03",
    insurerName: "—",
    description:
      "حاول طرف ثالث شراء مطالبتي بخصم. تعلمت من منصة حقي أن هذا غير قانوني، ورفضت العرض وتواصلت مع محامٍ موثوق.",
    outcome: "تم رفع دعوى وتحصيل التعويض الكامل",
    isApproved: true,
  },
  {
    accidentDate: "2026-01-21",
    insurerName: "—",
    description:
      "تأخرت شركة التأمين في الرد ٤٥ يومًا. قدّمت شكوى للبنك المركزي بناءً على نصيحة حقي، وتم الرد خلال أسبوع.",
    outcome: "صرف التعويض خلال ١٠ أيام من الشكوى",
    isApproved: true,
  },
];
