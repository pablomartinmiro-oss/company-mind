-- Comprehensive test data seed for Daily HQ page verification
-- Tenant: Company Mind (eb14e21e-1f61-44a2-a908-48b5b43303d9)
-- Updates tasks with varied types and due dates
-- Inserts multi-pipeline contacts for multi-stage display testing
-- Note: Inbox conversations live in GHL, not Supabase — cannot seed here.

DO $$
DECLARE
  tid uuid := 'eb14e21e-1f61-44a2-a908-48b5b43303d9';
  today date := CURRENT_DATE;
  sales_pipeline_id uuid;
  onboarding_pipeline_id uuid;
  upsell_pipeline_id uuid;
  followup_pipeline_id uuid;
BEGIN

  -- Look up pipeline IDs
  SELECT id INTO sales_pipeline_id FROM pipelines WHERE tenant_id = tid AND name = 'Sales Pipeline' LIMIT 1;
  SELECT id INTO onboarding_pipeline_id FROM pipelines WHERE tenant_id = tid AND name = 'Onboarding' LIMIT 1;
  SELECT id INTO upsell_pipeline_id FROM pipelines WHERE tenant_id = tid AND name = 'Upsell' LIMIT 1;
  SELECT id INTO followup_pipeline_id FROM pipelines WHERE tenant_id = tid AND name = 'Follow Up' LIMIT 1;

  -- ═══════════════════════════════════════════════
  -- 1. Varied tasks (at least 2 of each type)
  -- ═══════════════════════════════════════════════

  DELETE FROM tasks WHERE tenant_id = tid AND title LIKE 'Demo:%';

  INSERT INTO tasks (id, tenant_id, contact_id, title, description, task_type, assigned_to, due_date, completed, pipeline_stage) VALUES
    -- Admin tasks
    (gen_random_uuid(), tid, 'demo-contact-001', 'Update CRM fields for Sarah Chen', 'Verify all data points are current after closing call', 'admin', 'Pablo Martin', today - interval '3 days', false, 'Closed'),
    (gen_random_uuid(), tid, 'demo-contact-005', 'Clean up David Kim contact record', 'Remove duplicate entries and merge notes', 'admin', 'Corey Lavinder', today + interval '2 days', false, 'Nurture'),
    (gen_random_uuid(), tid, 'demo-contact-003', 'Export Q1 pipeline report', 'Pull pipeline data for Lisa Patel deal review', 'admin', 'Pablo Martin', today, false, 'Qualification'),
    -- Follow-up tasks
    (gen_random_uuid(), tid, 'demo-contact-002', 'Follow up with Marcus Thompson on proposal', 'He requested revised pricing — send updated deck', 'follow_up', 'Pablo Martin', today - interval '1 day', false, 'Closing'),
    (gen_random_uuid(), tid, 'demo-contact-004', 'Check in with Jake Rivera after demo', 'Demo went well, gauge interest level and next steps', 'follow_up', 'Corey Lavinder', today + interval '1 day', false, 'Qualification'),
    (gen_random_uuid(), tid, 'demo-contact-001', 'Send Sarah Chen onboarding welcome packet', 'Include team setup guide and timeline', 'follow_up', 'Pablo Martin', today + interval '3 days', false, 'New Client'),
    -- New lead tasks
    (gen_random_uuid(), tid, 'demo-contact-006', 'Research new inbound lead: TechForward Inc', 'Inbound from website form — check LinkedIn and company size', 'new_lead', 'Corey Lavinder', today - interval '2 days', false, 'New Lead'),
    (gen_random_uuid(), tid, 'demo-contact-007', 'Qualify referral from David Kim: GreenPath Solar', 'David referred them — schedule intro call', 'new_lead', 'Pablo Martin', today, false, 'New Lead'),
    -- Scheduling tasks
    (gen_random_uuid(), tid, 'demo-contact-002', 'Schedule closing call with Marcus Thompson', 'CFO wants to join — find mutual availability', 'scheduling', 'Pablo Martin', today - interval '4 days', false, 'Closing'),
    (gen_random_uuid(), tid, 'demo-contact-003', 'Book qualification call with Lisa Patel', 'She responded to email — schedule for this week', 'scheduling', 'Corey Lavinder', today + interval '1 day', false, 'Qualification'),
    (gen_random_uuid(), tid, 'demo-contact-005', 'Reschedule David Kim check-in', 'He cancelled last meeting — find new time next week', 'scheduling', 'Corey Lavinder', today + interval '5 days', false, 'Nurture');

  -- ═══════════════════════════════════════════════
  -- 2. Multi-pipeline contacts
  -- ═══════════════════════════════════════════════

  -- Remove existing entries
  DELETE FROM pipeline_contacts WHERE tenant_id = tid AND contact_id IN ('demo-contact-001', 'demo-contact-002', 'demo-contact-003', 'demo-contact-004', 'demo-contact-005');

  -- Marcus Thompson: Sales Pipeline (Closing) + Onboarding (New Client)
  IF sales_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-002', sales_pipeline_id, 'Closing', '45000', now() - interval '2 days');
  END IF;
  IF onboarding_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-002', onboarding_pipeline_id, 'New Client', '45000', now() - interval '1 day');
  END IF;

  -- Sarah Chen: Sales Pipeline (Closed) + Onboarding (Building)
  IF sales_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-001', sales_pipeline_id, 'Closed', '75000', now() - interval '7 days');
  END IF;
  IF onboarding_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-001', onboarding_pipeline_id, 'Building', '75000', now() - interval '4 days');
  END IF;

  -- Lisa Patel: Sales Pipeline (Qualification) + Upsell (Tier 1)
  IF sales_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-003', sales_pipeline_id, 'Qualification', '32000', now() - interval '4 days');
  END IF;
  IF upsell_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-003', upsell_pipeline_id, 'Tier 1', '32000', now() - interval '1 day');
  END IF;

  -- Jake Rivera: Sales Pipeline (Qualification)
  IF sales_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-004', sales_pipeline_id, 'Qualification', '28000', now() - interval '1 day');
  END IF;

  -- David Kim: Follow Up (Nurture)
  IF followup_pipeline_id IS NOT NULL THEN
    INSERT INTO pipeline_contacts (id, tenant_id, contact_id, pipeline_id, stage, deal_value, stage_entered_at) VALUES
      (gen_random_uuid(), tid, 'demo-contact-005', followup_pipeline_id, 'Nurture', '15000', now() - interval '7 days');
  END IF;

END $$;
