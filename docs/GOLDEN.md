# Frosted Glass Refactor — Verification

## Hard rules (zero tolerance)
- [ ] grep src/ for `bg-zinc-900` -> 0 results (excluding locked files)
- [ ] grep src/ for `bg-black` -> 0 results
- [ ] grep src/ for `bg-[#1f1a16]` -> 0 results
- [ ] grep src/ for `bg-[#1c1916]` -> 0 results (excluding locked files)
- [ ] No element wider than 48px uses solid coral as background

## Visual checks
- [ ] Page bg is warm grey-cream (#ebe7e0)
- [ ] Subtle noise texture visible on bg
- [ ] Sidebar is frosted glass (translucent)
- [ ] Sidebar brand mark is a coral gradient circle
- [ ] Active sidebar item is frosted white pill with coral icon
- [ ] "Ask AI" button is a small circle (40x40)
- [ ] Daily HQ stat cards are frosted glass with backdrop blur
- [ ] Stat card big numbers are coral, 48px, mono
- [ ] All panels are frosted glass
- [ ] No hard black rectangles anywhere

## Build checks
- [ ] TypeScript build succeeds with zero errors
