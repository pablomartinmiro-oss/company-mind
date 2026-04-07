-- Full Demo Seed — 10 companies, 18 contacts, calls, tasks, research
-- Tenant: eb14e21e-1f61-44a2-a908-48b5b43303d9
-- Pipelines:
--   Sales: 3ab98368-2f04-4a01-b20b-6d03577f2844
--   Onboarding: 9808dde3-4a72-44a4-b767-bc22ed531cc5
--   Upsell: 5ef7589d-2d0b-444c-a61e-25337d5af6fb
--   Follow Up: 4ccb2b46-aa90-4178-bb42-5768973bb6b9

DO $$
DECLARE
  tid uuid := 'eb14e21e-1f61-44a2-a908-48b5b43303d9';
  p_sales uuid := '3ab98368-2f04-4a01-b20b-6d03577f2844';
  p_onb uuid := '9808dde3-4a72-44a4-b767-bc22ed531cc5';
  p_ups uuid := '5ef7589d-2d0b-444c-a61e-25337d5af6fb';
  p_fu uuid := '4ccb2b46-aa90-4178-bb42-5768973bb6b9';
  -- company IDs
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  c6 uuid; c7 uuid; c8 uuid; c9 uuid; c10 uuid;
  -- call IDs for next_steps/data_points
  call1 uuid; call2 uuid; call3 uuid; call4 uuid; call5 uuid;
BEGIN

-- ═══ COMPANIES ═══
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Thompson HVAC', 'HVAC / Home Services', 'Nashville, TN', 'Google Ads') RETURNING id INTO c1;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Chen Solutions', 'IT Consulting', 'San Francisco, CA', 'Referral') RETURNING id INTO c2;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Patel Medical Staffing', 'Healthcare Staffing', 'Austin, TX', 'LinkedIn outreach') RETURNING id INTO c3;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Rivera Landscaping', 'Landscaping', 'Phoenix, AZ', 'Inbound website form') RETURNING id INTO c4;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Kim Auto Detailing', 'Auto Services', 'Seattle, WA', 'Referral') RETURNING id INTO c5;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Sarah Martinez Coaching', 'Executive Coaching', 'Denver, CO', 'Podcast appearance') RETURNING id INTO c6;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'TechForward Insurance', 'Insurance', 'Chicago, IL', 'Cold outreach') RETURNING id INTO c7;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Mountain Roofing Co', 'Roofing', 'Salt Lake City, UT', 'Google Ads') RETURNING id INTO c8;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'Bright Smile Dental', 'Dental', 'Portland, OR', 'Trade show') RETURNING id INTO c9;
INSERT INTO companies (id, tenant_id, name, industry, location, lead_source) VALUES
  (gen_random_uuid(), tid, 'GreenLeaf Lawn Care', 'Landscaping', 'Atlanta, GA', 'Inbound website form') RETURNING id INTO c10;

-- ═══ COMPANY CONTACTS ═══
INSERT INTO company_contacts (tenant_id, company_id, contact_id, is_primary, role) VALUES
  (tid, c1, 'seed-marcus-thompson', true, 'decision_maker'),
  (tid, c1, 'seed-linda-thompson', false, 'influencer'),
  (tid, c2, 'seed-sarah-chen', true, 'decision_maker'),
  (tid, c2, 'seed-david-park', false, 'champion'),
  (tid, c2, 'seed-jenny-wu', false, 'user'),
  (tid, c3, 'seed-lisa-patel', true, 'decision_maker'),
  (tid, c3, 'seed-raj-patel', false, 'gatekeeper'),
  (tid, c4, 'seed-jake-rivera', true, 'decision_maker'),
  (tid, c5, 'seed-david-kim', true, 'decision_maker'),
  (tid, c5, 'seed-maria-kim', false, 'influencer'),
  (tid, c6, 'seed-sarah-martinez', true, 'decision_maker'),
  (tid, c7, 'seed-michael-chen', true, 'champion'),
  (tid, c7, 'seed-patricia-boyd', false, 'decision_maker'),
  (tid, c7, 'seed-james-wilson', false, 'user'),
  (tid, c8, 'seed-tom-mitchell', true, 'decision_maker'),
  (tid, c9, 'seed-dr--amanda-reyes', true, 'decision_maker'),
  (tid, c9, 'seed-beth-carlson', false, 'gatekeeper'),
  (tid, c10, 'seed-tony-russo', true, 'decision_maker');

