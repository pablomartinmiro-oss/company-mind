-- Demo prep: local inbox + appointments tables for DB fallback when GHL unavailable

CREATE TABLE IF NOT EXISTS inbox_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_ghl_id text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('sms','email','whatsapp')),
  last_message_at timestamptz DEFAULT now(),
  last_message_snippet text,
  last_message_direction text CHECK (last_message_direction IN ('inbound','outbound')),
  unread_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_conv_tenant ON inbox_conversations(tenant_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES inbox_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  channel text NOT NULL CHECK (channel IN ('sms','email','whatsapp')),
  body text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_inbox_msg_conv ON inbox_messages(conversation_id, sent_at);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  contact_ghl_id text,
  title text NOT NULL,
  appointment_type text CHECK (appointment_type IN ('qualification_call','closing_call','onboarding_setup','onboarding_demo')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed','pending','cancelled')),
  assigned_to text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appt_tenant_date ON appointments(tenant_id, starts_at);
