# QA Report — 2026-04-08

## Summary
- **2 P0** — ALL RESOLVED
- **4 P1** — ALL RESOLVED
- **6 P2** (UX issue) — deferred
- **Bonus**: Hardcoded identity replaced

---

## P0 — Broken

**P0-1. contacts/[id] renders garbage on invalid ID — no notFound()**
Page: `/contacts/[id]`
File: `src/app/(app)/contacts/[id]/page.tsx`
Expected: 404 page when contact ID doesn't exist or has no data.
Actual: Page renders with `contactName = contactId` (the raw UUID), empty arrays for everything, no error boundary triggered. User sees a page titled with a UUID and no useful content.
Root cause: No `notFound()` call. The page never validates the contact exists — it just proceeds with empty query results.

**P0-2. companies/[id] returns inline error div, not proper 404**
Page: `/companies/[id]`
File: `src/app/(app)/companies/[id]/page.tsx:28-30`
Expected: 404 page when company not found.
Actual: Returns a `<div>` with "Company not found" text — but in the app shell layout. No `notFound()` call, so Next.js doesn't serve the 404 page. Search engines index it as a 200.
Root cause: Line 28 checks `if (!company)` but renders inline error instead of calling `notFound()`.

---

## P1 — Works Wrong

**P1-1. Activity feed POST doesn't include tenantId in request body**
File: `src/components/contact/activity-feed.tsx:30`
Expected: POST to `/api/activity` includes `tenantId` in the request body.
Actual: Body is `{ contactId, content, type: 'note' }` — no tenantId.
Impact: The API route calls `getTenantForUser()` server-side, so it still gets the tenant from auth cookies. But the activity_feed insert at the API layer uses the server-resolved tenantId, so this is functionally correct. Demoting to P1 because the pattern is inconsistent — other routes pass tenantId explicitly.

**P1-2. Inbox send reply has no user-visible error feedback**
File: `src/components/dashboard/inbox-panel.tsx:93-109`
Expected: Toast or inline error on send failure.
Actual: `try/catch` wraps the fetch but the catch block is empty — failure is completely silent. User types a reply, hits send, and if GHL is down, nothing happens.

**P1-3. "Push to CRM" button uses wrong URL pattern**
File: `src/app/(app)/calls/[id]/call-detail-tabs.tsx:332`
Expected: POST to `/api/calls/{callId}/next-steps/push`
Actual: POST to `/api/calls/${action.id}/next-steps/push` — uses **action.id** not **callId**. The action UUID goes in the URL path as if it were a call ID, then the route handler reads the actionId from the request body. This works by accident because the route ignores the URL param and reads actionId from the body, but the URL is semantically wrong.

**P1-4. company-list.tsx search doesn't include company industry in search scope**
File: `src/components/pipeline/company-list.tsx:52-54`
Expected: Searching "HVAC" should match companies with industry "HVAC / Home Services".
Actual: Search only matches `company_name` and `primary_contact_name`, not `industry`. User types "HVAC" and gets no results even though Thompson HVAC has industry "HVAC / Home Services".

---

## P2 — UX Issues

**P2-1. No loading.tsx for /companies/[id]**
File: `src/app/(app)/companies/[id]/`
Expected: Skeleton loading state while company data loads.
Actual: No `loading.tsx` file. The page shows nothing while server component renders. Other routes (dashboard, calls, pipeline, contacts) all have loading.tsx.

**P2-2. Appointment status cycle has no undo — accidental click changes status permanently**
File: `src/components/dashboard/appointments-panel.tsx:208`
The status pill cycles on single click. No confirmation, no undo. Easy to accidentally change a "confirmed" appointment to "showed" with a stray click.

**P2-3. Task edit save has no validation**
File: `src/components/dashboard/task-list.tsx`
The edit mode allows saving with empty title or empty fields. No client-side validation before PATCH.

**P2-4. Research field edit saves on blur — easy to save accidental changes**
File: `src/components/research/research-field.tsx:27`
Edit mode exits and saves on blur. If user clicks into a field accidentally and clicks away, any partial text change is saved.

