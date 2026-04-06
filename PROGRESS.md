# PROGRESS.md — Company Mind Build Tracker

## Current Status
- **Phase**: Full UI rebuild complete — all phases from CLAUDE_CODE_MASTER_PROMPT.md built
- **App state**: tsc clean (0 errors)
- **GHL**: connected via Private Integration Token
- **Supabase**: 14 tables (8 original + 6 new: pipelines, pipeline_contacts, stage_log, tasks, contact_research, activity_feed)
- **Frontend**: top nav, redesigned calls/dashboard/pipeline pages, new contact detail page

## What's Done

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

### Empty/Error States + Env Check
- `src/components/dashboard/inbox-panel.tsx` — Mail icon + "No conversations yet" empty state; AlertCircle + retry button on API error; no more "Select a conversation" when list is empty
- `src/components/dashboard/appointments-panel.tsx` — Calendar icon + "No appointments today" empty state; AlertCircle + retry on error; 5s timeout fallback instead of infinite "Loading..."
- `src/lib/env-check.ts` — dev-only server-side check logging presence of 6 required env vars
- `src/components/layout/app-shell.tsx` — extracted client layout from `(app)/layout.tsx`
- `src/app/(app)/layout.tsx` — now a server component that calls checkEnvVars() then renders AppShell

### UI Bug Fixes
- `src/components/dashboard/task-list.tsx` — pills now show pipeline stage (New Lead, Qualification, Closing…) instead of task type; filter dropdown updated to stages
- `src/components/pipeline/contact-list.tsx` — added score pills (e.g. "91 A", "82 B") using scoreBg/scoreGrade from format.ts; shows "—" when no score
- `src/app/(app)/calls/page.tsx` — renders address line below company name (data already fetched, just not displayed)

### Seed Data Fix
- `scripts/fix-seed-data.ts` — fixes call_type, outcome, stage_entered_at, task pipeline_stage
- call_type: closing (Sarah Chen), qualification (David Kim, Marcus Thompson), follow_up (Lisa Patel), cold_call (Jake Rivera)
- outcome: closed_won (Sarah Chen), follow_up_scheduled (David Kim, Marcus, Lisa), null (Jake)
- stage_entered_at staggered: 0, 1, 2, 4, 7 days ago across demo contacts
- npm script: `npm run fix-seed`

### Chat E2E Verification
- `src/mastra/agents/company-mind.ts` — model updated from `claude-sonnet-4-20250514` to `claude-sonnet-4-6`
- `src/mastra/tools/call-analysis.ts` — direct Anthropic SDK model string updated to `claude-sonnet-4-6`
- `src/app/api/chat/route.ts` — added `requestContext.set('tenantId', tenantId)` so tools can resolve tenant
- `src/mastra/tools/get-tenant-id.ts` — **NEW** helper: reads tenantId from `requestContext` (preferred) or `agent.resourceId` (legacy fallback), throws if missing
- All 8 tool files (19 occurrences) updated: `executionContext.agent?.resourceId` → `getTenantId(executionContext)`, removed non-null assertions
  - ghl-contacts.ts (4), db-calls.ts (3), ghl-pipelines.ts (4), ghl-calendar.ts (2), ghl-conversations.ts (2), ghl-notes.ts (1), ghl-tasks.ts (2), call-analysis.ts (1)
- `tsc --noEmit` passes clean (0 errors)

**Bug fixed**: All 19 tool functions would crash at runtime because `executionContext.agent?.resourceId` is only populated when agent has memory config (which we don't use). Now tools read tenantId from requestContext, which the chat route always sets.

### Supabase Auth + Tenant Isolation
- `@supabase/ssr` installed for cookie-based auth
- `src/lib/supabase-browser.ts` — browser Supabase client (anon key, cookie storage)
- `src/lib/supabase-server.ts` — server-side auth-aware client using cookies
- `src/middleware.ts` — protects all routes except `/login` and `/api/webhooks/*`
- `src/app/login/page.tsx` — email/password login page
- `src/lib/get-tenant.ts` — resolves auth user → users.auth_user_id → tenant_id
- `scripts/add-auth-user-id.sql` — migration adding auth_user_id to users table
- **All hardcoded tenant IDs removed** from `src/` (verified by grep)
- All server components + API routes use `getTenantForUser()` for tenant isolation
- `/api/chat/route.ts` — security fix: tenant resolved from auth cookies, not client body
- `src/components/layout/app-shell.tsx` — sign out dropdown on avatar
- `src/app/actions.ts` — approve/reject actions now auth-aware
- `tsc --noEmit` passes clean (0 errors)
- **Exception**: `/api/webhooks/*` routes NOT changed (use their own auth via GHL signatures)

### Auth User Creation
- `scripts/create-auth-users.ts` — creates Supabase Auth accounts + app user rows, links via `auth_id`
- `src/lib/get-tenant.ts` — fixed column name: `auth_user_id` → `auth_id` (matches actual DB schema)
- Auth users created:
  - pablo.martin.miro@gmail.com → `40a714b9-15ac-45d6-b749-1d818dd6a5f5`
  - corey@getgunner.ai → `af0bd40b-681c-4c79-9300-e97d0687f27e`
- Both linked in `users.auth_id` and verified
- Script is idempotent (skips existing auth users, skips existing app user rows)
- npm script: `npm run create-auth-users`

### Vercel Env Vars
- `ANTHROPIC_API_KEY` and `ASSEMBLYAI_API_KEY` pushed to Vercel (production, preview, development)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` already present

### Pre-Launch Cleanup
- Deleted old `/pipelines` route (`src/app/(app)/pipelines/`) — replaced by `/pipeline`
- Added `loading.tsx` skeletons: dashboard, calls, pipeline, contacts/[id]
- Added `error.tsx` error boundaries: dashboard, calls, pipeline, contacts/[id]
- Removed all production `console.log` statements (kept only in `env-check.ts`)
- Verified nav routes: `/dashboard`, `/calls`, `/pipeline` (no stale `/pipelines` links)
- `tsc --noEmit` passes clean (0 errors)

## Next Session
1. Live test login → dashboard → chat end-to-end
2. Test call grading pipeline with real GHL calls
3. Add GHL_ACCESS_TOKEN to Vercel env vars if not already present
