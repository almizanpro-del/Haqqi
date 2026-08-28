"use client";

/**
 * Design philosophy: Civic Editorial Calm — an Arabic-first public-service experience
 * that reduces cognitive load, makes trust visible, and shows the product in action.
 * Use this page as the landing-page narrative: reassurance → next step → proof → action.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { useAppStore } from "@/lib/i18n/store";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  FolderOpen,
  Globe2,
  LockKeyhole,
  Menu,
  MessageCircle,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

const heroImage = "/haqqi-hero-editorial.png";
const symbolImage = "/logo.svg";

const steps = [
  {
    number: "٠١",
    title: "أخبرنا بما حدث",
    description: "محادثة قصيرة ومنظمة، سؤال واحد في كل مرة.",
    icon: MessageCircle,
  },
  {
    number: "٠٢",
    title: "رتّب ملفك",
    description: "اجمع الصور والمستندات والمواعيد في مكان واحد.",
    icon: FolderOpen,
  },
  {
    number: "٠٣",
    title: "اعرف ماذا تفعل الآن",
    description: "احصل على قائمة خطوات وأسئلة جاهزة للمختص.",
    icon: ArrowUpLeft,
  },
];

const features = [
  {
    view: "intake" as const,
    title: "المحادثة التعريفية",
    description: "افهم قضيتك من خلال أسئلة بسيطة ومنظمة، بدون مصطلحات مربكة.",
    icon: MessageCircle,
    tone: "mint",
  },
  {
    view: "calculator" as const,
    title: "حاسبة الحقوق",
    description: "تقدير استرشادي للفئات المحتملة، لا وعد بمبلغ ولا بديل عن المشورة القانونية.",
    icon: Calculator,
    tone: "amber",
  },
  {
    view: "evidence" as const,
    title: "ملف الأدلة",
    description: "احتفظ بالصور والمستندات والمراسلات مرتبة في ملف واحد خاص بك.",
    icon: FolderOpen,
    tone: "blue",
  },
  {
    view: "workflow" as const,
    title: "الخطوات الزمنية",
    description: "اعرف ما الذي يأتي بعد ذلك، وتابع المواعيد والإجراءات المهمة.",
    icon: Clock3,
    tone: "rose",
  },
  {
    view: "drafting" as const,
    title: "مسودات جاهزة للمراجعة",
    description: "جهّز أسئلتك ومستنداتك قبل التحدث إلى شركة التأمين أو محامٍ.",
    icon: FileText,
    tone: "sand",
  },
];

const faqs = [
  {
    question: "هل حقي بديل عن المحامي؟",
    answer:
      "لا. حقي أداة مساعدة ذاتية ومعلوماتية تساعدك على فهم الخطوة التالية وتنظيم ملفك. لا يقدم تمثيلًا قانونيًا ولا يغني عن استشارة محامٍ مؤهل.",
  },
  {
    question: "هل بياناتي خاصة؟",
    answer:
      "نعم. صُممت التجربة حول مبدأ الخصوصية أولًا. لا نرسل أي شيء إلى شركة التأمين أو أي جهة أخرى دون موافقتك، وتظهر لك حدود استخدام البيانات بوضوح.",
  },
  {
    question: "هل أستطيع استخدام حقي بالإنجليزية؟",
    answer:
      "نعم. حقي ثنائي اللغة، ويمكنك التبديل بين العربية والإنجليزية عند الحاجة.",
  },
  {
    question: "هل يرسل حقي شيئًا لشركة التأمين؟",
    answer:
      "لا يتم الإرسال تلقائيًا. تبقى المسودات والملفات تحت سيطرتك، وأي مستند قابل للتصدير يمر بمراجعة واضحة قبل استخدامه.",
  },
  {
    question: "من أين تأتي التقديرات؟",
    answer:
      "الحاسبة تقدم نطاقًا استرشاديًا مبنيًا على فئات ومدخلات محددة، وليست نتيجة نهائية أو وعدًا بالتعويض. الأرقام القانونية تحتاج اعتمادًا ومراجعة مستمرة.",
  },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function AppLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      onClick={(event) => {
        const id = href.replace("#", "");
        if (id && document.getElementById(id)) {
          event.preventDefault();
          scrollToId(id);
        }
      }}
    >
      {children}
    </a>
  );
}

export function HomeView() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const setView = useAppStore((s) => s.setView);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const showComingSoon = (label: string) => {
    toast(`${label} ستكون متاحة قريبًا`, {
      description: "هذه المعاينة تعرض تجربة الصفحة الرئيسية فقط.",
    });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="haqqi-site" dir="rtl">
      <header className="site-header">
        <div className="container header-inner">
          <AppLink href="#top">
            <span className="brand-lockup" aria-label="حقي">
              <span className="brand-symbol-wrap">
                <img src={symbolImage} alt="" className="brand-symbol" />
              </span>
              <span className="brand-wordmark">حقي</span>
            </span>
          </AppLink>

          <nav className="desktop-nav" aria-label="التنقل الرئيسي">
            <AppLink href="#how-it-works">كيف يعمل</AppLink>
            <AppLink href="#benefits">ماذا ستعرف</AppLink>
            <AppLink href="#privacy">الخصوصية</AppLink>
            <AppLink href="#faq">الأسئلة الشائعة</AppLink>
          </nav>

          <div className="header-actions">
            <button className="language-control" onClick={() => showComingSoon("تبديل اللغة")}>
              <Globe2 size={15} strokeWidth={1.8} />
              <span lang="en">English</span>
            </button>
            <button className="login-link" onClick={() => showComingSoon("تسجيل الدخول")}>
              تسجيل الدخول
            </button>
            <button className="header-cta" onClick={() => scrollToId("start")}>ابدأ الآن</button>
            <button
              className="mobile-menu-button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mobile-nav-panel">
            <AppLink href="#how-it-works"><span onClick={closeMobile}>كيف يعمل</span></AppLink>
            <AppLink href="#benefits"><span onClick={closeMobile}>ماذا ستعرف</span></AppLink>
            <AppLink href="#privacy"><span onClick={closeMobile}>الخصوصية</span></AppLink>
            <AppLink href="#faq"><span onClick={closeMobile}>الأسئلة الشائعة</span></AppLink>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-backdrop" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="hero-grain" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow light-eyebrow">
                <span className="eyebrow-dot" />
                منصة مساعدة بعد حوادث السير في الأردن
              </p>
              <h1 id="hero-title">بعد الحادث، افهم خطوتك التالية <em>بثقة.</em></h1>
              <p className="hero-description">
                حقي يشرح لك ما يمكنك فعله الآن، يساعدك على ترتيب الأدلة، ويجهزك للتواصل مع شركة التأمين أو محامٍ — باللغة العربية أو الإنجليزية.
              </p>
              <div className="hero-actions" id="start">
                <button className="button button-primary" onClick={() => setView("intake")}>
                  <span>ابدأ محادثة آمنة مجانية</span>
                  <ArrowLeft size={18} />
                </button>
                <button className="button button-ghost" onClick={() => scrollToId("calculator")}>
                  <span>جرّب حاسبة الحقوق</span>
                </button>
              </div>
              <p className="hero-privacy-note">
                <span className="check-badge"><Check size={12} /></span>
                لا نرسل أي شيء إلى شركة التأمين أو أي جهة أخرى دون موافقتك.
              </p>
              <div className="hero-trust-row">
                <span><strong>عربي</strong> / <span lang="en">English</span></span>
                <span className="trust-pip" />
                <span>خصوصية أولًا</span>
                <span className="trust-pip" />
                <span>معلومات وليست فتوى قانونية</span>
              </div>
            </div>

            <div className="hero-preview" aria-label="معاينة لملف قضية حقي">
              <div className="preview-orbit orbit-one" />
              <div className="preview-orbit orbit-two" />
              <div className="case-file-card">
                <div className="case-file-topline">
                  <div>
                    <span className="card-label">ملف القضية</span>
                    <h2>حادث سير — عمّان</h2>
                  </div>
                  <span className="private-pill"><LockKeyhole size={12} /> خاص</span>
                </div>
                <div className="case-progress">
                  <div className="progress-copy"><span>خطوتك التالية</span><b>٢ من ٣</b></div>
                  <div className="progress-track"><span /></div>
                </div>
                <div className="next-action-card">
                  <div className="next-action-icon"><ArrowUpLeft size={21} /></div>
                  <div>
                    <span className="card-label">الآن</span>
                    <h3>اجمع صور الحادث والمستندات</h3>
                    <p>سيساعدك ذلك على تجهيز ملف واضح للمراجعة.</p>
                  </div>
                  <ArrowLeft className="next-action-arrow" size={18} />
                </div>
                <div className="mini-timeline">
                  <div className="timeline-node complete"><span><Check size={11} /></span><small>أخبرنا بما حدث</small></div>
                  <div className="timeline-connector complete" />
                  <div className="timeline-node current"><span>٢</span><small>رتّب ملفك</small></div>
                  <div className="timeline-connector" />
                  <div className="timeline-node"><span>٣</span><small>اعرف ماذا تفعل</small></div>
                </div>
              </div>
              <div className="floating-proof proof-private"><ShieldCheck size={17} /><span><b>ملفك خاص</b><small>أنت تتحكم ببياناتك</small></span></div>
              <div className="floating-proof proof-language"><span className="arabic-chip">ع</span><span><b>عربي / English</b><small>اللغة التي تناسبك</small></span></div>
            </div>
          </div>
        </section>

        <section className="trust-strip" id="privacy" aria-label="مبادئ الثقة">
          <div className="container trust-strip-inner">
            <div className="trust-item"><ShieldCheck size={20} /><span><b>خصوصية أولًا</b><small>لا إرسال دون موافقتك</small></span></div>
            <div className="trust-item"><Scale size={20} /><span><b>مخصص للأردن</b><small>لغة ومعلومات أقرب لسياقك</small></span></div>
            <div className="trust-item"><BadgeCheck size={20} /><span><b>حدود واضحة</b><small>معلومات وليست فتوى قانونية</small></span></div>
            <div className="trust-item"><Globe2 size={20} /><span><b>عربي / English</b><small>بدّل اللغة في أي وقت</small></span></div>
          </div>
        </section>

        <section className="steps-section section-pad" id="how-it-works" aria-labelledby="steps-title">
          <div className="container">
            <div className="section-intro split-intro">
              <div>
                <p className="section-kicker">مذكرة ٠١ / الطريق إلى الوضوح</p>
                <span className="section-rule" aria-hidden="true" />
                <h2 id="steps-title">من الحادث إلى<br /><span>الخطوة التالية.</span></h2>
              </div>
              <p>لا تحتاج إلى معرفة قانونية مسبقة. ابدأ من حيث أنت، وسيساعدك حقي على تحويل الموقف المربك إلى خطوات مفهومة.</p>
            </div>
            <div className="steps-grid">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <article className="step-card" key={step.number}>
                    <div className="step-card-top"><span className="step-number">{step.number}</span><StepIcon size={22} /></div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                    <span className="step-rule" />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="feature-section section-pad" id="benefits" aria-labelledby="benefits-title">
          <div className="container">
            <div className="feature-layout">
              <div className="feature-art-wrap">
                <div className="art-caption"><Sparkles size={15} /> ترتيب يخفف الضغط</div>
                <div className="case-board" role="img" aria-label="لوحة توضح تنظيم الأدلة والانتقال إلى الخطوة التالية">
                  <div className="board-header"><span className="board-file-label">ملف ٠٣ / ٢٠٢٦</span><span className="board-private"><LockKeyhole size={12} /> خاص</span></div>
                  <div className="board-title-row"><h3>ملف الحادث</h3><span>آخر تحديث: الآن</span></div>
                  <div className="board-body">
                    <div className="board-folder"><FolderOpen size={22} /><b>المستندات</b><span>٤ ملفات مرتبة</span></div>
                    <div className="board-checklist"><span className="checklist-title">قائمة التحقق</span><div><i className="checked"><Check size={10} /></i><span>صور موقع الحادث</span></div><div><i className="checked"><Check size={10} /></i><span>تقرير الشرطة</span></div><div><i className="unchecked" /><span>مراسلات التأمين</span></div></div>
                  </div>
                  <div className="board-footer"><span><span className="board-dot" /> الخطوة التالية واضحة</span><ArrowLeft size={16} /></div>
                </div>
                <div className="art-note"><span className="note-marker">مهم</span><span>اجمع ما لديك الآن.<br />الباقي يأتي خطوة خطوة.</span></div>
              </div>
              <div className="feature-copy">
                <p className="section-kicker">مذكرة ٠٢ / ما الذي يتغير؟</p>
                <span className="section-rule" aria-hidden="true" />
                <h2 id="benefits-title">كل ما تحتاجه<br /><span>لتستعيد وضوحك.</span></h2>
                <p className="feature-lede">من أول سؤال إلى تجهيز ملفك، صُممت الأدوات لتمنحك فهمًا عمليًا — لا مزيدًا من المصطلحات الغامضة.</p>
                <div className="feature-list">
                  {features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <button className="feature-row" key={feature.title} onClick={() => setView(feature.view)}>
                        <span className={`feature-icon ${feature.tone}`}><FeatureIcon size={18} /></span>
                        <span className="feature-row-copy"><b>{feature.title}</b><small>{feature.description}</small></span>
                        <ArrowLeft size={17} className="feature-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="calculator-section section-pad" id="calculator" aria-labelledby="calculator-title">
          <div className="container">
            <div className="calculator-card">
              <div className="calculator-copy">
                <span className="calculator-label"><Calculator size={17} /> مذكرة ٠٣ / حاسبة الحقوق</span>
                <span className="section-rule light-rule" aria-hidden="true" />
                <h2 id="calculator-title">ابدأ من سؤال واحد:<br /><span>ما الذي قد أستحقه؟</span></h2>
                <p>احصل على نطاق استرشادي للفئات المحتملة بناءً على المعلومات التي تدخلها. النتيجة تساعدك على تجهيز أسئلتك — وليست وعدًا بمبلغ.</p>
                <button className="dark-button" onClick={() => setView("calculator")}><span>ابدأ التقدير الاسترشادي</span><ArrowLeft size={17} /></button>
              </div>
              <div className="calculator-display" aria-hidden="true">
                <div className="display-header"><span>نطاق استرشادي</span><span className="display-status">قيد التجهيز</span></div>
                <div className="display-amount"><span>يتحدد حسب الحالة</span><b>— —</b></div>
                <div className="display-bars"><span /><span /><span /></div>
                <div className="display-foot"><span><Check size={13} /> يعتمد على مدخلاتك</span><span>معلومات فقط</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="privacy-section section-pad" aria-labelledby="privacy-title">
          <div className="container privacy-grid">
            <div className="privacy-copy">
              <p className="section-kicker">مذكرة ٠٤ / المساحة الخاصة</p>
              <span className="section-rule" aria-hidden="true" />
              <h2 id="privacy-title">ملفك لك.<br /><span>وقرارك لك.</span></h2>
              <p>الحادث وحده فيه ما يكفي من القلق. لذلك جعلنا الخصوصية جزءًا من التجربة، لا صفحة مخفية في الأسفل.</p>
              <div className="privacy-points">
                <div><span><LockKeyhole size={16} /></span><b>لا إرسال تلقائي</b><small>تظل كل المسودات والملفات تحت سيطرتك.</small></div>
                <div><span><FileText size={16} /></span><b>وضوح قبل التصدير</b><small>تعرف ما الذي سيغادر المنصة قبل أن توافق.</small></div>
              </div>
            </div>
            <div className="privacy-quote-card">
              <Quote size={32} className="quote-mark" />
              <blockquote>لا أحد يجب أن يخسر حقًا مستحقًا بسبب الجهل أو الخوف أو إجراءات غير واضحة.</blockquote>
              <div className="quote-caption"><span className="quote-line" /> <span>مبدأ حقي</span></div>
            </div>
          </div>
        </section>

        <section className="faq-section section-pad" id="faq" aria-labelledby="faq-title">
          <div className="container faq-layout">
            <div className="faq-intro">
              <p className="section-kicker">مذكرة ٠٥ / قبل أن تبدأ</p>
              <span className="section-rule" aria-hidden="true" />
              <h2 id="faq-title">أسئلة<br /><span>بلا تعقيد.</span></h2>
              <p>نحن نفضل أن تكون الحدود واضحة من البداية. إذا بقي لديك سؤال، يمكنك دائمًا التحدث إلى مختص.</p>
              <CircleHelp className="faq-watermark" size={90} strokeWidth={0.7} />
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div className={`faq-item ${isOpen ? "is-open" : ""}`} key={faq.question}>
                    <button onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen}>
                      <span>{faq.question}</span><ChevronDown size={19} />
                    </button>
                    {isOpen && <p>{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="final-cta-section" aria-labelledby="final-cta-title">
          <div className="container final-cta-inner">
            <div>
              <p className="section-kicker light-kicker">مذكرة أخيرة / الخطوة الأولى أسهل مما تبدو</p>
              <span className="section-rule light-rule" aria-hidden="true" />
              <h2 id="final-cta-title">ابدأ بفهم ما حدث —<br /><span>ثم قرر خطوتك التالية.</span></h2>
            </div>
            <div className="final-cta-actions">
              <button className="button button-primary" onClick={() => setView("intake")}><span>ابدأ محادثة آمنة مجانية</span><ArrowLeft size={18} /></button>
              <p><ShieldCheck size={15} /> لا التزام. لا إرسال دون موافقتك.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand"><span className="brand-lockup"><span className="brand-symbol-wrap"><img src={symbolImage} alt="" className="brand-symbol" /></span><span className="brand-wordmark">حقي</span></span><p>حقوقك بعد حادث سير في الأردن.</p></div>
          <div className="footer-links"><div><b>استكشف</b><AppLink href="#how-it-works">كيف يعمل</AppLink><AppLink href="#benefits">الأدوات</AppLink><AppLink href="#faq">الأسئلة الشائعة</AppLink></div><div><b>مهم</b><AppLink href="#privacy">الخصوصية</AppLink><button onClick={() => showComingSoon("شروط الاستخدام")}>شروط الاستخدام</button><button onClick={() => showComingSoon("تواصل معنا")}>تواصل معنا</button></div></div>
        </div>
        <div className="container footer-bottom"><span>© ٢٠٢٦ حقي. كل الحقوق محفوظة.</span><span>هذه المنصة للمعلومات والمساعدة الذاتية وليست بديلًا عن التمثيل القانوني.</span></div>
      </footer>
    </div>
  );
}