**P2-5. contacts/[id] fetches appointments via internal API call**
File: `src/app/(app)/contacts/[id]/page.tsx:122-125`
The server component calls `fetch('/api/appointments?contactId=...')` to get appointments. This is a server-to-server fetch via HTTP instead of a direct Supabase query or GHL client call. It works but adds latency (extra HTTP round-trip through own API).

**P2-6. Chat drawer and stat modal both use createPortal — not coordinated z-index**
Files: `src/components/chat/chat-drawer.tsx:132` (z-40), `src/components/dashboard/stat-detail-modal.tsx:91` (z-50), `src/components/ui/confirm-modal.tsx:68` (z-[9999])
If chat drawer is open and user clicks a stat card, the stat modal may appear behind the chat drawer. The confirm modal always wins (z-[9999]) but drawer/stat modal overlap is possible.

---

## Pass-by-pass Findings

### Pass A — Page Loads

| Route | Auth? | Data handling? | loading.tsx? | error.tsx? | Status |
|-------|-------|---------------|-------------|-----------|--------|
| /dashboard | getTenantForUser() | Handles empty arrays | YES | YES | OK |
| /calls | getTenantForUser() | Handles empty + error | YES | YES | OK |
| /calls/[id] | getTenantForUser() | notFound() on missing call | YES | YES | OK |
| /pipeline | Redirect → /companies | N/A | NO | NO | OK |
| /contacts/[id] | getTenantForUser() | **No notFound()** | YES | YES | **P0** |
| /companies/[id] | getTenantForUser() | **Inline error, no notFound()** | **NO** | YES | **P0** |
| /companies | getTenantForUser() | Handles empty | YES | YES | OK |
| /settings | getTenantForUser() | Minimal page | NO | NO | OK |
| /brand | Requires auth | Static showcase | NO | NO | OK |
| /login | Public | Client-side auth | NO | NO | OK |

### Pass B — Buttons & Handlers

| Element | Page | Expected | Status | Notes |
|---------|------|----------|--------|-------|
| Stat card click | Dashboard | Opens modal | WORKS | Portal to body, body scroll locked |
| Stat modal close | Dashboard | Backdrop/ESC closes | WORKS | |
| Stat modal item click | Dashboard | Navigates to detail | WORKS | |
| Inbox conversation click | Dashboard | Shows thread | WORKS | |
| Inbox channel tabs | Dashboard | Filters by channel | WORKS | |
| Inbox send reply | Dashboard | Sends via GHL | **P1** | No error feedback on failure |
| Appointment date nav | Dashboard | Navigates dates | WORKS | |
| Appointment expand | Dashboard | Shows detail | WORKS | |
| Appointment status cycle | Dashboard | Cycles status | **P2** | No undo/confirm |
| Task complete toggle | Dashboard | Marks done | WORKS | Optimistic update |
| Task edit → save | Dashboard | Updates task | **P2** | No validation |
| Task chevron | Dashboard | Opens detail/contact | WORKS | |
| Sidebar nav tabs | Layout | Navigate pages | WORKS | |
| Sidebar sign out | Layout | Confirm → logout | WORKS | Uses ConfirmModal |
| Ask AI bar | Layout | Opens chat drawer | WORKS | |
| AI floating button | Layout | Opens chat drawer | WORKS | |
| Call tab filters | Calls | Filters by status | WORKS | URL-based, SSR |
| Call row click | Calls | Opens call detail | WORKS | |
| Call detail tabs | Call detail | Switches tab content | WORKS | |
| Push to CRM | Call detail | Posts action to GHL | **P1** | Wrong URL pattern (action.id in path) |
| Approve/reject data point | Call detail | Updates data_points | WORKS | |
| Bulk approve | Call detail | Batch update | WORKS | |
| Reject data point | Call detail | Confirm modal → reject | WORKS | |
| Retry processing | Call detail | Resets to pending | WORKS | |
| Audio player | Call detail | Plays recording | WORKS | Native <audio>, error fallback |
| Pipeline collapse/expand | Companies | Toggle visibility | WORKS | |
| Stage circle click | Companies | Filter company list | WORKS | |
| Company search | Companies | Filters list | **P1** | Doesn't search by industry |
| Stage filter clear | Companies | Removes filter | WORKS | |
| Company row click | Companies | Opens company detail | WORKS | |
| Re-enrich button | Company detail | Confirm → enrich | WORKS | Frosted modal, success/error modals |
| Stage popover | Company detail | Move/remove stage | WORKS | Confirm on remove, alert on error |
| Contact role dropdown | Company detail | Portal dropdown | WORKS | |
| Set primary contact | Company detail | Updates primary flag | WORKS | |
| Back button | Contact detail | Navigate to /companies | WORKS | |
| Contact tabs | Contact detail | Switch content | WORKS | |
| Activity post note | Contact detail | Posts to API | WORKS | Missing tenantId in body (P1) |
| Research field edit | Contact detail | Edit + save on blur | **P2** | Saves on blur, easy accidental saves |