-- ═══ PIPELINE PLACEMENTS ═══
-- Thompson HVAC: Sales Closed + Onboarding Building
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c1, p_sales, 'Closed', '$5,988/yr', now() - interval '1 day', 'seed-marcus-thompson'),
  (tid, c1, p_onb, 'Building', '$5,988/yr', now() - interval '1 day', 'seed-marcus-thompson');
-- Chen Solutions: Sales Closed + Onboarding Operating
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c2, p_sales, 'Closed', '$10,788/yr', now() - interval '14 days', 'seed-sarah-chen'),
  (tid, c2, p_onb, 'Operating', '$10,788/yr', now() - interval '3 days', 'seed-sarah-chen');
-- Patel: Sales Closing
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c3, p_sales, 'Closing', '$8,400/yr', now() - interval '4 days', 'seed-lisa-patel');
-- Rivera: Sales Qualification
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c4, p_sales, 'Qualification', '$3,600/yr', now() - interval '8 days', 'seed-jake-rivera');
-- Kim: Sales New Lead
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c5, p_sales, 'New Lead', null, now() - interval '2 days', 'seed-david-kim');
-- Martinez: Sales Qualification
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c6, p_sales, 'Qualification', '$2,400/yr', now() - interval '5 days', 'seed-sarah-martinez');
-- TechForward: Sales Closed + Upsell Tier 2
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c7, p_sales, 'Closed', '$24,000/yr', now() - interval '90 days', 'seed-michael-chen'),
  (tid, c7, p_ups, 'Tier 2', '$24,000/yr', now() - interval '3 days', 'seed-michael-chen');
-- Mountain Roofing: Sales New Lead
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c8, p_sales, 'New Lead', null, now() - interval '1 day', 'seed-tom-mitchell');
-- Bright Smile: Follow Up Nurture
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c9, p_fu, 'Nurture', null, now() - interval '21 days', 'seed-dr--amanda-reyes');
-- GreenLeaf: Sales Closed + Onboarding Building
INSERT INTO pipeline_companies (tenant_id, company_id, pipeline_id, stage, deal_value, stage_entered_at, contact_id) VALUES
  (tid, c10, p_sales, 'Closed', '$4,200/yr', now() - interval '5 days', 'seed-tony-russo'),
  (tid, c10, p_onb, 'Building', '$4,200/yr', now() - interval '2 days', 'seed-tony-russo');

-- ═══ STAGE LOG ═══
INSERT INTO stage_log (tenant_id, company_id, pipeline_id, stage, entered_at, moved_by, source, entry_number, contact_id) VALUES
  (tid, c1, p_sales, 'New Lead', now() - interval '28 days', 'Pablo Martin', 'manual', 1, 'seed-marcus-thompson'),
  (tid, c1, p_sales, 'Qualification', now() - interval '14 days', 'Pablo Martin', 'manual', 1, 'seed-marcus-thompson'),
  (tid, c1, p_sales, 'Closing', now() - interval '6 days', 'Pablo Martin', 'manual', 1, 'seed-marcus-thompson'),
  (tid, c1, p_sales, 'Closed', now() - interval '1 day', 'Pablo Martin', 'manual', 1, 'seed-marcus-thompson'),
  (tid, c2, p_sales, 'New Lead', now() - interval '30 days', 'Pablo Martin', 'manual', 1, 'seed-sarah-chen'),
  (tid, c2, p_sales, 'Qualification', now() - interval '20 days', 'Pablo Martin', 'manual', 1, 'seed-sarah-chen'),
  (tid, c2, p_sales, 'Closing', now() - interval '14 days', 'Pablo Martin', 'manual', 1, 'seed-sarah-chen'),
  (tid, c2, p_sales, 'Closed', now() - interval '7 days', 'Pablo Martin', 'manual', 1, 'seed-sarah-chen'),
  (tid, c3, p_sales, 'New Lead', now() - interval '21 days', 'Corey Lavinder', 'manual', 1, 'seed-lisa-patel'),
  (tid, c3, p_sales, 'Qualification', now() - interval '14 days', 'Corey Lavinder', 'manual', 1, 'seed-lisa-patel'),
  (tid, c3, p_sales, 'Closing', now() - interval '4 days', 'Corey Lavinder', 'manual', 1, 'seed-lisa-patel'),
  (tid, c7, p_sales, 'New Lead', now() - interval '120 days', 'Pablo Martin', 'manual', 1, 'seed-michael-chen'),
  (tid, c7, p_sales, 'Qualification', now() - interval '110 days', 'Pablo Martin', 'manual', 1, 'seed-michael-chen'),
  (tid, c7, p_sales, 'Closing', now() - interval '100 days', 'Pablo Martin', 'manual', 1, 'seed-michael-chen'),
  (tid, c7, p_sales, 'Closed', now() - interval '90 days', 'Pablo Martin', 'manual', 1, 'seed-michael-chen');

