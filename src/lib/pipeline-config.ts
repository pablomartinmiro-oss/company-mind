// src/lib/pipeline-config.ts
// Tenant: Company Mind (Pablo Martin + Corey Lavinder)
// Dark theme pill classes — bg-{color}-500/10 text-{color}-300 border border-{color}-500/20

export const TEAM_MEMBERS = [
  { name: 'Pablo Martin',   initials: 'PM', avatarClass: 'bg-white' },
  { name: 'Corey Lavinder', initials: 'CL', avatarClass: 'bg-zinc-600' },
] as const;

export const PIPELINES = [
  { name: 'Sales Pipeline', stages: ['New Lead','Qualification','Closing','Closed'] },
  { name: 'Onboarding',     stages: ['New Client','Building','Built','Operating'] },
  { name: 'Upsell',         stages: ['Tier 1','Tier 2','Tier 3'] },
  { name: 'Follow Up',      stages: ['Nurture','Dead'] },
] as const;

export const STAGE_PILL_CLASSES: Record<string, string> = {
  'New Lead':      'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  'Qualification': 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  'Closing':       'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  'Closed':        'bg-green-500/10 text-green-300 border border-green-500/20',
  'New Client':    'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  'Building':      'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  'Built':         'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  'Operating':     'bg-green-500/10 text-green-300 border border-green-500/20',
  'Tier 1':        'bg-teal-500/10 text-teal-300 border border-teal-500/20',
  'Tier 2':        'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  'Tier 3':        'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  'Nurture':       'bg-white/[0.06] text-zinc-400 border border-white/[0.06]',
  'Dead':          'bg-red-500/10 text-red-400 border border-red-500/20',
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
  cold_call:     'bg-white/[0.06] text-zinc-400',
  qualification: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  closing:       'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  follow_up:     'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  onboarding:    'bg-teal-500/10 text-teal-300 border border-teal-500/20',
  admin:         'bg-white/[0.06] text-zinc-500',
};

export const OUTCOME_LABELS: Record<string, string> = {
  follow_up_scheduled: 'Follow-up scheduled',
  not_interested:      'Not interested',
  closed_won:          'Closed',
  no_answer:           'No answer',
  voicemail:           'Voicemail',
};

export const OUTCOME_PILL: Record<string, string> = {
  follow_up_scheduled: 'bg-teal-500/10 text-teal-300',
  not_interested:      'bg-red-500/10 text-red-400',
  closed_won:          'bg-green-500/10 text-green-300',
  no_answer:           'bg-white/[0.06] text-zinc-500',
  voicemail:           'bg-white/[0.06] text-zinc-500',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  admin:      'Admin',
  follow_up:  'Follow Up',
  new_lead:   'New Lead',
  scheduling: 'Scheduling',
};

export const TASK_TYPE_PILL: Record<string, string> = {
  admin:      'bg-white/[0.06] text-zinc-400 border border-white/[0.06]',
  follow_up:  'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  new_lead:   'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  scheduling: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
};

export const NEXT_STEP_TYPE_LABELS: Record<string, string> = {
  follow_up:  'Follow Up',
  scheduling: 'Scheduling',
  admin:      'Admin',
  new_lead:   'New Lead',
};

export const NEXT_STEP_TYPE_PILL: Record<string, string> = {
  follow_up:  'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  scheduling: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  admin:      'bg-white/[0.06] text-zinc-400 border border-white/[0.06]',
  new_lead:   'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  qualification_call: 'Qualification Call',
  closing_call:       'Closing Call',
  onboarding_setup:   'Onboarding Setup',
  onboarding_demo:    'Onboarding Demo',
};

export const APPOINTMENT_TYPE_PILL: Record<string, string> = {
  qualification_call: 'bg-blue-500/10 text-blue-300',
  closing_call:       'bg-violet-500/10 text-violet-300',
  onboarding_setup:   'bg-teal-500/10 text-teal-300',
  onboarding_demo:    'bg-teal-500/10 text-teal-300',
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
