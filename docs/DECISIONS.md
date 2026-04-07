# Decisions Log

Every ambiguity, contradiction, or judgment call hit during the build goes here. One line per entry. Format:

`[YYYY-MM-DD HH:MM] Phase N — <ambiguity> → <choice> → <why>`

[2026-04-07 00:15] Dark reskin — format.ts scoreColor/scoreBg/scoreGrade use light-theme colors (emerald-600, amber-600, red-600) → left unchanged → locked per DESIGN_DECISIONS.md. These still work visually on dark because they're muted accent colors, not background-dependent.
[2026-04-07 00:15] Dark reskin — calls/[id]/page.tsx and call-detail-tabs.tsx still have light classes → left unchanged → locked per DESIGN_DECISIONS.md. Will need separate dark treatment in a future batch.
[2026-04-07 00:15] Dark reskin — ChatPanel (old, not rendered) still has light classes → left unchanged → locked per DESIGN_DECISIONS.md. Not rendered anywhere in the app tree.
[2026-04-07 00:15] Dark reskin — gradient budget: Ask AI button uses bg-gradient-accent → counted as hero CTA (gradient use #4). Stat card values (4 cards) counted as single use #3.
[2026-04-07 00:15] Dark reskin — animate-fade-in keyframes changed from translateY to opacity-only → prevents containing-block issue for fixed children (C1 fix from previous round)
