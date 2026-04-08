# Company Mind Audit — 2026-04-07

## Summary
- **3 P0 issues** — ALL RESOLVED (commit f581bc1)
- **5 P1 issues** — ALL RESOLVED (commit below)
- **8 P2 issues** (polish) — deferred
- **4 P3 issues** (nice-to-have) — deferred

---

## P0 — Blockers

**P0-1. `/api/test-ghl` is completely unauthenticated**
File: `src/app/api/test-ghl/route.ts`
No `getTenantForUser()`, no auth check of any kind. Uses hardcoded env vars (`GHL_LOCATION_ID`, `GHL_ACCESS_TOKEN`) to call GHL API. Any anonymous request can search contacts via GHL. **Delete this file immediately.**

**P0-2. `approveAction()` and `rejectAction()` mutate without tenant filter**
File: `src/app/actions.ts:12-14` and `src/app/actions.ts:31-33`
Both call `getTenantForUser()` (good) but then update `call_actions` with `.eq('id', actionId)` only — no `.eq('tenant_id', tenantId)`. Any user with a valid UUID could approve/reject another tenant's call actions.

**P0-3. 11 stale reads from `contact_data_points` (0 rows in production)**
The legacy `contact_data_points` table has 0 rows. These pages/tools query it and get empty results:
- `src/app/(app)/calls/[id]/page.tsx:23-24` — Data Points tab source + company_name/address header (locked page)
- `src/app/(app)/calls/page.tsx:113` — company_name for call list rows
- `src/app/(app)/companies/[id]/page.tsx:47,121` — contact DPs for company detail
- `src/app/(app)/contacts/[id]/page.tsx:24` — contact field_name/field_value
- `src/app/(app)/dashboard/page.tsx:83` — company_name for inbox display
- `src/app/api/contacts/[id]/company/route.ts:13` — company lookup API
- `src/mastra/tools/db-companies.ts:65,141` — agent company name lookups (locked)
- `src/mastra/tools/call-analysis.ts:203` — old Mastra tool still writes to it (locked)

Impact: company names show as empty/Unknown across Dashboard, Calls, Companies, Contacts pages. Agent tools return no company data.

---

## P1 — Must fix before production tenant clone

**P1-1. CLAUDE.md DB tables list is stale**
File: `CLAUDE.md:98`
Still lists `call_jobs` (dropped). Missing: `companies`, `company_contacts`, `data_points`, `enrichment_jobs`, `next_steps`, `predictive_scores`, `webhook_events`, `appointment_status`, `pipeline_companies`.

**P1-2. 6 tables have no migration files**
These tables exist in Supabase but were created outside tracked migrations. Cannot recreate DB from migrations alone:
- `data_points` — R2 table, 8 rows, active
- `contact_data_points` — legacy, 0 rows, still read by 11 code sites
- `calls` — core table, no CREATE TABLE in migrations (only ALTERs)
- `call_actions` — referenced in actions.ts
- `feedback_log` — referenced in actions.ts
- `chat_messages` — referenced in chat route

**P1-3. Missing env vars: `CRON_SECRET`, `GHL_WEBHOOK_SECRET`**
Both are required for R3 pipeline but not set in `.env.local`. The cron worker accepts all requests without CRON_SECRET (fails open). Also missing: `GHL_ACCESS_TOKEN`, `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_LOCATION_ID`.

**P1-4. `/api/inbox` and `/api/appointments` fall back to demo data on error**
Instead of returning 401/500, these endpoints silently return hardcoded demo conversations/appointments when GHL fails. In production, a real GHL error would show fake data to users.

**P1-5. `text-zinc-900` used 35+ times instead of `text-[#1a1a1a]`**
Design system specifies `text-[#1a1a1a]` for primary text. Found 35+ instances of `text-zinc-900` across 20+ components. Functional difference is minimal (`#18181b` vs `#1a1a1a`) but inconsistent with the locked design spec.

---

## P2 — Polish

**P2-1. `bg-zinc-900` used as button/badge background in 6+ components**
Design system says no solid dark backgrounds. Found in:
- `task-list.tsx:231` — task checkbox (checked state)
- `pipeline-funnel.tsx:100` — stage count badge
- `call-detail-tabs.tsx:407,434` — action buttons (Push to CRM, Save edit)
- `chat-panel.tsx:100,112,174,203` — FAB, header, send button, user bubble (locked)

