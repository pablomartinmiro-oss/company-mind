# Design Decisions — Locked (Payoneer Edition)

**Job:** Operator CRM for Pablo + Corey (primary), client demo showpiece (secondary).

**Visual reference:** Payoneer redesign by Nixtio. Warm dark page, floating white app container, thin dark sidebar, dark cards on white as signature, coral pill CTAs.

## The 3-layer sandwich

LAYER 1 — Page background: #1c1916 (warm dark charcoal) with p-6 padding
LAYER 2 — App container: bg-white rounded-[28px] shadow-2xl, min-h-[calc(100vh-48px)]
LAYER 3 — Content: dark cards (#1f1a16) for stat tiles + white panels for data lists

## Color system

- pageBg: #1c1916
- containerBg: #ffffff
- sidebarBg: #1c1916 (64px wide, icons only)
- contentBg: #ffffff
- contentMutedBg: #faf8f5
- darkCardBg: #1f1a16, darkCardBgHover: #2a231e
- textPrimary: #1c1916, textSecondary: #52525b, textTertiary: #71717a
- accent (coral): #ff6a3d, accentHover: #f5552a, accentMuted: #fff1ec

## Sidebar (CRITICAL — replaces top bar)

64px wide, bg-[#1c1916], inside the white container on the left.
Active item: coral wash bg + 2px coral left bar.
Brand mark: 32x32 coral square with brain icon.

## Coral budget (7 uses max)

1. Brand mark in sidebar
2. Active sidebar item
3. Primary CTAs (one per visible area)
4. Coral icons inside dark cards (36x36 rounded-full)
5. Score circles 90+
6. Stat card values on dark cards
7. Chart bar emphasis

## Locked files — do NOT modify

- src/lib/ghl.ts, src/lib/supabase.ts, src/lib/format.ts (score helpers)
- src/mastra/**, src/app/(app)/calls/[id]/page.tsx, ChatPanel component
