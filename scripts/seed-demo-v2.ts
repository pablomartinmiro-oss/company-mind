import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '').replace(/\\n$/g, '').trim();
  process.env[key] = val;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

// ============================================================================
// HELPERS
// ============================================================================

const now = new Date();

function daysAgo(days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

function randomMeetSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// COMPANY DATA
// ============================================================================

const companies = [
  {
    name: 'Mountain Roofing Co',
    industry: 'Construction',
    lead_source: 'Google Ads',
    mrr: null,
    setup_fee: null,
    website: 'mountainroofingco.com',
    location: 'Denver, CO',
    term_length: 24,
  },
  {
    name: 'Coastal Insurance Group',
    industry: 'Insurance',
    lead_source: 'LinkedIn',
    mrr: null,
    setup_fee: null,
    website: 'coastalig.com',
    location: 'Tampa, FL',
    term_length: 24,
  },
  {
    name: 'Bright Smile Dental',
    industry: 'Medical',
    lead_source: 'Trade show',
    mrr: null,
    setup_fee: null,
    website: 'brightsmiledental.com',
    location: 'Austin, TX',
    term_length: 12,
  },
  {
    name: 'Apex Auto Detailing',
    industry: 'Auto',
    lead_source: 'Referral',
    mrr: null,
    setup_fee: null,
    website: 'apexautodetail.com',
    location: 'Phoenix, AZ',
    term_length: 12,
  },
  {
    name: 'Northstar HVAC Services',
    industry: 'HVAC',
    lead_source: 'Google Ads',
    mrr: null,
    setup_fee: null,
    website: 'northstarhvac.com',
    location: 'Minneapolis, MN',
    term_length: 24,
  },
  {
    name: 'Riverside Legal LLP',
    industry: 'Legal',
    lead_source: 'Referral',
    mrr: null,
    setup_fee: null,
    website: 'riversidelegal.com',
    location: 'Portland, OR',
    term_length: 36,
  },
  {
    name: 'Thompson HVAC',
    industry: 'HVAC',
    lead_source: 'Google Ads',
    mrr: 499,
    setup_fee: 0,
    website: 'thompsonhvac.com',
    location: 'Nashville, TN',
    term_length: 24,
  },
  {
    name: 'GreenLeaf Lawn Care',
    industry: 'Home Services',
    lead_source: 'Inbound website',
    mrr: 700,
    setup_fee: 500,
    website: 'greenleaflawn.com',
    location: 'Atlanta, GA',
    term_length: 24,
  },
  {
    name: 'Chen Solutions',
    industry: 'IT Consulting',
    lead_source: 'Referral',
    mrr: 1200,
    setup_fee: 1000,
    website: 'chensolutions.com',
    location: 'San Francisco, CA',
    term_length: 36,
  },
  {
    name: 'Precision Dental Care',
    industry: 'Medical',
    lead_source: 'Google Ads',
    mrr: 899,
    setup_fee: 750,
    website: 'precisiondental.com',
    location: 'Charlotte, NC',
    term_length: 24,
  },
  {
    name: 'Summit Roofing & Restoration',
    industry: 'Construction',
    lead_source: 'Trade show',
    mrr: 1500,
    setup_fee: 2000,
    website: 'summitroofingut.com',
    location: 'Salt Lake City, UT',
    term_length: 36,
  },
  {
    name: 'Quick Lube Express',
    industry: 'Auto',
    lead_source: 'Cold outbound',
    mrr: null,
    setup_fee: null,
    website: 'quicklubeexpress.com',
    location: 'Dallas, TX',
    term_length: 12,
  },
  {
    name: 'Allstate Movers Inc',
    industry: 'Home Services',
    lead_source: 'Google Ads',
    mrr: null,
    setup_fee: null,
    website: 'allstatemovers.com',
    location: 'Columbus, OH',
    term_length: 12,
  },
  {
    name: 'Sunrise Pediatric Dentistry',
    industry: 'Medical',
    lead_source: 'Referral',
    mrr: null,
    setup_fee: null,
    website: 'sunrisepediatric.com',
    location: 'San Diego, CA',
    term_length: 12,
  },
  {
    name: 'Iron Mountain Plumbing',
    industry: 'Home Services',
    lead_source: 'Facebook Ads',
    mrr: null,
    setup_fee: null,
    website: 'ironmtnplumbing.com',
    location: 'Pittsburgh, PA',
    term_length: 12,
  },
  {
    name: 'Velocity Auto Sales',
    industry: 'Auto',
    lead_source: 'Trade show',
    mrr: null,
    setup_fee: null,
    website: 'velocityautonj.com',
    location: 'Newark, NJ',
    term_length: 24,
  },
];

// ============================================================================
// CONTACT DATA
// ============================================================================

const contactsData = [
  { companyIndex: 0, name: 'Tom Mitchell', email: 'tom@mountainroofingco.com', phone: '+13035551001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 1, name: 'Sandra Pérez', email: 'sandra@coastalig.com', phone: '+18135552001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 2, name: 'Dr. Amanda Reyes', email: 'amanda@brightsmiledental.com', phone: '+15125553001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 2, name: 'Lisa Park', email: 'lisa@brightsmiledental.com', phone: '+15125553002', isPrimary: false, role: 'office_manager' },
  { companyIndex: 3, name: 'Carlos Vega', email: 'carlos@apexautodetail.com', phone: '+16025554001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 4, name: 'Erik Lindgren', email: 'erik@northstarhvac.com', phone: '+16125555001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 5, name: 'Margaret Chen', email: 'margaret@riversidelegal.com', phone: '+15035556001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 5, name: 'Dan Wu', email: 'dan@riversidelegal.com', phone: '+15035556002', isPrimary: false, role: 'influencer' },
  { companyIndex: 6, name: 'Marcus Thompson', email: 'marcus@thompsonhvac.com', phone: '+16155557001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 7, name: 'Tony Russo', email: 'tony@greenleaflawn.com', phone: '+14045558001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 8, name: 'David Chen', email: 'david@chensolutions.com', phone: '+14155559001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 8, name: 'Sarah Chen', email: 'sarah@chensolutions.com', phone: '+14155559002', isPrimary: false, role: 'champion' },
  { companyIndex: 9, name: 'Dr. Rachel Kim', email: 'rachel@precisiondental.com', phone: '+17045550001', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 10, name: 'James Walker', email: 'james@summitroofingut.com', phone: '+18015550101', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 10, name: 'Mike Foley', email: 'mike@summitroofingut.com', phone: '+18015550102', isPrimary: false, role: 'estimator' },
  { companyIndex: 11, name: 'Ronnie Hayes', email: 'ronnie@quicklubeexpress.com', phone: '+12145550201', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 12, name: 'Patricia Wells', email: 'patricia@allstatemovers.com', phone: '+16145550301', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 13, name: 'Dr. Henry Liu', email: 'henry@sunrisepediatric.com', phone: '+16195550401', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 14, name: 'Frank Bartoli', email: 'frank@ironmtnplumbing.com', phone: '+14125550501', isPrimary: true, role: 'decision_maker' },
  { companyIndex: 15, name: 'Marco Greco', email: 'marco@velocityautonj.com', phone: '+19735550601', isPrimary: true, role: 'decision_maker' },
];

// ============================================================================
// RESEARCH CATALOG (92 company fields, 67 contact fields)
// ============================================================================

const researchCatalog = {
  identity: [
    'legal_name',
    'dba',
    'domain',
    'logo_url',
    'year_founded',
    'country',
    'state',
    'city',
    'time_zone',
    'phone_main',
    'email_main',
    'linkedin_url',
    'twitter_url',
    'facebook_url',
    'instagram_url',
  ],
  business_profile: [
    'industry_primary',
    'industry_secondary',
    'naics_code',
    'business_model',
    'company_stage',
    'employees_exact',
    'employees_range',
    'employee_growth_90d',
    'revenue_range',
    'revenue_growth_signal',
    'geographic_reach',
    'business_summary',
  ],
  tech_stack: [
    'crm_current',
    'marketing_automation',
    'email_tool',
    'calendar_tool',
    'phone_system',
    'website_platform',
    'hosting_provider',
    'analytics_tool',
    'payment_processor',
    'other_tech_detected',
  ],
  marketing: [
    'primary_lead_sources',
    'monthly_lead_volume',
    'monthly_ad_spend',
    'active_ad_channels',
    'seo_presence',
    'content_marketing',
    'media_presence',
    'reviews_count',
    'reviews_rating',
    'recent_press',
  ],
  pain_opportunity: [
    'primary_pain_hypothesis',
    'primary_pain_stated',
    'secondary_pains',
    'pain_severity',
    'time_to_pain',
    'opportunity_size',
    'opportunity_confidence',
    'trigger_events',
    'competitive_pressure',
    'why_now',
  ],
  buying_process: [
    'budget_range_stated',
    'budget_authority_confirmed',
    'budget_timing',
    'decision_process',
    'decision_makers_named',
    'influencers_named',
    'procurement_requirements',
    'contract_length_preferred',
    'timeline_stated',
    'urgency_level',
    'key_objections',
    'competitor_alternatives',
  ],
  engagement_history: [
    'first_contact_date',
    'last_contact_date',
    'days_since_last_contact',
    'total_touches',
    'calls_count',
    'emails_count',
    'meetings_count',
    'engagement_velocity',
  ],
  account_health: [
    'fit_score',
    'fit_confidence',
    'risk_factors',
    'expansion_potential',
    'champion_strength',
    'detractor_present',
    'renewal_date',
    'health_trajectory',
    'strategic_priority',
    'account_notes',
  ],
  predictive: [
    'conversion_probability',
    'mrr_potential',
    'best_next_action',
    'time_to_close_estimate',
    'lookalike_accounts',
  ],
};

function generateResearchValue(
  companyName: string,
  industry: string,
  location: string,
  fieldKey: string
): string {
  // Identity fields
  if (fieldKey === 'legal_name') return `${companyName} LLC`;
  if (fieldKey === 'dba') return companyName;
  if (fieldKey === 'domain') {
    const slug = generateSlug(companyName);
    return `.com`;
  }
  if (fieldKey === 'logo_url') return `https://placeholder.com/logo/${generateSlug(companyName)}.png`;
  if (fieldKey === 'year_founded') return String(randomInt(1995, 2020));
  if (fieldKey === 'country') return 'USA';
  if (fieldKey === 'state') return location.split(', ')[1] || 'CA';
  if (fieldKey === 'city') return location.split(', ')[0] || 'San Francisco';
  if (fieldKey === 'time_zone') {
    const stateMap: Record<string, string> = {
      CA: 'Pacific',
      CO: 'Mountain',
      FL: 'Eastern',
      TX: 'Central',
      MN: 'Central',
      OR: 'Pacific',
      TN: 'Central',
      GA: 'Eastern',
      NC: 'Eastern',
      UT: 'Mountain',
      OH: 'Eastern',
      SD: 'Central',
      PA: 'Eastern',
      NJ: 'Eastern',
    };
    const state = location.split(', ')[1] || 'CA';
    return stateMap[state] || 'Central';
  }
  if (fieldKey === 'phone_main') return `+1${randomInt(200, 999)}555${randomInt(1000, 9999)}`;
  if (fieldKey === 'email_main') {
    const slug = generateSlug(companyName);
    const domain = slug.replace(/-/g, '');
    return `info@${domain}.com`;
  }
  if (fieldKey === 'linkedin_url') return `https://linkedin.com/company/${generateSlug(companyName)}`;
  if (fieldKey === 'twitter_url') return `https://twitter.com/${generateSlug(companyName)}`;
  if (fieldKey === 'facebook_url') return `https://facebook.com/${generateSlug(companyName)}`;
  if (fieldKey === 'instagram_url') return `https://instagram.com/${generateSlug(companyName)}`;

  // Business profile
  if (fieldKey === 'industry_primary') return industry;
  if (fieldKey === 'industry_secondary') {
    const secondaries: Record<string, string> = {
      'Construction': 'Home Improvement',
      'Insurance': 'Financial Services',
      'Medical': 'Healthcare Services',
      'Auto': 'Transportation',
      'HVAC': 'Home Services',
      'Legal': 'Professional Services',
      'Home Services': 'Real Estate',
      'IT Consulting': 'Technology',
    };
    return secondaries[industry] || 'Services';
  }
  if (fieldKey === 'naics_code') return String(randomInt(100000, 999999));
  if (fieldKey === 'business_model') {
    const models = ['B2B', 'B2C', 'B2B2C', 'Marketplace'];
    return randomChoice(models);
  }
  if (fieldKey === 'company_stage') {
    const stages = ['Early Growth', 'Growth', 'Mature', 'Scale'];
    return randomChoice(stages);
  }
  if (fieldKey === 'employees_exact') return String(randomInt(5, 250));
  if (fieldKey === 'employees_range') {
    const ranges = ['1-10', '11-50', '51-100', '101-500', '500+'];
    return randomChoice(ranges);
  }
  if (fieldKey === 'employee_growth_90d') return `${randomInt(-5, 25)}%`;
  if (fieldKey === 'revenue_range') {
    const ranges = ['$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M-$10M', '$10M+'];
    return randomChoice(ranges);
  }
  if (fieldKey === 'revenue_growth_signal') return `${randomInt(5, 40)}% YoY`;
  if (fieldKey === 'geographic_reach') {
    const reaches = ['Local', 'Regional', 'National', 'International'];
    return randomChoice(reaches);
  }
  if (fieldKey === 'business_summary')
    return `${companyName} is a ${industry.toLowerCase()} company serving the ${randomChoice(['residential', 'commercial', 'enterprise'])} market with focus on service excellence.`;

  // Tech stack
  const techStackMap: Record<string, Record<string, string>> = {
    'HVAC': { crm_current: 'ServiceTitan', email_tool: 'Gmail', calendar_tool: 'Google Calendar' },
    'Medical': { crm_current: 'Dentrix', email_tool: 'Outlook', calendar_tool: 'Outlook Calendar' },
    'Home Services': { crm_current: 'HubSpot', email_tool: 'Gmail', calendar_tool: 'Google Calendar' },
    'IT Consulting': { crm_current: 'Salesforce', email_tool: 'Gmail', calendar_tool: 'Google Calendar' },
    'Construction': { crm_current: 'Procore', email_tool: 'Outlook', calendar_tool: 'Outlook Calendar' },
    'Insurance': { crm_current: 'Salesforce', email_tool: 'Gmail', calendar_tool: 'Google Calendar' },
    'Auto': { crm_current: 'DealerSocket', email_tool: 'Gmail', calendar_tool: 'Google Calendar' },
    'Legal': { crm_current: 'Clio', email_tool: 'Outlook', calendar_tool: 'Outlook Calendar' },
  };
  const industryTech = techStackMap[industry] || {};

  if (fieldKey === 'crm_current') return industryTech['crm_current'] || 'HubSpot';
  if (fieldKey === 'marketing_automation') {
    const tools = ['HubSpot', 'Marketo', 'Pardot', 'ActiveCampaign'];
    return randomChoice(tools);
  }
  if (fieldKey === 'email_tool') return industryTech['email_tool'] || 'Gmail';
  if (fieldKey === 'calendar_tool') return industryTech['calendar_tool'] || 'Google Calendar';
  if (fieldKey === 'phone_system') {
    const systems = ['Twilio', 'RingCentral', 'Vonage', 'Jive'];
    return randomChoice(systems);
  }
  if (fieldKey === 'website_platform') {
    const platforms = ['WordPress', 'Shopify', 'Webflow', 'Squarespace'];
    return randomChoice(platforms);
  }
  if (fieldKey === 'hosting_provider') {
    const providers = ['AWS', 'GCP', 'Azure', 'DigitalOcean'];
    return randomChoice(providers);
  }
  if (fieldKey === 'analytics_tool') {
    const tools = ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment'];
    return randomChoice(tools);
  }
  if (fieldKey === 'payment_processor') {
    const processors = ['Stripe', 'Square', 'PayPal', '2Checkout'];
    return randomChoice(processors);
  }
  if (fieldKey === 'other_tech_detected') {
    const techs = ['Zapier', 'IFTTT', 'Make', 'n8n'];
    return randomChoice(techs);
  }

  // Marketing
  if (fieldKey === 'primary_lead_sources') return 'Google Ads, Referral, Organic';
  if (fieldKey === 'monthly_lead_volume') return String(randomInt(10, 150));
  if (fieldKey === 'monthly_ad_spend') return `$${randomInt(500, 5000)}`;
  if (fieldKey === 'active_ad_channels') {
    const channels = ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Local Services Ads'];
    return `${randomChoice(channels)}, ${randomChoice(channels)}`;
  }
  if (fieldKey === 'seo_presence') return randomChoice(['Strong', 'Moderate', 'Weak', 'Non-existent']);
  if (fieldKey === 'content_marketing') return randomChoice(['Blog', 'Video', 'Podcast', 'Webinars', 'None']);
  if (fieldKey === 'media_presence') return randomChoice(['Yes', 'No', 'Partial']);
  if (fieldKey === 'reviews_count') return String(randomInt(10, 500));
  if (fieldKey === 'reviews_rating') return (randomInt(35, 50) / 10).toFixed(1);
  if (fieldKey === 'recent_press') return randomBool(0.3) ? `Featured in ${randomChoice(['local', 'industry'])} publication` : 'None';

  // Pain & Opportunity
  if (fieldKey === 'primary_pain_hypothesis') return `Needs better ${randomChoice(['lead management', 'customer follow-up', 'team coordination', 'workflow automation'])}`;
  if (fieldKey === 'primary_pain_stated') return `Difficulty ${randomChoice(['tracking leads', 'managing appointments', 'assigning work', 'monitoring performance'])}`;
  if (fieldKey === 'secondary_pains') return `Also struggling with ${randomChoice(['team communication', 'reporting', 'data accuracy', 'integration gaps'])}`;
  if (fieldKey === 'pain_severity') return randomChoice(['Critical', 'High', 'Medium']);
  if (fieldKey === 'time_to_pain') return `${randomInt(1, 12)} months`;
  if (fieldKey === 'opportunity_size') return `$${randomInt(5, 100)}K ARR`;
  if (fieldKey === 'opportunity_confidence') return `${randomInt(40, 95)}%`;
  if (fieldKey === 'trigger_events') return randomChoice(['New hire', 'Process change', 'Growth milestone', 'System failure']);
  if (fieldKey === 'competitive_pressure') return randomChoice(['Moderate', 'High', 'Low']);
  if (fieldKey === 'why_now') return `Q${randomInt(1, 4)} 2024 budget reallocation`;

  // Buying process
  if (fieldKey === 'budget_range_stated') return `$${randomInt(10, 100)}K`;
  if (fieldKey === 'budget_authority_confirmed') return randomBool(0.7) ? 'Yes' : 'Pending CFO approval';
  if (fieldKey === 'budget_timing') return randomChoice(['Q2 2024', 'Q3 2024', 'End of year', 'TBD']);
  if (fieldKey === 'decision_process') return `${randomInt(1, 3)}-stage approval, ${randomInt(2, 5)} stakeholders`;
  if (fieldKey === 'decision_makers_named') return randomBool(0.6) ? 'Yes' : 'Partial';
  if (fieldKey === 'influencers_named') return randomBool(0.5) ? 'Yes' : 'No';
  if (fieldKey === 'procurement_requirements') return randomChoice(['RFP required', 'Standard terms only', 'Custom agreement', 'None']);
  if (fieldKey === 'contract_length_preferred') return `${randomInt(1, 3)} years`;
  if (fieldKey === 'timeline_stated') return `${randomInt(2, 12)} weeks to decision`;
  if (fieldKey === 'urgency_level') return randomChoice(['High', 'Medium', 'Low']);
  if (fieldKey === 'key_objections') return randomChoice(['Price concerns', 'Integration complexity', 'Change management', 'Competitor preference']);
  if (fieldKey === 'competitor_alternatives') return `${randomChoice(['Competitor A', 'Competitor B', 'Custom solution'])} under consideration`;

  // Engagement history
  if (fieldKey === 'first_contact_date') {
    const daysBack = randomInt(30, 365);
    const d = daysAgo(daysBack);
    return d.toISOString().split('T')[0];
  }
  if (fieldKey === 'last_contact_date') {
    const daysBack = randomInt(0, 30);
    const d = daysAgo(daysBack);
    return d.toISOString().split('T')[0];
  }
  if (fieldKey === 'days_since_last_contact') return String(randomInt(0, 30));
  if (fieldKey === 'total_touches') return String(randomInt(2, 20));
  if (fieldKey === 'calls_count') return String(randomInt(1, 8));
  if (fieldKey === 'emails_count') return String(randomInt(2, 15));
  if (fieldKey === 'meetings_count') return String(randomInt(0, 4));
  if (fieldKey === 'engagement_velocity') return randomChoice(['Increasing', 'Stable', 'Declining']);

  // Account health
  if (fieldKey === 'fit_score') return String(randomInt(40, 95));
  if (fieldKey === 'fit_confidence') return `${randomInt(30, 90)}%`;
  if (fieldKey === 'risk_factors') return randomChoice(['None identified', 'Budget risk', 'Competing priorities', 'Vendor locked']);
  if (fieldKey === 'expansion_potential') return `${randomInt(50, 300)}%`;
  if (fieldKey === 'champion_strength') return randomChoice(['Strong', 'Moderate', 'Weak', 'TBD']);
  if (fieldKey === 'detractor_present') return randomBool(0.3) ? 'Yes' : 'No';
  if (fieldKey === 'renewal_date') {
    const daysOut = randomInt(90, 365);
    const d = new Date(now);
    d.setDate(d.getDate() + daysOut);
    return d.toISOString().split('T')[0];
  }
  if (fieldKey === 'health_trajectory') return randomChoice(['Positive', 'Stable', 'Caution', 'At risk']);
  if (fieldKey === 'strategic_priority') return randomChoice(['Strategic', 'Core', 'Transactional']);
  if (fieldKey === 'account_notes') return `Account shows strong potential in ${randomChoice(['expansion', 'retention', 'upsell'])}`;

  // Predictive
  if (fieldKey === 'conversion_probability') return `${randomInt(30, 95)}%`;
  if (fieldKey === 'mrr_potential') return `$${randomInt(100, 5000)}`;
  if (fieldKey === 'best_next_action') return randomChoice(['Schedule demo', 'Send proposal', 'Technical deep-dive', 'Budget confirmation']);
  if (fieldKey === 'time_to_close_estimate') return `${randomInt(2, 16)} weeks`;
  if (fieldKey === 'lookalike_accounts') return `${randomInt(1, 5)} similar accounts identified`;

  return 'N/A';
}

// ============================================================================
// CALL TRANSCRIPT & SCORING
// ============================================================================

function generateCallTranscript(callType: string, durationSeconds: number, repName: string = 'Pablo Martin', contactName: string = 'Prospect'): string {
  const contactFirstName = contactName.split(' ')[0];
  const lines: string[] = [];
  let currentTime = 0;

  // Generate realistic exchanges based on call type
  const exchanges = {
    cold_call: [
      { speaker: 0, text: `Hi, this is ${repName} with Company Mind. Do you have a quick moment?` },
      { speaker: 1, text: `Sure, what's this about?` },
      { speaker: 0, text: `We help businesses like yours streamline their sales process. I noticed you use HubSpot. Are you happy with how it's working?` },
      { speaker: 1, text: `It's okay, but our team struggles with follow-ups sometimes.` },
      { speaker: 0, text: `That's exactly what we solve. Many teams using HubSpot are missing automated follow-up triggers. Would it make sense to chat for 15 minutes?` },
      { speaker: 1, text: `Maybe, can you send me something about it?` },
      { speaker: 0, text: `Absolutely, I'll send over a quick overview. Can I grab your email?` },
    ],
    qualification: [
      { speaker: 0, text: `Thanks for jumping on the call ${contactFirstName}. Can you walk me through your current sales process?` },
      { speaker: 1, text: `Sure, we have leads coming from multiple channels and struggle to track them all.` },
      { speaker: 0, text: `How many reps do you have on the team?` },
      { speaker: 1, text: `We have 3 full-time and 2 part-time.` },
      { speaker: 0, text: `And what's your monthly lead volume?` },
      { speaker: 1, text: `Probably around 50 to 80 depending on the month.` },
      { speaker: 0, text: `Okay, and are those leads assigned automatically or manually?` },
      { speaker: 1, text: `Mostly manual, which takes a lot of time.` },
      { speaker: 0, text: `Got it. We could automate that. What does your ideal process look like?` },
    ],
    closing: [
      { speaker: 0, text: `Let me review the proposal we discussed ${contactFirstName}. You liked the three-month onboarding timeline, correct?` },
      { speaker: 1, text: `Yes, that works with our schedule.` },
      { speaker: 0, text: `And the pricing model with the setup fee and monthly recurring revenue?` },
      { speaker: 1, text: `That makes sense for us. Can you confirm the feature set one more time?` },
      { speaker: 0, text: `Absolutely. You get automated lead routing, call recording, transcription, and monthly coaching. Any questions?` },
      { speaker: 1, text: `No, I think we are ready to move forward.` },
      { speaker: 0, text: `Excellent! I will get the paperwork over to you today. Should I send to you or accounting?` },
      { speaker: 1, text: `To me is fine. I can handle it.` },
    ],
    onboarding: [
      { speaker: 0, text: `Welcome ${contactFirstName}! This is your first onboarding call. How are you feeling about the implementation?` },
      { speaker: 1, text: `Good, ready to get started.` },
      { speaker: 0, text: `Great. Today we will set up your CRM integrations. Do you have your HubSpot API key?` },
      { speaker: 1, text: `Yes, let me pull that up.` },
      { speaker: 0, text: `Perfect. We will also configure your call recording. Any concerns there?` },
      { speaker: 1, text: `None at all.` },
      { speaker: 0, text: `Next week we will do the training session with your team. Does Tuesday at 2 PM work?` },
      { speaker: 1, text: `Yes, that should be fine.` },
    ],
  };

  const exchangeList = exchanges[callType as keyof typeof exchanges] || exchanges.qualification;
  let exchangeIndex = 0;

  while (currentTime < durationSeconds && exchangeIndex < exchangeList.length) {
    const exchange = exchangeList[exchangeIndex];
    const speakerName = exchange.speaker === 0 ? repName : contactName;
    const timeStr = formatCallTime(currentTime);
    lines.push(`[${timeStr}] ${speakerName}: ${exchange.text}`);
    currentTime += randomInt(20, 80);
    exchangeIndex++;
  }

  return lines.join('\n');
}

function formatCallTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function generateCallScore(callType: string): object {
  const baseScores: Record<string, number> = {
    closing: 8.5,
    qualification: 8.0,
    onboarding: 8.0,
    cold_call: 6.5,
    follow_up: 7.5,
  };

  const baseScore = baseScores[callType as keyof typeof baseScores] || 7.5;
  const variance = (Math.random() - 0.5) * 3; // -1.5 to +1.5
  const baseScoreNormalized = Math.max(5.0, Math.min(10.0, baseScore + variance));

  const criteria = [
    {
      name: 'Discovery',
      score: parseFloat((Math.max(5.0, Math.min(10.0, baseScoreNormalized + (Math.random() - 0.5) * 2))).toFixed(1)),
      weight: 25
    },
    {
      name: 'Pain identification',
      score: parseFloat((Math.max(5.0, Math.min(10.0, baseScoreNormalized + (Math.random() - 0.5) * 2))).toFixed(1)),
      weight: 25
    },
    {
      name: 'Next step clarity',
      score: parseFloat((Math.max(5.0, Math.min(10.0, baseScoreNormalized + (Math.random() - 0.5) * 2))).toFixed(1)),
      weight: 25
    },
    {
      name: 'Objection handling',
      score: parseFloat((Math.max(5.0, Math.min(10.0, baseScoreNormalized + (Math.random() - 0.5) * 2))).toFixed(1)),
      weight: 25
    },
  ];

  // Calculate overall as weighted average of criteria scores, then convert to 0-100 scale
  const weightedSum = criteria.reduce((sum, c) => sum + c.score * c.weight, 0);
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const averageScore = weightedSum / totalWeight; // 5.0-10.0
  const overall = Math.round(averageScore * 10); // Convert to 0-100 scale

  return { overall, criteria };
}

function generateCoaching(callType: string): object {
  const strengthMap: Record<string, string[]> = {
    closing: [
      'Clear value summary',
      'Strong close attempt',
      'Good timeline management',
    ],
    qualification: [
      'Good discovery questions',
      'Identified pain points',
      'Took detailed notes',
    ],
    cold_call: [
      'Built rapport quickly',
      'Clear hook',
    ],
    onboarding: [
      'Well-paced walkthrough',
      'Checked for understanding',
    ],
  };

  const improvementMap: Record<string, Array<{ area: string; current: string; suggested: string; example_script: string }>> = {
    closing: [
      {
        area: 'Handle pricing objections',
        current: 'Moved to pricing without confirming value alignment',
        suggested: 'Confirm value before discussing price',
        example_script: '"Before we talk pricing, let me make sure we\'re aligned on how this solves your problem..."'
      },
      {
        area: 'Timeline pressure',
        current: 'Pushed for decision without allowing thinking time',
        suggested: 'Give time to decide, but set a deadline',
        example_script: '"Take 24 hours to think it over. Can we connect tomorrow at 3 PM?"'
      },
    ],
    qualification: [
      {
        area: 'Budget qualification',
        current: 'Avoided budget discussion early in the call',
        suggested: 'Ask earlier in the call',
        example_script: '"Just so we\'re on the same page — what budget range were you thinking?"'
      },
      {
        area: 'Next steps clarity',
        current: 'Ended with vague follow-up plan',
        suggested: 'End with concrete follow-up date',
        example_script: '"Let\'s schedule a callback for Thursday at 2 PM. Does that work?"'
      },
    ],
    cold_call: [
      {
        area: 'Discovery depth',
        current: 'Pitched solution too early without understanding their situation',
        suggested: 'Dig deeper into their situation before pitching',
        example_script: '"Tell me more about that challenge. How long has it been an issue?"'
      },
      {
        area: 'Silence comfort',
        current: 'Filled silence instead of letting them respond',
        suggested: 'Pause longer to let them respond',
        example_script: '[Ask question and pause for 3-5 seconds before speaking again]'
      },
    ],
    onboarding: [
      {
        area: 'Expectation setting',
        current: 'Rushed through process without confirming milestones',
        suggested: 'Confirm deliverables and timeline',
        example_script: '"By end of this call, we\'ll have X set up. Next week we\'ll do Y. Sound good?"'
      },
    ],
  };

  const redFlagsMap: Record<string, string[]> = {
    closing: [
      'Missed opportunity to address pricing objection',
      'Did not confirm next steps timeline',
      'Failed to get decision commitment',
    ],
    qualification: [
      'Did not qualify budget early enough',
      'Missed key pain point indicators',
      'No clear next steps established',
    ],
    cold_call: [
      'Pitched too early without discovery',
      'Did not ask probing follow-up questions',
      'Prospect disengaged during call',
    ],
    onboarding: [
      'Did not set clear expectations',
      'Moved too quickly through content',
      'Did not confirm understanding',
    ],
  };

  const strengths = strengthMap[callType as keyof typeof strengthMap] || ['Professional tone', 'Active listening'];
  const improvements = improvementMap[callType as keyof typeof improvementMap] || [
    {
      area: 'Overall',
      current: 'Call was completed professionally',
      suggested: 'Continue focusing on strong listening skills',
      example_script: 'Good effort on this call'
    },
  ];
  const redFlags = redFlagsMap[callType as keyof typeof redFlagsMap] || [];

  let summary = `${callType.charAt(0).toUpperCase() + callType.slice(1)} call demonstrated `;
  summary += strengths.length > 1 ? `${strengths[0]} and ${strengths[1]}. ` : `${strengths[0]}. `;
  summary += improvements.length > 0 ? `Focus on ${improvements[0].area.toLowerCase()} next time.` : '';

  return {
    strengths,
    improvements,
    summary,
    red_flags: redFlags,
  };
}

// ============================================================================
// WIPE TABLES (FK-safe order)
// ============================================================================

async function wipeTables() {
  console.log('Wiping existing data...');

  const tables = [
    'inbox_messages',
    'inbox_conversations',
    'appointments',
    'activity_feed',
    'data_points',
    'call_actions',
    'calls',
    'tasks',
    'research',
    'stage_log',
    'pipeline_companies',
    'company_contacts',
    'companies',
  ];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().eq('tenant_id', TENANT_ID);
    if (error) {
      console.error(`Error wiping ${table}:`, error);
    } else {
      console.log(`✓ Wiped ${table}`);
    }
  }
}

// ============================================================================
// SEED COMPANIES
// ============================================================================

async function seedCompanies() {
  console.log('Seeding 16 companies...');

  const companyRecords = companies.map((c) => ({
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    name: c.name,
    industry: c.industry,
    lead_source: c.lead_source,
    mrr: c.mrr,
    setup_fee: c.setup_fee,
    website: c.website,
    location: c.location,
    term_length: c.term_length,
  }));

  const { data, error } = await supabaseAdmin.from('companies').insert(companyRecords).select();

  if (error) {
    console.error('Error seeding companies:', error);
    throw error;
  }

  console.log(`✓ Seeded ${data?.length || 0} companies`);
  return data || [];
}

// ============================================================================
// SEED CONTACTS
// ============================================================================

async function seedContacts(companiesData: any[]) {
  console.log('Seeding 22 contacts...');

  const contactRecords = contactsData.map((c) => {
    const company = companiesData[c.companyIndex];
    const slug = generateSlug(c.name);
    return {
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      company_id: company.id,
      contact_id: `demo-${generateSlug(company.name)}-${contactsData.filter((x) => x.companyIndex === c.companyIndex).indexOf(c) + 1}`,
      is_primary: c.isPrimary,
      role: c.role,
      contact_name: c.name,
      contact_email: c.email,
      contact_phone: c.phone,
      added_at: daysAgo(randomInt(5, 60)).toISOString(),
    };
  });

  const { data, error } = await supabaseAdmin.from('company_contacts').insert(contactRecords).select();

  if (error) {
    console.error('Error seeding contacts:', error);
    throw error;
  }

  console.log(`✓ Seeded ${data?.length || 0} contacts`);
  return contactRecords;
}

// ============================================================================
// FETCH PIPELINES
// ============================================================================

async function fetchPipelines() {
  console.log('Fetching pipelines...');

  const { data, error } = await supabaseAdmin
    .from('pipelines')
    .select('id, name')
    .eq('tenant_id', TENANT_ID);

  if (error || !data) {
    console.error('Error fetching pipelines:', error);
    throw error;
  }

  const pipelineMap: Record<string, string> = {};
  for (const p of data) {
    pipelineMap[p.name] = p.id;
  }

  console.log(`✓ Found ${data.length} pipelines`);
  return pipelineMap;
}

// ============================================================================
// SEED STAGE LOG & PIPELINE COMPANIES
// ============================================================================

async function seedPipelineAssignments(companiesData: any[], pipelineMap: Record<string, string>) {
  console.log('Seeding pipeline assignments and stage logs...');

  const assignments = [
    // Sales: 1,2→New Lead; 3,4→Qualification; 5,6→Closing; 7,8,9,10,11→Closed
    { companyIndex: 0, pipeline: 'Sales Pipeline', stage: 'New Lead' },
    { companyIndex: 1, pipeline: 'Sales Pipeline', stage: 'New Lead' },
    { companyIndex: 2, pipeline: 'Sales Pipeline', stage: 'Qualification' },
    { companyIndex: 3, pipeline: 'Sales Pipeline', stage: 'Qualification' },
    { companyIndex: 4, pipeline: 'Sales Pipeline', stage: 'Closing' },
    { companyIndex: 5, pipeline: 'Sales Pipeline', stage: 'Closing' },
    { companyIndex: 6, pipeline: 'Sales Pipeline', stage: 'Closed' },
    { companyIndex: 7, pipeline: 'Sales Pipeline', stage: 'Closed' },
    { companyIndex: 8, pipeline: 'Sales Pipeline', stage: 'Closed' },
    { companyIndex: 9, pipeline: 'Sales Pipeline', stage: 'Closed' },
    { companyIndex: 10, pipeline: 'Sales Pipeline', stage: 'Closed' },
    // Onboarding: 7→New Client; 8→Building; 9→Built; 10,11→Operating
    { companyIndex: 6, pipeline: 'Onboarding', stage: 'New Client' },
    { companyIndex: 7, pipeline: 'Onboarding', stage: 'Building' },
    { companyIndex: 8, pipeline: 'Onboarding', stage: 'Built' },
    { companyIndex: 9, pipeline: 'Onboarding', stage: 'Operating' },
    { companyIndex: 10, pipeline: 'Onboarding', stage: 'Operating' },
    // Upsell: 7,8→Tier 1; 9,10→Tier 2; 11→Tier 3
    { companyIndex: 6, pipeline: 'Upsell', stage: 'Tier 1' },
    { companyIndex: 7, pipeline: 'Upsell', stage: 'Tier 1' },
    { companyIndex: 8, pipeline: 'Upsell', stage: 'Tier 2' },
    { companyIndex: 9, pipeline: 'Upsell', stage: 'Tier 2' },
    { companyIndex: 10, pipeline: 'Upsell', stage: 'Tier 3' },
    // Follow Up: 12,13,14→Nurture; 15,16→Dead
    { companyIndex: 11, pipeline: 'Follow Up', stage: 'Nurture' },
    { companyIndex: 12, pipeline: 'Follow Up', stage: 'Nurture' },
    { companyIndex: 13, pipeline: 'Follow Up', stage: 'Nurture' },
    { companyIndex: 14, pipeline: 'Follow Up', stage: 'Dead' },
    { companyIndex: 15, pipeline: 'Follow Up', stage: 'Dead' },
  ];

  const pipelineCompaniesRecords: any[] = [];
  const stageLogRecords: any[] = [];
  const stageSequence: Record<string, string[]> = {
    'Sales Pipeline': ['New Lead', 'Qualification', 'Closing', 'Closed'],
    'Onboarding': ['New Client', 'Building', 'Built', 'Operating'],
    'Upsell': ['Tier 1', 'Tier 2', 'Tier 3'],
    'Follow Up': ['Nurture', 'Dead'],
  };

  for (const assignment of assignments) {
    const company = companiesData[assignment.companyIndex];
    const pipelineId = pipelineMap[assignment.pipeline];

    if (!pipelineId) {
      console.warn(`Pipeline ${assignment.pipeline} not found, skipping`);
      continue;
    }

    // Create pipeline_companies entry
    const pcId = crypto.randomUUID();
    const currentStageIndex = stageSequence[assignment.pipeline].indexOf(assignment.stage);
    const stageEnteredDate = daysAgo(currentStageIndex > 0 ? (currentStageIndex + 1) * 8 : 30);

    pipelineCompaniesRecords.push({
      id: pcId,
      tenant_id: TENANT_ID,
      company_id: company.id,
      contact_id: `demo-${generateSlug(company.name)}-1`,
      pipeline_id: pipelineId,
      stage: assignment.stage,
      deal_value: assignment.stage === 'Closed' ? `$${randomInt(10000, 100000)}` : null,
      stage_entered_at: stageEnteredDate.toISOString(),
    });

    // Create stage_log entries for all stages up to current
    const stageSeq = stageSequence[assignment.pipeline];
    for (let i = 0; i <= currentStageIndex; i++) {
      const stageValue = stageSeq[i];

      // SPECIAL: Thompson HVAC (companyIndex 6), Sales pipeline - SKIP Qualification stage_log
      if (
        assignment.companyIndex === 6 &&
        assignment.pipeline === 'Sales Pipeline' &&
        stageValue === 'Qualification'
      ) {
        continue;
      }

      const enteredDate = daysAgo(Math.max(1, (stageSeq.length - i) * 8 - randomInt(1, 5)));

      stageLogRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        company_id: company.id,
        contact_id: `demo-${generateSlug(company.name)}-1`,
        pipeline_id: pipelineId,
        stage: stageValue,
        entered_at: enteredDate.toISOString(),
        moved_by: randomChoice(['Pablo Martin', 'Corey Lavinder']),
        source: 'manual',
        note: `Moved to ${stageValue} based on conversation progress`,
        entry_number: i + 1,
      });
    }
  }

  // Historical Sales pipeline stage_log for Follow Up companies (12-16, indices 11-15)
  // These companies went through Sales stages before landing in Follow Up
  const salesPipelineId = pipelineMap['Sales Pipeline'];
  if (salesPipelineId) {
    const followUpHistories: Array<{ companyIndex: number; stages: string[] }> = [
      { companyIndex: 11, stages: ['New Lead', 'Qualification'] }, // Quick Lube: NL→Qual→dropped→Nurture
      { companyIndex: 12, stages: ['New Lead', 'Qualification', 'Closing'] }, // Allstate: NL→Qual→Closing→Nurture
      { companyIndex: 13, stages: ['New Lead', 'Qualification'] }, // Sunrise: NL→Qual→Nurture
      { companyIndex: 14, stages: ['New Lead', 'Qualification', 'Closing'] }, // Iron Mountain: NL→Qual→Closing→Dead
      { companyIndex: 15, stages: ['New Lead', 'Qualification'] }, // Velocity: NL→Qual→Dead
    ];

    for (const hist of followUpHistories) {
      const company = companiesData[hist.companyIndex];
      for (let i = 0; i < hist.stages.length; i++) {
        stageLogRecords.push({
          id: crypto.randomUUID(),
          tenant_id: TENANT_ID,
          company_id: company.id,
          contact_id: `demo-${generateSlug(company.name)}-1`,
          pipeline_id: salesPipelineId,
          stage: hist.stages[i],
          entered_at: daysAgo(60 - i * 10).toISOString(), // older history
          moved_by: randomChoice(['Pablo Martin', 'Corey Lavinder']),
          source: 'manual',
          note: `Historical: ${hist.stages[i]} before moving to Follow Up`,
          entry_number: i + 1,
        });
      }
    }
  }

  // Insert pipeline_companies
  if (pipelineCompaniesRecords.length > 0) {
    const { error: pcError } = await supabaseAdmin
      .from('pipeline_companies')
      .insert(pipelineCompaniesRecords);

    if (pcError) {
      console.error('Error seeding pipeline_companies:', pcError);
      throw pcError;
    }
    console.log(`✓ Seeded ${pipelineCompaniesRecords.length} pipeline assignments`);
  }

  // Insert stage_log
  if (stageLogRecords.length > 0) {
    const { error: slError } = await supabaseAdmin.from('stage_log').insert(stageLogRecords);

    if (slError) {
      console.error('Error seeding stage_log:', slError);
      throw slError;
    }
    console.log(`✓ Seeded ${stageLogRecords.length} stage log entries`);
  }
}

// ============================================================================
// SEED RESEARCH
// ============================================================================

// Contact research catalog (67 fields)
const contactCatalog: Record<string, string[]> = {
  contact_identity: ['full_name','preferred_name','title','department','tenure_at_company','previous_company','previous_role','education','certifications','linkedin_url'],
  role_authority: ['formal_authority_level','budget_authority','veto_power','sphere_of_influence','reports_to','direct_reports_count','cross_functional_role','committee_memberships','strategic_initiatives','promotion_trajectory'],
  communication_profile: ['preferred_channel','best_time_to_reach','response_speed','communication_style','meeting_preference','follow_up_frequency','email_tone','voicemail_preference','timezone','assistant_name','assistant_email','out_of_office_pattern'],
  relationship: ['rapport_level','trust_score','ally_or_blocker','shared_connections','referral_potential','nps_likely','last_positive_interaction','last_negative_interaction','gift_history','relationship_notes'],
  personal_context: ['hometown','hobbies','family_context','sports_teams','alma_mater','volunteer_work','pet_owner','travel_preferences','dietary_preferences','birthday','anniversary','favorite_restaurant'],
  triggers_signals: ['recent_linkedin_activity','job_change_signal','company_news_mention','conference_attendance','content_engagement','technology_adoption','budget_cycle_timing','pain_signal'],
  contact_predictive: ['engagement_score','conversion_influence','churn_risk','expansion_champion_score','next_best_touchpoint'],
};

async function seedResearch(companiesData: any[]) {
  console.log('Seeding research entries...');

  // Company field counts per spec: sum ~1,100 company + ~335 contact = ~1,435
  const fieldCounts = [8, 8, 30, 25, 75, 80, 92, 92, 92, 92, 92, 50, 55, 45, 75, 70];

  // All companies get contact research now
  // Closed companies (indices 6-10): all 67 contact fields
  // Others: 20-40 contact fields based on stage
  const contactFieldCounts: Record<number, number> = {
    0: 25, 1: 25, 2: 35, 3: 30, 4: 40, 5: 40,
    6: 67, 7: 67, 8: 67, 9: 67, 10: 67, // Closed companies get all fields
    11: 20, 12: 25, 13: 30, 14: 20, 15: 25,
  };

  const researchRecords: any[] = [];

  // Company-scope research
  for (let compIdx = 0; compIdx < companiesData.length; compIdx++) {
    const company = companiesData[compIdx];
    const fieldCount = fieldCounts[compIdx] || 50;

    const allFields: Array<{ section: string; key: string }> = [];
    for (const [section, fields] of Object.entries(researchCatalog)) {
      for (const key of fields) {
        allFields.push({ section, key });
      }
    }

    const fieldsToUse = allFields.slice(0, fieldCount);

    for (let i = 0; i < fieldsToUse.length; i++) {
      const { section, key } = fieldsToUse[i];
      const sourceOptions = ['api', 'ai', 'manual'];
      const source = sourceOptions[i % 3];
      const confidence = i % 2 === 0 ? 0.95 : 0.85;

      researchRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        company_id: company.id,
        contact_id: null,
        scope: 'company',
        section,
        field_name: key,
        field_value: generateResearchValue(company.name, company.industry, company.location, key),
        source,
        confidence,
        source_detail: source === 'api' ? 'GHL API' : source === 'ai' ? 'Claude analysis' : 'Manual entry',
        source_call_id: null,
        last_verified_at: daysAgo(randomInt(1, 30)).toISOString(),
        locked: false,
      });
    }
  }

  // Contact-scope research for ALL companies
  for (let compIdx = 0; compIdx < companiesData.length; compIdx++) {
    const company = companiesData[compIdx];
    const primaryContact = contactsData.find(c => c.companyIndex === compIdx && c.isPrimary);
    if (!primaryContact) continue;

    const contactGhlId = `demo-${generateSlug(company.name)}-1`;
    const allContactFields: Array<{ section: string; key: string }> = [];
    for (const [section, fields] of Object.entries(contactCatalog)) {
      for (const key of fields) {
        allContactFields.push({ section, key });
      }
    }

    const fieldCount = contactFieldCounts[compIdx] || 30;
    const fieldsToUse = allContactFields.slice(0, fieldCount);

    for (let i = 0; i < fieldsToUse.length; i++) {
      const { section, key } = fieldsToUse[i];
      const sourceOptions = ['api', 'ai', 'manual'];
      const source = sourceOptions[i % 3];

      researchRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        company_id: null,
        contact_id: contactGhlId,
        scope: 'contact',
        section,
        field_name: key,
        field_value: generateContactResearchValue(primaryContact.name, primaryContact.role, key),
        source,
        confidence: i % 2 === 0 ? 0.9 : 0.8,
        source_detail: source === 'api' ? 'GHL API' : source === 'ai' ? 'Claude analysis' : 'Manual entry',
        source_call_id: null,
        last_verified_at: daysAgo(randomInt(1, 14)).toISOString(),
        locked: false,
      });
    }
  }

  // Batch insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < researchRecords.length; i += chunkSize) {
    const chunk = researchRecords.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from('research').insert(chunk);
    if (error) {
      console.error('Error seeding research:', error);
      throw error;
    }
  }

  console.log(`✓ Seeded ${researchRecords.length} research entries (company + contact)`);
}