-- ═══ CALLS ═══
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-sarah-chen', 'Sarah Chen', '{"overall": 91}', 'Closing call with Sarah Chen reviewing pilot results. Team processed 340 leads (up from 120) and rep scores improved from 5.8 to 7.2 average. Sarah verbally committed to $899/month annual plan, pending CFO sign-off by end of week.', 'closing', 'closed_won', 1847, now() - interval '2 days', 'complete', 'complete', 'demo')
  RETURNING id INTO call1;
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-sarah-chen', 'Sarah Chen', '{"overall": 87}', 'Discovery call with Sarah Chen exploring CRM modernization needs. Team currently using HubSpot but frustrated with limited automation and high per-seat costs. Identified 8 specific use cases.', 'qualification', 'follow_up_scheduled', 2156, now() - interval '12 days', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-david-kim', 'David Kim', '{"overall": 94}', 'Winning demo with David Kim and office manager Maria from a 2-location auto detailing business. Identified 18-point close rate gap between locations ($180K/year opportunity). Deal closed on the call at $699/month annual.', 'qualification', 'follow_up_scheduled', 2456, now() - interval '2 days', 'complete', 'complete', 'demo')
  RETURNING id INTO call2;
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-marcus-thompson', 'Marcus Thompson', '{"overall": 82}', 'First qualification call with Marcus Thompson, owner of 12-employee HVAC business in Nashville. Currently using ServiceTitan for dispatch but no CRM for sales. Losing ~30% of inbound leads to slow follow-up.', 'qualification', 'follow_up_scheduled', 2103, now() - interval '6 days', 'complete', 'complete', 'demo')
  RETURNING id INTO call3;
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-marcus-thompson', 'Marcus Thompson', '{"overall": 89}', 'Closing call with Marcus Thompson. ROI projection: 47 leads/month, 15% close rate improvement = $58K additional annual revenue. Marcus signed off on $499/month annual plan. Onboarding kickoff scheduled.', 'closing', 'closed_won', 2845, now() - interval '1 day', 'complete', 'complete', 'demo')
  RETURNING id INTO call4;
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-lisa-patel', 'Lisa Patel', '{"overall": 78}', 'Discovery call with Lisa Patel for healthcare staffing CRM. Manages 40+ active placements per month with spreadsheets. Strong interest in AI call scoring for placement coordinator coaching.', 'qualification', 'follow_up_scheduled', 1987, now() - interval '4 days', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-jake-rivera', 'Jake Rivera', '{"overall": 64}', 'Initial qualification with Jake Rivera from Rivera Landscaping. 5-employee residential landscaping in Phoenix. No CRM, tracking in spreadsheet. Very price sensitive — $200/month max budget.', 'qualification', 'follow_up_scheduled', 1456, now() - interval '8 days', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-sarah-martinez', 'Sarah Martinez', '{"overall": 81}', 'Discovery call with Sarah Martinez, executive coach. Uses Calendly + spreadsheet. Wants CRM that handles client lifecycle from inquiry through 6-month engagement. Loved call scoring for self-improvement.', 'qualification', 'follow_up_scheduled', 2234, now() - interval '5 days', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-michael-chen', 'Michael Chen', '{"overall": 95}', 'QBR with Michael Chen at TechForward. Year 1: 23% increase in close rate, $340K additional revenue. Discussed Tier 2 upgrade to 15 seats at $24K annual. Michael ready to expand, needs CFO approval.', 'closing', 'closed_won', 3245, now() - interval '3 days', 'complete', 'complete', 'demo')
  RETURNING id INTO call5;
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-patricia-boyd', 'Patricia Boyd', '{"overall": 92}', 'CFO call with Patricia Boyd at TechForward. Year 1 ROI: $340K revenue lift on $14K invested. Patricia approved Tier 2 expansion to 15 seats at $24K/year. Contract signed.', 'closing', 'closed_won', 1876, now() - interval '2 days', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-tom-mitchell', 'Tom Mitchell', null, 'Intro call with Mountain Roofing. 8 employees, lots of leads from Google Ads but no tracking system. Scheduled 30-min discovery for Friday.', 'cold_call', 'follow_up_scheduled', 723, now() - interval '1 day', 'complete', 'complete', 'demo');
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-tony-russo', 'Tony Russo', '{"overall": 84}', 'Closing call with Tony Russo. Negotiated 30-day trial at full annual price with refund guarantee. Tony agreed at $349/month. Kickoff Tuesday.', 'closing', 'closed_won', 1534, now() - interval '5 days', 'complete', 'complete', 'demo');
-- Short/skipped calls
INSERT INTO calls (tenant_id, contact_ghl_id, contact_name, score, call_summary, call_type, outcome, duration_seconds, called_at, status, processing_status, source) VALUES
  (tid, 'seed-tom-mitchell', 'Tom Mitchell', null, null, 'cold_call', 'voicemail', 32, now() - interval '3 hours', 'complete', 'complete', 'demo'),
  (tid, 'seed-dr--amanda-reyes', 'Dr. Amanda Reyes', null, null, 'follow_up', 'no_answer', 18, now() - interval '1 day', 'complete', 'complete', 'demo'),
  (tid, 'seed-jake-rivera', 'Jake Rivera', null, null, 'follow_up', null, 187, now() - interval '4 days', 'complete', 'error', 'demo');

