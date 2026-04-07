-- Company Model Refactor Migration
-- Run against the linked Supabase project

-- 1. Companies table (the new top-level entity)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  website text,
  location text,
  ghl_company_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);

-- 2. Many-to-many: contacts <-> companies (with primary flag and role)
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id text NOT NULL,
  is_primary boolean DEFAULT false,
  role text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, company_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_cc_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_cc_contact ON company_contacts(contact_id);

-- 3. Rename pipeline_contacts -> pipeline_companies and add company_id
ALTER TABLE pipeline_contacts RENAME TO pipeline_companies;

ALTER TABLE pipeline_companies
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- 4. Rename contact_research -> research and add scope columns
ALTER TABLE contact_research RENAME TO research;

ALTER TABLE research
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'contact' CHECK (scope IN ('company', 'contact'));

ALTER TABLE research ALTER COLUMN contact_id DROP NOT NULL;

-- Drop old unique constraint and create scoped ones
ALTER TABLE research DROP CONSTRAINT IF EXISTS contact_research_tenant_id_contact_id_field_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_company_field
  ON research(tenant_id, company_id, field_name)
  WHERE scope = 'company';
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_contact_field
  ON research(tenant_id, contact_id, field_name)
  WHERE scope = 'contact';

-- 5. Stage log also references company now
ALTER TABLE stage_log
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- 6. Appointment status table (from prior fix, ensure it exists)
CREATE TABLE IF NOT EXISTS appointment_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ghl_event_id text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','showed','no_show','cancelled')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, ghl_event_id)
);
