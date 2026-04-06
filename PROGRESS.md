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

## Next Session
1. Test chat end-to-end with live Anthropic key
2. Delete old /pipelines route
3. Add auth to replace hardcoded tenant ID
