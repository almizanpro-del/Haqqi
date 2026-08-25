# Product Requirements Document (PRD)

**Haqqi – حقي**
*Your Rights After a Car Accident in Jordan*
Version 3.0 – Technical / Development-Ready
Date: August 25, 2026

---

## Revision Notes (v2.1 → v3.0)

Per your feedback, this version:

1. **Drops the naming/branding question as a blocker.** Noted once, briefly, in Section 1 — the product name is flexible and can be finalized independent of the technical build.
2. **Folds legal oversight into a concrete product feature instead of a risk section.** You have a lawyer engaged as legal counsel for the platform, so the open question isn't *whether* there's legal sign-off — it's *how the product enforces it*. Section 7 now specifies a full **Lawyer Review & Legal Content Management** workflow: states, roles, database fields, API endpoints, and UI, covering both per-document review (before anything is sent/filed) and ongoing content curation (compensation rules, RAG legal corpus, templates).
3. **Removes budget and timeline/GTM sections entirely**, as requested. This is a technical and functional spec, not a project plan.
4. **Expands the Technical Architecture section substantially** — provider-agnostic AI/LLM layer, RAG pipeline detail, API surface, RLS/auth model, PDF/notification architecture — plus a new **Technical Validation Plan** (Section 9) listing the specific things worth prototyping before committing to full-scale development, since that's what you said you actually need right now: validating the idea and the technical tools, not the business plan.

---

## 1. Overview

**Haqqi** (working name — the brand can be finalized independently of this spec; nothing below depends on the final name) is a bilingual (Arabic-first, English-second) AI-assisted platform that helps car-accident victims in Jordan understand their likely legal entitlements, follow a structured claims timeline, organize evidence, recognize bad-faith insurer conduct, generate lawyer-reviewed draft documents (complaint letters, demand letters, court filings), and connect with a vetted lawyer.

**Vision**: No one in Jordan should lose rightful compensation after a car accident due to lack of knowledge, fear, or an unfair claims process.

**Positioning**: a self-help and case-organization tool with a built-in lawyer-review layer — not a substitute for legal representation, and every document that leaves the platform is either explicitly informational or has passed through the Lawyer Review workflow in Section 7.

---

## 2. Problem Statement

| Pain Category | Description |
| --- | --- |
| **Information Asymmetry** | Victims don't know their entitlements (medical, disability, death, moral damages), deadlines, or required documents. |
| **Abusive Claims Handling** | Insurers may delay, deny, lowball, or misstate policy terms. |
| **Intimidation & Power Imbalance** | Aggressive adjusters or informal actors pressure victims into fast, unfair settlements. |
| **Informal Claim-Buying** | Third parties buy accident claims at a discount and cash out the difference. |
| **Weak Recourse Awareness** | A complaint path exists (insurer → CBJ → courts) but is not widely known or easy to use. |
| **Complex Court Procedures** | Victims don't know how to file a claim or enforce a judgment. |

**Current state**: Jordan has compulsory third-party motor insurance, a Motor Accidents Compensation Fund for uninsured/hit-and-run cases, an insurance-sector consumer-protection function at CBJ, and a civil procedure code governing court claims. **All specific article/regulation numbers referenced anywhere in this document are placeholders pending confirmation by your engaged legal counsel** — see Section 7.4.

---

## 3. Target Users

| Segment | Characteristics | Needs |
| --- | --- | --- |
| **Accident Victims** (primary) | Arabic-speaking, often low legal literacy, possibly injured or grieving | Clear rights info, step-by-step guidance, low cognitive load |
| **Family Members** (primary) | Navigating claims for an injured/deceased relative | Same, plus inheritance/heir guidance |
| **Vulnerable Groups** (primary) | Refugees, migrants, elderly, low literacy | Simplified language, voice input/output, WhatsApp/SMS |
| **Lawyers / Legal Aid** (secondary) | Reviewing content, receiving case handoffs | Review queue, organized case files |
| **Regulators (CBJ, Insurance Commission)** (secondary, Phase 3) | Monitoring market conduct | Aggregated, anonymized data |

