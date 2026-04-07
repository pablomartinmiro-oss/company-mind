# PROGRESS.md — Company Mind Build Tracker

## Current Status
- **Phase**: Production-ready, auth live, all 6 build phases complete
- **App state**: tsc clean, all routes auth-protected, login flow live
- **Live URL**: https://company-mind.vercel.app
- **First tenant**: Company Mind (Pablo + Corey)

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

## Next Session
1. Verify Batch 4 on live site (drawer opens, closes, context shows, tools respond)
2. Test full login flow on production with real credentials
3. Reset temporary passwords (currently CompanyMind2026!) to user-chosen ones
4. Batch 5: Gmail inbox connector, Google Meet call import
5. Button audit + AI assistant function check across the entire app
6. Build settings page (team management, GHL connection status, password reset)
7. Build rubric editor UI (currently disabled)
8. Add second tenant to verify multi-tenancy isolation
