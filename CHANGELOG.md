# Changelog

All notable changes to Haqqi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