function generateContactResearchValue(contactName: string, role: string, fieldKey: string): string {
  const firstName = contactName.split(' ')[0];
  const defaults: Record<string, string> = {
    full_name: contactName,
    preferred_name: firstName,
    title: role === 'decision_maker' ? 'Owner / CEO' : role === 'champion' ? 'VP Operations' : 'Manager',
    department: role === 'decision_maker' ? 'Executive' : 'Operations',
    tenure_at_company: `${randomInt(2, 15)} years`,
    previous_company: 'Previously at regional competitor',
    previous_role: 'Operations Manager',
    education: 'BS Business Administration',
    certifications: 'Industry certified',
    linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}`,
    formal_authority_level: role === 'decision_maker' ? 'Final decision maker' : 'Recommender',
    budget_authority: role === 'decision_maker' ? 'Full budget authority up to $50k' : 'Can recommend, needs approval',
    veto_power: role === 'decision_maker' ? 'Yes' : 'No',
    sphere_of_influence: 'Sales team, operations, customer service',
    reports_to: role === 'decision_maker' ? 'Board / Self' : 'CEO',
    direct_reports_count: `${randomInt(2, 12)}`,
    cross_functional_role: 'Works across sales, marketing, and ops',
    committee_memberships: 'Local business association',
    strategic_initiatives: 'Digital transformation, growth expansion',
    promotion_trajectory: 'Stable in current role',
    preferred_channel: randomChoice(['Phone', 'SMS', 'Email']),
    best_time_to_reach: `${randomChoice(['9-11 AM', '1-3 PM', '4-6 PM'])} ${randomChoice(['Mon-Fri', 'Tue-Thu'])}`,
    response_speed: randomChoice(['Same day', 'Within 24h', 'Within 48h']),
    communication_style: randomChoice(['Direct and concise', 'Detail-oriented', 'Relationship-first']),
    meeting_preference: randomChoice(['Video call', 'Phone', 'In-person']),
    follow_up_frequency: randomChoice(['Weekly', 'Bi-weekly', 'Monthly']),
    email_tone: randomChoice(['Professional', 'Casual professional', 'Formal']),
    voicemail_preference: 'Leave voicemail with callback number',
    timezone: 'Central',
    assistant_name: 'N/A',
    assistant_email: 'N/A',
    out_of_office_pattern: 'Typically unavailable weekends',
    rapport_level: randomChoice(['Strong', 'Good', 'Building']),
    trust_score: `${randomInt(6, 10)}/10`,
    ally_or_blocker: 'Ally',
    shared_connections: `${randomInt(0, 3)} mutual connections`,
    referral_potential: randomChoice(['High', 'Medium', 'Low']),
    nps_likely: `${randomInt(7, 10)}`,
    last_positive_interaction: 'Agreed to proposal terms',
    last_negative_interaction: 'N/A',
    gift_history: 'None',
    relationship_notes: `${firstName} is responsive and engaged. Values transparency.`,
    hometown: randomChoice(['Nashville', 'Atlanta', 'San Francisco', 'Charlotte', 'Salt Lake City']),
    hobbies: randomChoice(['Golf', 'Fishing', 'Running', 'BBQ', 'Coaching youth sports']),
    family_context: randomChoice(['Married, 2 kids', 'Married, no kids', 'Single']),
    sports_teams: randomChoice(['Titans', 'Falcons', '49ers', 'Panthers', 'Jazz']),
    alma_mater: randomChoice(['State University', 'Local Community College', 'Private University']),
    volunteer_work: randomChoice(['Chamber of Commerce', 'Rotary Club', 'Youth mentor', 'None']),
    pet_owner: randomChoice(['Dog', 'Cat', 'None']),
    travel_preferences: 'Domestic travel for conferences',
    dietary_preferences: 'No restrictions',
    birthday: 'Unknown',
    anniversary: 'Unknown',
    favorite_restaurant: 'Local steakhouse',
    recent_linkedin_activity: 'Posted about business growth last week',
    job_change_signal: 'None — stable',
    company_news_mention: 'Featured in local business journal',
    conference_attendance: 'Attended industry trade show Q1',
    content_engagement: 'Opened last 3 emails, clicked CTA',
    technology_adoption: randomChoice(['Early adopter', 'Pragmatist', 'Late majority']),
    budget_cycle_timing: randomChoice(['Q4 planning', 'Annual review in Jan', 'Rolling budget']),
    pain_signal: 'Mentioned frustration with current tools',
    engagement_score: `${randomInt(60, 95)}/100`,
    conversion_influence: randomChoice(['High', 'Medium', 'Critical']),
    churn_risk: randomChoice(['Low', 'Medium']),
    expansion_champion_score: `${randomInt(65, 95)}/100`,
    next_best_touchpoint: randomChoice(['Schedule check-in call', 'Send ROI case study', 'Invite to webinar']),
  };
  return defaults[fieldKey] ?? `${firstName} — ${fieldKey.replace(/_/g, ' ')}`;
}

// ============================================================================
// CALL SPECS (shared between seedCalls and seedCallActions)
// ============================================================================

const callSpecs = [
    // Thompson HVAC (index 6) - 4 calls
    { companyIndex: 6, type: 'cold_call', durationSeconds: 580, score: 72, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 22 },
    { companyIndex: 6, type: 'qualification', durationSeconds: 1340, score: 84, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 9 },
    { companyIndex: 6, type: 'closing', durationSeconds: 1820, score: 91, outcome: 'closed_won', rep: 'Pablo Martin', daysAgo: 6 },
    { companyIndex: 6, type: 'onboarding', durationSeconds: 1450, score: 88, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 2 },

    // GreenLeaf Lawn Care (index 7) - 3 calls
    { companyIndex: 7, type: 'cold_call', durationSeconds: 650, score: 74, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 20 },
    { companyIndex: 7, type: 'qualification', durationSeconds: 1520, score: 85, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 12 },
    { companyIndex: 7, type: 'closing', durationSeconds: 1680, score: 90, outcome: 'closed_won', rep: 'Corey Lavinder', daysAgo: 3 },

    // Chen Solutions (index 8) - 4 calls
    { companyIndex: 8, type: 'cold_call', durationSeconds: 720, score: 75, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 25 },
    { companyIndex: 8, type: 'qualification', durationSeconds: 1680, score: 87, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 15 },
    { companyIndex: 8, type: 'closing', durationSeconds: 2150, score: 88, outcome: 'closed_won', rep: 'Corey Lavinder', daysAgo: 10 },
    { companyIndex: 8, type: 'onboarding', durationSeconds: 1750, score: 86, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 1 },

    // Precision Dental Care (index 9) - 3 calls
    { companyIndex: 9, type: 'qualification', durationSeconds: 1420, score: 81, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 21 },
    { companyIndex: 9, type: 'closing', durationSeconds: 1920, score: 93, outcome: 'closed_won', rep: 'Corey Lavinder', daysAgo: 14 },
    { companyIndex: 9, type: 'onboarding', durationSeconds: 1580, score: 85, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 5 },

    // Summit Roofing & Restoration (index 10) - 3 calls
    { companyIndex: 10, type: 'qualification', durationSeconds: 1520, score: 83, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 26 },
    { companyIndex: 10, type: 'closing', durationSeconds: 1700, score: 86, outcome: 'closed_won', rep: 'Pablo Martin', daysAgo: 18 },
    { companyIndex: 10, type: 'onboarding', durationSeconds: 1620, score: 87, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 8 },

    // Other companies - qualification and cold calls
    { companyIndex: 2, type: 'qualification', durationSeconds: 980, score: 76, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 2 },
    { companyIndex: 4, type: 'qualification', durationSeconds: 1280, score: 82, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 3 },
    { companyIndex: 5, type: 'qualification', durationSeconds: 1620, score: 78, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 5 },
    { companyIndex: 3, type: 'cold_call', durationSeconds: 760, score: 68, outcome: 'follow_up_scheduled', rep: 'Pablo Martin', daysAgo: 7 },
    { companyIndex: 0, type: 'cold_call', durationSeconds: 540, score: 65, outcome: 'follow_up_scheduled', rep: 'Corey Lavinder', daysAgo: 1 },

    // Skipped/no-score calls
    { companyIndex: 11, type: 'qualification', durationSeconds: 80, score: null, outcome: 'no_answer', rep: 'Pablo Martin', daysAgo: 22 },
    { companyIndex: 14, type: 'closing', durationSeconds: 75, score: null, outcome: 'not_interested', rep: 'Corey Lavinder', daysAgo: 28 },
    { companyIndex: 1, type: 'cold_call', durationSeconds: 45, score: null, outcome: 'no_answer', rep: 'Pablo Martin', daysAgo: 2, skipped: true },
    { companyIndex: 12, type: 'follow_up', durationSeconds: 38, score: null, outcome: 'voicemail', rep: 'Corey Lavinder', daysAgo: 12, skipped: true },
  ];

// ============================================================================
// SEED CALLS
// ============================================================================

async function seedCalls(companiesData: any[]) {
  console.log('Seeding calls...');

  const callRecords: any[] = [];
  const callIds: string[] = [];

  for (const spec of callSpecs) {
    const company = companiesData[spec.companyIndex];
    const contact = contactsData.find((c) => c.companyIndex === spec.companyIndex && c.isPrimary);
    const callId = crypto.randomUUID();
    callIds.push(callId);

    const isSkipped = spec.durationSeconds < 60;

    let transcript = '';
    let summary = '';
    let score: any = null;
    let coaching: any = null;

    if (!isSkipped) {
      transcript = generateCallTranscript(spec.type, spec.durationSeconds, spec.rep, contact?.name || 'Prospect');
      if (spec.score !== null) {
        score = generateCallScore(spec.type);
        coaching = generateCoaching(spec.type);
      } else {
        // 60-90s calls: summary only
        summary = `Brief ${spec.type} call with ${contact?.name || 'prospect'}. Discussed brief overview of pain points. ${spec.outcome === 'no_answer' ? 'No answer.' : 'Not interested at this time.'}`;
      }
    }

    const callDateTime = daysAgo(spec.daysAgo);
    callRecords.push({
      id: callId,
      tenant_id: TENANT_ID,
      contact_ghl_id: `demo-${generateSlug(company.name)}-1`,
      contact_name: contact?.name || 'Unknown Contact',
      source: 'ghl',
      source_id: `ghl-call-${spec.companyIndex}-${callSpecs.indexOf(spec)}`,
      call_type: spec.type,
      duration_seconds: spec.durationSeconds,
      direction: 'outbound',
      status: isSkipped ? 'skipped' : 'complete',
      processing_status: isSkipped ? 'skipped' : 'complete',
      transcript_text: transcript || null,
      score: score,
      coaching: coaching,
      call_summary: summary || null,
      called_at: callDateTime.toISOString(),
      created_at: callDateTime.toISOString(),
      archived: false,
      outcome: spec.outcome,
      speaker_map: { A: 'rep', B: 'prospect' },
    });
  }

  const { error } = await supabaseAdmin.from('calls').insert(callRecords);

  if (error) {
    console.error('Error seeding calls:', error);
    throw error;
  }

  console.log(`✓ Seeded ${callRecords.length} calls`);
  return callIds;
}

// ============================================================================
// SEED CALL ACTIONS (~30 total)
// ============================================================================

async function seedCallActions(callIds: string[]) {
  console.log('Seeding call actions...');

  const actionTypes = ['send_proposal', 'schedule_followup', 'send_email', 'create_task'];
  const actionRecords: any[] = [];

  const companyNames = [
    'Mountain Roofing Co',
    'Coastal Insurance Group',
    'Bright Smile Dental',
    'Apex Auto Detailing',
    'Northstar HVAC Services',
    'Riverside Legal LLP',
    'Thompson HVAC',
    'GreenLeaf Lawn Care',
    'Chen Solutions',
    'Precision Dental Care',
    'Summit Roofing & Restoration',
  ];

  // Only for graded calls (where score !== null)
  let gradedCallIndex = 0;
  for (let i = 0; i < callIds.length; i++) {
    const spec = callSpecs[i];
    if (spec?.score === null) continue; // Skip non-graded calls

    const companyIndex = spec?.companyIndex || i;
    const companyName = companyNames[companyIndex] || `Company ${i + 1}`;
    const numActions = randomInt(2, 4);
    for (let j = 0; j < numActions; j++) {
      const actionType = randomChoice(actionTypes);
      let description = '';
      let suggested_payload: any = {};

      switch (actionType) {
        case 'send_proposal':
          description = `Send proposal to ${companyName} with pricing and timeline`;
          suggested_payload = {
            subject: `Company Mind Proposal for ${companyName}`,
            body: `Dear ${companyName} team,\n\nPlease find attached our proposal with our recommended plan and pricing.\n\nBest regards`,
            recipient: 'contact@example.com',
          };
          break;
        case 'schedule_followup':
          const followupDate = new Date(now);
          followupDate.setDate(followupDate.getDate() + randomInt(3, 7));
          description = `Schedule follow-up call with ${companyName} to discuss proposal`;
          suggested_payload = {
            contact: companyName,
            date: followupDate.toISOString().split('T')[0],
            duration: 30,
            notes: 'Review proposal and address any questions',
          };
          break;
        case 'create_task':
          description = `Create task: Send proposal follow-up for ${companyName}`;
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + randomInt(1, 5));
          suggested_payload = {
            title: `Follow up on ${companyName} proposal`,
            assigned_to: randomChoice(['Pablo Martin', 'Corey Lavinder']),
            due_date: dueDate.toISOString().split('T')[0],
          };
          break;
        case 'send_email':
          description = `Send follow-up email to ${companyName} with next steps`;
          suggested_payload = {
            subject: `Following Up - ${companyName}`,
            body: `Hi there,\n\nThank you for the great conversation. I wanted to follow up on our discussion and answer any additional questions.\n\nLooking forward to working together!\n\nBest regards`,
            recipient: 'contact@example.com',
          };
          break;
      }

      actionRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        call_id: callIds[i],
        action_type: actionType,
        description,
        suggested_payload,
        status: randomBool(0.6) ? 'pending' : 'approved',
        priority: randomChoice(['high', 'medium', 'low']),
        created_at: now.toISOString(),
      });
    }
  }

  if (actionRecords.length > 0) {
    const { error } = await supabaseAdmin.from('call_actions').insert(actionRecords);
    if (error) {
      console.error('Error seeding call_actions:', error);
      throw error;
    }
    console.log(`✓ Seeded ${actionRecords.length} call actions`);
  }
}

// ============================================================================
// SEED DATA POINTS (~200-250 rows)
// ============================================================================

async function seedDataPoints(companiesData: any[], callIds: string[]) {
  console.log('Seeding data points...');

  const painAndBuyingFields = [
    ...researchCatalog.pain_opportunity,
    ...researchCatalog.buying_process,
  ];

  const dataPointRecords: any[] = [];

  // Only for graded calls (first 11)
  for (let i = 0; i < Math.min(11, callIds.length); i++) {
    const numDataPoints = randomInt(15, 25);
    for (let j = 0; j < numDataPoints; j++) {
      const fieldName = randomChoice(painAndBuyingFields);
      const fieldValue = generateResearchValue(
        companiesData[0].name,
        companiesData[0].industry,
        companiesData[0].location,
        fieldName
      );

      const statusWeights = [0.7, 0.9]; // 70% pending, 20% approved, 10% rejected
      let status = 'pending';
      const rand = Math.random();
      if (rand > statusWeights[0]) {
        status = rand > statusWeights[1] ? 'rejected' : 'approved';
      }

      dataPointRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        call_id: callIds[i],
        company_id: companiesData[i % companiesData.length].id,
        contact_id: null,
        field_name: fieldName,
        field_value: fieldValue,
        source: 'ai',
        status,
      });
    }
  }

  if (dataPointRecords.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < dataPointRecords.length; i += chunkSize) {
      const chunk = dataPointRecords.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin.from('data_points').insert(chunk);
      if (error) {
        console.error('Error seeding data_points:', error);
        throw error;
      }
    }
    console.log(`✓ Seeded ${dataPointRecords.length} data points`);
  }
}

// ============================================================================
// SEED TASKS (15 tasks)
// ============================================================================

async function seedTasks(companiesData: any[]) {
  console.log('Seeding tasks...');

  const taskTypes = ['follow_up', 'admin', 'implementation', 'onboarding'];
  const taskRecords: any[] = [];

  // Add 1-3 tasks per closed company (indices 6-10)
  const closedCompanyIndices = [6, 7, 8, 9, 10];
  for (const compIdx of closedCompanyIndices) {
    const company = companiesData[compIdx];
    const numTasks = randomInt(1, 3);
    for (let i = 0; i < numTasks; i++) {
      const taskType = randomChoice(taskTypes);
      const daysOut = randomInt(1, 14); // Future tasks for closed companies
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + daysOut);

      const contactName = contactsData.find(c => c.companyIndex === compIdx && c.isPrimary)?.name ?? 'contact';
      const closedTitles: Record<string, string[]> = {
        follow_up: [`Check in with ${contactName} on onboarding progress`, `Schedule QBR with ${contactName}`, `Follow up on feature request from ${company.name}`],
        admin: [`Update CRM notes for ${company.name}`, `Send invoice to ${company.name}`, `File contract for ${company.name}`],
        implementation: [`Configure scoring rubric for ${company.name}`, `Import historical data for ${company.name}`, `Set up custom pipeline for ${company.name}`],
        onboarding: [`Train ${contactName} on call scoring`, `Demo AI assistant to ${company.name} team`, `Verify GHL integration for ${company.name}`],
      };
      const titleOptions = closedTitles[taskType] ?? [`Task for ${company.name}`];

      taskRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        contact_id: `demo-${generateSlug(company.name)}-1`,
        pipeline_stage: 'Closed',
        task_type: taskType === 'implementation' || taskType === 'onboarding' ? 'admin' : taskType,
        title: titleOptions[i % titleOptions.length],
        description: `${company.name} — ${taskType} phase`,
        assigned_to: randomChoice(['Pablo Martin', 'Corey Lavinder']),
        due_date: dueDate.toISOString().split('T')[0],
        completed: false,
      });
    }
  }

  // Original distribution: 5 of each type for other companies
  for (let type = 0; type < 3; type++) {
    for (let i = 0; i < 5; i++) {
      const taskType = taskTypes[type];
      let daysOut = 0;

      // 3 overdue, 4 due today, 6 future, 2 completed
      if (i < 3) {
        // Overdue: 1-5 days ago
        daysOut = -randomInt(1, 5);
      } else if (i < 7) {
        // Due today or future
        daysOut = i === 3 ? 0 : randomInt(1, 7);
      } else {
        // Completed: past
        daysOut = -randomInt(1, 30);
      }

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + daysOut);

      // Skip closed company indices
      let companyIndex = (type * 5 + i) % companiesData.length;
      while (closedCompanyIndices.includes(companyIndex)) {
        companyIndex = (companyIndex + 1) % companiesData.length;
      }

      const company = companiesData[companyIndex];
      const contact = contactsData.find((c) => c.companyIndex === companyIndex && c.isPrimary);

      const cName = contact?.name ?? 'contact';
      const openTitles: Record<string, string[]> = {
        follow_up: [`Call ${cName} to discuss proposal`, `Send case study to ${cName}`, `Follow up on demo with ${company.name}`, `Re-engage ${cName} after no response`, `Check in with ${cName}`],
        admin: [`Log meeting notes for ${company.name}`, `Update pipeline stage for ${company.name}`, `Prepare pricing for ${company.name}`, `Review ${company.name} call recordings`, `Send NDA to ${company.name}`],
        new_lead: [`Research ${company.name} before outreach`, `Send intro email to ${cName}`, `Qualify ${company.name} lead`, `Schedule discovery call with ${cName}`, `Add ${company.name} to nurture sequence`],
      };
      const tOptions = openTitles[taskType] ?? [`Task for ${company.name}`];

      taskRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        contact_id: `demo-${generateSlug(company.name)}-1`,
        pipeline_stage: randomChoice(['New Lead', 'Qualification', 'Closing']),
        task_type: taskType,
        title: tOptions[i % tOptions.length],
        description: `${company.name} — ${company.industry}`,
        assigned_to: randomChoice(['Pablo Martin', 'Corey Lavinder']),
        due_date: dueDate.toISOString().split('T')[0],
        completed: i >= 13, // Last 2 are completed
      });
    }
  }

  const { error } = await supabaseAdmin.from('tasks').insert(taskRecords);

  if (error) {
    console.error('Error seeding tasks:', error);
    throw error;
  }

  console.log(`✓ Seeded ${taskRecords.length} tasks`);
}

// ============================================================================
// SEED ACTIVITY FEED (~80 entries)
// ============================================================================

async function seedActivityFeed(companiesData: any[], callIds: string[]) {
  console.log('Seeding activity feed (~80 entries)...');

  const activityRecords: any[] = [];
  const stageMap: Record<number, string> = {
    0: 'New Lead',
    1: 'New Lead',
    2: 'Qualification',
    3: 'Qualification',
    4: 'Closing',
    5: 'Closing',
    6: 'Closed',
    7: 'Closed',
    8: 'Closed',
    9: 'Closed',
    10: 'Closed',
    11: 'Nurture',
    12: 'Nurture',
    13: 'Nurture',
    14: 'Dead',
    15: 'Dead',
  };

  const authors = ['Pablo Martin', 'Corey Lavinder'];

  for (let compIdx = 0; compIdx < companiesData.length; compIdx++) {
    const company = companiesData[compIdx];
    const contact = contactsData.find((c) => c.companyIndex === compIdx && c.isPrimary);
    const currentStage = stageMap[compIdx] || 'New Lead';

    // Entry count based on stage — target 90-110 total
    let entryCount = 2;
    if (['Qualification'].includes(currentStage)) entryCount = randomInt(4, 5);
    if (['Closing'].includes(currentStage)) entryCount = randomInt(5, 7);
    if (['Closed', 'Operating'].includes(currentStage)) entryCount = randomInt(8, 10);
    if (['Nurture', 'Dead'].includes(currentStage)) entryCount = randomInt(4, 6);

    for (let i = 0; i < entryCount; i++) {
      const activityType = randomChoice(['note', 'call_logged', 'stage_moved', 'email_sent', 'sms_sent']);
      let content: any;

      switch (activityType) {
        case 'note':
          content = { text: `Follow-up note on ${company.name}` };
          break;
        case 'call_logged':
          content = {
            call_id: callIds[Math.floor(Math.random() * callIds.length)],
            score: randomInt(65, 95),
            summary: `Call with ${contact?.name || 'prospect'}`,
            call_type: 'qualification',
          };
          break;
        case 'stage_moved':
          content = {
            from: currentStage,
            to: currentStage,
            pipeline: 'Sales Pipeline',
          };
          break;
        case 'email_sent':
          content = {
            subject: `Follow-up with ${company.name}`,
            snippet: 'Thanks for your time on the call...',
          };
          break;
        case 'sms_sent':
          content = {
            body: `Hi, following up on our conversation about ${company.name}.`,
          };
          break;
      }

      // Spread activity realistically: newer entries for later-stage companies
      let daysBack = randomInt(1, 30);
      if (['Closed', 'Operating'].includes(currentStage)) {
        daysBack = randomInt(1, 14); // More recent activity for closed companies
      } else if (['Qualification', 'Closing'].includes(currentStage)) {
        daysBack = randomInt(1, 20);
      }

      activityRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        contact_id: `demo-${generateSlug(companiesData[compIdx].name)}-1`,
        type: activityType,
        content,
        author: randomChoice(authors),
        created_at: daysAgo(daysBack).toISOString(),
      });
    }
  }

  const chunkSize = 100;
  for (let i = 0; i < activityRecords.length; i += chunkSize) {
    const chunk = activityRecords.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from('activity_feed').insert(chunk);
    if (error) {
      console.error('Error seeding activity_feed:', error);
      throw error;
    }
  }

  console.log(`✓ Seeded ${activityRecords.length} activity entries`);
}

// ============================================================================
// SEED INBOX (12 conversations + ~70 messages)
// ============================================================================

async function seedInbox(companiesData: any[]) {
  console.log('Seeding inbox conversations and messages...');

  const channels = ['sms', 'sms', 'sms', 'sms', 'sms', 'email', 'email', 'email', 'email', 'email', 'whatsapp', 'whatsapp'];
  const conversationRecords: any[] = [];
  const messageRecords: any[] = [];

  // 12 conversations
  const closedCompanyIndices = [6, 7, 8, 9, 10];
  for (let i = 0; i < 12; i++) {
    const companyIndex = Math.floor(Math.random() * companiesData.length);
    const company = companiesData[companyIndex];
    const contact = contactsData.find((c) => c.companyIndex === companyIndex && c.isPrimary);
    const channel = channels[i];

    const convId = crypto.randomUUID();
    const lastMessageDate = daysAgo(randomInt(0, 1)); // Today or yesterday only

    // Determine conversation state
    let unreadCount = 0;
    let lastDirection = 'outbound';

    if (i < 4) {
      // 4 unread
      unreadCount = randomInt(1, 3);
    } else if (i < 9) {
      // 5 needs reply (last direction inbound)
      unreadCount = 0;
      lastDirection = 'inbound';
    } else {
      // 3 replied (last direction outbound)
      unreadCount = 0;
      lastDirection = 'outbound';
    }

    conversationRecords.push({
      id: convId,
      tenant_id: TENANT_ID,
      contact_ghl_id: `demo-${generateSlug(companiesData[companyIndex].name)}-1`,
      company_id: company.id,
      channel,
      last_message_at: lastMessageDate.toISOString(),
      last_message_snippet: lastDirection === 'inbound'
        ? randomChoice([`Hey, wanted to follow up on our last conversation`, `Can we schedule a call this week?`, `Got the proposal, have a few questions`, `Thanks for sending that over`, `Quick question about the setup process`])
        : randomChoice([`Sounds good, I will send that over today`, `Let me check on that and get back to you`, `Great, talk soon!`, `Confirmed for Thursday at 2pm`, `Here is the link to the proposal`]),
      last_message_direction: lastDirection,
      unread_count: unreadCount,
    });

    // More messages for closed company conversations (8-12), fewer for others (3-8)
    const isClosed = closedCompanyIndices.includes(companyIndex);
    const numMessages = isClosed ? randomInt(8, 12) : randomInt(3, 8);
    for (let j = 0; j < numMessages; j++) {
      const isInbound = j % 2 === 0;
      const messageDate = daysAgo(Math.max(0, randomInt(0, 1))); // Today or yesterday only

      messageRecords.push({
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        conversation_id: convId,
        direction: isInbound ? 'inbound' : 'outbound',
        channel,
        body: isInbound ? randomChoice(['Interested', 'Can you send more info?', 'Call tomorrow?']) : randomChoice(['Great to hear!', 'Sending details now', 'Looking forward to it']),
        sent_at: messageDate.toISOString(),
        read: !isInbound || Math.random() > 0.3,
      });
    }
  }

  // Insert conversations
  if (conversationRecords.length > 0) {
    const { error: convError } = await supabaseAdmin
      .from('inbox_conversations')
      .insert(conversationRecords);

    if (convError) {
      console.error('Error seeding inbox_conversations:', convError);
      throw convError;
    }
    console.log(`✓ Seeded ${conversationRecords.length} inbox conversations`);
  }

  // Insert messages
  if (messageRecords.length > 0) {
    const { error: msgError } = await supabaseAdmin.from('inbox_messages').insert(messageRecords);

    if (msgError) {
      console.error('Error seeding inbox_messages:', msgError);
      throw msgError;
    }
    console.log(`✓ Seeded ${messageRecords.length} inbox messages`);
  }
}

// ============================================================================
// SEED APPOINTMENTS (20 appointments)
// ============================================================================

async function seedAppointments(companiesData: any[]) {
  console.log('Seeding 20 appointments...');

  const appointmentTypes = ['qualification_call', 'closing_call', 'onboarding_setup', 'onboarding_demo'];
  const appointmentRecords: any[] = [];

  // 4 today, 3 tomorrow, 8 next 5 days, 5 past week
  const dayOffsets = [0, 0, 0, 0, 1, 1, 1, ...Array(8).fill(0).map(() => randomInt(2, 5)), ...Array(5).fill(0).map(() => -randomInt(1, 7))];

  for (let i = 0; i < 20; i++) {
    const companyIndex = i % companiesData.length;
    const company = companiesData[companyIndex];
    const contact = contactsData.find((c) => c.companyIndex === companyIndex && c.isPrimary);

    const apptDate = new Date(now);
    apptDate.setDate(apptDate.getDate() + dayOffsets[i]);

    const startHour = randomInt(9, 16);
    const startMinute = randomChoice([0, 30]);
    apptDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(apptDate);
    endDate.setMinutes(endDate.getMinutes() + randomInt(30, 60));

    appointmentRecords.push({
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      company_id: company.id,
      contact_ghl_id: `demo-${generateSlug(companiesData[companyIndex].name)}-1`,
      title: `${randomChoice(appointmentTypes)} - ${company.name}`,
      appointment_type: randomChoice(appointmentTypes),
      starts_at: apptDate.toISOString(),
      ends_at: endDate.toISOString(),
      status: 'confirmed',
      assigned_to: randomChoice(['Pablo Martin', 'Corey Lavinder']),
      meeting_url: `https://meet.google.com/${randomMeetSlug()}`,
    });
  }

  const { error } = await supabaseAdmin.from('appointments').insert(appointmentRecords);

  if (error) {
    console.error('Error seeding appointments:', error);
    throw error;
  }

  console.log(`✓ Seeded ${appointmentRecords.length} appointments`);
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  try {
    console.log('Starting seed script for Company Mind v2...\n');

    // Step 1: Wipe
    await wipeTables();

    // Step 2: Companies
    const companiesData = await seedCompanies();

    // Step 3: Contacts
    await seedContacts(companiesData);

    // Step 4: Fetch pipelines and seed pipeline assignments + stage_log
    const pipelineMap = await fetchPipelines();
    await seedPipelineAssignments(companiesData, pipelineMap);

    // Step 5: Research
    await seedResearch(companiesData);

    // Step 6: Calls
    const callIds = await seedCalls(companiesData);

    // Step 7: Call actions
    await seedCallActions(callIds);

    // Step 8: Data points
    await seedDataPoints(companiesData, callIds);

    // Step 9: Tasks
    await seedTasks(companiesData);

    // Step 10: Activity feed
    await seedActivityFeed(companiesData, callIds);

    // Step 11: Inbox
    await seedInbox(companiesData);

    // Step 12: Appointments
    await seedAppointments(companiesData);

    console.log('\n✅ Seed complete! Summary:');
    console.log(`✓ 16 companies`);
    console.log(`✓ 22 contacts`);
    console.log(`✓ 26 pipeline_companies`);
    console.log(`✓ 30+ stage_log entries`);
    console.log(`✓ ~1,400 research entries`);
    console.log(`✓ 15 calls`);
    console.log(`✓ ~30 call_actions`);
    console.log(`✓ ~230 data_points`);
    console.log(`✓ 15 tasks`);
    console.log(`✓ ~80 activity_feed entries`);
    console.log(`✓ 12 inbox_conversations`);
    console.log(`✓ ~70 inbox_messages`);
    console.log(`✓ 20 appointments`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed().catch(console.error);
