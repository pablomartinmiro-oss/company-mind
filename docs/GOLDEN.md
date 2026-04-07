# Golden Assertions — Self-Verification Checklist

After each phase, verify the matching section below.

## Typography and Base
- [ ] Inter loaded via next/font, available as font-sans
- [ ] JetBrains Mono loaded via next/font, available as font-mono
- [ ] Body background is #0a0a0b
- [ ] Body text is #f4f4f5
- [ ] framer-motion installed
- [ ] Focus ring visible on keyboard tab, not mouse click

## Navigation
- [ ] Top bar is 52px tall, not a sidebar
- [ ] Brand mark uses the accent gradient (gradient use #1)
- [ ] Active nav tab is bg-white text-zinc-900
- [ ] Inactive nav tabs are text-zinc-400
- [ ] Logo + 3 tabs (Daily HQ, Calls, Companies) + Ask AI + settings + avatar

## Dashboard
- [ ] 4 stat cards in grid-cols-4 gap-2.5
- [ ] Primary stat values use gradient text-clip (gradient use #3)
- [ ] Inbox panel is 2/3 width, appointments 1/3 width
- [ ] Task list full width below
- [ ] All numbers are font-mono
- [ ] Empty/loading/error states all present

## Calls
- [ ] Score circles 90+ use accent gradient (gradient use #2)
- [ ] Call type pills use dark pill mapping
- [ ] Outcome pills use dark pill mapping
- [ ] Every Supabase query includes tenant_id filter

## Companies/Pipeline
- [ ] Stage circles are 30x30, connector lines dashed
- [ ] Search filters contacts client-side
- [ ] Contact rows show days badge, name, stage pill, score, deal value

## Contact Detail
- [ ] Pipeline tracker shows only contact's pipelines
- [ ] 3 tabs: Overview, Activity, Research
- [ ] Activity feed has note textarea at top

## Final cleanup
- [ ] Zero bg-white, text-zinc-900, border-zinc-200 remaining in src/
- [ ] Gradient used in exactly 4 places app-wide
- [ ] TypeScript build succeeds with zero errors