---

## 4. Goals & Success Metrics

| Metric | Target | Measurement |
| --- | --- | --- |
| Rights Module Completion Rate | 70% | Funnel analytics |
| Complaint Letter Generation Rate | 40% | Event tracking |
| Drafting Mode Usage Rate | 35% | Event tracking |
| Evidence Upload Rate | 50% | Storage metrics |
| Escalation Rate (CBJ/Lawyer) | 25% | Referral tracking |
| Lawyer Review Turnaround Time | < 48 hrs | Workflow timestamps (Section 7) |
| CSAT | 4.5 / 5 | In-app survey |
| NPS | ≥ 50 | Quarterly survey |

---

## 5. Scope & Features

### 5.1 Phase 1 — Core Self-Help (informational only; nothing generated here is sent externally)

#### 5.1.1 Rights & Entitlements Calculator
**Functional requirements**
* Guided Q&A (Arabic default, English toggle): accident type, injuries, death/disability, medical bills, lost income, vehicle damage, other party's insurance status.
* Output: compensation categories with plain-language legal basis (from the versioned, lawyer-approved rules config — Section 7.2), an estimated JD range with a "not legal advice" disclaimer, and a document checklist per category.
* Persist results to the user's profile if logged in.

**Technical requirements**
* Next.js (App Router) + TypeScript. Compensation logic reads from a versioned JSON/YAML config table (`legal_rules_config`, Section 6.2), never hardcoded in application code, so legal counsel can update it via the Legal Content Management UI (Section 7.2) without a deploy.

#### 5.1.2 Step-by-Step Accident Workflow
**Functional requirements**
* Auto-generated task timeline (police report, croquis, photos, medical exam, insurer notification, document submission, follow-up), driven by the same `legal_rules_config` as 5.1.1.
* Reminders via SMS/WhatsApp/email at key milestones. Progress tracker.

**Technical requirements**
* Supabase Edge Functions (or Vercel Cron) for scheduled reminder jobs. Messaging sent through the provider-agnostic notification layer (Section 6.6).

#### 5.1.3 Complaints Directory & Templates
**Functional requirements**
* Directory of insurer complaint contacts; CBJ contact details.
* Insurer- and CBJ-complaint templates auto-filled from case data. Export as PDF (Arabic RTL), email, or copy-to-clipboard.

**Technical requirements**
* RTL-capable PDF generation (e.g., `@react-pdf/renderer` with Noto Sans Arabic embedded — validate in Section 9). Templates stored as MDX in the `legal_templates` table (Section 6.2), version-controlled and lawyer-approved before use (Section 7.2).

#### 5.1.4 Anonymous Story & Abuse Reporting
**Functional requirements**
* Submission form, no PII required. Admin moderation queue before publishing. Public, filterable, anonymized stories page.

**Technical requirements**
* Supabase RLS restricting raw submissions to admins. Rate limiting at the edge (e.g., Upstash) to prevent spam.

#### 5.1.5 AI-Powered Step-by-Step Intake
**Functional requirements — 7 stages**
1. Triage & safety (death/injury/threats → emergency guidance).
2. Accident facts (date/time/location, police report, croquis, other party, insurance status).
3. Losses & damages.
4. Claims history (insurer, claim number, offers/denials).
5. Goals & constraints (desired outcome, lawyer budget, litigation willingness).
6. Document collection checklist.
7. Consent & disclaimers (active confirmation, not a pre-checked box).
* Output: structured `case_intake` JSON feeding the Calculator, Workflow, and (Phase 2) Drafting Mode.

