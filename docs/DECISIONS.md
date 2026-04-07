# Decisions Log

Every ambiguity, contradiction, or judgment call goes here.
Format: `[YYYY-MM-DD HH:MM] Phase N — <ambiguity> → <choice> → <why>`

[2026-04-07 01:00] Payoneer redesign — Replacing dark-everywhere theme with Payoneer 3-layer sandwich (warm dark page + white container + dark cards on white). Previous dark theme commits preserved in git history.
[2026-04-07 01:00] Layout — Overriding original Phase 1 top bar with thin dark icon sidebar per Payoneer spec. This is the single biggest structural change.
[2026-04-07 02:00] Refactor — Previous build was wrong (hard black surfaces, solid dark sidebar, wide coral buttons). Pivoting to frosted glass on warm grey-cream per real Payoneer reference. All surfaces become translucent with backdrop-blur.
[2026-04-07 15:00] R3 — Spec said 60s skip threshold but CLAUDE.md Rule 4 says 45s → Using 45s per CLAUDE.md (non-negotiable rules take precedence over prompt)
[2026-04-07 15:00] R3 — Spec's analyzeCall(call.id) only passes 1 arg but locked function takes (tenantId, callId) → Calling with both args to match the locked API
[2026-04-07 15:00] R3 — Spec uses TENANT_ID static import for status/retry endpoints → Using getTenantForUser() for auth-based tenant resolution (matches existing auth pattern)
[2026-04-07 15:00] R3 — Existing webhook at /api/webhooks/ghl uses call_jobs table + status column; R3 spec uses processing_status state machine on calls table directly → Rewriting webhook to use new processing_status state machine, keeping the existing recording URL extraction logic which handles more GHL payload variants
[2026-04-07 15:00] R3 — Existing cron at /api/jobs/process-calls uses call_jobs table → Creating new cron at /api/cron/process-calls with state machine pattern; old route left in place but vercel.json updated to new path
