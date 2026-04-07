# Company Mind — Claude Code Build Prompt
## Read CLAUDE.md and PROGRESS.md first. Then execute this document top to bottom.

---

## WHAT THIS IS

This repo currently has a working MVP with a left sidebar, a basic calls list,
a hardcoded kanban pipeline, and no contact detail page.

Your job is to transform it to match the exact target designs described below.
Every section has:
- CURRENT FILE(S): what exists today and what to modify
- TARGET: the exact layout and behaviour to build
- DATA: exactly where the data comes from

Do not change anything not listed here. Especially do not touch:
- src/lib/ghl.ts
- src/lib/supabase.ts  
- src/mastra/
- src/app/api/
- src/app/(app)/calls/[id]/page.tsx
- The ChatPanel component

---

## PHASE 0 — RUN THESE MIGRATIONS FIRST

Open Supabase SQL editor and run:

```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_type text;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS outcome text;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'complete';

CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipeline_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id text NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'New Lead',
  stage_entered_at timestamptz DEFAULT now(),
  deal_value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, contact_id, pipeline_id)
);

CREATE TABLE IF NOT EXISTS stage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contact_id text NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage text NOT NULL,
  entered_at timestamptz DEFAULT now(),
  moved_by text,
  source text DEFAULT 'manual',
  note text,
  entry_number int DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id text,
  pipeline_stage text,
  title text NOT NULL,
  description text,
  assigned_to text,
  due_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contact_id text NOT NULL,
  section text NOT NULL,
  field_name text NOT NULL,
  field_value text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, contact_id, field_name)
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contact_id text NOT NULL,
  type text NOT NULL,
  content jsonb,
  author text,
  created_at timestamptz DEFAULT now()
);

-- Get tenant ID: SELECT id FROM tenants LIMIT 1;
-- Then replace <TENANT_UUID> and run:
INSERT INTO pipelines (tenant_id, name, stages) VALUES
  ('<TENANT_UUID>', 'Sales Pipeline', '["New Lead","Qualification","Closing","Closed"]'),
  ('<TENANT_UUID>', 'Onboarding',     '["New Client","Building","Built","Operating"]'),
  ('<TENANT_UUID>', 'Upsell',         '["Tier 1","Tier 2","Tier 3"]'),
  ('<TENANT_UUID>', 'Follow Up',      '["Nurture","Dead"]')
ON CONFLICT DO NOTHING;
```

---

## PHASE 1 — NAVIGATION

CURRENT FILE: `src/app/(app)/layout.tsx`

WHAT IT LOOKS LIKE NOW: Left sidebar, 232px wide, with logo at top, 
nav items stacked vertically, user avatar at bottom.

WHAT TO BUILD: Remove the sidebar entirely. Replace with a top bar.

TARGET LAYOUT:
```
┌─────────────────────────────────────────────────────────────────┐
│ [Brain icon] Company Mind  │ Daily HQ  Calls  Pipeline │  ⚙  PM │
└─────────────────────────────────────────────────────────────────┘
```

EXACT SPECS:
- Outer wrapper: `flex flex-col h-screen overflow-hidden bg-white`
- Header: `h-[52px] shrink-0 border-b border-zinc-200/60 bg-white flex items-center px-5 gap-6 z-10`
- Logo section (left): Brain icon in `h-[26px] w-[26px] rounded-lg bg-zinc-900` + "Company Mind" in `text-[13px] font-semibold text-zinc-900`
- Nav tabs (center, `flex items-center gap-0.5`):
  - Active tab: `rounded-md px-3 py-1.5 text-[13px] font-medium bg-zinc-900 text-white`
  - Inactive tab: `rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-150`
  - Links: Daily HQ → /dashboard, Calls → /calls, Pipeline → /pipeline
- Right side (`ml-auto flex items-center gap-2.5`): Settings gear icon (text-zinc-400, h-4 w-4) + avatar circle (`h-7 w-7 rounded-full bg-zinc-900 text-white text-[11px] font-semibold`, shows "PM")
- Main: `flex-1 overflow-y-auto bg-white`
- Keep ChatPanel exactly as it is

---

## PHASE 2 — DAILY HQ PAGE

CURRENT FILE: `src/app/(app)/dashboard/page.tsx`

WHAT IT LOOKS LIKE NOW: 4 stat cards, then a 2-column split: recent calls left, pending actions right.

WHAT TO BUILD: 4 stat cards, then inbox (2/3 width) + appointments (1/3 width) side by side, then a full-width task list below.