-- ═══ TASKS ═══
INSERT INTO tasks (tenant_id, contact_id, pipeline_stage, title, description, assigned_to, due_date, completed) VALUES
  (tid, 'seed-sarah-chen', 'Closing', 'Send pilot results summary', 'Compile lead processing metrics and rep score improvements from last 30 days', 'Pablo Martin', current_date, false),
  (tid, 'seed-sarah-chen', 'Closing', 'Schedule CFO call', 'Coordinate with Sarah to bring CFO into next conversation for budget sign-off', 'Pablo Martin', current_date + 1, false),
  (tid, 'seed-david-kim', 'New Lead', 'Send onboarding kit', 'Welcome package + GHL sub-account credentials + first-week guide', 'Pablo Martin', current_date, false),
  (tid, 'seed-marcus-thompson', 'Closing', 'Send agreement', 'Annual agreement at $499/mo, e-sign via PandaDoc', 'Pablo Martin', current_date - 1, false),
  (tid, 'seed-marcus-thompson', 'Closing', 'Schedule kickoff call', 'Onboarding kickoff for Monday at 10am CST', 'Pablo Martin', current_date + 1, false),
  (tid, 'seed-lisa-patel', 'Qualification', 'Prepare healthcare-specific demo', 'Customize demo for staffing use case — placement tracking, candidate communication', 'Corey Lavinder', current_date + 2, false),
  (tid, 'seed-lisa-patel', 'Qualification', 'Send proposal', '$700/month annual proposal with 14-day pilot included', 'Corey Lavinder', current_date, false),
  (tid, 'seed-jake-rivera', 'Qualification', 'Re-engage Jake Rivera', 'No response to last two messages — try calling directly', 'Pablo Martin', current_date - 5, false),
  (tid, 'seed-sarah-martinez', 'Qualification', 'Send solo plan pricing', 'Single-user plan options with annual discount', 'Corey Lavinder', current_date + 1, false),
  (tid, 'seed-michael-chen', 'Closing', 'CFO follow-up', 'CFO wants to join — find mutual availability for next week', 'Pablo Martin', current_date + 2, false),
  (tid, 'seed-tom-mitchell', 'New Lead', 'Discovery call prep', 'Research Mountain Roofing Co before Friday discovery call', 'Corey Lavinder', current_date + 3, false),
  (tid, 'seed-dr--amanda-reyes', 'Nurture', 'Quarterly check-in', 'Light touch — share dental industry case study', 'Pablo Martin', current_date + 14, false),
  (tid, 'seed-tony-russo', 'Closing', 'Verify data points', 'After closing call, audit research fields for accuracy', 'Pablo Martin', current_date, false),
  (tid, 'seed-beth-carlson', 'Nurture', 'Get on Dr. Reyes calendar', 'Beth gatekeeps — send polite reminder for 15-min slot', 'Corey Lavinder', current_date + 5, false);

