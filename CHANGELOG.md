# Changelog

All notable changes to Haqqi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (Phase 3 — in progress)
- Lawyer Directory + Handoff Packets (PRD §5.2.4)
- Engagement Letters module with e-signature (PRD §5.3.2 + Appendix A)
- Court Procedure Guidance Module (PRD §5.3.1)
- RTL Arabic PDF export for approved drafts (PRD §5.1.3, §9.2)
- Hybrid RAG retrieval (BM25 + vector) (PRD §6.5, §9.3)
- Community Forum stub (PRD §5.3.4)
- Regulator Dashboard stub (PRD §5.3.3)
- Notification layer with SMS/WhatsApp/email abstraction (PRD §6.6)

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
