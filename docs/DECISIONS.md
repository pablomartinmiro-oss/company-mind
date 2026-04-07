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
[2026-04-07 17:00] UX — Company label pills use lazy-display: if the company row already has an `industry` field loaded (from the companies table), show the color-coded pill; if not (e.g. calls page has only contact_data_points), fall back to default zinc pill. No extra N+1 queries to fetch research data just for label display.
[2026-04-07 17:00] UX — Error alerts (stage move failures, enrichment errors) use the same ConfirmModal with cancelLabel: null to hide the cancel button, making it a single-button "OK" alert. No separate AlertModal component — one modal handles both confirm and alert patterns via the cancelLabel prop.
[2026-04-07 18:00] Data Points — Approve is one-way in MVP. Un-approve path deferred post-launch.
[2026-04-07 18:00] Data Points — Legacy `contact_data_points` table left untouched (0 rows, no reads from R2 flow). Read migration from contact_data_points → research deferred to pre-launch session.
[2026-04-07 18:00] Data Points — Approved data points upsert into `research` — will overwrite existing AI/api value for that field. Manual and locked fields protected by R2 call-analysis logic upstream.
[2026-04-07 18:00] Data Points — Section lookup for promoted fields: catalog lookup via findSectionForField() first, else 'AI Extracted' fallback section.
[2026-04-07 18:00] Data Points — Per-row approve does not require confirmation. Reject does (destructive, uses ConfirmModal).
[2026-04-07 18:00] Data Points — Errors shown inline per row, not via modal, for clarity during bulk operations.
[2026-04-07 18:00] Data Points — calls/[id]/page.tsx is locked, so DataPointsView self-fetches from /api/calls/[id]/data-points instead of receiving server-rendered props. Deprecated props kept in CallDetailTabs interface for compatibility.
[2026-04-07 16:00] Architecture lock — Call processing uses `processing_status` state machine on the `calls` table directly, NOT a separate `call_jobs` table. States: pending → fetching_audio → transcribing → analyzing → complete | failed | skipped. Old `call_jobs` table is deprecated. Old cron at /api/jobs/process-calls deleted. Do not reintroduce either. call_jobs table dropped via `DROP TABLE IF EXISTS call_jobs` in R3 migration.
