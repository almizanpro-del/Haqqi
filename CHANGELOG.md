# Changelog

All notable changes to Haqqi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (Phase 8 — Audit Gap Closure — 2026-08-25)
Closed all Critical and Important gaps identified in external review.

**Critical gaps closed**:
- **Multi-user case access** (C1) — `CaseAccess` model (owner/family_representative/assigned_lawyer/viewer), API for grant/revoke, audit logged. Family members can now manage a case for an injured/deceased relative.
- **Calendar export (.ics)** (C3) — `GET /api/cases/[id]/deadlines.ics` produces valid iCalendar with all workflow tasks + statute of limitations + CBJ complaint window, with VALARM triggers. 'Export to calendar' button on Dashboard.
- **Lawyer verification flow** (C4) — `LawyerVerification` model (barId, licenseNumber, licenseFileUrl, lawFirmName, practiceAreas), submit + admin approve/reject workflow. Approval flips `isVerified=true`.
- **PII redaction before LLM calls** (C5) — `src/lib/pii-redaction.ts` with 8 PII patterns (national_id, phone, email, credit_card, iban, license_plate, passport, dob). Wired into intake + drafting. LLM receives redacted text + notice. PDPL compliance.
- **Canonical audit log** (C6) — `AuditLog` model (actorId, actorRole, action, entityType, entityId, caseId, metadata, ipAddress, userAgent). `src/lib/audit.ts` with convenience methods. Wired into 10+ actions. `GET /api/audit-logs` with filters.

**Important gaps closed**:
- **Crisis/distress escalation** (I7) — Enhanced AI intake prompt with distress detection (death, suicide ideation, severe distress). Returns `distressDetected=true` → UI shows rose banner with 911 + 111 (Mental Health Hotline) + 080022022. Pauses legal intake.
- **Evidence chain-of-custody** (I8) — `EvidenceHash` model with SHA-256 + immutable timestamp. Computed on upload. Audit logged with hash.
- **Consent versioning** (I9) — `ConsentRecord` model with consentType, version, documentHash (SHA-256 of accepted text). `ConsentGate` modal on first visit requiring 4 consents (terms, privacy, not-legal-advice, data-processing).
- **In-app notification center** (I10) — `GET /api/notifications/inbox` builds user-facing feed from in_app logs + draft status changes + handoff packets. `InboxView` with severity colors, unread badges.
- **AI answer feedback** (I11) — `AiFeedback` model (feature, messageId, query, answer, rating, comment). `AiFeedbackButtons` (thumbs up/down) on RAG search results. Quality signal for AI improvement.

**Worth-deciding gaps closed**:
- **PDPL data subject rights** (W14) — `DataSubjectRequest` model (export/deletion/correction). `PrivacyView` with request form + history + recorded consents + PII protection info.
- **In-app payment** (W15) — explicitly documented as out of scope per PRD §5.4.
- **Voice input/output** (W13) — deferred (low priority).

**New models** (7): CaseAccess, LawyerVerification, AuditLog, EvidenceHash, ConsentRecord, AiFeedback, DataSubjectRequest. Total models: 30.
**New API routes** (9): cases/[id]/access, cases/[id]/deadlines.ics, lawyers/[id]/verification, lawyers/verify, audit-logs, consents, ai-feedback, data-subject-requests, notifications/inbox.
**New lib modules** (3): pii-redaction.ts, audit.ts, consents.ts.
**New views** (2): InboxView, PrivacyView.
**New components** (2): ConsentGate, AiFeedbackButtons.

### Added (Phase 5 — implemented 2026-08-25)
- **Case Dashboard** — unified overview of active case with deadline countdowns (insurer response / CBJ / statute of limitations) with CRITICAL badges, bad-faith pattern auto-detection from claim log, document checklist progress, drafts summary by status, recent interactions timeline, and quick-link cards to all related views.
- **Arabic PDF Font Embedding** (PRD §9.2 spike) — embedded DejaVu Sans (165 Arabic glyphs) into jsPDF. PDF size grew from 8KB to 309KB. RTL line reversal + right-alignment. Note: DejaVu Sans lacks Arabic shaping engine — letters render isolated. Production should embed Noto Sans Arabic with a shaping library.
- **Settings Page** — language selector (AR/EN), role selector (victim/lawyer/admin/regulator), theme info, about card, reset local data, restart onboarding tour.

