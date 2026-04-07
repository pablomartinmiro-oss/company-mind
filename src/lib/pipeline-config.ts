// src/lib/pipeline-config.ts
// Tenant: Company Mind (Pablo Martin + Corey Lavinder)
// Payoneer edition — pills on white content area

export const TEAM_MEMBERS = [
  { name: 'Pablo Martin',   initials: 'PM', avatarClass: 'bg-[#1c1916]' },
  { name: 'Corey Lavinder', initials: 'CL', avatarClass: 'bg-zinc-600' },
] as const;

export const PIPELINES = [
  { name: 'Sales Pipeline', stages: ['New Lead','Qualification','Closing','Closed'] },
  { name: 'Onboarding',     stages: ['New Client','Building','Built','Operating'] },
  { name: 'Upsell',         stages: ['Tier 1','Tier 2','Tier 3'] },
  { name: 'Follow Up',      stages: ['Nurture','Dead'] },
] as const;

export const STAGE_PILL_CLASSES: Record<string, string> = {
  'New Lead':      'bg-amber-50 text-amber-700 border border-amber-200',
  'Qualification': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Closing':       'bg-violet-50 text-violet-700 border border-violet-200',
  'Closed':        'bg-green-50 text-green-700 border border-green-200',
  'New Client':    'bg-amber-50 text-amber-700 border border-amber-200',
  'Building':      'bg-blue-50 text-blue-700 border border-blue-200',
  'Built':         'bg-violet-50 text-violet-700 border border-violet-200',
  'Operating':     'bg-green-50 text-green-700 border border-green-200',
  'Tier 1':        'bg-teal-50 text-teal-700 border border-teal-200',
  'Tier 2':        'bg-blue-50 text-blue-700 border border-blue-200',
  'Tier 3':        'bg-violet-50 text-violet-700 border border-violet-200',
  'Nurture':       'bg-zinc-100 text-zinc-500 border border-zinc-200',
  'Dead':          'bg-red-50 text-red-400 border border-red-100',
};

export const CALL_TYPE_LABELS: Record<string, string> = {
  cold_call:     'Cold Call',
  qualification: 'Qualification Call',
  closing:       'Closing Call',
  follow_up:     'Follow Up',
  onboarding:    'Onboarding Call',
  admin:         'Admin Call',
};

export const CALL_TYPE_PILL: Record<string, string> = {
  cold_call:     'bg-zinc-100 text-zinc-500',
  qualification: 'bg-blue-50 text-blue-700 border border-blue-200',
  closing:       'bg-violet-50 text-violet-700 border border-violet-200',
  follow_up:     'bg-amber-50 text-amber-700 border border-amber-200',
  onboarding:    'bg-teal-50 text-teal-700 border border-teal-200',
  admin:         'bg-zinc-100 text-zinc-400',
};

export const OUTCOME_LABELS: Record<string, string> = {
  follow_up_scheduled: 'Follow-up scheduled',
  not_interested:      'Not interested',
  closed_won:          'Closed',
  no_answer:           'No answer',
  voicemail:           'Voicemail',
};

export const OUTCOME_PILL: Record<string, string> = {
  follow_up_scheduled: 'bg-teal-50 text-teal-700',
  not_interested:      'bg-red-50 text-red-600',
  closed_won:          'bg-green-50 text-green-700',
  no_answer:           'bg-zinc-100 text-zinc-400',
  voicemail:           'bg-zinc-100 text-zinc-400',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  admin:      'Admin',
  follow_up:  'Follow Up',
  new_lead:   'New Lead',
  scheduling: 'Scheduling',
};

export const TASK_TYPE_PILL: Record<string, string> = {
  admin:      'bg-zinc-100 text-zinc-500 border border-zinc-200',
  follow_up:  'bg-amber-50 text-amber-700 border border-amber-200',
  new_lead:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  scheduling: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export const NEXT_STEP_TYPE_LABELS: Record<string, string> = {
  follow_up:  'Follow Up',
  scheduling: 'Scheduling',
  admin:      'Admin',
  new_lead:   'New Lead',
};

export const NEXT_STEP_TYPE_PILL: Record<string, string> = {
  follow_up:  'bg-amber-50 text-amber-700 border border-amber-200',
  scheduling: 'bg-blue-50 text-blue-700 border border-blue-200',
  admin:      'bg-zinc-100 text-zinc-500 border border-zinc-200',
  new_lead:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  qualification_call: 'Qualification Call',
  closing_call:       'Closing Call',
  onboarding_setup:   'Onboarding Setup',
  onboarding_demo:    'Onboarding Demo',
};

export const APPOINTMENT_TYPE_PILL: Record<string, string> = {
  qualification_call: 'bg-blue-50 text-blue-700',
  closing_call:       'bg-violet-50 text-violet-700',
  onboarding_setup:   'bg-teal-50 text-teal-700',
  onboarding_demo:    'bg-teal-50 text-teal-700',
};

export const SALES_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Business Info':  ['Company name','Industry','Employees','Annual revenue','Years in business','Website','Location'],
  'Pain Points':    ['Primary pain','Current CRM','Current lead volume per week','Current response time','Lead sources','Monthly ad spend'],
  'Buying Process': ['Decision maker','Budget authority','Budget range','Timeline','Key objections','Competitor alternatives'],
  'Sales Context':  ['Referral source','Last call score','Overall fit','Next step agreed','Notes'],
};

export const ONBOARDING_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Account Setup':    ['GHL sub-account ID','Sub-account name','Domain','Billing status','Plan tier','Contract start date'],
  'Technical Setup':  ['Phone number provisioned','CRM data imported','Team members added','Call recording enabled','First pipeline configured','AI scoring activated'],
  'Client Context':   ['Industry','Use case','Team size','Success metric','Key contacts','Training notes'],
};