**P2-2. Coral (#ff6a3d) usage: 39 instances across 20 files**
Budget is 7 categories. Current usage spans: sidebar brand mark, active nav, small icon buttons, score circles, stat values, form pills, tab active borders, floating button, research field focus, login button, next-steps tab badge, inbox tab highlight. Exceeds budget significantly.

**P2-3. `stat-detail-modal.tsx:93` uses `bg-zinc-900/30` backdrop**
Should use `bg-black/20` per confirm-modal pattern, or a lighter frosted overlay.

**P2-4. No loading.tsx for `/companies/[id]` route**
All other dynamic routes have loading.tsx skeletons. This one is missing.

**P2-5. `dialog.tsx:42` uses `bg-black/10` backdrop**
shadcn default, not aligned with the frosted glass system backdrop pattern.

**P2-6. Old `/pipeline` route is a redirect only**
`src/app/(app)/pipeline/page.tsx` exists only to redirect to `/companies`. Could be a next.config.ts redirect instead.

**P2-7. `/brand` showcase page still accessible in production**
`src/app/(app)/brand/page.tsx` — internal design showcase visible to all authenticated users.

**P2-8. `src/app/page.tsx` (root page) exists**
Likely unreachable behind middleware redirect. Verify it's not serving stale content.

---

## P3 — Nice-to-have

**P3-1. No TODO/FIXME/HACK comments found**
Clean. (The `format-phone.ts` grep hit was a false positive on the arrow symbol `→`.)

**P3-2. Old `/pipelines` route already deleted**
Confirmed. No stale duplicate.

**P3-3. `contact_data_points` table should be formally deprecated**
Write a migration to either drop it or add a deprecation comment. Currently ghost data source.

**P3-4. `settings` page appears to be minimal/empty**
`src/app/(app)/settings/page.tsx` exists but was not in the feature list. Verify it has content.

---

## Pass-by-pass findings

### Pass 1 — Locked file inventory

**Locked files that exist (confirmed):**

| File | Last commit | Notes |
|------|-------------|-------|
| src/lib/ghl.ts | `0d18eb6` | Original MVP |
| src/lib/supabase.ts | `820722b` | Client-side crash fix |
| src/lib/format.ts | `573eb2a` | Added formatExactDate/Time |
| src/mastra/** | `2835f97` | Rename refactor |
| src/app/(app)/calls/[id]/page.tsx | `f655e86` | R3 banner + audio |
| src/components/chat/chat-panel.tsx | `d733c52` | Auth integration |
| src/lib/research/catalog.ts | `7473e68` | R1 catalog lock |
| src/lib/ai/enrichment.ts | `7473e68` | R2 engine |
| src/lib/ai/call-analysis.ts | `7473e68` | R2 engine |

**Files that should probably be locked but aren't listed:**
- `src/app/api/cron/process-calls/route.ts` — R3 pipeline core
- `src/lib/transcription/assemblyai.ts` — R3 transcription core
- `src/lib/ai/helpers.ts` — shared by both R2 engines

### Pass 2 — Tenant isolation

| File | getTenant? | tenant filter? | Verifies ownership? | Risk |
|------|-----------|----------------|---------------------|------|
| /api/test-ghl | NO | NO | NO | **P0** |
| actions.ts (approveAction/rejectAction) | YES | **NO** on mutation | NO | **P0** |
| /api/inbox | YES | Partial (GHL) | Partial | P2 |
| /api/appointments | YES | Partial (GHL) | Partial | P2 |
| All other 22 routes | YES | YES | YES | OK |

### Pass 3 — Data source consistency

**`contact_data_points` reads (LEGACY — 0 rows, all return empty):**
11 read sites across 7 files (see P0-3 above for full list).

**`data_points` reads (R2 — 8 rows, active):**
- `src/lib/ai/call-analysis.ts:182` — INSERT (locked, R2 writer)
- `src/app/(app)/calls/[id]/page.tsx:26` — pending count badge (locked)
- `src/app/api/calls/[id]/data-points/route.ts` — GET for DataPointsView
- `src/app/actions.ts` — approve/reject/bulk actions

**`research` reads:**
- `src/lib/ai/enrichment.ts` — R2 enrichment upsert (locked)
- `src/lib/ai/call-analysis.ts` — R2 call analysis upsert (locked)
- `src/app/api/companies/[id]/research/route.ts` — GET/POST
- `src/app/api/contacts/[id]/research/route.ts` — GET/POST
- `src/app/actions.ts:73` — approve promotes to research

**Badge/list mismatch:** calls/[id] badge reads `data_points` (correct, 8), but the locked page still passes `contact_data_points` data as props to the old interface. DataPointsView now self-fetches from API, so the rendered list is correct. The stale props flow through but are ignored.

### Pass 4 — Dead code

- Old `/pipelines` route: **DELETED** (confirmed)
- Old `call_jobs` references: **0 in src/** (cleaned up). Still mentioned in CLAUDE.md DB tables list.
- Mastra `call-analysis.ts:203`: **Still writes to `contact_data_points`** (locked, cannot fix without unlocking)
- TODO/FIXME/HACK comments: **0 found** in src/

### Pass 5 — Component state coverage

| Component | Loading? | Empty? | Error? | Priority |
|-----------|----------|--------|--------|----------|
| inbox-panel.tsx | YES | YES | YES | OK |
| appointments-panel.tsx | YES | YES | YES | OK |
| task-list.tsx | NO | YES | NO | P2 |
| stat-cards.tsx | NO | YES | NO | P2 |
| pipeline-funnel.tsx | NO | YES | NO | P2 |
| company-list.tsx | NO | YES | NO | P2 |
| contact-detail-client.tsx | NO | YES (per section) | NO | P2 |
| contacts-panel.tsx | NO | YES | NO | P2 |
| data-points-view.tsx | YES | YES | YES (inline) | OK |
| processing-status.tsx | N/A | N/A | YES | OK |
| next-steps-tab.tsx | NO | YES | NO | P2 |
| chat-drawer.tsx | YES | YES | YES | OK |

Most components receive server-rendered props (loading handled by Next.js loading.tsx files). Error boundaries exist at the route level. Missing inline error states are low-risk since server components throw to the nearest error.tsx.

### Pass 6 — Design system compliance

- **Solid dark backgrounds (bg-zinc-900):** 8 instances in 5 files (see P2-1)
- **text-zinc-900 vs text-[#1a1a1a]:** 35+ instances (see P1-5)
- **Native confirm/alert:** 0 remaining (all converted to ConfirmModal)
- **Coral (#ff6a3d):** 39 instances across 20 files (budget exceeded — see P2-2)

### Pass 7 — Routes inventory

**App routes (11):**
| Route | Purpose |
|-------|---------|
| / | Root redirect |
| /login | Auth login page |
| /dashboard | Daily HQ — stats, inbox, appointments, tasks |
| /calls | Calls list with tab filters |
| /calls/[id] | Call detail — score, coaching, transcript, next steps, data points |
| /companies | Company list with pipeline funnels |
| /companies/[id] | Company detail — contacts, research, calls |
| /contacts/[id] | Contact detail — overview, activity, research |
| /pipeline | Redirect → /companies |
| /settings | Settings page (minimal) |
| /brand | Internal design showcase |

**API routes (26):** All listed, no orphans found. `/api/test-ghl` is the only one that should be deleted.

### Pass 8 — Env vars

| Env var | Feature | In .env.local? | Public? |
|---------|---------|---------------|---------|
| ANTHROPIC_API_KEY | AI enrichment + call analysis | YES | No |
| ASSEMBLYAI_API_KEY | Transcription | YES | No |
| CRON_SECRET | Cron auth | **NO** | No |
| GHL_ACCESS_TOKEN | test-ghl route (dead) | **NO** | No |
| GHL_CLIENT_ID | GHL OAuth (unused) | **NO** | No |
| GHL_CLIENT_SECRET | GHL OAuth (unused) | **NO** | No |
| GHL_LOCATION_ID | test-ghl route (dead) | **NO** | No |
| GHL_WEBHOOK_SECRET | Webhook signature | **NO** | No |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client-side Supabase | YES | Yes (correct) |
| NEXT_PUBLIC_SUPABASE_URL | Client-side Supabase | YES | Yes (correct) |
| NODE_ENV | Environment detection | Auto | N/A |
| SUPABASE_SERVICE_ROLE_KEY | Server-side Supabase | YES | No |

No secrets with `NEXT_PUBLIC_` prefix. GHL_ACCESS_TOKEN, GHL_CLIENT_ID, GHL_CLIENT_SECRET, GHL_LOCATION_ID are only used by the dead `/api/test-ghl` route — they can be removed when the route is deleted.

### Pass 9 — DB schema vs code

21 tables referenced in code. Tables NOT in CLAUDE.md DB list: `companies`, `company_contacts`, `enrichment_jobs`, `next_steps`, `predictive_scores`, `webhook_events`, `appointment_status`, `pipeline_companies`. Table IN CLAUDE.md but dropped: `call_jobs`.

Tables without CREATE TABLE migrations (P1-2): `data_points`, `contact_data_points`, `calls`, `call_actions`, `feedback_log`, `chat_messages`. These were created before migrations were tracked.

### Pass 10 — Live smoke test

**Not performed** — no browser access from CLI environment. Recommend manual smoke test or Playwright E2E before launch.

---

## Recommended next sessions

1. **Security hardening (1 session):** Delete `/api/test-ghl`, add tenant filter to `approveAction`/`rejectAction`, remove demo data fallbacks from inbox/appointments routes.
2. **Data migration: contact_data_points → research (1 session):** Migrate the 11 stale read sites to use `research` table (or populate `contact_data_points` from `research` as a compatibility shim). Requires unlocking calls/[id]/page.tsx and Mastra tools.
3. **DB migration bootstrap (1 session):** Write CREATE TABLE migrations for the 6 tables missing them. Update CLAUDE.md DB tables list.
4. **Design token sweep (1 session):** Replace all `text-zinc-900` with `text-[#1a1a1a]`, replace `bg-zinc-900` button backgrounds with `bg-[#1a1a1a]`, audit coral budget.
5. **Live smoke test + E2E (1 session):** Manual walkthrough of all pages + write Playwright tests for critical flows.
