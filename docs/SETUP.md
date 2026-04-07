# Company Mind Setup

## Required Environment Variables

### Production (Vercel)
- `ANTHROPIC_API_KEY` — for AI enrichment and call analysis
- `ASSEMBLYAI_API_KEY` — for call transcription with speaker diarization
- `GHL_WEBHOOK_SECRET` — shared secret for verifying GHL webhook signatures
- `CRON_SECRET` — shared secret for Vercel cron auth
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (for client-side auth)

### Local Development (.env.local)
Same as above. The cron worker won't run locally — to test it, hit
`/api/cron/process-calls` manually with the right Authorization header:
```bash
curl -X GET http://localhost:3000/api/cron/process-calls \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## GHL Webhook Setup (per tenant)

1. In the GHL sub-account, go to Settings → Webhooks
2. Add a new webhook:
   - URL: `https://company-mind.vercel.app/api/webhooks/ghl`
   - Events: Call Ended, Call Recorded
   - Secret: paste your `GHL_WEBHOOK_SECRET`
3. In Supabase, update the tenants table for this customer:
   ```sql
   UPDATE tenants SET ghl_location_id = 'their_ghl_location_id' WHERE id = 'tenant_uuid';
   ```

## AssemblyAI Setup

1. Create account at assemblyai.com
2. Get API key from dashboard
3. Add to env vars
4. Default plan supports speaker diarization out of the box

## Vercel Cron

The cron schedule is in vercel.json. Vercel runs it every minute.
To disable temporarily, comment out the cron entry or remove the file.

## Database Migrations

Migrations live in `supabase/migrations/`. Run them in order via the
Supabase SQL Editor or CLI:
```bash
supabase db push
```

Key R3 migration: `20260407_r3_call_processing_pipeline.sql`
- Adds processing state machine columns to calls table
- Creates webhook_events audit log table
- Adds idempotency indexes

## Call Processing Pipeline (R3)

```
GHL call ends
  → GHL fires webhook to /api/webhooks/ghl
  → Webhook creates call row with processing_status='pending'
  → Vercel Cron hits /api/cron/process-calls every minute
  → Worker advances: pending → transcribing → analyzing → complete
  → Call detail page polls /api/calls/[id]/status every 3s
  → Page auto-reloads when complete
```

State machine: `pending → transcribing → analyzing → complete`
Error states: `failed` (retryable), `skipped` (under 45s)
Max attempts: 3, timeout: 10 minutes per transcription