-- ═══ COMPANY RESEARCH ═══
INSERT INTO research (tenant_id, scope, company_id, contact_id, section, field_name, field_value, source) VALUES
  -- Thompson HVAC
  (tid, 'company', c1, null, 'Business Info', 'Employees', '12-20', 'api'),
  (tid, 'company', c1, null, 'Business Info', 'Annual revenue', '$1.2M-$2.5M est.', 'ai'),
  (tid, 'company', c1, null, 'Business Info', 'Years in business', '8 years', 'api'),
  (tid, 'company', c1, null, 'Business Info', 'Website', 'thompsonhvac.com', 'api'),
  (tid, 'company', c1, null, 'Pain Points', 'Primary pain', 'Lead follow-up speed — reps avg 4+ hrs response', 'ai'),
  (tid, 'company', c1, null, 'Pain Points', 'Current CRM', 'ServiceTitan (dispatch only)', 'ai'),
  (tid, 'company', c1, null, 'Pain Points', 'Lead volume per week', '~40 leads', 'ai'),
  (tid, 'company', c1, null, 'Pain Points', 'Monthly ad spend', '$3,000 Google Ads', 'ai'),
  (tid, 'company', c1, null, 'Buying Process', 'Budget range', '$500-1000/month', 'ai'),
  (tid, 'company', c1, null, 'Account Health', 'Overall fit', 'Strong — HVAC ICP match, budget aligned', 'manual'),
  -- Chen Solutions
  (tid, 'company', c2, null, 'Business Info', 'Employees', '25-40', 'api'),
  (tid, 'company', c2, null, 'Business Info', 'Annual revenue', '$3M-$5M est.', 'ai'),
  (tid, 'company', c2, null, 'Business Info', 'Website', 'chensolutions.com', 'api'),
  (tid, 'company', c2, null, 'Pain Points', 'Primary pain', 'HubSpot too expensive at scale ($24K/year), automation limitations', 'ai'),
  (tid, 'company', c2, null, 'Pain Points', 'Current CRM', 'HubSpot Professional', 'ai'),
  (tid, 'company', c2, null, 'Pain Points', 'Monthly ad spend', '$8,000 (LinkedIn + Google)', 'ai'),
  (tid, 'company', c2, null, 'Buying Process', 'Budget range', '$10,000-$15,000 annual', 'ai'),
  -- TechForward
  (tid, 'company', c7, null, 'Business Info', 'Employees', '85', 'api'),
  (tid, 'company', c7, null, 'Business Info', 'Annual revenue', '$12M est.', 'ai'),
  (tid, 'company', c7, null, 'Business Info', 'Years in business', '14 years', 'api'),
  (tid, 'company', c7, null, 'Account Health', 'Overall fit', 'Excellent — expanding from 8 to 23 seats', 'manual'),
  (tid, 'company', c7, null, 'Account Health', 'Renewal date', 'February 2027', 'manual'),
  (tid, 'company', c7, null, 'Account Health', 'Last touch', 'QBR with Michael Chen 3 days ago', 'manual');