TARGET LAYOUT:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ CALLS  5     │ AVG SCORE 82 │ PIPELINE $25k│ OPEN TASKS 7 │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌──────────────────────────────────────┬─────────────────────┐
│ INBOX                                │ APPOINTMENTS        │
│ ┌────────────┬────────────────────┐  │ Today Apr 3   ‹ ›   │
│ │[S] Sarah   │ Sarah Chen         │  │ 12:00 ─ Marcus Demo │
│ │[E] David   │ "Just reviewed..." │  │  3:30 ─ Jake Discov │
│ │[W] Marcus  │ Reply via:         │  │ Apr5  ─ Sarah Close │
│ │[E] Lisa    │ [SMS][Email][WA]   │  │ Apr7  ─ Lisa F/up   │
│ │[S] Jake    │ [__reply input__]  │  │ Apr9  ─ David check │
│ └────────────┴────────────────────┘  │                     │
└──────────────────────────────────────┴─────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ [All stages ▼] [All team ▼]                    7 tasks     │
│ ○ [New Lead]    Jake Rivera    @ Alex Rivera               │
│   Re-engage — no response to last two messages    0d overdue│
│ ○ [Qualification] Marcus Thompson @ Pablo Martin           │
│   Follow up after demo — check if proposal received Due today│
└────────────────────────────────────────────────────────────┘
```

━━━ STAT CARDS ━━━

4 cards in `grid grid-cols-4 gap-2.5`.
Each card: `bg-zinc-50 rounded-lg px-4 py-3.5`
Label: `text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1`
Value: `text-[22px] font-medium font-mono text-zinc-900 leading-none`

Cards:
1. CALLS — COUNT(*) from calls WHERE tenant_id = TENANT_ID AND created_at > now() - 7 days
2. AVG SCORE — AVG(score) same filter, show as "82 B" where B is scoreGrade() colored (use existing scoreColor from format.ts)
3. PIPELINE — "25k" from SUM of deal_value across pipeline_contacts (parse the dollar amounts)
4. OPEN TASKS — COUNT from tasks WHERE completed = false AND tenant_id = TENANT_ID
   Sub-label below the number: "{n} due today" in text-red-500 text-[11px] if any are due today

━━━ INBOX PANEL (2/3 width) ━━━

Create: `src/components/dashboard/inbox-panel.tsx` — 'use client'

Wrapper: `border border-zinc-200/60 rounded-xl overflow-hidden flex flex-col bg-white`

Header (h-9, flex, items-center, justify-between, px-3.5, border-b border-zinc-200/60):
  Left: "INBOX" in `text-[10px] font-medium tracking-widest uppercase text-zinc-400`
        + count badge `text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600` if unread > 0
  Right: RefreshCw icon, `h-3 w-3 text-zinc-400 hover:text-zinc-600`

Body (flex, height 320px):
  LEFT column (w-[240px], border-r border-zinc-200/60, overflow-y-auto):
    Section headers: `text-[9px] font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-3 py-1.5 border-b border-zinc-100`
    - "UNREAD" with red count pill
    - "NEEDS REPLY" with amber count pill

    Each conversation row:
    `w-full text-left px-3 py-2 border-b border-zinc-100 flex items-start gap-2 cursor-pointer hover:bg-zinc-50/80`
    When selected: `bg-zinc-50 border-l-2 border-l-zinc-900`

    Row contents:
    - Channel icon (16x16, rounded, text-[9px] font-bold):
      SMS: `bg-emerald-50 text-emerald-700` showing "S"
      Email: `bg-blue-50 text-blue-700` showing "E"
      WhatsApp: `bg-teal-50 text-teal-700` showing "W"
    - Contact name `text-[12px] font-medium text-zinc-900` + timestamp `text-[10px] text-zinc-400 font-mono`
    - Snippet `text-[11px] text-zinc-400 truncate`
    - Unread dot: `w-1.5 h-1.5 rounded-full bg-zinc-800` (only if unread)

  RIGHT pane (flex-1, flex flex-col):
    Thread header (h-10, flex items-center gap-2.5, px-3.5, border-b border-zinc-200/60):
      - Initials avatar: `h-7 w-7 rounded-full bg-zinc-900 text-white text-[10px] font-semibold`
      - Name `text-[13px] font-medium` + channel badge + company name `text-[10px] text-zinc-400`
      - Link icon on right: `text-[12px] text-zinc-400 hover:text-zinc-700`

    Messages area (flex-1, overflow-y-auto, px-3.5 py-3, flex flex-col gap-2, bg-zinc-50/40):
      Inbound bubble: `self-start max-w-[78%] px-3 py-2 text-[12px] bg-white border border-zinc-200/80 text-zinc-800 rounded-tr-xl rounded-b-xl`
      Outbound bubble: `self-end max-w-[78%] px-3 py-2 text-[12px] bg-zinc-900 text-white rounded-tl-xl rounded-b-xl`
      Below each bubble: `text-[10px] text-zinc-400` with colored dot for channel + timestamp

    Reply area (border-t border-zinc-200/60, px-3 py-2.5, bg-white, shrink-0):
      "REPLY VIA" label `text-[9px] font-medium tracking-widest uppercase text-zinc-400`
      Channel tab buttons (text-[11px] font-medium, px-2.5 py-1 rounded-full border):
        Active: `bg-zinc-900 text-white border-zinc-900`
        Inactive: `text-zinc-500 border-zinc-200 hover:bg-zinc-50`
      Channels: SMS | Email | WhatsApp
      Textarea: `flex-1 resize-none text-[12px] px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400`
      Send button: `px-3.5 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40`

DATA — InboxPanel:
  GET /api/inbox → calls GHL /conversations with unreadOnly, returns { unread: [], needsReply: [] }
  POST /api/inbox/send → body { conversationId, contactId, message, channel }
    Routes to GHL /conversations/{id}/messages with type: 'SMS' | 'Email' | 'WhatsApp'
  On any API error: show empty state, never crash

━━━ APPOINTMENTS PANEL (1/3 width) ━━━

Create: `src/components/dashboard/appointments-panel.tsx` — 'use client'

Wrapper: `border border-zinc-200/60 rounded-xl overflow-hidden bg-white`

Header (h-9, flex items-center justify-between px-3.5 border-b border-zinc-200/60):
  "APPOINTMENTS" label
  Date nav: [‹ button] [Apr 3 text] [› button] — clicking changes date state

Each appointment row (`flex items-start gap-2 px-3 py-2 border-b border-zinc-100 last:border-0`):
  - Time `text-[10px] font-mono text-zinc-400 w-[44px] shrink-0 pt-0.5 leading-tight` (shows "12:00" or "Apr 5\n2:00")
  - Vertical bar `w-[2px] self-stretch rounded-sm`:
    - Confirmed today: `bg-zinc-900`
    - Future/pending: `bg-zinc-200`
  - Content: name `text-[12px] font-medium` + type `text-[10px] text-zinc-400 mt-0.5`
    + badge: confirmed `bg-emerald-50 text-emerald-700` or pending `bg-amber-50 text-amber-600`, text-[9px] px-1.5 py-0.5 rounded-full mt-1

DATA — Appointments:
  GET /api/appointments?date={date} → calls GHL calendar API
  On error or empty: "No appointments" centered in the panel

━━━ TASK LIST ━━━

Create: `src/components/dashboard/task-list.tsx` — 'use client'

Wrapper: `border border-zinc-200/60 rounded-xl overflow-hidden bg-white`

Header (`flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200/60`):
  Left: Two `<select>` elements styled `text-[12px] px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-500`:
    1. Stage filter: "All stages" | "New Lead" | "Qualification" | "Closing" | "Closed" | etc.
    2. Team filter: "All team" | "Pablo Martin" | "Corey Lavinder"
  Right: "{n} tasks" in `text-[12px] text-zinc-400`

Each task row (`flex items-center gap-3 px-3.5 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 cursor-pointer transition-colors duration-100`):

  1. Radio circle: `h-[18px] w-[18px] rounded-full border-[1.5px] border-zinc-200 flex items-center justify-center text-[9px] text-transparent hover:border-zinc-900 cursor-pointer flex-shrink-0`
     On click: mark completed → `bg-zinc-900 border-zinc-900 text-white` shows ✓, row fades to opacity-35

  2. Stage pill (`text-[10px] font-medium px-2.5 py-1 rounded-full border flex-shrink-0`):
     New Lead:      `bg-amber-50 text-amber-700 border-amber-200`
     Qualification: `bg-blue-50 text-blue-700 border-blue-200`
     Closing:       `bg-violet-50 text-violet-700 border-violet-200`
     Closed:        `bg-green-50 text-green-700 border-green-200`
     New Client:    `bg-amber-50 text-amber-700 border-amber-200`
     Building:      `bg-blue-50 text-blue-700 border-blue-200`
     Built:         `bg-violet-50 text-violet-700 border-violet-200`
     Operating:     `bg-green-50 text-green-700 border-green-200`
     Tier 1:        `bg-teal-50 text-teal-700 border-teal-200`
     Tier 2:        `bg-blue-50 text-blue-700 border-blue-200`
     Tier 3:        `bg-violet-50 text-violet-700 border-violet-200`
     Nurture:       `bg-zinc-100 text-zinc-500 border-zinc-200`
     Dead:          `bg-red-50 text-red-400 border-red-100`

  3. Task body (flex-1, min-w-0):
     Top line: contact name `text-[13px] font-medium text-zinc-900` + "@" + assignee name `text-[11px] text-blue-600`
     Second line: task description `text-[11px] text-zinc-400 mt-0.5`

  4. Due date (min-w-[70px] text-right):
     Overdue:  `text-[11px] font-medium text-red-600 font-mono` → "{n}d overdue"
     Due today: `text-[11px] font-medium text-amber-600` → "Due today"
     Future:   `text-[11px] text-zinc-400 font-mono` → "Apr 5"

  5. Chevron: `text-[14px] text-zinc-300 flex-shrink-0` → links to /contacts/{contactId}

DATA — TaskList:
  Fetch from Supabase: `tasks` WHERE tenant_id = TENANT_ID AND completed = false ORDER BY due_date ASC NULLS LAST
  Filter client-side by stage and team member dropdowns
  On radio click: UPDATE tasks SET completed = true WHERE id = taskId

━━━ DAILY HQ PAGE ASSEMBLY ━━━

In `src/app/(app)/dashboard/page.tsx` (server component), fetch stat card data,
then render:
```
<div className="p-5 space-y-4">
  <StatCards />               {/* 4 cards */}
  <div className="grid grid-cols-3 gap-3">
    <div className="col-span-2"><InboxPanel /></div>
    <div className="col-span-1"><AppointmentsPanel /></div>
  </div>
  <TaskList />
