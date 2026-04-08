'use client';

import { useState } from 'react';
import { Building2, User } from 'lucide-react';
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
  const [activeContactId, setActiveContactId] = useState(selectedContactId ?? contacts[0]?.contactId ?? null);
  const [companyData, setCompanyData] = useState(companyResearch);
  const [contactDataMap, setContactDataMap] = useState(contactResearchMap);

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
    <div className="space-y-6">
      {/* Company sections */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-zinc-500" />
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">About the company</h2>
        </div>
        {COMPANY_SECTIONS.map(section => (
          <ResearchSection
            key={section.key}
            section={section}
            data={companyData}
            onSave={saveCompanyField}
          />
        ))}
      </div>

      {/* Contact tabs + sections */}
      {contacts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-zinc-500" />
            <h2 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              About {activeContact?.contactName ?? 'contact'}
            </h2>
          </div>

          {/* Contact switcher tabs */}
          {contacts.length > 1 && (
            <div className="flex gap-1 mb-4">
              {contacts.map(c => (
                <button
                  key={c.contactId}
                  onClick={() => setActiveContactId(c.contactId)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-full transition-all ${
                    activeContactId === c.contactId
                      ? 'bg-white/70 text-[#1a1a1a] shadow-sm border border-white/60'
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/40'
                  }`}
                >
                  {c.contactName}
                </button>
              ))}
            </div>
          )}

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
