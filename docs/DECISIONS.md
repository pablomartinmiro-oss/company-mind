# Decisions Log

Every ambiguity, contradiction, or judgment call goes here.
Format: `[YYYY-MM-DD HH:MM] Phase N — <ambiguity> → <choice> → <why>`

[2026-04-07 01:00] Payoneer redesign — Replacing dark-everywhere theme with Payoneer 3-layer sandwich (warm dark page + white container + dark cards on white). Previous dark theme commits preserved in git history.
[2026-04-07 01:00] Layout — Overriding original Phase 1 top bar with thin dark icon sidebar per Payoneer spec. This is the single biggest structural change.
[2026-04-07 02:00] Refactor — Previous build was wrong (hard black surfaces, solid dark sidebar, wide coral buttons). Pivoting to frosted glass on warm grey-cream per real Payoneer reference. All surfaces become translucent with backdrop-blur.
