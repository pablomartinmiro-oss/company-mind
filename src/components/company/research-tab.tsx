'use client';

import { useState } from 'react';
import { COMPANY_SECTIONS, CONTACT_SECTIONS } from '@/lib/research/catalog';
import type { FieldSource } from '@/lib/research/catalog';
import { ResearchSection } from '@/components/research/research-section';

interface ResearchData {
  value: string;
  source: string;
  source_detail?: string;
}

interface ContactOption {
  contactId: string;
  contactName: string;
}

interface Props {
  companyId: string;
  contacts: ContactOption[];
  selectedContactId: string | null;
  companyResearch: Record<string, ResearchData>;
  contactResearchMap: Record<string, Record<string, ResearchData>>;
}

export function CompanyResearchTab({ companyId, contacts, selectedContactId, companyResearch, contactResearchMap }: Props) {
  const [activeTab, setActiveTab] = useState<string>('company');
  const [companyData, setCompanyData] = useState(companyResearch);
  const [contactDataMap, setContactDataMap] = useState(contactResearchMap);

  const activeContactId = activeTab === 'company' ? null : activeTab;
  const activeContact = contacts.find(c => c.contactId === activeContactId);
  const contactData = activeContactId ? (contactDataMap[activeContactId] ?? {}) : {};

  const saveCompanyField = async (fieldKey: string, value: string) => {
    await fetch(`/api/companies/${companyId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: fieldKey, fieldValue: value, source: 'manual' }),
    });
    setCompanyData(prev => ({ ...prev, [fieldKey]: { value, source: 'manual' as FieldSource } }));
  };

  const saveContactField = async (fieldKey: string, value: string) => {
    if (!activeContactId) return;
    await fetch(`/api/contacts/${activeContactId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: fieldKey, fieldValue: value, source: 'manual' }),
    });
    setContactDataMap(prev => ({
      ...prev,
      [activeContactId]: { ...(prev[activeContactId] ?? {}), [fieldKey]: { value, source: 'manual' as FieldSource } },
    }));
  };

  return (
    <div>
      {/* Switcher bar */}
      <div className="flex gap-1 mb-4 border-b border-zinc-100 pb-3">
        <button
          onClick={() => setActiveTab('company')}
          className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
            activeTab === 'company'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-400 hover:bg-zinc-100'
          }`}
        >
          Company
        </button>
        {contacts.map(c => (
          <button
            key={c.contactId}
            onClick={() => setActiveTab(c.contactId)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
              activeTab === c.contactId
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-400 hover:bg-zinc-100'
            }`}
          >
            {c.contactName}
          </button>
        ))}
      </div>

      {/* Company research */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          {COMPANY_SECTIONS.map(section => (
            <ResearchSection
              key={section.key}
              section={section}
              data={companyData}
              onSave={saveCompanyField}
            />
          ))}
        </div>
      )}

      {/* Contact research */}
      {activeContactId && (
        <div className="space-y-4">
          {CONTACT_SECTIONS.map(section => (
            <ResearchSection
              key={`${activeContactId}-${section.key}`}
              section={section}
              data={contactData}
              onSave={saveContactField}
            />
          ))}
        </div>
      )}
    </div>
  );
}
