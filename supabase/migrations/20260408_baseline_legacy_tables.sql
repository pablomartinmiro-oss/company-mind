-- Baseline migration for 6 tables created before migrations were tracked.
-- All use IF NOT EXISTS — safe to run against existing prod.
-- DO NOT run until manually reviewed.

-- 1. calls (core table — ALTERs exist in other migrations, this is the CREATE)
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text,
  source text,
  source_id text,
  contact_ghl_id text,
  contact_name text,
  opportunity_ghl_id text,
  call_type text,
  recording_url text,
  duration_seconds int,
  direction text DEFAULT 'unknown',
  status text,
  transcript jsonb,
  transcript_text text,
  speaker_map jsonb,
  score jsonb,
  coaching jsonb,
  next_steps jsonb,
  data_point_updates jsonb,
  call_summary text,
  metadata jsonb,
  error_message text,
  called_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived boolean DEFAULT false,
  outcome text,
  processing_status text DEFAULT 'pending',
  coaching_data jsonb,
  -- R3 columns (also in 20260407_r3_call_processing_pipeline.sql ALTERs)
  ghl_call_id text,
  ghl_recording_url text,
  assemblyai_transcript_id text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  processing_error text,
  processing_attempts int DEFAULT 0
);

-- 2. call_actions
CREATE TABLE IF NOT EXISTS call_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id uuid NOT NULL,
  action_type text NOT NULL,
  description text,
  suggested_payload jsonb,
  priority text DEFAULT 'medium',
  status text DEFAULT 'suggested',
  created_at timestamptz DEFAULT now()
);

-- 3. contact_data_points (LEGACY — 0 rows, kept for locked mastra tool compatibility)
CREATE TABLE IF NOT EXISTS contact_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_ghl_id text NOT NULL,
  field_name text NOT NULL,
  field_value text,
  source text DEFAULT 'manual',
  source_call_id uuid,
  confidence text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, contact_ghl_id, field_name)
);

-- 4. data_points (R2 pending AI extractions)
CREATE TABLE IF NOT EXISTS data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id uuid,
  company_id uuid,
  contact_id uuid,
  field_name text NOT NULL,
  field_value text,
  source text NOT NULL DEFAULT 'ai',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 5. feedback_log
CREATE TABLE IF NOT EXISTS feedback_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_action_id uuid,
  feedback_type text NOT NULL,
  original_value text,
  edited_value text,
  context jsonb,
  user_id text DEFAULT 'default',
  created_at timestamptz DEFAULT now()
);

-- 6. chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL DEFAULT 'default',
  role text NOT NULL,
  content text,
  created_at timestamptz DEFAULT now()
);
