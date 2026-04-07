# Decisions Log

Every ambiguity, contradiction, or judgment call goes here.
Format: `[YYYY-MM-DD HH:MM] Phase N — <ambiguity> → <choice> → <why>`

[2026-04-07 01:00] Payoneer redesign — Replacing dark-everywhere theme with Payoneer 3-layer sandwich (warm dark page + white container + dark cards on white). Previous dark theme commits preserved in git history.
[2026-04-07 01:00] Layout — Overriding original Phase 1 top bar with thin dark icon sidebar per Payoneer spec. This is the single biggest structural change.
[2026-04-07 02:00] Refactor — Previous build was wrong (hard black surfaces, solid dark sidebar, wide coral buttons). Pivoting to frosted glass on warm grey-cream per real Payoneer reference. All surfaces become translucent with backdrop-blur.
[2026-04-07 15:00] R3 — Standardized 60s skip threshold across CLAUDE.md, webhook, status banner, and all docs. Calls page already used 60s; CLAUDE.md Rule 4 was the last holdout at 45s. 60s is now the single source of truth.
[2026-04-07 15:00] R3 — Spec's analyzeCall(call.id) only passes 1 arg but locked function takes (tenantId, callId) → Calling with both args to match the locked API
[2026-04-07 15:00] R3 — Spec uses TENANT_ID static import for status/retry endpoints → Using getTenantForUser() for auth-based tenant resolution (matches existing auth pattern)
[2026-04-07 15:00] R3 — Existing webhook at /api/webhooks/ghl uses call_jobs table + status column; R3 spec uses processing_status state machine on calls table directly → Rewriting webhook to use new processing_status state machine, keeping the existing recording URL extraction logic which handles more GHL payload variants
[2026-04-07 15:00] R3 — Existing cron at /api/jobs/process-calls uses call_jobs table → Creating new cron at /api/cron/process-calls with state machine pattern; old route left in place but vercel.json updated to new path
[2026-04-07 16:00] Architecture lock — Call processing uses `processing_status` state machine on the `calls` table directly, NOT a separate `call_jobs` table. States: pending → fetching_audio → transcribing → analyzing → complete | failed | skipped. Old `call_jobs` table is deprecated. Old cron at /api/jobs/process-calls deleted. Do not reintroduce either. call_jobs table still exists in Supabase but is deprecated and unused — drop it when convenient.