### Added (Phase 6 — implemented 2026-08-25)
- **PWA Manifest** (PRD §8) — `public/manifest.json` with name, shortcuts (Intake/Calculator/Dashboard), theme color, RTL direction. App is now installable on mobile/desktop.
- **Enriched RAG Corpus** (PRD §6.5) — added 7 new legal documents (PDPL-3, CML-12, CPC-118, CIV-267, MACF-7, CML-5, LAB-32). Total corpus: 12 documents (was 5). All verified and searchable.
- **Mobile Bottom Navigation** — fixed bottom nav for mobile (lg:hidden) with 5 primary items + More button that opens a bottom sheet with all secondary views. Role-aware.
- **Onboarding Tour** — 6-step dialog that auto-shows on first visit (localStorage flag). Steps: Welcome → AI Intake → Rights Calculator → Drafting Mode → Lawyer Review → Lawyer Directory. Progress dots, Skip/Next/Get started buttons.

### Added (Phase 3 — implemented 2026-08-25)
- **Lawyer Directory + Handoff Packets** (PRD §5.2.4) — searchable directory with filters (location, language, fee model, expertise), reviews from verified users, one-click handoff packet (enforces §7.1: only approved drafts can be included).
- **Engagement Letters** (PRD §5.3.2 + Appendix A) — 4 templates (contingency/hourly × AR/EN), template-filling via API, dual e-signature workflow (client + lawyer) per Electronic Transactions Law.
- **Court Procedure Guidance** (PRD §5.3.1) — 5 procedural step sections (pre-filing, statement of claim, service, expert pathway, enforcement) + court filings API.
- **RTL Arabic PDF Export** (PRD §5.1.3, §9.2) — jsPDF-based generator with brand header, metadata, page numbers, hard-enforced: only approved/sent drafts can be exported.
- **Hybrid RAG Retrieval** (PRD §6.5, §9.3) — BM25-like scoring + topic boost + article-ID exact-match boost, confidence threshold with "refer to lawyer" fallback per §6.4 guardrails.
- **Notification Layer** (PRD §6.6) — abstracted `sendNotification()` interface, 8 templates (reminders, draft_approved/rejected, handoff, forum), audit log with attempts + provider message IDs.
- **Community Forum** (PRD §5.3.4) — topics + posts with 6 categories, verified lawyer Q&A badge, moderation queue.
- **Regulator Dashboard** (PRD §5.3.3) — aggregated, anonymized data with k-anonymity (k≥5), per-insurer breakdown + totals, role-based access (admin/regulator only).
- **Regulator role** added to role switcher (victim/lawyer/admin/regulator).
- **7 new Prisma models**: LawyerReview, EngagementLetter, CourtFiling, ForumTopic, ForumPost, RegulatorStat, NotificationLog.
- **Forum seed script** (`scripts/seed-forum.ts`) — 5 sample topics + 3 lawyer replies + 2 regulator stats.
- **150+ new translation keys** (AR/EN) for all new views.

### Changed
- Extended Prisma schema with 7 new models and updated relations on User, Case, Lawyer.
- Updated header navigation with 7 new nav items, role gating for admin/regulator-only views.
- Updated Drafting view with "Export PDF" button (visible when status is approved/sent).
- Updated Regulator Stats endpoint to use the new RegulatorStat materialized table.

## [0.1.0] — 2026-08-25

### Added — Initial MVP
- Bilingual Arabic-first RTL layout with English toggle (PRD §1)
- 7-stage AI Intake via z-ai-web-dev-sdk with structured JSON output (PRD §5.1.5)
- Rights & Entitlements Calculator driven by versioned `legal_rules_config` (PRD §5.1.1, §7.2)
- Step-by-Step Workflow Timeline with deadlines (PRD §5.1.2)
- Complaints Directory (CBJ / insurers / courts) (PRD §5.1.3)
- Anonymous Stories with moderation queue (PRD §5.1.4)
- Drafting Mode — AI legal companion with citation-aware generation (PRD §5.2.1)
- RAG Knowledge Base UI with lawyer-verification gate (PRD §5.2.2, §6.5, §7.2)
- Evidence Organizer & Claim Log with bad-faith pattern flags (PRD §5.2.3)
- Anti-Corruption Education & Reporting (PRD §5.2.5)
- Lawyer Review Queue with approve/reject + audit log (PRD §7.1)
- Legal Content Management (rules / RAG / templates with propose → approve → activate) (PRD §7.2)
- Hard enforcement: drafts cannot be sent until `review_status = 'approved'` (PRD §7.1)
- Role switcher (victim / lawyer / admin) with view gating
- 15-model Prisma schema mirroring PRD §6.2
- 19 API routes covering PRD §6.7 surface
- Database seed script (lawyers, rules v1, 7 templates, 5 RAG docs, 3 stories)
- Comprehensive README + .gitignore
