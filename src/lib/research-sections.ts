// Company-scoped research sections (about the business)
export const COMPANY_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Business Info': [
    'Industry',
    'Employees',
    'Annual revenue',
    'Years in business',
    'Website',
    'Location',
    'Founded',
  ],
  'Pain Points': [
    'Primary pain',
    'Current CRM',
    'Current tools',
    'Lead volume per week',
    'Response time',
    'Lead sources',
    'Monthly ad spend',
  ],
  'Buying Process': [
    'Budget range',
    'Timeline',
    'Decision process',
    'Key objections',
    'Competitor alternatives',
    'Procurement requirements',
  ],
  'Account Health': [
    'Overall fit',
    'Risk factors',
    'Expansion potential',
    'Renewal date',
    'Last touch',
    'Notes',
  ],
};

// Contact-scoped research sections (about the individual person)
export const CONTACT_RESEARCH_SECTIONS: Record<string, string[]> = {
  'Personal Context': [
    'Role',
    'Tenure',
    'Reports to',
    'Direct reports',
    'Decision authority',
    'Budget authority',
    'Background',
  ],
  'How They Interact': [
    'Communication style',
    'Preferred channel',
    'Best time to reach',
    'Response speed',
    'Meeting style',
    'Pet peeves',
  ],
  'Relationship': [
    'Champion level',
    'Trust score',
    'Last meaningful conversation',
    'Mutual connections',
    'How we met',
    'Key wins together',
  ],
  'Interests & Hobbies': [
    'Hobbies',
    'Sports teams',
    'Family',
    'Hometown',
    'Education',
    'Personal goals',
    'Fun facts',
  ],
};

export const CONTACT_ROLES = [
  { value: 'decision_maker', label: 'Decision Maker', color: 'violet' },
  { value: 'champion', label: 'Champion', color: 'emerald' },
  { value: 'influencer', label: 'Influencer', color: 'blue' },
  { value: 'gatekeeper', label: 'Gatekeeper', color: 'amber' },
  { value: 'user', label: 'User', color: 'zinc' },
] as const;
