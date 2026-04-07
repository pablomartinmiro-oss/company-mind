// Company Mind Research Catalog — 159 fields total
// COMPANY: 92 fields across 9 sections
// CONTACT: 67 fields across 7 sections

export type FieldSource = 'api' | 'ai' | 'call' | 'manual';
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'longtext' | 'score';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  primarySource: FieldSource;
  secondarySources?: FieldSource[];
  options?: string[];
  helper?: string;
  apiProvider?: string;
  aiPrompt?: string;
  predictive?: boolean;
}

export interface SectionDefinition {
  key: string;
  label: string;
  description?: string;
  scope: 'company' | 'contact';
  fields: FieldDefinition[];
  collapsedByDefault?: boolean;
}

// ============================================================
// COMPANY-LEVEL SECTIONS (9 sections, 92 fields)
// ============================================================

export const COMPANY_SECTIONS: SectionDefinition[] = [
  {
    key: 'identity',
    label: 'Identity',
    description: 'Basic identifying information',
    scope: 'company',
    fields: [
      { key: 'legal_name', label: 'Legal Name', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'dba', label: 'DBA / Trade Name', type: 'text', primarySource: 'manual' },
      { key: 'domain', label: 'Domain', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'logo_url', label: 'Logo URL', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'year_founded', label: 'Year Founded', type: 'number', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'country', label: 'Country', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'state', label: 'State / Region', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'city', label: 'City', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'time_zone', label: 'Time Zone', type: 'text', primarySource: 'api' },
      { key: 'phone_main', label: 'Main Phone', type: 'text', primarySource: 'api', apiProvider: 'ghl' },
      { key: 'email_main', label: 'Main Email', type: 'text', primarySource: 'api', apiProvider: 'ghl' },
      { key: 'linkedin_url', label: 'LinkedIn', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'twitter_url', label: 'Twitter / X', type: 'text', primarySource: 'api' },
      { key: 'facebook_url', label: 'Facebook', type: 'text', primarySource: 'api' },
      { key: 'instagram_url', label: 'Instagram', type: 'text', primarySource: 'api' },
    ],
  },
  {
    key: 'business_profile',
    label: 'Business Profile',
    description: 'What kind of business this is',
    scope: 'company',
    fields: [
      { key: 'industry_primary', label: 'Primary Industry', type: 'text', primarySource: 'api', apiProvider: 'clearbit', secondarySources: ['ai', 'manual'] },
      { key: 'industry_secondary', label: 'Secondary Industries', type: 'multiselect', primarySource: 'ai' },
      { key: 'naics_code', label: 'NAICS Code', type: 'text', primarySource: 'api' },
      { key: 'business_model', label: 'Business Model', type: 'select', primarySource: 'ai', options: ['B2B', 'B2C', 'B2B2C', 'Marketplace', 'D2C', 'Nonprofit', 'Other'] },
      { key: 'company_stage', label: 'Company Stage', type: 'select', primarySource: 'ai', options: ['Idea', 'Pre-revenue', 'Early', 'Growth', 'Mature', 'Decline'] },
      { key: 'employees_exact', label: 'Employees (exact)', type: 'number', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'employees_range', label: 'Employees (range)', type: 'select', primarySource: 'api', options: ['1', '2-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { key: 'employee_growth_90d', label: 'Employee Growth (90d)', type: 'text', primarySource: 'api', apiProvider: 'clearbit' },
      { key: 'revenue_range', label: 'Annual Revenue Range', type: 'select', primarySource: 'api', options: ['<$1M', '$1M-$5M', '$5M-$25M', '$25M-$100M', '$100M-$1B', '$1B+'] },
      { key: 'revenue_growth_signal', label: 'Revenue Growth Signal', type: 'select', primarySource: 'ai', options: ['Growing fast', 'Growing steady', 'Flat', 'Declining', 'Unknown'] },
      { key: 'geographic_reach', label: 'Geographic Reach', type: 'select', primarySource: 'ai', options: ['Local', 'Regional', 'National', 'International'] },
      { key: 'business_summary', label: 'What They Do', type: 'longtext', primarySource: 'ai' },
    ],
  },
  {
    key: 'tech_stack',
    label: 'Tech & Tools',
    description: 'Software and platforms they use',
    scope: 'company',
    fields: [
      { key: 'crm_current', label: 'Current CRM', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'marketing_automation', label: 'Marketing Automation', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'email_tool', label: 'Email Tool', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'calendar_tool', label: 'Calendar Tool', type: 'text', primarySource: 'manual' },
      { key: 'phone_system', label: 'Phone System', type: 'text', primarySource: 'manual' },
      { key: 'website_platform', label: 'Website Platform', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'hosting_provider', label: 'Hosting', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'analytics_tool', label: 'Analytics', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'payment_processor', label: 'Payment Processor', type: 'text', primarySource: 'api', apiProvider: 'builtwith' },
      { key: 'other_tech_detected', label: 'Other Tech Detected', type: 'longtext', primarySource: 'api' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & Lead Gen',
    description: 'How they get customers',
    scope: 'company',
    fields: [
      { key: 'primary_lead_sources', label: 'Primary Lead Sources', type: 'multiselect', primarySource: 'ai', options: ['Google Ads', 'Facebook Ads', 'SEO', 'Referrals', 'Cold outreach', 'Content marketing', 'Trade shows', 'Direct mail', 'Other'] },
      { key: 'monthly_lead_volume', label: 'Monthly Lead Volume', type: 'text', primarySource: 'call' },
      { key: 'monthly_ad_spend', label: 'Monthly Ad Spend', type: 'text', primarySource: 'ai' },
      { key: 'active_ad_channels', label: 'Active Ad Channels', type: 'multiselect', primarySource: 'ai' },
      { key: 'seo_presence', label: 'SEO Presence', type: 'select', primarySource: 'ai', options: ['None', 'Weak', 'Moderate', 'Strong', 'Dominant'] },
      { key: 'content_marketing', label: 'Content Marketing', type: 'select', primarySource: 'ai', options: ['None', 'Light', 'Active', 'Heavy'] },
      { key: 'media_presence', label: 'Podcast / Media Presence', type: 'longtext', primarySource: 'ai' },
      { key: 'reviews_count', label: 'Reviews Count', type: 'number', primarySource: 'api', apiProvider: 'google_places' },
      { key: 'reviews_rating', label: 'Reviews Rating', type: 'number', primarySource: 'api', apiProvider: 'google_places' },
      { key: 'recent_press', label: 'Recent Press Mentions', type: 'longtext', primarySource: 'ai' },
    ],
  },
  {
    key: 'pain_opportunity',
    label: 'Pain & Opportunity',
    description: 'Why they would buy',
    scope: 'company',
    fields: [
      { key: 'primary_pain_hypothesis', label: 'Primary Pain (hypothesis)', type: 'longtext', primarySource: 'ai' },
      { key: 'primary_pain_stated', label: 'Primary Pain (stated)', type: 'longtext', primarySource: 'call' },
      { key: 'secondary_pains', label: 'Secondary Pains', type: 'longtext', primarySource: 'call', secondarySources: ['ai'] },
      { key: 'pain_severity', label: 'Pain Severity (1-10)', type: 'score', primarySource: 'ai' },
      { key: 'time_to_pain', label: 'Time to Pain', type: 'select', primarySource: 'call', options: ['Urgent now', 'Soon (this quarter)', 'Someday', 'No pain'] },
      { key: 'opportunity_size', label: 'Opportunity Size Estimate', type: 'text', primarySource: 'ai' },
      { key: 'opportunity_confidence', label: 'Opportunity Confidence', type: 'select', primarySource: 'ai', options: ['Low', 'Medium', 'High'] },
      { key: 'trigger_events', label: 'Trigger Events', type: 'longtext', primarySource: 'ai' },
      { key: 'competitive_pressure', label: 'Competitive Pressure', type: 'longtext', primarySource: 'ai' },
      { key: 'why_now', label: 'Why Now', type: 'longtext', primarySource: 'call' },
    ],
  },
  {
    key: 'buying_process',
    label: 'Buying Process',
    description: 'How decisions get made',
    scope: 'company',
    fields: [
      { key: 'budget_range_stated', label: 'Budget Range (stated)', type: 'text', primarySource: 'call' },
      { key: 'budget_authority_confirmed', label: 'Budget Authority Confirmed', type: 'text', primarySource: 'call' },
      { key: 'budget_timing', label: 'Budget Timing', type: 'text', primarySource: 'call' },
      { key: 'decision_process', label: 'Decision Process Described', type: 'longtext', primarySource: 'call' },
      { key: 'decision_makers_named', label: 'Decision Makers Named', type: 'longtext', primarySource: 'call' },
      { key: 'influencers_named', label: 'Influencers Named', type: 'longtext', primarySource: 'call' },
      { key: 'procurement_requirements', label: 'Procurement Requirements', type: 'longtext', primarySource: 'call' },
      { key: 'contract_length_preferred', label: 'Contract Length Preferred', type: 'text', primarySource: 'call' },
      { key: 'timeline_stated', label: 'Timeline Stated', type: 'text', primarySource: 'call' },
      { key: 'urgency_level', label: 'Urgency Level', type: 'select', primarySource: 'call', options: ['Immediate', 'This month', 'This quarter', 'This year', 'No timeline'] },
      { key: 'key_objections', label: 'Key Objections Raised', type: 'longtext', primarySource: 'call' },
      { key: 'competitor_alternatives', label: 'Competitor Alternatives Mentioned', type: 'longtext', primarySource: 'call' },
    ],
  },
  {
    key: 'engagement_history',
    label: 'Engagement History',
    description: 'How we have interacted (auto-calculated)',
    scope: 'company',
    collapsedByDefault: true,
    fields: [
      { key: 'first_contact_date', label: 'First Contact', type: 'date', primarySource: 'api' },
      { key: 'last_contact_date', label: 'Last Contact', type: 'date', primarySource: 'api' },
      { key: 'days_since_last_contact', label: 'Days Since Last Contact', type: 'number', primarySource: 'api' },
      { key: 'total_touches', label: 'Total Touches', type: 'number', primarySource: 'api' },
      { key: 'calls_count', label: 'Calls Count', type: 'number', primarySource: 'api' },
      { key: 'emails_count', label: 'Emails Count', type: 'number', primarySource: 'api' },
      { key: 'meetings_count', label: 'Meetings Count', type: 'number', primarySource: 'api' },
      { key: 'engagement_velocity', label: 'Touches per Week', type: 'number', primarySource: 'api' },
    ],
  },
  {
    key: 'account_health',
    label: 'Account Health',
    description: 'Overall account status and risk',
    scope: 'company',
    fields: [
      { key: 'fit_score', label: 'Fit Score (0-100)', type: 'score', primarySource: 'ai' },
      { key: 'fit_confidence', label: 'Fit Confidence', type: 'select', primarySource: 'ai', options: ['Low', 'Medium', 'High'] },
      { key: 'risk_factors', label: 'Risk Factors', type: 'longtext', primarySource: 'ai' },
      { key: 'expansion_potential', label: 'Expansion Potential', type: 'select', primarySource: 'ai', options: ['Low', 'Medium', 'High'] },
      { key: 'champion_strength', label: 'Champion Strength', type: 'select', primarySource: 'manual', options: ['None', 'Weak', 'Moderate', 'Strong', 'Multiple'] },
      { key: 'detractor_present', label: 'Detractor Present', type: 'text', primarySource: 'manual' },
      { key: 'renewal_date', label: 'Renewal Date', type: 'date', primarySource: 'manual' },
      { key: 'health_trajectory', label: 'Health Trajectory', type: 'select', primarySource: 'ai', options: ['Improving', 'Steady', 'Declining'] },
      { key: 'strategic_priority', label: 'Strategic Priority', type: 'select', primarySource: 'manual', options: ['Low', 'Medium', 'High'] },
      { key: 'account_notes', label: 'Notes', type: 'longtext', primarySource: 'manual' },
    ],
  },
  {
    key: 'predictive',
    label: 'Predictive',
    description: 'AI-calculated forecasts',
    scope: 'company',
    collapsedByDefault: true,
    fields: [
      { key: 'conversion_probability', label: 'Conversion Probability', type: 'score', primarySource: 'ai', predictive: true },
      { key: 'mrr_potential', label: 'Estimated MRR Potential', type: 'text', primarySource: 'ai', predictive: true },
      { key: 'best_next_action', label: 'Best Next Action', type: 'longtext', primarySource: 'ai', predictive: true },
      { key: 'time_to_close_estimate', label: 'Time to Close Estimate', type: 'text', primarySource: 'ai', predictive: true },
      { key: 'lookalike_accounts', label: 'Lookalike Accounts', type: 'longtext', primarySource: 'ai', predictive: true },
    ],
  },
];

// ============================================================
// CONTACT-LEVEL SECTIONS (7 sections, 67 fields)
// ============================================================

export const CONTACT_SECTIONS: SectionDefinition[] = [
  {
    key: 'contact_identity',
    label: 'Identity',
    scope: 'contact',
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', primarySource: 'api' },
      { key: 'preferred_name', label: 'Preferred Name', type: 'text', primarySource: 'manual' },
      { key: 'title', label: 'Title', type: 'text', primarySource: 'api', apiProvider: 'apollo' },
      { key: 'department', label: 'Department', type: 'text', primarySource: 'api', apiProvider: 'apollo' },
      { key: 'seniority_level', label: 'Seniority Level', type: 'select', primarySource: 'ai', options: ['IC', 'Manager', 'Director', 'VP', 'C-suite', 'Owner / Founder'] },
      { key: 'email', label: 'Email', type: 'text', primarySource: 'api' },
      { key: 'phone', label: 'Phone', type: 'text', primarySource: 'api' },
      { key: 'mobile', label: 'Mobile', type: 'text', primarySource: 'api', apiProvider: 'apollo' },
      { key: 'linkedin_url', label: 'LinkedIn', type: 'text', primarySource: 'api' },
      { key: 'twitter_url', label: 'Twitter / X', type: 'text', primarySource: 'api' },
    ],
  },
  {
    key: 'role_authority',
    label: 'Role & Authority',
    scope: 'contact',
    fields: [
      { key: 'reports_to', label: 'Reports To', type: 'text', primarySource: 'call' },
      { key: 'direct_reports_count', label: 'Direct Reports Count', type: 'number', primarySource: 'call' },
      { key: 'tenure_at_company', label: 'Tenure at Company', type: 'text', primarySource: 'api' },
      { key: 'tenure_in_role', label: 'Tenure in Role', type: 'text', primarySource: 'api' },
      { key: 'previous_companies', label: 'Previous Companies', type: 'longtext', primarySource: 'api' },
      { key: 'career_trajectory', label: 'Career Trajectory', type: 'select', primarySource: 'ai', options: ['Rising fast', 'Steady climb', 'Plateau', 'Lateral', 'Unknown'] },
      { key: 'decision_authority_level', label: 'Decision Authority', type: 'select', primarySource: 'call', options: ['Final', 'Recommender', 'Influencer', 'User', 'Blocker', 'Unknown'] },
      { key: 'budget_authority_threshold', label: 'Budget Authority Threshold', type: 'text', primarySource: 'call' },
      { key: 'domain_expertise', label: 'Domain Expertise Areas', type: 'longtext', primarySource: 'ai' },
      { key: 'stated_priorities', label: 'Stated Priorities', type: 'longtext', primarySource: 'call' },
    ],
  },
  {
    key: 'communication_profile',
    label: 'Communication Profile',
    description: 'How they like to be talked to',
    scope: 'contact',
    fields: [
      { key: 'communication_style', label: 'Communication Style', type: 'select', primarySource: 'call', options: ['Direct', 'Consultative', 'Analytical', 'Relational', 'Mixed'] },
      { key: 'preferred_channel', label: 'Preferred Channel', type: 'select', primarySource: 'call', options: ['Call', 'Email', 'SMS', 'In-person', 'Video', 'No preference'] },
      { key: 'best_time_to_reach', label: 'Best Time to Reach', type: 'text', primarySource: 'ai' },
      { key: 'best_day_of_week', label: 'Best Day of Week', type: 'text', primarySource: 'ai' },
      { key: 'avg_response_time', label: 'Average Response Time', type: 'text', primarySource: 'ai' },
      { key: 'email_length_preference', label: 'Email Length Preference', type: 'select', primarySource: 'ai', options: ['Short', 'Medium', 'Long'] },
      { key: 'tone_preference', label: 'Tone Preference', type: 'select', primarySource: 'call', options: ['Formal', 'Casual', 'Data-driven', 'Story-driven'] },
      { key: 'meeting_style', label: 'Meeting Style', type: 'select', primarySource: 'call', options: ['Agenda-driven', 'Open', 'Brief', 'Deep-dive'] },
      { key: 'decision_speed', label: 'Decision Speed', type: 'select', primarySource: 'call', options: ['Fast', 'Deliberate', 'Consultative', 'Slow'] },
      { key: 'conflict_style', label: 'Conflict Style', type: 'select', primarySource: 'call', options: ['Direct', 'Avoidant', 'Collaborative'] },
      { key: 'influence_tactics_that_work', label: 'Influence Tactics That Work', type: 'longtext', primarySource: 'ai' },
      { key: 'influence_tactics_that_backfire', label: 'Influence Tactics That Backfire', type: 'longtext', primarySource: 'ai' },
    ],
  },
  {
    key: 'relationship',
    label: 'Relationship',
    scope: 'contact',
    fields: [
      { key: 'how_we_met', label: 'How We Met', type: 'text', primarySource: 'manual' },
      { key: 'first_contact_date', label: 'First Contact Date', type: 'date', primarySource: 'api' },
      { key: 'champion_level', label: 'Champion Level (0-10)', type: 'score', primarySource: 'manual' },
      { key: 'trust_score', label: 'Trust Score (0-10)', type: 'score', primarySource: 'manual' },
      { key: 'reciprocity_history', label: 'Favors Given / Received', type: 'longtext', primarySource: 'manual' },
      { key: 'last_meaningful_conversation', label: 'Last Meaningful Conversation', type: 'longtext', primarySource: 'call' },
      { key: 'last_sentiment_detected', label: 'Last Sentiment Detected', type: 'select', primarySource: 'call', options: ['Very positive', 'Positive', 'Neutral', 'Negative', 'Very negative'] },
      { key: 'internal_advocate_status', label: 'Internal Advocate Status', type: 'text', primarySource: 'manual' },
      { key: 'detractor_status', label: 'Detractor Status', type: 'text', primarySource: 'manual' },
      { key: 'personal_connection_notes', label: 'Personal Connection Notes', type: 'longtext', primarySource: 'manual' },
    ],
  },
  {
    key: 'personal_context',
    label: 'Personal Context',
    description: 'The human behind the contact',
    scope: 'contact',
    fields: [
      { key: 'hometown', label: 'Hometown', type: 'text', primarySource: 'ai' },
      { key: 'current_city', label: 'Current City', type: 'text', primarySource: 'api' },
      { key: 'education', label: 'Education', type: 'longtext', primarySource: 'api' },
      { key: 'languages_spoken', label: 'Languages Spoken', type: 'multiselect', primarySource: 'manual' },
      { key: 'family_status', label: 'Family Status', type: 'text', primarySource: 'manual' },
      { key: 'children_count_ages', label: 'Children (count and ages)', type: 'text', primarySource: 'manual' },
      { key: 'pets', label: 'Pets', type: 'text', primarySource: 'manual' },
      { key: 'hobbies', label: 'Hobbies and Interests', type: 'longtext', primarySource: 'ai' },
      { key: 'sports_teams', label: 'Sports Teams', type: 'multiselect', primarySource: 'manual' },
      { key: 'favorite_restaurants', label: 'Favorite Restaurants', type: 'longtext', primarySource: 'manual' },
      { key: 'vacation_patterns', label: 'Vacation Patterns', type: 'longtext', primarySource: 'manual' },
      { key: 'personal_goals', label: 'Personal Goals Stated', type: 'longtext', primarySource: 'call' },
    ],
  },
  {
    key: 'triggers_signals',
    label: 'Triggers & Signals',
    description: 'Real-time intent and life-event signals',
    scope: 'contact',
    collapsedByDefault: true,
    fields: [
      { key: 'recent_job_changes', label: 'Recent Job Changes', type: 'longtext', primarySource: 'ai' },
      { key: 'recent_posts', label: 'Recent Posts / Articles', type: 'longtext', primarySource: 'ai' },
      { key: 'recent_achievements', label: 'Recent Achievements', type: 'longtext', primarySource: 'ai' },
      { key: 'social_pain_points', label: 'Pain Points Expressed in Social', type: 'longtext', primarySource: 'ai' },
      { key: 'social_engagement_topics', label: 'Topics They Engage With', type: 'longtext', primarySource: 'ai' },
      { key: 'mutual_linkedin_connections', label: 'Mutual LinkedIn Connections', type: 'longtext', primarySource: 'api' },
      { key: 'shared_interests_with_team', label: 'Shared Interests With Our Team', type: 'longtext', primarySource: 'ai' },
      { key: 'birthday', label: 'Birthday', type: 'date', primarySource: 'manual' },
    ],
  },
  {
    key: 'contact_predictive',
    label: 'Predictive',
    description: 'AI-calculated forecasts',
    scope: 'contact',
    collapsedByDefault: true,
    fields: [
      { key: 'influence_score', label: 'Influence Score (0-100)', type: 'score', primarySource: 'ai', predictive: true },
      { key: 'likelihood_to_champion', label: 'Likelihood to Champion (0-100)', type: 'score', primarySource: 'ai', predictive: true },
      { key: 'best_message_angle', label: 'Best Message Angle', type: 'longtext', primarySource: 'ai', predictive: true },
      { key: 'optimal_touch_frequency', label: 'Optimal Touch Frequency (days)', type: 'number', primarySource: 'ai', predictive: true },
      { key: 'risk_of_disengagement', label: 'Risk of Disengagement (0-100)', type: 'score', primarySource: 'ai', predictive: true },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

export function getCompanyFieldByKey(key: string): FieldDefinition | undefined {
  for (const section of COMPANY_SECTIONS) {
    const f = section.fields.find(f => f.key === key);
    if (f) return f;
  }
  return undefined;
}

export function getContactFieldByKey(key: string): FieldDefinition | undefined {
  for (const section of CONTACT_SECTIONS) {
    const f = section.fields.find(f => f.key === key);
    if (f) return f;
  }
  return undefined;
}

export function getAllCompanyFields(): FieldDefinition[] {
  return COMPANY_SECTIONS.flatMap(s => s.fields);
}

export function getAllContactFields(): FieldDefinition[] {
  return CONTACT_SECTIONS.flatMap(s => s.fields);
}

export const FIELD_COUNTS = {
  company: getAllCompanyFields().length,
  contact: getAllContactFields().length,
  total: getAllCompanyFields().length + getAllContactFields().length,
};
