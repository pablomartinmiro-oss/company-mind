# PROGRESS.md — Company Mind Build Tracker

## Current Status
- **Phase**: Data Points approval flow shipped
- **App state**: tsc clean, build passes, all routes auth-protected
- **Live URL**: https://company-mind.vercel.app
- **First tenant**: Company Mind (Pablo + Corey)

## Latest: Audit Cleanup Batch (2026-04-07)

### Commit 1: P0 security fixes
- Deleted /api/test-ghl (unauthenticated GHL access)
- Added tenant filter + ownership verification to approveAction/rejectAction
- Created src/lib/lookups.ts with getContactInfo/getContactInfoBatch helpers
- Migrated 6 stale contact_data_points reads to JOIN companies + company_contacts
- Skipped: 5 sites in locked files (calls/[id]/page.tsx ×2, mastra/** ×3)

### Commit 2: P1 launch prep
- Updated CLAUDE.md DB tables list (removed call_jobs, added 10 missing tables)
- Created baseline migration for 6 legacy tables (not yet run against prod)
- Created .env.example with all 12 required vars
- Removed demo-data fallback in /api/inbox and /api/appointments (now return proper errors)
- Replaced text-zinc-900 → text-[#1a1a1a] across 16 files (2 locked files skipped)

### Audit Status
- 3 P0 resolved
- 5 P1 resolved
- 8 P2 deferred to post-launch
- 4 P3 deferred to post-launch

## Data Points Approval Flow (2026-04-07)

- Rewrote `approveDataPoint`/`rejectDataPoint` to operate on R2 `data_points` table (was reading empty `contact_data_points`)
- Added tenant check to both actions via `getTenantForUser()` (closed cross-tenant mutation hole)
- Approved data points now promote to `research` catalog with `source='call'`, section lookup from catalog, `confidence='medium'`
- Built new `DataPointsView` component: pending/approved/rejected sections, bulk approve/reject, inline per-row actions, frosted glass design
- Component self-fetches from new `GET /api/calls/[id]/data-points` route (bypasses locked page.tsx)
- Reject uses ConfirmModal; approve is one-way in MVP
- Added `approveDataPointsBulk` and `rejectDataPointsBulk` server actions
- calls/[id]/page.tsx is locked — kept deprecated props in CallDetailTabs interface, new DataPointsView ignores them

**New files:**
- `src/components/calls/data-points-view.tsx` — full approval UI
- `src/app/api/calls/[id]/data-points/route.ts` — data_points query endpoint

**Modified files:**
- `src/app/actions.ts` — rewrote approve/reject + added bulk actions + tenant checks
- `src/app/(app)/calls/[id]/call-detail-tabs.tsx` — imports new DataPointsView, removed old inline version

## Post-R3 Bug Backlog Batch (2026-04-07)

9 of 10 backlog bugs resolved in 3 commits. Bug #8 was already done (call_jobs dropped).

**Commit 1 — Native dialogs → frosted glass modals (bugs #1, #7):**
- `src/components/ui/confirm-modal.tsx` — ConfirmProvider + useConfirm() hook with portal-rendered frosted glass modal. Supports confirm (two buttons) and alert (cancelLabel: null) patterns.
- `src/components/layout/app-shell.tsx` — ConfirmProvider wraps entire app
- `src/components/company/re-enrich-button.tsx` — destructive confirm + success/error alerts
- `src/components/company/stage-popover.tsx` — error alert + destructive remove confirm
- `src/components/layout/sidebar.tsx` — sign out confirm

**Commit 2 — Display + formatting fixes (bugs #2-6):**
- Bug #2: `src/lib/company-labels.ts` — color-coded industry pills (SaaS, Medical, Construction, etc.) applied to company list rows
- Bug #3: `src/components/pipeline/pipeline-funnel.tsx` — fixed-height h-7 label container for vertical alignment
- Bug #4: `src/components/company/contacts-panel.tsx` — role dropdown portaled to document.body via createPortal
- Bug #5: `src/lib/format-phone.ts` — formatPhone() formats +14155550201 → (415) 555-0201
- Bug #6: `src/components/contact/contact-detail-client.tsx` — pb-[10px] on tab buttons for descender clearance

**Commit 3 — Observability + audio playback (bugs #9, #10):**
- Bug #9: `src/lib/log.ts` — structured JSON logger; instrumented webhook (ghl_webhook_received/rejected) and cron worker (cron_tick_start/end, call_processing_start, transcription_complete, analysis_complete, call_processing_error)
- Bug #10: `src/app/(app)/calls/[id]/call-detail-tabs.tsx` — native `<audio>` player wired to ghl_recording_url, graceful error states, mock waveform removed

## Phase R3 — Live Call Processing Pipeline (2026-04-07)

End-to-end: GHL records a call → webhook fires → queue processes → AssemblyAI transcribes with diarization → R2 call analysis runs → call appears scored and analyzed in the app.

**Schema changes:**
- 7 new columns on calls table: ghl_call_id, ghl_recording_url, assemblyai_transcript_id, processing_started_at, processing_completed_at, processing_error, processing_attempts
- processing_status state machine constraint: pending → transcribing → analyzing → complete | failed | skipped
- Idempotency index on (tenant_id, ghl_call_id)
- Worker index on processing_status for fast pending lookups
- New table: webhook_events (audit log for all incoming webhooks)

**New files:**
- `src/lib/transcription/assemblyai.ts` — async submit/poll client with speaker diarization
- `src/app/api/cron/process-calls/route.ts` — cron worker: pending → transcribing → analyzing → complete
- `src/app/api/calls/[id]/status/route.ts` — polling endpoint for processing status
- `src/app/api/calls/[id]/retry/route.ts` — manual retry for failed calls
- `src/components/calls/processing-status.tsx` — live status banner with auto-polling
- `docs/SETUP.md` — full setup guide (env vars, GHL webhook, AssemblyAI, cron)
- `docs/BACKLOG.md` — 10 tracked post-R3 bugs
- `supabase/migrations/20260407_r3_call_processing_pipeline.sql`

**Modified files:**
- `src/app/api/webhooks/ghl/route.ts` — rewritten to use processing_status state machine + webhook_events audit log
- `src/app/(app)/calls/[id]/page.tsx` — ProcessingStatusBanner wired above header
- `vercel.json` — cron pointed to /api/cron/process-calls
- `docs/DECISIONS.md` — 5 new R3 judgment calls logged

**Pipeline flow:**
1. GHL webhook → creates call row with processing_status='pending'
2. Cron (every 1min) → submits audio to AssemblyAI → processing_status='transcribing'
3. Cron next tick → polls AssemblyAI → transcript ready → processing_status='analyzing'
4. Cron next tick → runs R2 analyzeCall() → processing_status='complete'
5. Call detail page polls /status every 3s → auto-reloads on complete

**Not yet done (requires env vars):**
- GHL_WEBHOOK_SECRET and CRON_SECRET need to be set in .env.local and Vercel
- Migration SQL needs to be run in Supabase
- GHL webhook URL needs to be configured in the GHL sub-account

## Phase R2 — AI Inference Engines (deployed)
- Deep enrichment engine: web search + Claude inference populates 159-field catalog
  - Respects locked/manual fields, runs predictive scores, enriches each contact
  - Tracked via enrichment_jobs table
- Call analysis engine: extracts company/contact field updates, next steps, data
  points, scoring, and coaching from call transcripts
  - Updates research with source='call', creates next_steps and data_points
- JSON schema builders for all Claude prompts (company, contact, predictive, call)
- API routes: POST /api/companies/[id]/enrich, POST /api/calls/[id]/analyze
- Re-enrich button wired on company detail page
- DB: coaching_data + transcript columns on calls table

## Phase R1 — Research Catalog Foundation
- 159-field catalog locked as source of truth (92 company + 67 contact)
- 9 company sections: Identity, Business Profile, Tech & Tools, Marketing, Pain & Opportunity, Buying Process, Engagement History, Account Health, Predictive
- 7 contact sections: Identity, Role & Authority, Communication Profile, Relationship, Personal Context, Triggers & Signals, Predictive
- Each field has type, primarySource, options, apiProvider for future enrichment
- Research tab renders all sections with collapsible headers and completion progress bars
- Inline-editable fields with type-aware inputs (text, longtext, select, number, date, score)
- Source badges: API (violet), AI (blue), Call (green), Manual (amber)
- New tables: predictive_scores, enrichment_jobs
- Research table extended with confidence, source_detail, source_call_id, locked columns

## Batch 1 — 18 UI/Logic Fixes
- Chunk 1: Task type pills replace stage pills, fixed-width aligned columns
- Chunk 2: Calls under 60s only in Skipped tab, all selects use frosted SelectPill, solid stat modals
- Chunk 3: MRR/setup fee replace ARR, unified meta pills, real contact names with email/phone from company_contacts
- Chunk 4: Stage popover with move/remove, pipeline remove API
- Chunk 5: Floating AI button (bottom-right), @mention autocomplete, sidebar avatar menu (CL)
- Chunk 6: Unscored calls show "Not scored" instead of F 0%
- New tables: data_points, next_steps
- New components: SelectPill, MentionInput, AiFloatingButton, StagePopover, NextStepsTab

## UI Fixes + Stage Gate + Full Demo Seed
- Phase 1: Per-person assignee pill colors, company meta pills (greyed when empty), call header frosted glass, data points badge, next steps tab with Push/Edit/Skip actions
- Phase 2: Stage gate — Onboarding/Upsell blocked unless company is Closed in Sales Pipeline
- Phase 3+4: Wiped old demo data and seeded fresh: 10 companies, 18 contacts, 15 calls, 14 tasks, 47 research fields, 11 next steps, 8 data points, 15 stage log entries
- New tables: data_points (AI suggestions), next_steps (action items from calls)

## Company Model Refactor
- Companies are now first-class entities (companies table)
- Contacts attached to companies via M2M (company_contacts) with primary flag and role
- pipeline_contacts renamed to pipeline_companies with company_id FK
- contact_research renamed to research with scope column (company/contact)
- Companies list page shows company rows with contact count, primary contact + role
- Company detail page: company header, contacts sidebar, dual-scope research tabs
- New API routes: /api/companies/[id]/research, /api/companies/[id]/contacts (CRUD)
- All existing code updated to use renamed tables (8 files)
- 5 companies backfilled from existing pipeline contacts

## 7-Fix UX Polish Round
- Top header AI bar with voice input (Web Speech API) replaces small Ask AI circle
- Inbox contact names are clickable, open /contacts/{id} in new tab
- Appointment status pill cycles on click: Confirmed → Showed → No Show → Cancelled (persisted to DB)
- Task row reorganized: checkbox first, stage pill, assignee pill, content, due date, chevron
- Task detail shows company name + reorganized layout with contact hierarchy
- Pipeline stages show Lucide icons instead of numbers/checkmarks
- Pipeline funnel uses symmetric CSS grid alignment across pipelines of different lengths

## Completed Phases

### 1. Seed Data Fix
- `scripts/fix-seed-data.ts` — corrected call_type/outcome for all demo contacts
- stage_entered_at staggered: 0, 1, 2, 4, 7 days ago across demo contacts
- npm script: `npm run fix-seed`

### 2. UI Bug Fixes
- Task stage pills show pipeline stage names instead of task type
- Pipeline contact list shows score pills (e.g. "91 A", "82 B")
- Call rows render address line below company name

### 3. GHL Graceful States
- Inbox: empty state (Mail icon), error state (AlertCircle + retry), demo data fallback
- Appointments: empty state (Calendar icon), error state, 5s timeout fallback
- `src/lib/env-check.ts` — dev-only server-side check for 6 required env vars

### 4. Chat E2E
- Model strings updated to `claude-sonnet-4-6`
- `src/mastra/tools/get-tenant-id.ts` — reads tenantId from requestContext (preferred) or agent.resourceId (fallback)
- All 19 tool functions across 8 files updated to use `getTenantId(executionContext)`
- `/api/chat/route.ts` sets `requestContext.set('tenantId', tenantId)` so tools can resolve tenant

### 5. Auth + Tenant Isolation
- `@supabase/ssr` installed for cookie-based auth
- `src/lib/supabase-browser.ts` — browser Supabase client (anon key)
- `src/lib/supabase-server.ts` — server-side auth-aware client using cookies
- `src/middleware.ts` — protects all routes except `/login` and `/api/webhooks/*`
- `src/app/login/page.tsx` — email/password login page
- `src/lib/get-tenant.ts` — resolves auth user → `users.auth_id` → `tenant_id`
- All hardcoded tenant IDs removed from `src/` (28 files updated)
- `/api/chat/route.ts` — tenant resolved from auth cookies, not client body
- `src/components/layout/app-shell.tsx` — sign out dropdown on avatar
- Auth users created: pablo.martin.miro@gmail.com, corey@getgunner.ai (via `scripts/create-auth-users.ts`)
- `ANTHROPIC_API_KEY` and `ASSEMBLYAI_API_KEY` pushed to Vercel (production, preview, development)

### 6. Pre-Launch Cleanup
- Deleted old `/pipelines` route (replaced by `/pipeline`)
- Added `loading.tsx` skeleton files: dashboard, calls, pipeline, contacts/[id]
- Added `error.tsx` error boundaries: dashboard, calls, pipeline, contacts/[id]
- Removed all production `console.log` statements (kept only in `env-check.ts`)
- Verified nav routes: `/dashboard`, `/calls`, `/pipeline` (no stale links)

## What's Done (Prior Sessions)

### Phase 0 — SQL Migrations
- 4 new columns on calls table (archived, call_type, outcome, processing_status)
- 6 new tables: pipelines, pipeline_contacts, stage_log, tasks, contact_research, activity_feed
- Seed data: 4 pipelines, 5 pipeline_contacts, 15 contact_research entries

### Phase 1 — Navigation
- `src/app/(app)/layout.tsx` — sidebar replaced with 52px top bar

### Phase 2 — Daily HQ Page
- `src/app/(app)/dashboard/page.tsx` — 4 stat cards, inbox + appointments + task list
- `src/components/dashboard/inbox-panel.tsx` — GHL conversation inbox with thread view and reply
- `src/components/dashboard/appointments-panel.tsx` — GHL calendar appointments with date nav
- `src/components/dashboard/task-list.tsx` — filterable task list with stage/team dropdowns

### Phase 3 — Calls Page
- `src/app/(app)/calls/page.tsx` — tab filters, dropdown filters, redesigned call rows
- `src/components/calls/call-filters.tsx` — client dropdown filters

### Phase 4 — Pipeline Page
- `src/app/(app)/pipeline/page.tsx` — server component with real pipeline data
- `src/components/pipeline/pipeline-funnel.tsx` — collapsible pipeline funnels with stage log
- `src/components/pipeline/contact-list.tsx` — searchable contact list
- `src/components/pipeline/pipeline-page-client.tsx` — client wrapper

### Phase 5 — Contact Detail Page
- `src/app/(app)/contacts/[id]/page.tsx` — full contact detail server component
- `src/components/contact/contact-detail-client.tsx` — header, pipeline tracker, 3 tabs
- `src/components/contact/pipeline-tracker.tsx` — per-contact pipeline visualization
- `src/components/contact/activity-feed.tsx` — notes, call logs, stage moves
- `src/components/contact/research-tab.tsx` — structured research fields, inline editing

### Phase 6 — API Routes
- `src/app/api/inbox/route.ts` — GET inbox conversations from GHL
- `src/app/api/inbox/send/route.ts` — POST send message via GHL
- `src/app/api/appointments/route.ts` — GET calendar events from GHL
- `src/app/api/pipeline/move-stage/route.ts` — POST move contact stage + log
- `src/app/api/contacts/[id]/research/route.ts` — GET/POST contact research fields
- `src/app/api/activity/route.ts` — POST new activity feed entry
- `src/app/api/tasks/complete/route.ts` — POST mark task complete

### Phase 7 — Shared Config
- `src/lib/pipeline-config.ts` — all shared constants

### Bug Fix Batch 1 — Daily HQ
- Panel heights fixed (inbox + appointments same 356px)
- Task sorting by stage, expandable task rows
- Channel theming on inbox messages
- Modal cleanup

### Bug Fix Batch 2 — Calls Page
- Bug 13: Exact timestamps (Apr 4, 2:15 PM) instead of relative "X ago"
- Bug 15: Push to CRM + Edit buttons on next step actions (new API route)
- Bug 16: Color-coded type pills on next steps (follow_up, scheduling, admin, new_lead)
- Bug 17: Strengths/red flags moved from sidebar to coaching tab
- Bug 18: Criteria scoring fixed — shows X/10 instead of broken X/2, X/3
- New file: `src/app/api/calls/[id]/next-steps/push/route.ts`
- Modified: call-detail-tabs.tsx, page.tsx (calls list + detail), format.ts, pipeline-config.ts, call-analysis.ts

### Bug Fix Batch 3 — Pipeline → Companies Rename
- Bug 19: Removed inline stage logs from pipeline funnel (circles are display/filter only now)
- Bug 20: Renamed Pipeline → Companies: new route `/companies`, nav tab, page title, `/pipeline` redirects
- Bug 21: Multi-pipeline stage pills per company row (companies can be in multiple pipelines)
- Bug 22: Removed score pill column from company list
- Bug 23: Company rows open contact detail in new browser tab (`target="_blank"`)
- Bug 24: Contact detail header cleanup — "Pipeline Name · Stage" pills + compact metadata row
- Renamed `contact-list.tsx` → `company-list.tsx`, `ContactList` → `CompanyList`
- Deleted old `/pipeline` loading.tsx and error.tsx (moved to `/companies`)
- Modified: app-shell.tsx, pipeline-page-client.tsx, pipeline-funnel.tsx, contact-detail-client.tsx, pipeline/page.tsx (redirect)
- New files: `src/app/(app)/companies/page.tsx`, `src/components/pipeline/company-list.tsx`

### Bug Fix Batch 4 — AI Assistant Slide-in Drawer + Tenant Data Tools (2026-04-06)

AI Assistant Batch 4 complete.

**Bugs resolved:**
- Bug 25: AI Assistant transformed from full-page chat into slide-in side panel
  - "Ask AI" button in top nav header (before settings gear), opens 420px drawer from right
  - Backdrop overlay + Esc key to close, animated slide-in/out
  - Context indicator shows current page at top of drawer
  - Old ChatPanel FAB removed from page tree; drawer is now the only chat entry point
- Bug 26: Chat agent has full read access to all tenant data
  - 6 new Mastra tools added: `get_companies`, `get_company_detail`, `get_tasks`, `get_pipeline_summary`, `get_appointments`, `get_activity_feed`
  - Existing `search_calls` and `get_call_detail` tools already covered call queries
  - Agent system prompt updated with data access instructions and expanded tool selection guide
  - Page context (currentPage, contactId, callId) now passed on every chat message so the agent knows what the user is looking at

**New files:**
- `src/components/chat/chat-drawer.tsx` — slide-in chat drawer component
- `src/mastra/tools/db-companies.ts` — get_companies, get_company_detail
- `src/mastra/tools/db-tasks.ts` — get_tasks
- `src/mastra/tools/db-pipelines.ts` — get_pipeline_summary
- `src/mastra/tools/db-appointments.ts` — get_appointments
- `src/mastra/tools/db-activity.ts` — get_activity_feed

**Modified files:**
- `src/components/layout/app-shell.tsx` — replaced ChatPanel with ChatDrawer, added "Ask AI" nav button
- `src/mastra/agents/company-mind.ts` — registered 6 new tools, updated system prompt
- `src/app/api/chat/route.ts` — passes currentCallId through to agent context

**Note:** Write tools (create/update/delete) deferred to a future batch.

### Daily HQ Audit Fixes (2026-04-06)

Daily HQ audit fixes complete (post-Batch 4).

**Bugs resolved:**
- A1: Stat cards clickable — centered 640x560 modal per card with search, scrollable list, click-through to detail pages
- A2: Inbox channel UI — distinct visual layouts per channel (SMS phone-style, Email card layout with From/To/Subject, WhatsApp teal bubbles with double-check), channel tab highlighting fixed
- A3: Appointments sorted by time ascending (client-side safety net), click-to-expand inline detail block (status, time range, attendees, meeting link, description)
- A4: Task modal pipeline legend removed — now shows ONLY the company's actual current stages fetched via new `/api/contacts/[id]/pipelines` route
- A5: Task rows and modal show exact dates ("Apr 2, 2026") with color-coding (red=overdue, amber=today, grey=future)
- A6: Edit task button wired — switches to edit mode with editable fields, Save persists via new `PATCH /api/tasks/[id]` route
- A7: Comprehensive test data seeded — 11 tasks across all 4 types with varied due dates, multi-pipeline contacts (Marcus: Sales+Onboarding, Sarah: Sales+Onboarding, Lisa: Sales+Upsell)

**New files:**
- `src/components/dashboard/stat-detail-modal.tsx` — 4 modal variants for stat cards
- `src/components/dashboard/stat-cards.tsx` — clickable stat card client wrapper
- `src/app/api/tasks/[id]/route.ts` — GET/PATCH for individual task editing
- `src/app/api/contacts/[id]/pipelines/route.ts` — returns actual pipeline stages for a contact
- `supabase/migrations/20260407015000_seed_comprehensive_test_data.sql` — comprehensive seed data

**Modified files:**
- `src/app/(app)/dashboard/page.tsx` — uses StatCards component, fetches extra data for modals, pipeline name lookup
- `src/components/dashboard/inbox-panel.tsx` — channel-specific thread layouts (SMS/Email/WhatsApp), fixed tab highlighting
- `src/components/dashboard/appointments-panel.tsx` — client-side sort, click-to-expand inline detail
- `src/components/dashboard/task-list.tsx` — exact dates, edit mode, actual pipeline stages from API
- `src/lib/format.ts` — added formatExactDate helper

**Also fixed (from Batch 4):**
- Mastra tools db-companies.ts, db-pipelines.ts, db-activity.ts — corrected column names (contact_id/stage instead of contact_ghl_id/current_stage)

**Note:** Inbox conversations live in GHL, not Supabase — conversation seed data depends on GHL test data and was skipped.

### Daily HQ Audit Round 2 (2026-04-06)

Daily HQ audit round 2 complete.

**Bugs resolved:**
- B1: Stat modal now truly viewport-centered — restructured to single `fixed inset-0` container with backdrop as sibling, modal as `relative z-10` child. Body scroll locked while open.
- B2: Inbox threads show real contact names, emails, and phone numbers instead of "Contact" / "You" placeholders. SMS/WhatsApp meta lines show `From: {name} ({phone}) → To: {tenant} ({phone})`. Email cards show `From: {name} <{email}>`. Demo data enriched with per-contact email/phone. GHL conversations pass through `contactEmail`/`contactPhone` when available.
- B3: Appointments sort diagnosed and fixed. **Root cause:** demo appointment dates were computed at module load time (`todayAt`, `futureDay` called in `const DEMO_APPOINTMENTS`), so they froze on serverless cold start and went stale on warm instances. Additionally, demo data was never filtered by the requested date — all 6 appointments appeared regardless of which day was viewed. **Fix:** moved date computation into a `getDemoAppointments()` function called per-request; added `filterByDate()` that filters demo appointments to match the `?date=` query param before returning. Also added `endTime` and `description` to demo appointments for the expand detail block.
- B4: Task row layout rearranged to `[Task type pill] [Time status pill] [Circle] [Content]`. Time status pill shows "3d overdue" (red), "Due today" (amber), "Due in 5d" (grey), or "No due date" (grey). Exact date removed from row right side (still visible in task modal).
- B5: Edit task now includes "Assigned To" dropdown with TEAM_MEMBERS options. PATCH API route updated to persist `assigned_to`.

**Modified files:**
- `src/components/dashboard/stat-detail-modal.tsx` — B1 viewport centering + body scroll lock
- `src/components/dashboard/inbox-panel.tsx` — B2 real contact metadata in all thread layouts
- `src/app/api/inbox/route.ts` — B2 enriched demo data with email/phone, GHL passthrough
- `src/app/api/appointments/route.ts` — B3 request-time date computation + date filtering
- `src/components/dashboard/task-list.tsx` — B4 row layout + B5 assignee in edit mode
- `src/app/api/tasks/[id]/route.ts` — B5 accepts assigned_to in PATCH

### Daily HQ Audit Round 3 (2026-04-06)

Daily HQ audit round 3 complete.

**Bugs resolved:**
- C1: Stat detail modal, chat drawer portaled to `document.body` via `createPortal` to escape `animate-fade-in` transform ancestor that was breaking `position: fixed` viewport centering. Added SSR-safe `mounted` guard (`useState(false)` + `useEffect`). Task list accordion is inline (not fixed), so no portal needed.
- C2: All datetime helpers now render in `America/Chicago` timezone with TZ suffix. `formatExactDateTime` → "Apr 4, 2:15 PM CDT". New `formatExactTime` → "2:15 PM CDT". Inbox message times, appointment row times, email card dates, call row timestamps, and stat modal timestamps all updated. `formatExactDate` unchanged (dates don't need TZ).

**Root cause note for future reference:** Any ancestor with `transform`, `filter`, or `will-change` creates a new containing block for `position: fixed` descendants, causing them to be positioned relative to that ancestor instead of the viewport. The `animate-fade-in` CSS animation uses `transform: translateY()` with `animation-fill-mode: both`, which persists the transform after the animation ends. Always use `createPortal(jsx, document.body)` for modals and drawers to escape the component tree entirely.

**Modified files:**
- `src/components/dashboard/stat-detail-modal.tsx` — createPortal to document.body + mounted guard
- `src/components/chat/chat-drawer.tsx` — createPortal to document.body + mounted guard
- `src/lib/format.ts` — DEFAULT_TIMEZONE constant, Intl-based formatExactDateTime with TZ, new formatExactTime
- `src/components/dashboard/inbox-panel.tsx` — uses formatExactTime/formatExactDateTime for all timestamps
- `src/components/dashboard/appointments-panel.tsx` — uses formatExactTime for row times and expanded detail

### Dark Theme + Brand Kit (2026-04-07)

Full Payoneer-inspired dark theme applied across the entire app. Brand kit scaffolded.

**What changed:**
- Layout: Inter + JetBrains Mono fonts via next/font (replacing Geist), body bg #0a0a0b
- CSS: globals.css rewritten with dark-first root variables, fixed animate-fade-in (opacity-only, no transform), gradient utility classes
- Navigation: dark surface (#111113), gradient brand mark, white active tabs, gradient Ask AI button
- Dashboard: all 6 components reskinned (stat cards, inbox, appointments, tasks, stat modal, stat cards wrapper)
- Calls page: dark tabs, filters, call rows, score displays
- Companies page: dark pipeline funnels, company list, search
- Contact detail: dark header, tabs, pipeline tracker, activity feed, research tab
- Chat drawer: dark surface, dark bubbles (user=white/dark, assistant=subtle)
- Login page: dark card on dark background
- Loading/error states: dark skeletons and error cards
- Pipeline config: all pill classes converted to dark (bg-{color}-500/10 text-{color}-300)
- Stat card values use gradient text (text-gradient-accent)

**New scaffolding:**
- `/docs/` — DESIGN_DECISIONS.md (locked design direction), DECISIONS.md (judgment log), GOLDEN.md (checklist), README.md
- `/brand/` — tokens (colors, typography, spacing, radii, shadows), logo SVGs (6 variants), voice-and-tone.md, README.md

**Locked files NOT touched:** src/lib/ghl.ts, src/lib/supabase.ts, src/mastra/**, src/app/(app)/calls/[id]/*, src/components/chat/chat-panel.tsx, src/lib/format.ts (score helpers)

**Gradient budget:** 3 of 4 used (brand mark, stat values, Ask AI CTA). Score circles 90+ pending.

**Decisions logged:** 5 entries in /docs/DECISIONS.md

### Phase 8 — Brand Kit Integration (2026-04-07)

- Brand CSS tokens wired into `@theme inline` in globals.css (`bg-brand-*`, `text-brand-*`, `border-brand-*`)
- Button component (`src/components/ui/button.tsx`) gains `brand` and `brand-ghost` variants using brand tokens
- `/brand` showcase route built — renders logos, color palette, typography scale, radii, shadows, component examples (buttons, pills, inputs, score circles, stat cards), voice/tone table
- SVG favicon from brand mark gradient (`src/app/icon.svg`)
- Logo SVGs copied to `public/brand/` for static serving
- `brand/EXPORT.md` documents how to port the kit to other projects

### Payoneer Redesign (2026-04-07)

Complete visual overhaul from dark-everywhere to Payoneer 3-layer sandwich design.

**The signature:** Warm dark page bg (#1c1916) → floating white app container (rounded-[28px]) → dark stat cards on white + white data panels. Thin dark icon sidebar replaces top bar.

**What changed:**
- Layout: Body bg #1c1916 with p-6 padding, white app container with warm shadow, 64px dark icon sidebar (replaces top bar)
- Sidebar: Dark bg, coral brand mark, coral active item wash + left bar, icon-only nav
- Dashboard: Dark stat cards (#1f1a16) with coral values and icons — the Payoneer signature. Inbox, appointments, tasks as white panels.
- All content pages: White panels with warm cream muted sections (#faf8f5), warm borders rgba(28,25,22,0.06)
- Buttons: Coral pill CTAs (#ff6a3d rounded-full), dark secondary, ghost
- Chat drawer: White bg, warm borders, coral send button
- Login: White card on dark bg, coral submit button
- Brand showcase (/brand): Updated for Payoneer edition with 3-layer demo
- Docs: DESIGN_DECISIONS, DECISIONS, GOLDEN all updated for Payoneer spec
- Brand tokens: Colors, shadows, radii updated for warm palette
- Logo SVGs: Coral mark replaces gradient mark
- Pipeline config: Light-theme pill classes (work on white content area)

**Coral budget:** 6 of 7 used (brand mark, sidebar active, Ask AI CTA, dark card icons, stat values, showcase demos). Score circles 90+ pending.

**Locked files NOT touched:** ghl.ts, supabase.ts, mastra/**, calls/[id]/*, chat-panel.tsx, format.ts

### Frosted Glass Refactor (2026-04-07)

Pivoted from hard dark surfaces to frosted glass on warm grey-cream. Previous build had hard black sidebar, solid dark stat cards, wide coral buttons — all wrong per the real Payoneer reference.

**What changed:**
- Page bg: #ebe7e0 warm grey-cream with SVG noise texture at 4%
- Sidebar: frosted glass (bg-white/40 backdrop-blur-xl), not solid black
- Brand mark: 40x40 coral gradient circle (not square)
- Active sidebar: frosted white pill with coral icon (not black bg)
- Ask AI: small 40x40 coral circle (not wide pill)
- Content header: transparent (no fill)
- All panels: frosted glass (glass-card utility class in globals.css)
- Stat cards: frosted glass with 48px coral stat values
- Buttons: coral gradient pills (small), frosted pills (secondary), ghost
- Chat drawer: frosted glass bg
- Login: frosted glass card
- No solid black surfaces anywhere (zero bg-zinc-900, bg-[#1f1a16], bg-[#1c1916] in UI)
- Brand tokens updated for frosted palette
- Brand showcase updated with frosted glass demos

### Quick Fixes (2026-04-07)

- Inbox routing strings removed — no more "From: Company Mind (+1...) -> To: Sarah Chen (+1...)" debug lines. Bubbles now show only message text + timestamp.
- Ask AI panel solidified — bg-white/95 backdrop-blur-2xl replaces double-frost translucency. Solid inputs, clear borders, readable content.
- Contact detail header unified — back link, name, meta, pipeline tracker, and tabs all inside one frosted glass container instead of separate floating elements.

## Next Session
1. Verify quick fixes on live site
2. Call detail page (/calls/[id]) needs treatment (locked)
3. Score circles 90+ coral ring
4. Batch 5: Gmail inbox connector, Google Meet call import
5. Button audit + AI assistant function check
6. Build settings page
7. Build rubric editor UI
8. Add second tenant to verify multi-tenancy isolation
