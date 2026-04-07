# Bug Backlog (post-R3 cleanup batch)

These bugs are tracked but not blocking R3. They will be fixed in
a single batch prompt after R3 is verified working.

## Visual Polish

1. **Native confirms/alerts → in-app modals**
   Every `confirm()` and `alert()` in the codebase needs to become
   a styled modal dialog. Affects: Re-enrich button, sign out,
   stage move errors, delete confirmations.

2. **Company labels: color coding + reorganization**
   Labels under company name need: (a) color coding by category,
   (b) most should pull from research data fields rather than the
   limited current set, (c) clearer hierarchy (identity vs financial
   vs status).

3. **Pipeline funnel stages not symmetric**
   Sales Pipeline circles and Onboarding circles don't line up
   vertically. The grid alignment fix from earlier still has a bug.

4. **Contact role dropdown clipping**
   The "User / Decision Maker / Champion / Influencer" dropdown is
   cut off / has no padding around it.

5. **Phone number formatting is ugly**
   Showing `+14155550201` raw. Needs to format as `(415) 555-0201`
   and align cleanly with the email row.

6. **Cut-off characters under tabs on company detail page**
   Still appearing — looks like leftover content rendering past the
   main grid that the previous fix didn't fully kill.

7. **Re-enrich confirmation should be in-app, not native**
   Same as #1 but called out specifically because it was the most
   visible offender.

## R3 Post-Launch

8. **Old call_jobs table cleanup**
   The R3 pipeline uses processing_status on calls table directly.
   The old `call_jobs` table and `/api/jobs/process-calls` route
   are no longer used by the cron. Remove after R3 is stable.

9. **Observability for pipeline**
   Add structured logging to webhook receiver and cron worker for
   production debugging. Currently relying on Vercel function logs.

10. **Audio playback from GHL recording URL**
    The call detail transcript tab has a mock waveform player.
    Wire it to the actual `ghl_recording_url` for playback.
