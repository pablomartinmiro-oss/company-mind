# CLAUDE.md — Company Mind

> Read this ENTIRE file before touching any code.
> Status: PROGRESS.md. Architecture decisions documented inline.

@AGENTS.md

## What This Is

Company Mind — multi-tenant AI CRM SaaS built on Go High Level.
An LLM "company mind" that knows everything about the business, executes GHL CRM actions via chat, auto-grades calls with scoring + coaching, and learns from user feedback over time to become progressively autonomous.

First tenant: our own sales process for selling this SaaS.

## Non-Negotiable Rules

### Rule 1 — Tenant Isolation
Every Supabase query MUST include tenant_id filter. Every API route MUST validate tenant context before touching data. No exceptions. This is the #1 security boundary.

### Rule 2 — No Text Inputs for GHL Mappings
Every GHL field mapping (pipeline, stage, user, calendar) must be a dropdown populated by a live GHL API call. Store GHL IDs, not display names — names change, IDs don't.

### Rule 3 — Server Fetches, Client Displays
Server components fetch data via supabaseAdmin. Client components ('use client') handle interactivity only — clicks, state, forms. Never fetch data in client components.

### Rule 4 — Call Duration Routing
Calls under 45 seconds: mark as 'skipped', reason 'no_answer'. Do NOT send to Claude for grading — it produces garbage scores on voicemails and no-answers.
Calls 45-90 seconds: summary-only grade (lightweight analysis).
Calls 90+ seconds: full grade with rubric scoring, coaching, data extraction.

### Rule 5 — GHL Date Handling
GHL returns dates as Unix milliseconds in many endpoints, NOT ISO strings. Always check and convert: `if (typeof date === 'number') new Date(date).toISOString()`

### Rule 6 — Session Handoff
Every Claude Code session MUST update PROGRESS.md before ending:
1. What was done (specific files created/changed)
2. Known bugs discovered
3. Exact next task with exact first prompt
Test: could a new Claude Code session pick up using only PROGRESS.md + CLAUDE.md?

### Rule 7 — Never Expose Secrets Client-Side
SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, GHL_ACCESS_TOKEN — server-side only. Use NEXT_PUBLIC_ prefix only for truly public values.

### Rule 8 — Auth Required Everywhere
Every server component and API route MUST call getTenantForUser() to get the tenant ID.
Exceptions: /login route, /api/webhooks/* routes, static assets.
Never hardcode a tenant ID. Never trust a tenant ID from a request body or query param.

## Tech Stack (Locked)

| Layer | Tech | Entry Point |
|-------|------|-------------|
| Framework | Next.js 16 App Router | next.config.ts |
| Database | Supabase (PostgreSQL, direct queries) | src/lib/supabase.ts |
| Agent | Mastra framework (@mastra/core) | src/mastra/index.ts |
| LLM | Claude API via @ai-sdk/anthropic | src/mastra/agents/company-mind.ts |
| Call Analysis | Claude direct via @anthropic-ai/sdk | src/mastra/tools/call-analysis.ts |
| Transcription | AssemblyAI | src/lib/assemblyai.ts |
| CRM | GHL API v2 (Private Integration Token for MVP) | src/lib/ghl.ts |
| Styling | Tailwind v4 + shadcn/ui | src/app/globals.css |
| Chat UI | Vercel AI SDK v6 (@ai-sdk/react) | src/components/chat/chat-panel.tsx |
| Deploy | Vercel | vercel.json |

## Key Files

```
src/lib/supabase.ts        — supabaseAdmin (bypasses RLS, use for server queries)
src/lib/ghl.ts             — GHL API wrapper with auto token refresh
src/lib/tenant-context.ts  — loads tenant, creates GHL client, 30s cache
src/lib/assemblyai.ts      — transcription with diarization + sentiment
src/lib/format.ts          — formatDuration, timeAgo, scoreColor, scoreBg, scoreGrade
src/mastra/index.ts        — Mastra instance, exports { mastra }
src/mastra/agents/company-mind.ts — 18 tools, dynamic system prompt via requestContext
src/app/api/chat/route.ts  — streaming chat endpoint (agent.stream → createUIMessageStream)
src/app/api/webhooks/ghl/route.ts — webhook handler, signature verify, dedup, job queue
src/app/api/jobs/process-calls/route.ts — background worker, retry, locking, duration routing
src/app/actions.ts         — server actions for approve/reject mutations
src/components/chat/chat-panel.tsx — collapsible chat panel with useChat
scripts/seed-demo.ts       — demo data seeder (npm run seed)
src/lib/supabase-browser.ts  — client-side Supabase (auth-aware, anon key)
src/lib/supabase-server.ts   — server-side Supabase (auth-aware, cookie-based)
src/lib/get-tenant.ts        — resolves auth user → tenant_id via auth_id column
src/lib/env-check.ts         — env var verification (dev only)
src/middleware.ts             — auth middleware, protects all routes except /login and /api/webhooks
src/app/login/page.tsx        — login page
```

## DB Tables

tenants, users, calls, call_actions, contact_data_points, feedback_log, chat_messages, call_jobs,
pipelines, pipeline_contacts, stage_log, tasks, contact_research, activity_feed

Note: users table has `auth_id` column (not `auth_user_id`) linking to Supabase Auth users.

### Key Column Notes
- calls.score: JSONB `{ overall: number, criteria: [...] }`
- calls.coaching: JSONB `{ strengths: string[], improvements: [...], summary: string }`
- call_actions: uses `suggested_payload` JSONB (not separate `reasoning` column)
- contact_data_points: uses `field_name`, `field_value`, `source_call_id`, `confidence` (string)
- contact_data_points unique on: `tenant_id, contact_ghl_id, field_name`

## Current Tenant (MVP)

Name: Company Mind
Industry: SaaS
Tenant ID is resolved dynamically via `getTenantForUser()` based on the authenticated user.
No hardcoded tenant IDs anywhere in the codebase.

## Agent Usage

```typescript
import { mastra } from '@/mastra';
const agent = mastra.getAgent('companyMind');

// Stream (for chat — returns MastraModelOutput with fullStream)
const result = await agent.stream(messages, {
  requestContext,  // RequestContext from @mastra/core/request-context
  maxSteps: 10,
});
// result.fullStream yields AgentChunkType with .type and .payload

// RequestContext setup:
import { RequestContext } from '@mastra/core/request-context';
const rc = new RequestContext();
rc.set('userName', 'Pablo');
rc.set('currentPage', 'dashboard');
// etc.
```

### Tool Execute Signature (Mastra v1.21+)
```typescript
execute: async (input, executionContext) => {
  const resourceId = executionContext.agent?.resourceId;
  // input = typed schema, NOT { context, resourceId }
}
```

## Streaming Architecture (AI SDK v6)

Server returns `createUIMessageStreamResponse` with chunks mapped from Mastra's fullStream:
- `text-delta` → chunk.payload.text
- `tool-call` → chunk.payload.toolCallId, toolName, args
- `tool-result` → chunk.payload.toolCallId, result

Client uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport` from `ai`.
UIMessage parts: `text`, `tool-{name}` (typed), `dynamic-tool` (untyped).
Tool states: `input-streaming`, `input-available`, `output-available`, `output-error`.