-- ═══ CONTACT RESEARCH ═══
INSERT INTO research (tenant_id, scope, company_id, contact_id, section, field_name, field_value, source) VALUES
  -- Sarah Chen
  (tid, 'contact', null, 'seed-sarah-chen', 'Personal Context', 'Role', 'CEO and co-founder', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Personal Context', 'Tenure', '6 years at Chen Solutions', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Personal Context', 'Decision authority', 'Final on tools <$10K, CFO required for larger', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Personal Context', 'Background', 'Former engineering manager at Salesforce', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'How They Interact', 'Communication style', 'Direct, data-driven, prefers numbers over stories', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'How They Interact', 'Preferred channel', 'Email for proposals, Slack for quick questions', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'How They Interact', 'Best time to reach', 'Morning PT, before her 11am standup', 'ai'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Relationship', 'Champion level', 'Strong — has referred 2 other companies', 'manual'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Relationship', 'How we met', 'Inbound — found us via Anthropic blog post', 'manual'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Interests & Hobbies', 'Hobbies', 'Trail running, cooking', 'manual'),
  (tid, 'contact', null, 'seed-sarah-chen', 'Interests & Hobbies', 'Family', 'Married, two daughters (8 and 11)', 'manual'),
  -- Marcus Thompson
  (tid, 'contact', null, 'seed-marcus-thompson', 'Personal Context', 'Role', 'Owner / Operator', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'Personal Context', 'Tenure', '8 years (founded the business)', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'Personal Context', 'Decision authority', 'Sole owner, full authority', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'How They Interact', 'Communication style', 'Casual, no-BS, plain English over jargon', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'How They Interact', 'Preferred channel', 'Phone calls > text > email', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'How They Interact', 'Best time to reach', 'Early morning before 8am or after 5pm', 'ai'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'Interests & Hobbies', 'Hobbies', 'College football (Tennessee Vols), bass fishing', 'manual'),
  (tid, 'contact', null, 'seed-marcus-thompson', 'Interests & Hobbies', 'Family', 'Wife Linda (works in the business), three kids', 'manual'),
  -- Michael Chen
  (tid, 'contact', null, 'seed-michael-chen', 'Personal Context', 'Role', 'VP of Sales', 'ai'),
  (tid, 'contact', null, 'seed-michael-chen', 'Personal Context', 'Tenure', '4 years at TechForward', 'ai'),
  (tid, 'contact', null, 'seed-michael-chen', 'Personal Context', 'Reports to', 'Patricia Boyd (CFO) for budget, CEO for ops', 'ai'),
  (tid, 'contact', null, 'seed-michael-chen', 'How They Interact', 'Communication style', 'Methodical, asks lots of questions, wants references', 'ai'),
  (tid, 'contact', null, 'seed-michael-chen', 'Relationship', 'Champion level', 'Strong internal champion — has driven all expansion', 'manual');

-- ═══ NEXT STEPS ═══
INSERT INTO next_steps (tenant_id, call_id, action_type, title, description, status) VALUES
  (tid, call1, 'task', 'Send agreement to Sarah', '$899/month annual plan, prepared with success manager intro', 'pending'),
  (tid, call1, 'appointment', 'Schedule kickoff call', 'Pencil in week of April 14 for onboarding kickoff', 'pending'),
  (tid, call1, 'email', 'Loop in CFO', 'Sarah mentioned CFO sign-off needed — get her email for direct intro', 'pending'),
  (tid, call1, 'research', 'Update Pain Points', 'Sarah mentioned new use case: contract review — add to research', 'pending'),
  (tid, call2, 'task', 'Send onboarding kit', 'Welcome package + GHL credentials', 'pending'),
  (tid, call2, 'stage_change', 'Move to Closed', 'Deal closed on call — update Sales Pipeline stage', 'pending'),
  (tid, call2, 'appointment', 'Onboarding kickoff Monday 10am', 'David and Maria both attending', 'pending'),
  (tid, call4, 'task', 'Send agreement', 'Annual at $499/month, PandaDoc', 'pending'),
  (tid, call4, 'note', 'Loop in Linda', 'Linda is co-decision maker — include her on all comms', 'pending'),
  (tid, call5, 'task', 'Process Tier 2 contract', 'Expansion from 8 to 23 seats at $24K/year', 'pending'),
  (tid, call5, 'appointment', 'Expansion onboarding Monday', 'Add 15 new users to TechForward sub-account', 'pending');

-- ═══ DATA POINTS ═══
INSERT INTO data_points (tenant_id, call_id, field_name, field_value, source, status) VALUES
  (tid, call1, 'Budget range', '$899/month annual commitment', 'ai', 'pending'),
  (tid, call1, 'Decision maker', 'CEO Sarah Chen with CFO approval for >$10K', 'ai', 'pending'),
  (tid, call1, 'Current pain', 'HubSpot cost per seat too high at scale', 'ai', 'pending'),
  (tid, call3, 'Lead volume', '47 inbound leads per month', 'ai', 'pending'),
  (tid, call3, 'Response time', 'Currently averaging 4+ hours', 'ai', 'pending'),
  (tid, call3, 'Current CRM', 'ServiceTitan for dispatch, no sales CRM', 'ai', 'pending'),
  (tid, call5, 'Expansion seats', 'From 8 to 23 seats', 'ai', 'pending'),
  (tid, call5, 'Year 1 ROI', '$340K revenue lift on $14K invested', 'ai', 'pending');

END $$;