### Pass C — LLM Features

| Feature | Status | Notes |
|---------|--------|-------|
| Chat streaming | WORKS | useChat + DefaultChatTransport → /api/chat → Mastra agent.stream |
| Chat tenant isolation | WORKS | getTenantForUser() + RequestContext.set('tenantId') |
| Chat tools (28 total) | WORKS | All 3 spot-checked tools filter by tenant_id |
| Chat page context | WORKS | currentPage, contactId, callId passed on every message |
| Call analysis (R2) | WORKS | Reads transcript, writes score/coaching/next_steps/data_points/research |
| Call analysis locked fields | WORKS | Checks `locked` and `source='manual'` before overwriting |
| Enrichment (R2) | WORKS | Web search tool, writes to research + predictive_scores |
| Enrichment locked fields | WORKS | Checks locked/manual before overwriting |
| R3 cron pipeline | WORKS | State machine: pending → transcribing → analyzing → complete |
| R3 timeout handling | WORKS | 10-min timeout, 3 max attempts |
| R3 structured logging | WORKS | log.info/warn/error at every stage |

### Pass D — Forms & Inputs

| Form | Accepts input? | Validates? | Correct API? | Feedback? | Status |
|------|---------------|-----------|-------------|----------|--------|
| Login email/password | YES | HTML5 required | signInWithPassword | Error message | OK |
| Inbox reply textarea | YES | None | POST /api/inbox/send | **None on error** | P1 |
| Activity note textarea | YES | None | POST /api/activity | None | OK |
| Research inline edit | YES | None | onSave callback to API | None | P2 |
| Contact role dropdown | YES | N/A (select) | PATCH /api/companies/[id]/contacts | None visible | OK |
| Task edit fields | YES | **None** | PATCH /api/tasks/[id] | None | P2 |
| Company search | YES | N/A | Client-side filter | Immediate | OK |

### Pass E — Empty States

| Component | Empty state? | What renders? | Status |
|-----------|-------------|--------------|--------|
| Inbox panel | YES | Mail icon + "No conversations" + retry | OK |
| Appointments panel | YES | Calendar icon + "No appointments" | OK |
| Task list | YES | "No tasks" text | OK |
| Company list | YES | "No companies found" | OK |
| Data points view | YES | Database icon + explanatory text | OK |
| Next steps tab | YES | "No suggested next steps" | OK |
| Contact calls | YES | "No graded calls." | OK |
| Contact tasks | YES | "No tasks." | OK |
| Contact appointments | YES | "No upcoming appointments" | OK |
| Calls page (empty filter) | YES | Error boundary message | OK |

### Pass F — Error States

| Route | Invalid ID handling | Status |
|-------|-------------------|--------|
| /calls/invalid-id | `notFound()` called on `.single()` error | OK |
| /contacts/invalid-id | **No notFound()** — renders with UUID as title | **P0** |
| /companies/invalid-id | **Inline "Company not found" div, no 404** | **P0** |
| API bad payloads | Most return 400/500 with error JSON | OK |

---

## Recommended Fixes (ordered by priority)

1. **P0-1 + P0-2**: Add `notFound()` calls to contacts/[id] and companies/[id] pages (+ add loading.tsx for companies/[id])
2. **P1-2**: Add inline error message to inbox send reply on failure
3. **P1-3**: Fix Push to CRM URL to use callId instead of action.id
4. **P1-4**: Add industry to company search scope
5. **P2-2**: Add undo or confirm to appointment status cycle
6. **P2-4**: Change research edit from blur-save to explicit save button
