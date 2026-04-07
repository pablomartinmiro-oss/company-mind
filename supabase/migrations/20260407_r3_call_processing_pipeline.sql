-- R3: Call Processing Pipeline — State Machine + Webhook Events
-- Run this migration in Supabase SQL Editor

-- 1. Add processing state machine columns to calls
ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS ghl_call_id text,
  ADD COLUMN IF NOT EXISTS ghl_recording_url text,
  ADD COLUMN IF NOT EXISTS assemblyai_transcript_id text,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS processing_attempts int DEFAULT 0;

-- Replace the simple processing_status with the full state machine
-- (drop old constraint if it exists, then add new one)
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_processing_status_check;
ALTER TABLE calls ADD CONSTRAINT calls_processing_status_check
  CHECK (processing_status IN (
    'pending',           -- Just received from webhook, waiting to be picked up
    'fetching_audio',    -- Worker pulled the job, fetching audio from GHL
    'transcribing',      -- AssemblyAI is processing
    'analyzing',         -- Transcript ready, R2 analysis running
    'complete',          -- All done, call is fully processed
    'failed',            -- Something broke, see processing_error
    'skipped'            -- Under 60s or other skip reason
  ));

-- Idempotency: never process the same GHL call twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_ghl_call_id
  ON calls(tenant_id, ghl_call_id)
  WHERE ghl_call_id IS NOT NULL;

-- Index for the cron worker to find pending work fast
CREATE INDEX IF NOT EXISTS idx_calls_processing_pending
  ON calls(processing_status, processing_started_at)
  WHERE processing_status IN ('pending', 'fetching_audio', 'transcribing', 'analyzing');

-- 2. Webhook events log (for debugging and retry)
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  source text NOT NULL,                  -- 'ghl', 'assemblyai', etc
  event_type text NOT NULL,              -- 'CallEnded', 'CallRecorded', etc
  external_id text,                      -- the source's ID for this event
  payload jsonb NOT NULL,
  signature_valid boolean,
  processed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_external_id
  ON webhook_events(source, external_id);

-- 3. Drop deprecated call_jobs table (replaced by processing_status state machine on calls)
DROP TABLE IF EXISTS call_jobs;

-- 4. Ensure tenants table has ghl_location_id (may already exist)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ghl_location_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_ghl_location
  ON tenants(ghl_location_id)
  WHERE ghl_location_id IS NOT NULL;
