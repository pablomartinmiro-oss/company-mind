# Design Decisions — Payoneer Frosted Glass (FINAL)

**Visual reference:** Real Payoneer redesign by Nixtio. Warm grey-cream page bg with subtle noise. Frosted glass cards with backdrop blur and gradient fills. Soft inner glows. Coral as small circular accents only.

**Critical anti-patterns (what the previous build did wrong):**
- Hard black sidebar -> Soft cream sidebar with frosted nav items
- Hard black active tab -> Soft frosted pill with subtle highlight
- Flat solid dark stat cards -> Frosted glass cards with gradient
- Wide coral "Ask AI" button -> Small circular coral icon button
- Pure white page bg -> Warm grey-cream #ebe7e0 with noise
- Coral used everywhere -> Coral only on small icons and accents

## Color system

### Page: #ebe7e0 warm grey-cream with subtle SVG noise at 4% opacity
### Frosted glass cards: bg-white/55 backdrop-blur-xl border-white/60 with soft layered shadows
### Sidebar: bg-white/40 backdrop-blur-xl (frosted, not solid), 72px wide
### Text: #1a1a1a primary, #52525b secondary, #71717a tertiary
### Coral: #ff6a3d — small accents only (circles, icons, small pills)

## Coral budget (strict)
1. Sidebar brand mark (40x40 coral gradient circle)
2. Active sidebar nav item icon (coral-tinted)
3. Small circular icon buttons (Ask AI 40x40, add, refresh)
4. Score circles 90+ (coral ring + text)
5. Stat card primary values (coral text on frosted card)
6. Chart bar emphasis (accentDeep)
7. Send/Confirm form pills (small coral gradient pills)

NEVER: wide coral buttons, coral tab backgrounds, coral sidebar fills

## Frosted glass card recipe
```
bg-white/55 backdrop-blur-xl backdrop-saturate-150
border border-white/60
rounded-3xl
shadow-[0_8px_32px_-8px_rgba(28,25,22,0.12),0_2px_8px_-2px_rgba(28,25,22,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]
```
With gradient overlay: `bg-gradient-to-br from-white/30 to-transparent`

## Locked files — do NOT modify
- src/lib/ghl.ts, src/lib/supabase.ts, src/lib/format.ts
- src/mastra/**, src/app/(app)/calls/[id]/page.tsx, ChatPanel component