</div>
```

---

## PHASE 3 — CALLS PAGE

CURRENT FILE: `src/app/(app)/calls/page.tsx`

WHAT IT LOOKS LIKE NOW: Simple table with score on left, contact name, type, duration, when. No filters.

WHAT TO BUILD:

TARGET LAYOUT:
```
Calls
All recorded calls and scores.

[All calls (5)] [Needs review (1)] [Skipped (100+)] [Archived]

[Last 7 days ▼] [All types ▼] [All outcomes ▼]

┌────────────────────────────────────────────────┬────────────────┐
│ Sarah Chen                                     │ 30m 47s        │
│ Chen Solutions                                 │ 18h ago        │
│ 123 Market St, San Francisco CA                │ Pablo Martin   │
│ [Closing] [Follow-up scheduled]                │                │
│ Closing call reviewing pilot results...        │   ┌──────┐     │
│                                                │   │ 91 A │     │
│                                                │   └──────┘     │
└────────────────────────────────────────────────┴────────────────┘
```

━━━ TAB FILTERS ━━━

Use URL searchParams (not state) — `?tab=all|needs_review|skipped|archived`

Tab styling:
  Active: `rounded-md px-3 py-1.5 text-[13px] font-medium bg-zinc-900 text-white flex items-center gap-1.5`
  Inactive: `rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-1.5`
  Count badge: active = `bg-white/15 text-white/80`, inactive = `bg-zinc-100 text-zinc-500`, both `text-[10px] px-1.5 rounded-full`

Tab filters:
  "needs_review" = WHERE processing_status = 'error'
  "skipped" = WHERE duration_seconds < 60
  "archived" = WHERE archived = true
  "all" = no extra filter

Under "Needs Review" tab, show: `text-[11px] text-zinc-400 italic mb-3` → "Calls where transcription or scoring failed."

━━━ DROPDOWN FILTERS ━━━

Three selects in a row, styled `text-[12px] px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500`:
  1. "Last 7 days" | "Last 30 days" | "All time" — filters by created_at
  2. "All types" | "Cold Call" | "Qualification" | "Closing" | "Follow Up" | "Onboarding" | "Admin" — filters by call_type
  3. "All outcomes" | "Follow-up scheduled" | "Not interested" | "Closed" | "No answer" | "Voicemail" — filters by outcome

━━━ CALL ROWS ━━━

Each row: `flex items-start gap-4 px-4 py-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 cursor-pointer transition-colors`

Needs-review rows get: `border-l-2 border-l-red-400`

LEFT: Contact block (flex-1, min-w-0)
  - Name: `text-[13px] font-medium text-zinc-900`
  - Company: `text-[11px] text-zinc-400 mt-0.5`
  - Address (if in contact_data_points): `text-[11px] text-zinc-400`
  - Pill row (`flex flex-wrap gap-1 mt-1.5`):
    Call type pills:
      cold_call:     `bg-zinc-100 text-zinc-500`
      qualification: `bg-blue-50 text-blue-700 border border-blue-200`
      closing:       `bg-violet-50 text-violet-700 border border-violet-200`
      follow_up:     `bg-amber-50 text-amber-700 border border-amber-200`
      onboarding:    `bg-teal-50 text-teal-700 border border-teal-200`
      admin:         `bg-zinc-100 text-zinc-400`
    All pills: `text-[10px] font-medium px-2 py-0.5 rounded-full`
    Outcome pills:
      follow_up_scheduled: `bg-teal-50 text-teal-700`
      not_interested:      `bg-red-50 text-red-600`
      closed_won:          `bg-green-50 text-green-700`
      no_answer:           `bg-zinc-100 text-zinc-400`
    Processing error: `bg-red-50 text-red-500 border border-red-200` → "Processing error"
  - Summary text: `text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed`

RIGHT: (`flex flex-col items-end gap-2 flex-shrink-0`)
  - Meta text: `text-[11px] text-zinc-400 text-right leading-relaxed`
    Duration, time ago, rep name — each on its own line
  - Score circle (`h-[42px] w-[42px] rounded-full border-[1.5px] flex flex-col items-center justify-center flex-shrink-0`):
    Use scoreColor() + scoreBg() from src/lib/format.ts
    Shows score number `text-[12px] font-medium font-mono` + letter grade `text-[9px]`
    If processing_status = 'error': show `!` in `text-[16px] text-red-500`, circle border `border-red-300 bg-red-50`

━━━ CALLS PAGE STRUCTURE ━━━

Make `calls/page.tsx` a server component that reads searchParams.
Extract the filter bar to `src/components/calls/call-filters.tsx` ('use client') for the dropdowns.
Apply tab filter in the Supabase query on the server.
Apply dropdown filters via URL searchParams.

---

## PHASE 4 — PIPELINE PAGE

CURRENT FILE: `src/app/(app)/pipelines/page.tsx`
NEW ROUTE: Rename to `src/app/(app)/pipeline/page.tsx`, update layout nav link.

WHAT IT LOOKS LIKE NOW: Horizontal kanban columns with one card per column. Hardcoded stages.

WHAT TO BUILD:

TARGET LAYOUT:
```
Pipeline
5 contacts · $25,164 total value

┌──────────────────────────────────────────────────────────────┐
│ ▼ SALES PIPELINE                                             │
│  [New Lead 1] ─── [Qualification 1] ─── [Closing 1] ─── ... │
│  (click a circle to expand stage log inline)                 │
├──────────────────────────────────────────────────────────────│
│ ▶ ONBOARDING   (collapsed)                                   │
├──────────────────────────────────────────────────────────────│
│ ▶ UPSELL        (collapsed)                                  │
├──────────────────────────────────────────────────────────────│
│ ▶ FOLLOW UP     (collapsed)                                  │
└──────────────────────────────────────────────────────────────┘