**Technical requirements**
* LLM provider abstracted behind a single interface (Section 6.4) so the underlying model (Grok, Gemini, or other) is swappable without touching intake logic — validate provider choice per Section 9 before committing.
* Structured output validated against a Zod/Pydantic schema before being trusted downstream. System prompt requires one question at a time, empathetic tone, and an explicit "I'm not sure — here's how to reach a lawyer" fallback rather than guessing.

### 5.2 Phase 2 — AI Drafting & Case Management

#### 5.2.1 Drafting Mode (AI Legal Companion)
**Functional requirements**
* Template library: insurer demand letter, CBJ complaint, statement of claim, settlement/release agreement, limited power of attorney, evidence list/chronology, expert request.
* Citation-aware drafting: each paragraph can show a "why this wording" panel citing the specific retrieved article.
* Plain-Arabic / Legal-Arabic toggle. Full version history.
* **Every draft must pass the Lawyer Review workflow (Section 7.1) before export/send is enabled** — this is enforced at the data layer, not just a UI checklist.

**Technical requirements**
* Draft generation ≤ 60s after intake completion. Every legal claim in a draft carries at least one citation reference from the RAG layer. Full audit log of generation/edit/review/send events.

#### 5.2.2 RAG Knowledge Base (Insurance Law & Court Procedure)
**Functional requirements**
* Indexed sources (priority order, each gated by `lawyer_verified = true` before indexing — Section 7.2): Civil Code liability/limitation provisions; compulsory motor insurance regulations; Civil Procedure Code; Motor Accidents Compensation Fund rules; CBJ Financial Consumer Protection instructions; publicly available Court of Cassation summaries for recurring ambiguities.
* Chunking by article/clause (200–400 tokens) with `{source, article_id, topic, language}` metadata. Hybrid retrieval (keyword + vector). Below-threshold retrieval confidence → assistant states uncertainty and offers lawyer referral instead of guessing.

**Technical requirements**
* Supabase pgvector, 768-dim embeddings, ivfflat index. Retrieval latency ≤ 500ms. Weekly re-index or on-demand when a source changes.

#### 5.2.3 Evidence Organizer & Claim Log
**Functional requirements**
* Uploads: police report, croquis, photos, medical reports, bills, salary slips, correspondence. Structured interaction log (date, contact, summary, outcome).
* Bad-faith pattern flags (repeated delays, unnecessary requests, lowball offers vs. calculated range). One-click demand-letter generation from the log (routes through 5.2.1 → 7.1).

**Technical requirements**
* Supabase Storage with signed URLs. Malware scanning on upload. AES-256 at rest, TLS 1.3 in transit. File limits configurable, not hardcoded (validate real-world medical-file sizes in Section 9).

#### 5.2.4 Lawyer & Legal Aid Directory
**Functional requirements**
* Filters: location, language, fee model, expertise. Profiles with bio, contact, verified-user reviews, self-reported success rate.
* One-click handoff packet: shares case intake, documents, claim log, and lawyer-approved drafts.

**Technical requirements**
* Manual admin verification before a lawyer profile is live. Reviews restricted to verified accounts.

#### 5.2.5 Anti-Corruption Education & Reporting
**Functional requirements**
* Education module on risks of selling/transferring a claim. Anonymous reporting form for suspicious actors, admin-only aggregation.

**Technical requirements**
* No PII stored unless opted in. Encrypted at rest, admin-only access via RLS.

### 5.3 Phase 3 — Litigation Support & Ecosystem

#### 5.3.1 Court Procedure Guidance Module
Pre-filing checklist, statement-of-claim drafting, service/notification guidance, expert-evidence pathway, enforcement guidance — each step showing deadline, required form, fee, and a "generate this document" action routed through Lawyer Review (Section 7.1). All Civil Procedure Code citations require sign-off from your legal counsel before this module ships.

#### 5.3.2 Lawyer Nomination & Engagement Letters
Matching logic (city, language, fee model, specialty, availability) feeding the 5.2.4 handoff packet, plus engagement-letter templates (Appendix A) with limited in-app editing and e-signature (Electronic Transactions Law compliant).

