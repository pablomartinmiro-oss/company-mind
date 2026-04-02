# PROGRESS.md — Company Mind Build Tracker

## Current Status
- **Phase**: MVP BUILD — backend complete, frontend redesigned with premium UI
- **App state**: builds clean, all routes working
- **GHL**: connected via Private Integration Token, verified at /api/test-ghl
- **Supabase**: 8 tables, tenant seeded, 5 demo calls with full scoring/coaching data
- **Chat**: streaming fixed — uses agent.stream() with createUIMessageStream
- **Frontend**: premium redesign complete — Apple/Linear-inspired, light sidebar, refined typography

## What's Done

### Backend (complete)
- `src/lib/supabase.ts` — admin + anon clients, tenantQuery helper
- `src/lib/ghl.ts` — GHL API v2 wrapper with auto token refresh
- `src/lib/tenant-context.ts` — tenant loader with 30s cache, GHL client factory
- `src/lib/assemblyai.ts` — transcription with diarization + sentiment + chapters
- `src/lib/format.ts` — formatDuration, timeAgo, scoreColor, scoreBg, scoreGrade (letter grades A-F)
- `src/mastra/agents/company-mind.ts` — 18 tools, dynamic instructions via requestContext
- `src/mastra/tools/` — all 8 tool files, execute(input, executionContext) API
- `src/app/api/webhooks/ghl/route.ts` — webhook with signature verify + dedup + duration routing
- `src/app/api/jobs/process-calls/route.ts` — background worker with retry + locking + duration routing (Rule 4: <45s skip, 45-90s short, 90+ full)
- `src/app/api/chat/route.ts` — streaming via agent.stream() → createUIMessageStream
- `src/app/actions.ts` — server actions for approve/reject

### Frontend (redesigned)
Design: Light sidebar (#fbfbfb) with zinc-900 active states, white content, 13px body text, font-mono for numbers, 4px grid spacing, 150ms transitions. Inspired by Linear/Apple/Vercel.

- **Layout**: Light sidebar with user avatar, nav with active chevron indicator. Chat panel as collapsible right panel.
- **Chat Panel**: Redesigned with iMessage-style bubbles (user = dark rounded, assistant = light), Sparkles icon branding, textarea input with send arrow
- `/dashboard` — Clean metric cards (no icon boxes, font-mono values), split layout: recent calls as compact rows in bordered container, pending actions with approve/dismiss
- `/calls` — Bordered container with divide-y rows, score circles with letter grades (A-F), single-line summaries, type/source pills
- `/calls/[id]` — Split panel: LEFT (280px) has refined score circle (ring-2, 28x28), green-dot strengths, metadata. RIGHT has 5 tabs: Coaching (call summary + improvement cards), Criteria (thin bars + evidence), Transcript (iMessage blue/gray bubbles), Next Steps, Data Points
- `/pipelines` — Kanban with subtle zinc-50 column backgrounds, clean white cards with score pills
- `/settings` — Tenant config, scoring rubric with weight bars, integration status badges

### Data
- `scripts/seed-demo.ts` — 5 realistic calls seeded (npm run seed)
- Scores: David Kim 94, Sarah Chen 91, Marcus Thompson 82, Lisa Patel 77, Jake Rivera 64
- 14 call_actions, 20 contact_data_points inserted

### Documentation
- `CLAUDE.md` — Complete project reference with 7 non-negotiable rules, tech stack, key files, DB schema notes, agent usage, streaming architecture
- `PROGRESS.md` — This file

## Known Bugs
- Chat untested end-to-end with live Anthropic API key
- Calls page filter tabs (All/Needs Review/Complete/Skipped) not yet implemented
- Pipeline kanban is static (hardcoded contact→stage mapping)
- Settings page scoring rubric is read-only (edit button disabled)

## Architecture Decisions
- Used Mastra's new `stream()` (not `streamLegacy()`) for v3 model compatibility
- Mastra fullStream chunks use `.payload` objects (AgentChunkType)
- Server actions use native `<form action={fn.bind(null, id)}>` — no client component needed
- Call detail: server component fetches, single 'use client' tabs component
- Duration routing (Rule 4): webhook + job processor both check duration tiers
- Light sidebar chosen over dark after design review — cleaner, more Apple/Linear feel

## Next Session
1. Test chat end-to-end with live Anthropic key
2. Add filter tabs to Calls page (All | Needs Review | Complete | Skipped)
3. Wire pipeline stages to actual GHL pipeline data
4. Add auth (Supabase Auth or NextAuth) to replace hardcoded tenant ID
5. Add Cmd+K command palette for power-user navigation
