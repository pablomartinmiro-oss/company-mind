# Design Decisions — Locked

**Job:** Operator CRM for Pablo + Corey (primary), client demo showpiece (secondary). Must be dense enough for 4+ hours daily use AND polished enough to WOW prospects in a demo.

## Hybrid direction: Dense layout, Payoneer dark surface

### From Stripe/Attio (information architecture — DO NOT CHANGE)
- 13px body text, 10–11px labels, 9px metadata
- Dense rows, tight spacing, data-first
- URL-driven filter state, not client state
- All layout specs stand as-is

### From Payoneer (surface treatment — APPLY EVERYWHERE)
- Background: near-black #0a0a0b (not pure black, not dark zinc)
- Elevated surfaces: #111113 for cards, panels, nav
- Borders: rgb(255 255 255 / 0.06) — barely visible
- Text primary: #f4f4f5
- Text secondary: #a1a1aa
- Text tertiary: #52525b
- Accent gradient: from-violet-500 via-fuchsia-500 to-orange-400 — used ONLY on: nav brand mark, score circles (90+), stat card primary numbers, one hero CTA per page
- Semantic colors muted: emerald-400, amber-400, red-400, blue-400 at ~70% saturation so they don't fight the gradient

### Typography
- Sans: Inter via next/font, variable --font-sans
- Mono: JetBrains Mono via next/font, variable --font-mono
- Mono used aggressively: all numbers, times, durations, scores, dollar amounts, counts, dates

### Motion
- framer-motion installed
- Page entry: stagger children, 8px translate, 200ms, 40ms stagger
- Row hover: bg shift to rgb(255 255 255 / 0.03), 120ms
- Score circles mount: scale 0.9 → 1.0, 300ms spring
- No page transitions, no loading spinners (skeletons only)

### Rounded corners
- Inputs, buttons: rounded-lg (8px)
- Cards, panels: rounded-xl (12px)
- Score circles, avatars, pills: rounded-full
- Nothing between 12px and full

### What we DO NOT take from Payoneer
- No oversized 48–72px display type (breaks density)
- No big round consumer buttons (breaks density)
- No card-flip animations, no playful illustrations
- No bright gradients on body content
- No light mode this sprint

## Class Mapping
When converting existing light-theme code, use this mapping:

| Light (existing) | Dark (target) |
|---|---|
| bg-white | bg-[#0a0a0b] |
| bg-zinc-50 | bg-white/[0.03] |
| bg-zinc-50/40 | bg-white/[0.02] |
| bg-zinc-100 | bg-white/[0.06] |
| text-zinc-900 | text-zinc-100 |
| text-zinc-600 | text-zinc-300 |
| text-zinc-500 | text-zinc-400 |
| text-zinc-400 | text-zinc-500 |
| text-zinc-300 | text-zinc-600 |
| border-zinc-200/60 | border-white/[0.06] |
| border-zinc-100 | border-white/[0.04] |
| hover:bg-zinc-50 | hover:bg-white/[0.03] |
| hover:bg-zinc-100 | hover:bg-white/[0.06] |
| bg-zinc-900 text-white (active nav) | bg-white text-zinc-900 |

Pill color mapping (apply to all stage, call type, outcome pills):
- bg-{color}-50 text-{color}-700 border-{color}-200 → bg-{color}-500/10 text-{color}-300 border border-{color}-500/20

## Gradient Budget — exactly 4 uses app-wide
1. Top nav brand mark (brain icon container)
2. Score circles where score >= 90
3. Daily HQ stat card primary value (via bg-clip-text text-transparent)
4. Primary hero CTA (max one per page, only where clearly needed)

## Typography scale (locked)
- h1 page title: text-[18px] font-medium tracking-tight text-zinc-100
- h2 section: text-[14px] font-medium text-zinc-100
- body: text-[13px] text-zinc-300
- label: text-[10px] font-medium tracking-widest uppercase text-zinc-500
- metadata: text-[11px] text-zinc-400
- micro: text-[9px] text-zinc-500
- numeric: font-mono (always)

## Locked file ownership
These are frozen contracts. Do NOT modify:
- src/lib/ghl.ts
- src/lib/supabase.ts
- src/lib/format.ts (scoreColor, scoreBg, scoreGrade are frozen)
- src/mastra/**
- src/app/(app)/calls/[id]/page.tsx
- Any existing ChatPanel component