#### 5.3.3 Regulator Dashboard (CBJ / Insurance Commission)
Aggregated, anonymized complaint/outcome data with k-anonymity thresholds and export tools. **Technically straightforward; commercially/legally dependent on CBJ or the Insurance Commission agreeing to receive the data and, if wanted, on an SSO integration** — a partnership prerequisite, not a build blocker for the rest of the platform.

#### 5.3.4 Community Forum & Support Groups
Topic-categorized discussion, verified lawyer/NGO Q&A participation, automated + human moderation.

### 5.4 Out of Scope / Non-Goals

* Haqqi does not represent users in proceedings — it informs, organizes, drafts (with lawyer review), and refers.
* No AI-generated document is sendable/filable without passing the Lawyer Review workflow (Section 7.1), even after Phase 2 ships.
* No guaranteed compensation amounts or outcomes.
* No non-motor-accident personal injury claims in v1.
* No insurance underwriting or policy-sales functionality.
* Additional languages beyond Arabic/English are deferred, not committed to a phase.

---

## 6. Technical Architecture

### 6.1 High-Level Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui | Use the current stable major version; validate against whatever the rest of your platform portfolio is standardized on if this shares infrastructure with another product. |
| Backend | Next.js API routes / Server Actions | Add a separate service (e.g., Python) only if a specific need (heavy NLP, PDF pipeline) can't be met in the Next.js runtime — don't default to a second backend without a concrete reason. |
| Database | Supabase (Postgres + pgvector + Storage + Auth + Edge Functions) | |
| AI/LLM | Provider-agnostic layer (Section 6.4) over Grok, Gemini, or another model | Decide by Arabic-language quality, structured-output reliability, and cost at expected volume — see Section 9. |
| RAG | Supabase pgvector + hybrid (keyword + vector) search | |
| PDF Generation | `@react-pdf/renderer` or equivalent, RTL + Arabic font embedding | |
| Hosting | Vercel (frontend/API) + Supabase (backend) | |
| Monitoring | Sentry (errors), self-hosted analytics (Plausible/Matomo) | |
| Messaging | Twilio and/or WhatsApp Business API, transactional email provider | Behind the notification abstraction in 6.6 |

### 6.2 Data Model (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'victim', -- 'victim' | 'lawyer' | 'admin' | 'regulator'
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Intakes
CREATE TABLE case_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  intake_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accidents
CREATE TABLE accidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  accident_date DATE,
  location TEXT,
  type TEXT,
  injuries TEXT,
  other_party_insured BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accident_id UUID REFERENCES accidents(id),
  insurer_name TEXT,
  policy_number TEXT,
  status TEXT,
  amount_claimed NUMERIC,
  amount_offered NUMERIC,
  amount_paid NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  type TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim Logs
CREATE TABLE claim_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  contact_date DATE,
  contact_person TEXT,
  summary TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  target TEXT, -- 'insurer' | 'cbj' | 'court'
  template_type TEXT,
  content TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts (Drafting Mode) — extended with the Lawyer Review workflow fields
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_intake_id UUID REFERENCES case_intakes(id),
  template_type TEXT,
  version INT DEFAULT 1,
  content TEXT,
  plain_arabic_version TEXT,
  legal_arabic_version TEXT,
  citations JSONB,
  review_status TEXT DEFAULT 'pending_review', -- 'pending_review' | 'approved' | 'rejected' | 'sent'
  reviewed_by_lawyer_id UUID REFERENCES lawyers(id),
  review_comments TEXT,
  reviewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ, -- app enforces: only settable if review_status = 'approved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories (anonymous)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accident_date DATE,
  insurer_name TEXT,
  description TEXT,
  outcome TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corruption Reports (anonymous)
