// src/lib/pipeline-config.ts
// Tenant: Company Mind (Pablo Martin + Corey Lavinder)
// Payoneer edition — pills on white content area

import {
  User, Search, Handshake, CheckCircle,
  Sparkles, Wrench, Rocket, Target,
  ArrowUpRight, TrendingUp, Crown,
  Zap, Skull,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const STAGE_ICONS: Record<string, LucideIcon> = {
  // Sales Pipeline
  'New Lead': User,
  'Qualification': Search,
  'Closing': Handshake,
  'Closed': CheckCircle,
  // Onboarding
  'New Client': Sparkles,
  'Building': Wrench,
  'Built': Rocket,
  'Operating': Target,
  // Upsell
  'Tier 1': ArrowUpRight,
  'Tier 2': TrendingUp,
  'Tier 3': Crown,
  // Follow Up
  'Nurture': Zap,
  'Dead': Skull,
};

export const TEAM_MEMBERS = [
  { name: 'Pablo Martin',   initials: 'PM', pillClass: 'bg-violet-100/60 text-violet-700 border border-violet-200/40', avatarClass: 'bg-gradient-to-br from-violet-400 to-violet-600' },
  { name: 'Corey Lavinder', initials: 'CL', pillClass: 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/40', avatarClass: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
] as const;

export function getTeamMember(name: string) {
  const found = TEAM_MEMBERS.find(m => m.name === name);
  if (found) return found;
  return {
    name,
    initials: name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
    pillClass: 'bg-zinc-100/60 text-zinc-500 border border-zinc-200/40',
    avatarClass: 'bg-gradient-to-br from-zinc-400 to-zinc-600',
  };
}

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
  follow_up:          'Follow Up',
  scheduling:         'Scheduling',
  admin:              'Admin',
  new_lead:           'New Lead',
  send_proposal:      'Send Proposal',
  schedule_followup:  'Schedule Followup',
  create_task:        'Create Task',
  send_email:         'Send Email',
};

export const NEXT_STEP_TYPE_PILL: Record<string, string> = {
  follow_up:          'bg-amber-50 text-amber-700 border border-amber-200',
  scheduling:         'bg-blue-50 text-blue-700 border border-blue-200',
  admin:              'bg-zinc-100 text-zinc-500 border border-zinc-200',
  new_lead:           'bg-emerald-50 text-emerald-700 border border-emerald-200',
  send_proposal:      'bg-violet-50/80 text-violet-700 border border-violet-200/60',
  schedule_followup:  'bg-blue-50/80 text-blue-700 border border-blue-200/60',
  create_task:        'bg-amber-50/80 text-amber-700 border border-amber-200/60',
  send_email:         'bg-teal-50/80 text-teal-700 border border-teal-200/60',
};

export const ACTION_TYPE_CONFIG: Record<string, { label: string; pillClass: string; icon: string }> = {
  task:         { label: 'Task',          pillClass: 'bg-blue-100/60 text-blue-700 border border-blue-200/40',     icon: 'CheckSquare' },
  appointment:  { label: 'Appointment',   pillClass: 'bg-violet-100/60 text-violet-700 border border-violet-200/40', icon: 'Calendar' },
  email:        { label: 'Email',         pillClass: 'bg-amber-100/60 text-amber-700 border border-amber-200/40',   icon: 'Mail' },
  note:         { label: 'Note',          pillClass: 'bg-zinc-100/60 text-zinc-600 border border-zinc-200/40',      icon: 'StickyNote' },
  stage_change: { label: 'Stage Change',  pillClass: 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/40', icon: 'ArrowRight' },
  research:     { label: 'Research',      pillClass: 'bg-teal-100/60 text-teal-700 border border-teal-200/40',      icon: 'Search' },
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  showed: 'Showed',
  no_show: 'No Show',
  cancelled: 'Cancelled',
};

export const APPOINTMENT_STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/40',
  showed: 'bg-blue-100/60 text-blue-700 border border-blue-200/40',
  no_show: 'bg-amber-100/60 text-amber-700 border border-amber-200/40',
  cancelled: 'bg-zinc-100/60 text-zinc-500 border border-zinc-200/40',
};

export const APPOINTMENT_STATUS_ORDER = ['confirmed', 'showed', 'no_show', 'cancelled'] as const;

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

export const LEAD_SOURCES = [
  'Google Ads', 'Facebook Ads', 'Referral', 'Cold outbound',
  'Trade show', 'Inbound website', 'Other',
] as const;

export const ONBOARDING_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Account Setup':    ['GHL sub-account ID','Sub-account name','Domain','Billing status','Plan tier','Contract start date'],
  'Technical Setup':  ['Phone number provisioned','CRM data imported','Team members added','Call recording enabled','First pipeline configured','AI scoring activated'],
  'Client Context':   ['Industry','Use case','Team size','Success metric','Key contacts','Training notes'],
};