[Search name, company...]          [Active stage pill ✕]

┌────┬──────────────────────┬──────────────┬────────┬──────────┐
│ 0d │ Jake Rivera          │ New Lead     │  64 D  │   —    › │
│    │ Rivera Landscaping   │              │        │          │
│ 3d │ Marcus Thompson      │ Closing      │  82 B  │ $5,988 › │
└────┴──────────────────────┴──────────────┴────────┴──────────┘
```

━━━ PIPELINE FUNNEL ━━━

Create: `src/components/pipeline/pipeline-funnel.tsx`

One bordered block (`border border-zinc-200/60 rounded-xl overflow-hidden mb-4`) contains ALL pipelines.

For each pipeline, a row inside the block separated by `border-b border-zinc-100`:

Collapsible header (`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-zinc-50/50`):
  - Arrow: `▼` or `▶` text-[10px] text-zinc-400
  - Pipeline name: `text-[10px] font-semibold tracking-widest uppercase text-zinc-400`

Stages row (when expanded, `flex items-center px-4 pb-4 pt-2`):
  Each stage: `flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer`
  Connector line: `flex-1 border-t-[1.5px] border-dashed border-zinc-200 mb-[14px] min-w-1`

  Stage circle (`h-[30px] w-[30px] rounded-full border-[1.5px] flex items-center justify-center relative`):
    Future (not yet reached): `border-zinc-200 bg-white text-zinc-400 text-[11px] font-medium font-mono`
    Done (past stages):       `border-zinc-200 bg-zinc-100 text-zinc-400` — shows ✓ checkmark, hides number
    Active (current stage):   `border-zinc-900 bg-zinc-900 text-white text-[11px] font-bold font-mono`
    Open (log panel showing): `border-[2px] border-zinc-900`
    Count badge: `absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full bg-zinc-900 text-white text-[9px] font-medium flex items-center justify-center`

  Stage name below circle:
    Normal: `text-[9px] text-zinc-400 text-center max-w-[58px] leading-tight`
    Active: `text-[9px] font-medium text-zinc-900 text-center max-w-[58px] leading-tight`

CLICK → INLINE STAGE LOG PANEL:
  Clicking a stage circle opens a panel that slides in INSIDE the pipeline block,
  immediately below that pipeline's stage row (before the next pipeline's header).

  Panel: `bg-zinc-50 border-t border-zinc-100 px-4 py-3`

  Header row (`flex items-center justify-between mb-2`):
    Stage name: `text-[13px] font-medium text-zinc-900`
    Buttons: `+ Log` (bg-zinc-900 text-white text-[11px] px-2.5 py-1 rounded-full)
             `Edit` + `Delete` (border border-zinc-200 text-[11px] px-2.5 py-1 rounded-full text-zinc-500)

  Log entries (from stage_log table, filtered by pipeline_id + stage + contact_id):
    Each entry (`bg-white border border-zinc-100 rounded-lg p-2.5 mb-2`):
      Top row: date `text-[11px] font-mono text-zinc-400` + who `text-[11px] font-medium text-zinc-600`
               + source badge: API=`bg-violet-50 text-violet-700`, AI=`bg-blue-50 text-blue-700`, Manual=`bg-green-50 text-green-700`
               + if entry_number > 1: "repeat entry" badge `bg-amber-50 text-amber-600 text-[9px] px-1.5 rounded-full`
      Note (if exists): `text-[11px] text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-100`

  Clicking same stage again → collapses the panel.
  Clicking a different stage → switches to that stage's panel.

━━━ SEARCH + FILTER BAR ━━━

`flex items-center gap-3 px-4 py-3 border-b border-zinc-100`
Search input: `flex-1 text-[12px] px-3 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400`
Active stage filter pill (when a stage circle is selected above):
  `text-[11px] font-medium px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 flex items-center gap-1.5 cursor-pointer`
  with ✕ to clear

━━━ CONTACT LIST ━━━

Create: `src/components/pipeline/contact-list.tsx` ('use client')
Receives contacts array, filters client-side from search + stage selection.

Each row (`flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 cursor-pointer`):

1. Days badge (w-[44px] flex-shrink-0):
   `text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-center`
   0–1d: `bg-emerald-50 text-emerald-600`
   2–3d: `bg-amber-50 text-amber-600`
   4+d:  `bg-red-50 text-red-600`

2. Contact info (flex-1, min-w-0):
   Name: `text-[13px] font-medium text-zinc-900`
   Company: `text-[11px] text-zinc-400 mt-0.5`

3. Stage pill (same colors as task list above)

4. Score pill (`text-[10px] font-medium font-mono px-2 py-0.5 rounded-full flex-shrink-0`):
   Use scoreBg() and scoreGrade() from format.ts

5. Deal value: `text-[11px] font-mono text-zinc-400 min-w-[70px] text-right flex-shrink-0`

6. Chevron: `text-[14px] text-zinc-300 flex-shrink-0`

━━━ STAGE MOVE API ━━━

Create: `src/app/api/pipeline/move-stage/route.ts`
POST body: { contactId, pipelineId, newStage, tenantId, movedBy, note? }
1. UPDATE pipeline_contacts SET stage = newStage, stage_entered_at = now()
2. SELECT COUNT entry_number for this contact+pipeline+stage
3. INSERT into stage_log
4. Return { success: true }

━━━ PIPELINE PAGE ASSEMBLY ━━━

`src/app/(app)/pipeline/page.tsx` — server component
Fetch pipelines + pipeline_contacts (with call score join) from Supabase.
Render: page header → PipelineFunnel → search bar → ContactList

---

## PHASE 5 — CONTACT DETAIL PAGE (new page)

CREATE: `src/app/(app)/contacts/[id]/page.tsx`
New components:
  `src/components/contact/pipeline-tracker.tsx` ('use client')
  `src/components/contact/activity-feed.tsx` ('use client')
  `src/components/contact/research-tab.tsx` ('use client')

TARGET LAYOUT:
```
← Back to pipeline

[Closing] [3d in stage] [Qualification Call] [AI enriched]
Marcus Thompson
Thompson HVAC · Nashville, TN                [✦ Re-enrich] [GHL ↗] [Move stage ↓]

┌──────────────────────────────────────────────────────────────┐
│ SALES PIPELINE                                               │
│ [✓1]──[✓2]──[3 active]──[4]──[5]                            │
│ ONBOARDING                                                   │
│ [1 active]──[2]──[3]──[4]                                    │
└──────────────────────────────────────────────────────────────┘

[Overview] [Activity] [Research]

