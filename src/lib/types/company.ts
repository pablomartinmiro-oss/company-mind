export type ContactRole = 'decision_maker' | 'influencer' | 'champion' | 'gatekeeper' | 'user' | null;
export type ResearchScope = 'company' | 'contact';

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  ghl_company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  contact_id: string;
  is_primary: boolean;
  role: ContactRole;
  added_at: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface PipelineCompany {
  id: string;
  company_id: string;
  pipeline_id: string;
  stage: string;
  stage_entered_at: string;
  deal_value: string | null;
  company?: Company;
  primary_contact?: CompanyContact;
  contact_count?: number;
}

export interface ResearchField {
  id: string;
  scope: ResearchScope;
  company_id: string | null;
  contact_id: string | null;
  section: string;
  field_name: string;
  field_value: string | null;
  source: 'api' | 'ai' | 'manual';
}