CREATE TABLE corruption_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE,
  location TEXT,
  description TEXT,
  evidence_urls TEXT[],
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyers
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  firm TEXT,
  location TEXT,
  languages TEXT[],
  fee_model TEXT,
  expertise TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_legal_reviewer BOOLEAN DEFAULT FALSE, -- can this lawyer approve drafts/content (Section 7)?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer Reviews (user-submitted ratings)
CREATE TABLE lawyer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID REFERENCES lawyers(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handoff Packets
CREATE TABLE handoff_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_intake_id UUID REFERENCES case_intakes(id),
  lawyer_id UUID REFERENCES lawyers(id),
  included_document_ids UUID[],
  included_draft_ids UUID[],
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Letters
CREATE TABLE engagement_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID REFERENCES lawyers(id),
  user_id UUID REFERENCES users(id),
  template_type TEXT,
  content TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Court Filings
CREATE TABLE court_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_intake_id UUID REFERENCES case_intakes(id),
  filing_type TEXT,
  content TEXT,
  filed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG: Legal Documents
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  source TEXT,
  article_id TEXT,
  topics TEXT[],
  language TEXT DEFAULT 'ar',
  embedding VECTOR(768),
  lawyer_verified BOOLEAN DEFAULT FALSE, -- gate before RAG indexing job picks it up
  verified_by_lawyer_id UUID REFERENCES lawyers(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON legal_documents USING gin (topics);
CREATE INDEX ON legal_documents (article_id);

-- Legal Rules Config (versioned, drives Calculator + Workflow deadlines)
CREATE TABLE legal_rules_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL,
  rules_json JSONB NOT NULL, -- compensation categories, ranges, deadlines, doc checklists
  is_active BOOLEAN DEFAULT FALSE, -- only one active version at a time
  approved_by_lawyer_id UUID REFERENCES lawyers(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Templates (MDX, versioned, lawyer-approved)
CREATE TABLE legal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL, -- 'insurer_demand', 'cbj_complaint', 'statement_of_claim', etc.
  version INT NOT NULL,
  content_mdx TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  approved_by_lawyer_id UUID REFERENCES lawyers(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Row-Level Security Model

| Table category | Read access | Write access |
| --- | --- | --- |
| User's own case data (`case_intakes`, `accidents`, `claims`, `documents`, `claim_logs`, `drafts`) | Owning user; assigned reviewing lawyer (post-handoff); admin | Owning user (create/edit pre-review); reviewing lawyer (review fields only); admin |
| `stories`, `corruption_reports` | Public: approved/published rows only; Admin: all rows | Anyone (create, anonymous); Admin (moderate) |
| `lawyers`, `lawyer_reviews` | Public (verified profiles only) | Admin (verification); verified users (reviews) |
| `legal_documents`, `legal_rules_config`, `legal_templates` | Public: active/verified content only via application layer; Admin & legal-reviewer lawyers: full read/write | Legal-reviewer lawyers (`is_legal_reviewer = true`) and admins only |
| Regulator dashboard views (Phase 3) | Approved regulator accounts only, via aggregated views with k-anonymity applied at the query layer | N/A (read-only) |

### 6.4 AI/LLM Integration Layer

* Single internal interface (e.g., `generateCompletion(prompt, context, schema)`) wrapping whichever provider is selected, so intake, drafting, and RAG-answer code never call a provider SDK directly. This is what makes the Grok-vs-Gemini decision (Section 9) a config change, not a rewrite.
* Structured-output mode (function calling / JSON schema) required for intake parsing and citation extraction — free-text parsing is not acceptable for data that feeds legal documents.
* System-prompt library stored server-side and versioned, not inlined ad hoc per call — the intake prompt, drafting prompt, and RAG-answer prompt should each be a reviewable, versioned asset (and a candidate for the same lawyer-approval gate as templates, since prompt wording affects legal-sounding output).
* Guardrails: confidence threshold below which the assistant must return an "uncertain, refer to lawyer" response rather than an answer; hard block on generating anything in the `court_filings` or `drafts` (CBJ/court target) tables without the case first passing through intake validation.

### 6.5 RAG Pipeline

1. **Ingestion**: source document → chunked (200–400 tokens, by article/clause) → embedded (768-dim) → inserted into `legal_documents` with `lawyer_verified = false`.
2. **Verification gate**: a legal-reviewer lawyer reviews and flips `lawyer_verified = true` via the Legal Content Management UI (Section 7.2) — the indexing/retrieval job only serves `lawyer_verified = true` rows.
3. **Retrieval**: hybrid BM25 + vector search, reranked to boost exact article-ID matches and topic relevance to the query.
4. **Answer generation**: retrieved chunks passed to the LLM layer (6.4) with instructions to cite `article_id` for every legal claim; below-threshold retrieval triggers the uncertainty fallback.

### 6.6 Notification Layer

* Abstracted interface (`sendNotification(channel, template, recipient, data)`) over SMS (Twilio), WhatsApp Business API, and transactional email — application code never calls a provider SDK directly, matching the pattern in 6.4.
* Queue-based sending with retry/backoff so a provider outage doesn't silently drop accident-deadline reminders.

### 6.7 API Surface (representative, not exhaustive)

| Endpoint | Purpose |
| --- | --- |
| `POST /api/intake/message` | Send/receive one turn of the AI intake conversation |
| `POST /api/calculator/estimate` | Run the Rights Calculator against the active `legal_rules_config` |
| `POST /api/drafts/generate` | Generate a draft from a case intake + template |
| `POST /api/drafts/:id/submit-for-review` | Move a draft to `pending_review` |
| `POST /api/drafts/:id/review` | Lawyer approves/rejects with comments |
| `POST /api/drafts/:id/send` | Blocked unless `review_status = 'approved'` |
| `GET /api/lawyer/review-queue` | Reviewing lawyer's pending items (drafts, RAG sources, templates) |
| `POST /api/legal-content/rules-config` | Propose a new `legal_rules_config` version (lawyer/admin only) |
| `POST /api/legal-content/rules-config/:id/approve` | Approve and activate a rules-config version |
| `POST /api/handoff` | Create a handoff packet to a lawyer |
| `POST /api/stories` / `POST /api/corruption-reports` | Anonymous submissions |

---

## 7. Lawyer Review & Legal Content Management (core feature)

Since legal counsel is already engaged for the platform, this section specifies how that oversight is actually implemented in the product — not as a risk mitigation, but as a first-class workflow with its own UI, states, and data.

### 7.1 Per-Document Review Workflow

**States** (on `drafts.review_status`): `pending_review → approved | rejected → sent` (sent only reachable from `approved`).

* Any draft generated by Drafting Mode (5.2.1) enters `pending_review` automatically.
* A reviewing lawyer (`lawyers.is_legal_reviewer = true`) sees it in their review queue (`GET /api/lawyer/review-queue`), can edit inline, leave comments, and approve or reject.
* Rejection returns the draft to the user/system with `review_comments` for revision and re-submission.
* `sent_at` is only settable by the application when `review_status = 'approved'` — enforced in the API layer and, ideally, with a DB constraint/trigger, not just client-side logic.
* Every state transition is timestamped and attributed (`reviewed_by_lawyer_id`, `reviewed_at`) for the audit log required in 5.2.1.

### 7.2 Legal Content Management (ongoing curation, not just per-document review)

Three content types need the same lawyer-approval discipline as individual drafts, since they drive what every user sees:

* **Compensation rules** (`legal_rules_config`): versioned; a new version is proposed, reviewed, and only becomes `is_active` after a legal reviewer approves it. The Rights Calculator and Workflow deadlines always read the currently active version.
* **RAG legal corpus** (`legal_documents`): nothing is retrievable by the AI layer until `lawyer_verified = true` (Section 6.5).
* **Document templates** (`legal_templates`): versioned MDX, same propose → approve → activate flow.

This gives your legal counsel a real admin surface (a simple internal dashboard, not just "review a PDF over email") to keep the platform's legal content current without needing an engineer for every wording change.

### 7.3 Roles

* `lawyers.is_legal_reviewer` distinguishes lawyers who can approve platform content/drafts from lawyers who are simply listed in the directory (5.2.4) for case handoff — a directory lawyer isn't automatically a reviewer, and vice versa isn't required either, but your engaged legal counsel would typically be flagged `is_legal_reviewer = true`.
* `users.role = 'admin'` can manage lawyer verification and `is_legal_reviewer` flags.

### 7.4 What Still Needs Legal Counsel's Direct Input

Regardless of the review workflow above, these specific items need your lawyer's direct input before they're built into rules/templates/RAG content — the workflow enforces *that* review happens, not what the correct legal content actually is:

* Confirmed article/regulation numbers and current deadlines (Civil Code, compulsory insurance regulation, Civil Procedure Code, CBJ instructions) — every number in Section 2 and elsewhere is a placeholder.
* Sign-off on the initial `legal_rules_config` v1 and each `legal_templates` entry before Phase 1/2 launch respectively.
* Confirmation of current CBJ complaint-channel contact details before they're hardcoded into the Complaints Directory (5.1.3).

---

## 8. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | Page load < 2s; API p95 < 500ms; LLM latency ≤ 3s/turn; RAG retrieval ≤ 500ms |
| Accessibility | WCAG 2.1 AA — RTL, screen readers, keyboard nav |
| Localization | Arabic default, English toggle |
| Mobile | Responsive, PWA with offline support for key pages |
| Security | TLS 1.3 in transit, AES-256 at rest, RLS per Section 6.3, malware scanning on upload |
| Auditability | Every AI generation and every review-workflow transition logged with actor and timestamp |
| Data compliance | Jordan Personal Data Protection Law — consent capture, deletion requests |

---

## 9. Technical Validation Plan

Concrete things worth prototyping before committing to full-scale development — this is the "validate the technical tools" work:

1. **LLM provider bake-off**: run the same set of Arabic-language legal-intake and drafting prompts through Grok and Gemini (and any other candidate). Compare structured-output reliability, Arabic fluency/register (legal Arabic vs. plain Arabic), latency, and cost per 1K case intakes at your expected volume. Pick one and build the abstraction layer (6.4) around it — don't leave both wired in "just in case."
2. **RTL Arabic PDF generation spike**: confirm `@react-pdf/renderer` (or an alternative) correctly renders mixed Arabic/English, right-to-left layout, and Noto Sans Arabic embedding for a realistic complaint-letter template before building the full template library.
3. **Hybrid RAG retrieval accuracy**: index a small real sample of Jordanian legal text (even 20–30 lawyer-approved articles) and test whether hybrid BM25 + vector search actually surfaces the right article for representative Arabic legal queries — this is the highest-risk technical assumption in the whole spec.
4. **Structured intake extraction reliability**: test whether the chosen LLM reliably produces schema-valid JSON from a multi-turn Arabic conversation, including messy/incomplete user answers, before building the Calculator and Drafting Mode on top of that output.
5. **Notification deliverability**: confirm actual SMS/WhatsApp delivery rates and latency for Jordanian numbers through your chosen provider before relying on it for statute-of-limitations reminders.
6. **Review-workflow ergonomics**: build the lawyer review queue (7.1) early and have your actual engaged lawyer use it on a handful of real draft examples — this is a UI/workflow risk (will a busy lawyer actually use this queue) as much as a technical one.

---

## Appendix A: Engagement Letter Templates (Arabic/English)

*(Starting drafts — route through the Legal Content Management workflow in Section 7.2 for approval before use, same as any other template.)*

### A.1 Contingency Engagement Letter (Arabic)

اتفاقية تمثيل قانوني (على أساس نسبة من التعويض)

بين: [اسم المحامي/المكتب]، ومقره [العنوان]، ("المحامي")
وبين: [اسم العميل]، رقم الهوية [___]، ("العميل")

١. النطاق: يمثل المحامي العميل في المطالبة التأمينية، الشكوى لدى البنك المركزي، ورفع الدعوى إن لزم.
٢. الأجر: نسبة [___]% من صافي التعويض المُستلم (بعد خصم الرسوم القضائية وأتعاب الخبراء).
٣. المصروفات: الرسوم القضائية، أتعاب الخبراء، وطوابع البريد تُخصم من التعويض قبل احتساب النسبة.
٤. موافقة التسوية: لا يتم قبول أي تسوية دون موافقة العميل الخطية.
٥. السرية: نلتزم بسرية معلوماتك وفق قانون حماية البيانات الشخصية.
٦. الإنهاء: يجوز لأي طرف إنهاء التمثيل بإشعار خطي؛ تستحق الأتعاب عن العمل المنجز حتى تاريخ الإنهاء.
٧. الاختصاص: محاكم الأردن.

توقيع المحامي: __________    تاريخ: ___/___/_____
توقيع العميل: __________    تاريخ: ___/___/_____

### A.2 Contingency Engagement Letter (English)

Legal Representation Agreement (Contingency Fee)

Between: [Lawyer/Firm Name], located at [Address] ("Lawyer")
And: [Client Name], ID No. [___] ("Client")

1. Scope: Lawyer represents Client in the insurance claim, CBJ complaint, and court filing if needed.
2. Fee: [___]% of net compensation received (after court fees and expert fees).
3. Costs: Court fees, expert fees, and postage are deducted from compensation before calculating the percentage.
4. Settlement approval: No settlement is accepted without Client's written consent.
5. Confidentiality: Client information is kept confidential per Jordan's Personal Data Protection Law.
6. Termination: Either party may terminate with written notice; fees are due for work performed to date.
7. Jurisdiction: Courts of Jordan.

Lawyer Signature: __________    Date: ___/___/_____
Client Signature: __________    Date: ___/___/_____

### A.3 Hourly/Fixed Engagement Letter (Arabic)

اتفاقية تمثيل قانوني (أجر ساعي/مقطوع)

بين: [اسم المحامي/المكتب]، ومقره [العنوان]، ("المحامي")
وبين: [اسم العميل]، رقم الهوية [___]، ("العميل")

١. النطاق: [تفاوض/صياغة/تقاضي].
٢. الأجر: [___] دينار/ساعة أو مبلغ مقطوع [___] دينار للمرحلة [___].
٣. المصروفات: تُدفع فعليًا (رسوم محكمة، خبراء، بريد).
٤. الفواتير: تُصدر كل [١٥/٣٠] يومًا؛ السداد خلال [٧] أيام.
٥. باقي الشروط (السرية، التسوية، الإنهاء، الاختصاص) كما في نموذج النسبة.

توقيع المحامي: __________    تاريخ: ___/___/_____
توقيع العميل: __________    تاريخ: ___/___/_____

### A.4 Hourly/Fixed Engagement Letter (English)

Legal Representation Agreement (Hourly/Fixed Fee)

Between: [Lawyer/Firm Name], located at [Address] ("Lawyer")
And: [Client Name], ID No. [___] ("Client")

1. Scope: [Negotiation/Drafting/Litigation].
2. Fee: [___] JOD/hour or fixed fee [___] JOD for stage [___].
3. Costs: Pay-as-incurred (court fees, experts, postage).
4. Billing: Invoiced every [15/30] days; payment due within [7] days.
5. Other terms (confidentiality, settlement, termination, jurisdiction) as in the contingency model.

Lawyer Signature: __________    Date: ___/___/_____
Client Signature: __________    Date: ___/___/_____
