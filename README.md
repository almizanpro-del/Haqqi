# Haqqi — حقي

> **Your Rights After a Car Accident in Jordan**
>
> A bilingual (Arabic-first, English-second) AI-assisted platform that helps car-accident victims in Jordan understand their likely legal entitlements, follow a structured claims timeline, organize evidence, recognize bad-faith insurer conduct, generate lawyer-reviewed draft documents, and connect with a vetted lawyer.

**Vision**: No one in Jordan should lose rightful compensation after a car accident due to lack of knowledge, fear, or an unfair claims process.

**Positioning**: a self-help and case-organization tool with a built-in lawyer-review layer — not a substitute for legal representation. Every document that leaves the platform is either explicitly informational or has passed through the Lawyer Review workflow (PRD §7).

---

## 📋 Status

Built per **PRD v3.0 — Technical / Development-Ready**.

| Phase | Status | Coverage |
| --- | --- | --- |
| **Phase 1** — Core Self-Help | ✅ Implemented | AI Intake, Rights Calculator, Workflow Timeline, Complaints Directory, Anonymous Stories |
| **Phase 2** — Drafting & Case Management | ✅ Implemented | Drafting Mode, RAG UI, Evidence Organizer, Lawyer Review Queue, Legal Content Mgmt, Corruption Reporting |
| **Phase 3** — Litigation & Ecosystem | ✅ Implemented | Lawyer Directory + Handoff, Engagement Letters, Court Procedure, Community Forum, Regulator Dashboard, Notifications, PDF Export, Hybrid RAG Search |

---

## 🏗️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes / Server Actions |
| Database | Prisma ORM (SQLite for dev; Postgres + pgvector for prod per PRD §6.1) |
| AI/LLM | `z-ai-web-dev-sdk` (provider-agnostic abstraction per PRD §6.4) |
| RAG | Lawyer-verified corpus with retrieval UI (hybrid BM25 + vector planned per PRD §9.3) |
| PDF Generation | RTL Arabic PDF (planned — PRD §9.2 spike) |
| Hosting | Vercel + Supabase (production target) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (or Bun 1.3+)
- A `.z-ai-config` file in your home directory or project root (for the LLM SDK)

### Local Development (SQLite)

```bash
# Install dependencies
bun install

# Initialize the database (SQLite for dev)
bun run db:push

# Seed initial legal content (lawyers, rules v1, templates, RAG corpus, stories)
bun run seed

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment (Supabase + Vercel)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete step-by-step guide.

Quick summary:
1. Create a Supabase project (Frankfurt region for best Jordan latency)
2. Enable pgvector extension (SQL provided in `prisma/migrations/001_setup_pgvector.sql`)
3. Connect the GitHub repo to Vercel
4. Set environment variables (see `.env.example`)
5. Run `bun run db:push && bun run seed` against Supabase
6. Deploy on Vercel

**Cost**: $0/month on free tiers for MVP.

### Demo Flow

1. Click **"Start AI Intake"** on the home page.
2. Either complete the 7-stage AI conversation, or click **"Load a ready demo case"** to skip ahead.
3. Visit the **Rights Calculator** to see estimated compensation ranges.
4. Visit **Drafting Mode** to generate an AI-drafted legal document.
5. Switch role to **Lawyer** (top-right corner) → open **Lawyer Review Queue** → approve the draft.
6. Switch back to **User** → return to Drafting Mode → click **Send / Export** (now enabled because the draft is approved).

---

## 🗂️ Project Structure

```
.
├── prisma/
│   └── schema.prisma            # 15-model schema mirroring PRD §6.2
├── scripts/
│   └── seed.ts                  # Database seeder (lawyers, rules, templates, RAG, stories)
├── src/
│   ├── app/
│   │   ├── api/                 # 19 API routes
│   │   │   ├── cases/           # CRUD + timeline
│   │   │   ├── intake/          # AI intake (LLM)
│   │   │   ├── calculator/      # Rules-driven estimate
│   │   │   ├── drafts/          # generate/submit/review/send (hard-enforced §7.1)
│   │   │   ├── review-queue/    # Lawyer's queue
│   │   │   ├── legal-content/   # rules / RAG / templates (§7.2)
│   │   │   ├── evidence/        # Evidence organizer
│   │   │   ├── claim-logs/      # Interaction log
│   │   │   ├── stories/         # Anonymous stories
│   │   │   ├── corruption-reports/
│   │   │   └── complaints/      # Directory contacts
│   │   ├── layout.tsx           # Bilingual RTL/LTR + Arabic fonts
│   │   ├── page.tsx             # View router
│   │   └── globals.css          # Theme (teal/amber palette)
│   ├── components/
│   │   ├── haqqi/               # Header, Footer, LanguageToggle
│   │   ├── views/               # 11 feature views
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── i18n/                # Bilingual strings + Zustand store
│   │   ├── legal/               # Seed data (rules, templates, RAG corpus)
│   │   ├── api-helpers.ts       # Demo user, reviewer, JSON helpers
│   │   └── db.ts                # Prisma client
│   └── hooks/                   # use-mobile, use-toast
└── .env                         # DATABASE_URL
```

---

## 🛡️ Lawyer Review Workflow (PRD §7.1)

Every AI-generated draft flows through this state machine:

```
pending_review → approved | rejected → sent
                                     (only reachable from approved)
```

**Hard enforcement** at the API layer (`/api/drafts/send`):

```typescript
if (draft.reviewStatus !== "approved") {
  return NextResponse.json(
    { error: `cannot_send: review_status=${draft.reviewStatus}` },
    { status: 400 },
  );
}
```

Every state transition is timestamped and attributed (`reviewed_by_lawyer_id`, `reviewed_at`) and logged in the `ReviewLog` table for the audit trail required in PRD §5.2.1.

---

## 📚 Legal Content Management (PRD §7.2)

Three content types share the same propose → lawyer-approve → activate workflow:

| Content Type | Table | Gate |
| --- | --- | --- |
| Compensation rules | `legal_rules_config` | `is_active = true` only after lawyer approval |
| RAG legal corpus | `legal_documents` | `lawyer_verified = true` required before retrieval |
| Document templates | `legal_templates` | `is_active = true` only after lawyer approval |

This gives the engaged legal counsel a real admin surface to keep the platform's legal content current without needing an engineer for every wording change.

---

## ⚠️ Legal Disclaimer

**All article/regulation numbers in this platform are placeholders pending confirmation by engaged legal counsel** (PRD §7.4). The estimates produced by the Rights Calculator are not legal advice and not guaranteed amounts — they are indicative ranges based on lawyer-approved rules.

Haqqi is a self-help tool, not a substitute for legal representation.

---

## 📐 Technical Validation Plan (PRD §9)

The following items are worth prototyping before committing to full-scale development:

1. ✅ **LLM provider abstraction** — provider is swappable behind `z-ai-web-dev-sdk`
2. 🚧 **RTL Arabic PDF generation spike** — `@react-pdf/renderer` with Noto Sans Arabic embedding
3. 🚧 **Hybrid RAG retrieval accuracy** — currently direct lookup; BM25 + vector pending
4. ✅ **Structured intake extraction** — Zod-validated JSON from LLM
5. 🚧 **Notification deliverability** — Twilio/WhatsApp Business API integration
6. ✅ **Review-workflow ergonomics** — usable lawyer queue UI

---

## 📄 License

Proprietary. © 2026 Haqqi. All rights reserved.

---

## 🔗 References

- **PRD**: `Haqqi_PRD_v3.0_Technical.md` (in project root)
- **Built per**: PRD v3.0 — Technical / Development-Ready