Overview tab: 2 columns
Left:  CONTACTS + TEAM
Right: GRADED CALLS + TASKS + UPCOMING APPOINTMENTS
```

━━━ PAGE HEADER ━━━

Back link: `← Back to pipeline` `text-[12px] text-zinc-400 hover:text-zinc-700 py-3 inline-block`

Badge row (`flex items-center gap-1.5 flex-wrap mb-2`): pipeline stage, days in stage, call type, AI enriched
  All: `text-[10px] font-medium px-2.5 py-1 rounded-full`

Name: `text-[24px] font-medium text-zinc-900 leading-tight`
Company line: `text-[14px] text-zinc-500 mt-1`

Actions row (ml-auto): 
  Re-enrich: `text-[12px] font-medium px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center gap-1.5`
  GHL link: `text-[12px] font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50`
  Move stage: `text-[12px] font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-white`

━━━ PIPELINE TRACKER ━━━

Component: `src/components/contact/pipeline-tracker.tsx` ('use client')

Same visual as pipeline funnel circles above, but shows ONLY the pipelines
this specific contact is enrolled in.

Bordered block: `border border-zinc-200/60 rounded-xl overflow-hidden mb-4`

For EACH pipeline (contact can be in multiple):
  Pipeline label: `text-[9px] font-semibold tracking-widest uppercase text-zinc-400 px-4 pt-3 pb-1`
  Stage row: same circle layout as funnel page
  After each stage row: same inline log panel on click (identical to funnel page behaviour)
  Separate pipelines with `border-b border-zinc-100`

━━━ DETAIL TABS ━━━

Three tabs: Overview | Activity | Research
Tab bar: `flex border-b border-zinc-200/60 mb-5`
Each tab: `px-4 py-2.5 text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-all`
  Active: `text-zinc-900 border-zinc-900`
  Inactive: `text-zinc-400 border-transparent hover:text-zinc-600`

━━━ OVERVIEW TAB ━━━

`grid grid-cols-[300px_1fr] gap-5`

LEFT COLUMN:

CONTACTS section:
  Label: `text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-2`
  Each contact card (`border border-zinc-200/60 rounded-lg p-3 mb-1.5 last:mb-0`):
    Top row: name `text-[13px] font-medium` + role badge `text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 cursor-pointer` (clicking opens role dropdown)
    Contact details: `text-[11px] text-zinc-400 mt-1 leading-relaxed`
  Add link: `text-[11px] text-blue-600 cursor-pointer mt-1.5 block`

Divider: `border-t border-zinc-100 my-3`

TEAM section:
  Same label style
  Each team row (`flex items-center gap-2 py-1.5 border-b border-zinc-100 last:border-0`):
    Avatar: `h-[26px] w-[26px] rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0`
    Name: `text-[12px] font-medium flex-1`
    Role badge: `text-[9px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-400 tracking-wide uppercase`
  Add link: same style

RIGHT COLUMN:

GRADED CALLS section (count badge like `text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 ml-1`):
  Each call item (`flex items-start gap-2.5 py-2 border-b border-zinc-100 last:border-0 cursor-pointer`):
    Score circle (34x34): same styling as calls page
    Call body (flex-1): summary `text-[12px] text-zinc-600 line-clamp-2` + meta `text-[10px] text-zinc-400 mt-0.5`
    Click → navigate to /calls/{callId}

TASKS section:
  Each task (`flex items-center gap-2 py-2 border-b border-zinc-100 last:border-0`):
    Checkbox `h-3.5 w-3.5 rounded border border-zinc-300 flex-shrink-0`
    Text `text-[12px] text-zinc-600 flex-1`
    Due `text-[10px] text-zinc-400`

UPCOMING APPOINTMENTS section:
  Each appointment row (same layout as appointments panel above)

━━━ ACTIVITY TAB ━━━

Component: `src/components/contact/activity-feed.tsx` ('use client')

Top: textarea `border border-zinc-200 rounded-lg px-3 py-2 text-[13px] w-full resize-none min-h-[64px] mb-2 focus:outline-none focus:border-zinc-400` placeholder "Add a note... use @ to tag a team member"
Post button: `px-3 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg`
Hint: `text-[11px] text-zinc-400` → "@ to mention · Shift+Enter for new line"

Feed items (`flex gap-2.5 py-3 border-b border-zinc-100 last:border-0`):

Avatar (28px circle, flex-shrink-0, mt-0.5):
  Manual note: `bg-zinc-900 text-white` with initials
  Call logged: `bg-blue-50 text-blue-600 text-[11px]` with score number
  Stage moved/system: `bg-zinc-100 text-zinc-500 text-[12px]` with ⇄ or +

Meta row: author bold + timestamp in `text-[11px] text-zinc-400`

Content:
  note: `text-[12px] text-zinc-600 leading-relaxed`
  call_logged: bordered card `border border-zinc-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-50`
    with score pill + call type pill + summary `text-[11px] text-zinc-400`
  stage_moved: inline pill `inline-flex items-center gap-1.5 text-[12px] text-zinc-600 bg-zinc-50 rounded-lg px-3 py-1.5`
    showing "Lead → Discovery" with pipeline name `text-[10px] text-zinc-400 ml-1`

DATA — Activity:
  Fetch from activity_feed WHERE contact_id = id ORDER BY created_at DESC
  POST /api/activity — INSERT new note entry
  Auto-entries: when stage moves, call is processed — these are system-inserted

━━━ RESEARCH TAB ━━━

Component: `src/components/contact/research-tab.tsx` ('use client')

Header row (`flex items-center gap-3 mb-4`):
  Search: `flex-1 text-[12px] px-3 py-1.5 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400`
  Source legend (`flex items-center gap-3`):
    Each: `flex items-center gap-1.5 text-[11px] font-medium`
    API dot: `w-2 h-2 rounded-full bg-violet-500`
    AI dot:  `w-2 h-2 rounded-full bg-blue-500`
    Manual dot: `w-2 h-2 rounded-full bg-green-500`

Sections (from contact_research grouped by section, each section in `mb-5`):
  Section header: `text-[9px] font-semibold tracking-widest uppercase text-zinc-400 pb-1.5 mb-2 border-b border-zinc-100`

  Fields grid: `grid grid-cols-3 gap-2`
  Wide fields (span 2 or 3): use `col-span-2` or `col-span-3`

  Each field card (`border border-zinc-200/60 rounded-lg p-2.5 cursor-pointer hover:border-zinc-300 transition-colors`):
    Header row: label `text-[9px] font-medium text-zinc-400 tracking-wide uppercase` + source badge (right-aligned)
      Source badges: `text-[8px] font-medium px-1.5 py-0.5 rounded-full`
        api:    `bg-violet-50 text-violet-600 border border-violet-200`
        ai:     `bg-blue-50 text-blue-600 border border-blue-200`
        manual: `bg-green-50 text-green-600 border border-green-200`
    Value: `text-[12px] font-medium text-zinc-900 mt-1 leading-snug`
    Empty value: `text-[12px] text-zinc-300` → "—"

    Click to edit: value becomes an inline `<input>` with Save/Cancel buttons
    On save: POST /api/contacts/[id]/research, sets source to 'manual', updates DB

DATA — Research:
  Fetch from contact_research WHERE tenant_id AND contact_id GROUP BY section

---

## PHASE 6 — API ROUTES

Create these routes. Keep them simple and focused.

`src/app/api/inbox/route.ts` (GET)
  Load tenant via tenant-context.ts
  Call GHL: GET /conversations/?locationId={locationId}&limit=30
  Group conversations:
    unread: where unreadCount > 0
    needsReply: where lastMessageDirection = 'inbound' AND unreadCount = 0
  For each, fetch last 10 messages from GHL /conversations/{id}/messages
  Return { unread: Conversation[], needsReply: Conversation[] }
  On error: return { unread: [], needsReply: [] } with status 200

`src/app/api/inbox/send/route.ts` (POST)
  Body: { conversationId, contactId, message, channel }
  channel mapping:
    'sms'       → type: 'SMS'
    'email'     → type: 'Email'  
    'whatsapp'  → type: 'WhatsApp'
  POST to GHL /conversations/{conversationId}/messages
  Return { success: true }

`src/app/api/appointments/route.ts` (GET)
  Query param: date (ISO string)
  Load tenant, call GHL GET /calendars/events?locationId={locationId}&startTime={startOfDay}&endTime={endOfDay}
  Return events array. On error: return []

`src/app/api/pipeline/move-stage/route.ts` (POST)
  Body: { contactId, pipelineId, newStage, tenantId, movedBy, note? }
  1. supabaseAdmin.from('pipeline_contacts').update({stage: newStage, stage_entered_at: new Date()}).eq(...)
  2. Count existing stage_log entries for this contact+pipeline+stage
  3. supabaseAdmin.from('stage_log').insert({...})
  Return { success: true }

`src/app/api/contacts/[id]/research/route.ts` (GET + POST)
  GET: fetch contact_research WHERE contact_id = id, group by section, return as { [section]: field[] }
  POST body: { fieldName, fieldValue, section, source }
    upsert contact_research

`src/app/api/appointments/route.ts` (GET)
  query param: ?date=YYYY-MM-DD
  return GHL calendar events for that date range

---

## PHASE 7 — SHARED CONFIG FILE

Create `src/lib/pipeline-config.ts`:

```typescript
export const STAGE_PILL_CLASSES: Record<string, string> = {
  'New Lead':      'bg-amber-50 text-amber-700 border border-amber-200',
  'Qualification': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Closing':       'bg-violet-50 text-violet-700 border border-violet-200',
  'Closed':        'bg-green-50 text-green-700 border border-green-200',
  'New Client':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Building':      'bg-blue-50 text-blue-700 border border-blue-200',
  'Built':         'bg-violet-50 text-violet-700 border border-violet-200',
  'Operating':     'bg-green-50 text-green-700 border border-green-200',
  'Tier 1':        'bg-teal-50 text-teal-700 border border-teal-200',
  'Tier 2':        'bg-blue-50 text-blue-700 border border-blue-200',
  'Tier 3':        'bg-violet-50 text-violet-700 border border-violet-200',
  'Nurture':       'bg-zinc-100 text-zinc-500 border border-zinc-200',
  'Dead':          'bg-red-50 text-red-400 border border-red-100',
};

export const CALL_TYPE_PILL: Record<string, string> = {
  cold_call:     'bg-zinc-100 text-zinc-500',
  qualification: 'bg-blue-50 text-blue-700 border border-blue-200',
  closing:       'bg-violet-50 text-violet-700 border border-violet-200',
  follow_up:     'bg-amber-50 text-amber-700 border border-amber-200',
  onboarding:    'bg-teal-50 text-teal-700 border border-teal-200',
  admin:         'bg-zinc-100 text-zinc-400',
};

export const CALL_TYPE_LABELS: Record<string, string> = {
  cold_call:     'Cold Call',
  qualification: 'Qualification',
  closing:       'Closing',
  follow_up:     'Follow Up',
  onboarding:    'Onboarding',
  admin:         'Admin',
};

export const OUTCOME_PILL: Record<string, string> = {
  follow_up_scheduled: 'bg-teal-50 text-teal-700',
  not_interested:      'bg-red-50 text-red-600',
  closed_won:          'bg-green-50 text-green-700',
  no_answer:           'bg-zinc-100 text-zinc-400',
  voicemail:           'bg-zinc-100 text-zinc-400',
};

export const OUTCOME_LABELS: Record<string, string> = {
  follow_up_scheduled: 'Follow-up scheduled',
  not_interested:      'Not interested',
  closed_won:          'Closed',
  no_answer:           'No answer',
  voicemail:           'Voicemail',
};

export const TEAM_MEMBERS = [
  { name: 'Pablo Martin',    initials: 'PM', avatarClass: 'bg-zinc-900' },
  { name: 'Corey Lavinder',  initials: 'CL', avatarClass: 'bg-zinc-700' },
];
```

Import this file everywhere instead of defining these values inline.

---

## DESIGN RULES — APPLY EVERYWHERE

- All font sizes in text-[Xpx] syntax, not Tailwind text-sm etc.
- Body: text-[13px]
- Labels/badges: text-[10px] or text-[9px]
- Numbers: font-mono
- All borders: border-zinc-200/60 or border-zinc-100 at 0.5px–1px
- Active/selected states: bg-zinc-900 text-white
- Hover states: hover:bg-zinc-50 or hover:bg-zinc-100
- Transitions: transition-all duration-150 or transition-colors
- Rounded corners: rounded-lg for inputs/buttons, rounded-xl for panels/cards
- No shadows except on the top nav if needed
- No gradients
- Background: white (#fff) for content, zinc-50/40 for message areas

---

## EXECUTION ORDER

1. Run Phase 0 SQL migrations
2. Phase 1: layout.tsx (nav) — commit
3. Phase 7: create pipeline-config.ts — commit
4. Phase 3: calls page — commit
5. Phase 4: pipeline page — commit
6. Phase 2: daily HQ page — commit (most complex, last of the main pages)
7. Phase 5: contact detail page — commit
8. Phase 6: API routes (inbox, appointments, move-stage, research) — commit
9. Update CLAUDE.md with all new files/routes/tables
```

---

## TENANT CONFIGURATION — APPLY THROUGHOUT THE BUILD

This is the first tenant: Company Mind's own sales process.
Two users, four pipelines, specific call/task/appointment types.
Every dropdown, filter, pill, and label in the app uses these values.

---

### USERS

| Name | Initials | Avatar class | Email |
|------|----------|-------------|-------|
| Pablo Martin | PM | bg-zinc-900 | pablo.martin.miro@gmail.com |
| Corey Lavinder | CL | bg-zinc-700 | corey@getgunner.ai |

Everywhere the app shows a team member selector, avatar, or assignee:
use these two people. No others. Hard-code as TEAM_MEMBERS in pipeline-config.ts.

---

### PIPELINES — exact names and stages in order

**Sales Pipeline**
  New Lead → Qualification → Closing → Closed

**Onboarding**
  New Client → Building → Built → Operating

**Upsell**
  Tier 1 → Tier 2 → Tier 3

**Follow Up**
  Nurture → Dead

These are the values to INSERT for the tenant seed SQL in Phase 0.
Replace `<TENANT_UUID>` with: `SELECT id FROM tenants LIMIT 1`

```sql
INSERT INTO pipelines (tenant_id, name, stages) VALUES
  ((SELECT id FROM tenants LIMIT 1), 'Sales Pipeline', '["New Lead","Qualification","Closing","Closed"]'),
  ((SELECT id FROM tenants LIMIT 1), 'Onboarding',     '["New Client","Building","Built","Operating"]'),
  ((SELECT id FROM tenants LIMIT 1), 'Upsell',         '["Tier 1","Tier 2","Tier 3"]'),
  ((SELECT id FROM tenants LIMIT 1), 'Follow Up',      '["Nurture","Dead"]')
ON CONFLICT DO NOTHING;

-- Wire the 5 demo contacts into Sales Pipeline
INSERT INTO pipeline_contacts (tenant_id, contact_id, pipeline_id, stage, deal_value)
SELECT
  (SELECT id FROM tenants LIMIT 1),
  unnest(ARRAY['demo-contact-004','demo-contact-003','demo-contact-002','demo-contact-001','demo-contact-005']),
  (SELECT id FROM pipelines WHERE name = 'Sales Pipeline' LIMIT 1),
  unnest(ARRAY['New Lead','Qualification','Closing','Closed','Qualification']),
  unnest(ARRAY[null, null, '$5,988/yr', '$10,788/yr', null])
ON CONFLICT DO NOTHING;
```

---

### CALL TYPES — update pipeline-config.ts CALL_TYPE_LABELS and CALL_TYPE_PILL

Replace the existing call type values with these exact six:

| DB value | Display label | Pill color |
|----------|--------------|------------|
| cold_call | Cold Call | bg-zinc-100 text-zinc-500 |
| qualification | Qualification Call | bg-blue-50 text-blue-700 border border-blue-200 |
| closing | Closing Call | bg-violet-50 text-violet-700 border border-violet-200 |
| follow_up | Follow Up | bg-amber-50 text-amber-700 border border-amber-200 |
| onboarding | Onboarding Call | bg-teal-50 text-teal-700 border border-teal-200 |
| admin | Admin Call | bg-zinc-100 text-zinc-400 |

These appear as:
- Pill badges on each call row in the Calls page
- Filter dropdown options: "Cold Call" | "Qualification Call" | "Closing Call" | "Follow Up" | "Onboarding Call" | "Admin Call"
- Badge on contact detail graded calls section
- Badge in the Activity feed call entries

---

### TASK TYPES

Three task types stored in tasks.task_type column:

| DB value | Display | When LLM generates it |
|----------|---------|----------------------|
| follow_up | Follow Up | After any call with outcome = follow_up_scheduled, or after no reply to 2+ messages |
| admin | Admin | After closing call — send agreement, send docs, schedule next step |
| new_lead | New Lead | When a new contact enters New Lead stage |

Task type does NOT appear as the stage pill on the task row.
The STAGE PILL on each task row shows the contact's current pipeline stage (New Lead, Qualification, etc.)
The task type influences what description text the LLM generates.

---

### APPOINTMENT TYPES — used in calendar panel and contact detail

| DB value | Display label | Badge color |
|----------|--------------|------------|
| qualification_call | Qualification Call | bg-blue-50 text-blue-700 |
| closing_call | Closing Call | bg-violet-50 text-violet-700 |
| onboarding_setup | Onboarding Setup | bg-teal-50 text-teal-700 |
| onboarding_demo | Onboarding Demo | bg-teal-50 text-teal-700 |

Add to pipeline-config.ts:
```typescript
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  qualification_call: 'Qualification Call',
  closing_call:       'Closing Call',
  onboarding_setup:   'Onboarding Setup',
  onboarding_demo:    'Onboarding Demo',
};

export const APPOINTMENT_TYPE_PILL: Record<string, string> = {
  qualification_call: 'bg-blue-50 text-blue-700',
  closing_call:       'bg-violet-50 text-violet-700',
  onboarding_setup:   'bg-teal-50 text-teal-700',
  onboarding_demo:    'bg-teal-50 text-teal-700',
};
```

---

### CONTACT RESEARCH SECTIONS — for the Research tab on contact detail

These sections are pre-defined for this tenant. They map to the `section` 
column in the contact_research table. Claude Code should seed these as 
the default sections when rendering the Research tab — if a contact has 
no data for a section, show the fields as empty (value = "—").

**Sales Pipeline contacts — sections and fields:**

Section: Business Info
  Fields: Company name, Industry, Employees, Annual revenue, Years in business, Website, Location

Section: Pain Points
  Fields: Primary pain, Current CRM, Current lead volume per week, Current response time, Lead sources, Monthly ad spend

Section: Buying Process
  Fields: Decision maker, Budget authority, Budget range, Timeline, Key objections, Competitor alternatives

Section: Sales Context
  Fields: Referral source, Last call score, Overall fit, Next step agreed, Notes

**Onboarding pipeline contacts — sections and fields:**

Section: Account Setup
  Fields: GHL sub-account ID, Sub-account name, Domain, Billing status, Plan tier, Contract start date

Section: Technical Setup
  Fields: Phone number provisioned, CRM data imported, Team members added, Call recording enabled, First pipeline configured, AI scoring activated

Section: Client Context
  Fields: Industry, Use case, Team size, Success metric, Key contacts, Training notes

**Seed demo contact research for Marcus Thompson (demo-contact-002):**

```sql
INSERT INTO contact_research (tenant_id, contact_id, section, field_name, field_value, source)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Business Info',   'Company name',                'Thompson HVAC LLC',                             'api'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Business Info',   'Industry',                    'HVAC / Home Services',                          'api'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Business Info',   'Employees',                   '12–20',                                         'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Business Info',   'Annual revenue',              '$1.2M–$2.5M est.',                              'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Business Info',   'Years in business',           '8 years',                                       'api'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Pain Points',     'Primary pain',                'Lead follow-up speed — reps avg 4+ hrs response, losing jobs to faster competitors', 'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Pain Points',     'Current CRM',                 'ServiceTitan (basic)',                          'manual'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Pain Points',     'Current lead volume per week','~40 leads',                                     'manual'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Pain Points',     'Monthly ad spend',            '$3,000 Google Ads',                             'manual'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Buying Process',  'Decision maker',              'Marcus Thompson (owner)',                       'manual'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Buying Process',  'Budget authority',            'Yes — sole owner',                              'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Buying Process',  'Timeline',                    'Q2 2026',                                       'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Buying Process',  'Key objections',              'Setup time concern',                            'ai'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Sales Context',   'Referral source',             'Google Ads inbound',                            'api'),
  ((SELECT id FROM tenants LIMIT 1), 'demo-contact-002', 'Sales Context',   'Next step agreed',            'Receive ROI proposal by Friday',                'ai')
ON CONFLICT (tenant_id, contact_id, field_name) DO NOTHING;
```

---

### UPDATED pipeline-config.ts — complete file with tenant values

Replace the pipeline-config.ts created in Phase 7 with this complete version:

```typescript
// src/lib/pipeline-config.ts
// Tenant: Company Mind (Pablo Martin + Corey Lavinder)

export const TEAM_MEMBERS = [
  { name: 'Pablo Martin',   initials: 'PM', avatarClass: 'bg-zinc-900' },
  { name: 'Corey Lavinder', initials: 'CL', avatarClass: 'bg-zinc-700' },
] as const;

export const PIPELINES = [
  { name: 'Sales Pipeline', stages: ['New Lead','Qualification','Closing','Closed'] },
  { name: 'Onboarding',     stages: ['New Client','Building','Built','Operating'] },
  { name: 'Upsell',         stages: ['Tier 1','Tier 2','Tier 3'] },
  { name: 'Follow Up',      stages: ['Nurture','Dead'] },
] as const;

export const STAGE_PILL_CLASSES: Record<string, string> = {
  'New Lead':      'bg-amber-50 text-amber-700 border border-amber-200',
  'Qualification': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Closing':       'bg-violet-50 text-violet-700 border border-violet-200',
  'Closed':        'bg-green-50 text-green-700 border border-green-200',
  'New Client':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Building':      'bg-blue-50 text-blue-700 border border-blue-200',
  'Built':         'bg-violet-50 text-violet-700 border border-violet-200',
  'Operating':     'bg-green-50 text-green-700 border border-green-200',
  'Tier 1':        'bg-teal-50 text-teal-700 border border-teal-200',
  'Tier 2':        'bg-blue-50 text-blue-700 border border-blue-200',
  'Tier 3':        'bg-violet-50 text-violet-700 border border-violet-200',
  'Nurture':       'bg-zinc-100 text-zinc-500 border border-zinc-200',
  'Dead':          'bg-red-50 text-red-400 border border-red-100',
};

export const CALL_TYPE_LABELS: Record<string, string> = {
  cold_call:     'Cold Call',
  qualification: 'Qualification Call',
  closing:       'Closing Call',
  follow_up:     'Follow Up',
  onboarding:    'Onboarding Call',
  admin:         'Admin Call',
};

export const CALL_TYPE_PILL: Record<string, string> = {
  cold_call:     'bg-zinc-100 text-zinc-500',
  qualification: 'bg-blue-50 text-blue-700 border border-blue-200',
  closing:       'bg-violet-50 text-violet-700 border border-violet-200',
  follow_up:     'bg-amber-50 text-amber-700 border border-amber-200',
  onboarding:    'bg-teal-50 text-teal-700 border border-teal-200',
  admin:         'bg-zinc-100 text-zinc-400',
};

export const OUTCOME_LABELS: Record<string, string> = {
  follow_up_scheduled: 'Follow-up scheduled',
  not_interested:      'Not interested',
  closed_won:          'Closed',
  no_answer:           'No answer',
  voicemail:           'Voicemail',
};

export const OUTCOME_PILL: Record<string, string> = {
  follow_up_scheduled: 'bg-teal-50 text-teal-700',
  not_interested:      'bg-red-50 text-red-600',
  closed_won:          'bg-green-50 text-green-700',
  no_answer:           'bg-zinc-100 text-zinc-400',
  voicemail:           'bg-zinc-100 text-zinc-400',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  qualification_call: 'Qualification Call',
  closing_call:       'Closing Call',
  onboarding_setup:   'Onboarding Setup',
  onboarding_demo:    'Onboarding Demo',
};

export const APPOINTMENT_TYPE_PILL: Record<string, string> = {
  qualification_call: 'bg-blue-50 text-blue-700',
  closing_call:       'bg-violet-50 text-violet-700',
  onboarding_setup:   'bg-teal-50 text-teal-700',
  onboarding_demo:    'bg-teal-50 text-teal-700',
};

// Research sections shown in contact detail Research tab
// Sales Pipeline contacts get SALES_RESEARCH_SECTIONS
// Onboarding contacts get ONBOARDING_RESEARCH_SECTIONS
export const SALES_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Business Info':  ['Company name','Industry','Employees','Annual revenue','Years in business','Website','Location'],
  'Pain Points':    ['Primary pain','Current CRM','Current lead volume per week','Current response time','Lead sources','Monthly ad spend'],
  'Buying Process': ['Decision maker','Budget authority','Budget range','Timeline','Key objections','Competitor alternatives'],
  'Sales Context':  ['Referral source','Last call score','Overall fit','Next step agreed','Notes'],
};

export const ONBOARDING_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Account Setup':    ['GHL sub-account ID','Sub-account name','Domain','Billing status','Plan tier','Contract start date'],
  'Technical Setup':  ['Phone number provisioned','CRM data imported','Team members added','Call recording enabled','First pipeline configured','AI scoring activated'],
  'Client Context':   ['Industry','Use case','Team size','Success metric','Key contacts','Training notes'],
};
```

---

### HOW TO USE THESE SECTIONS IN THE RESEARCH TAB

In `src/components/contact/research-tab.tsx`:

1. Determine which research section template to use:
   - If the contact is in the Sales Pipeline or Follow Up pipeline → use SALES_RESEARCH_SECTIONS
   - If the contact is in the Onboarding or Upsell pipeline → use ONBOARDING_RESEARCH_SECTIONS
   - If in both → merge both section sets

2. For each section in the template, render the section header.

3. For each field in the section:
   - Look up the contact's actual value from the contact_research DB results
   - If found: show value + source badge (api/ai/manual)
   - If not found: show "—" in text-zinc-300, still clickable to add a value

4. This means every contact shows a full Research tab with all fields,
   even if empty — so the user always knows what data they can fill in.

---

### TASK LIST FILTER VALUES

In the Daily HQ task list, the stage filter dropdown shows:
"All stages" | "New Lead" | "Qualification" | "Closing" | "Closed" |
"New Client" | "Building" | "Built" | "Operating" |
"Tier 1" | "Tier 2" | "Tier 3" | "Nurture" | "Dead"

The team filter dropdown shows:
"All team" | "Pablo Martin" | "Corey Lavinder"

---

### CALLS PAGE FILTER VALUES

Call Type dropdown options (in order):
"All types" | "Cold Call" | "Qualification Call" | "Closing Call" | "Follow Up" | "Onboarding Call" | "Admin Call"

Map each display label back to DB value when filtering:
Cold Call → cold_call, Qualification Call → qualification, etc.
