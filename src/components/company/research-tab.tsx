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

interface Props {
  companyId: string;
  selectedContactId: string | null;
  selectedContactName: string | null;
  companyResearch: Record<string, ResearchData>;
  contactResearch: Record<string, ResearchData>;
}

export function CompanyResearchTab({ companyId, selectedContactId, selectedContactName, companyResearch, contactResearch }: Props) {
  const [companyData, setCompanyData] = useState(companyResearch);
  const [contactData, setContactData] = useState(contactResearch);

  const saveCompanyField = async (fieldKey: string, value: string) => {
    await fetch(`/api/companies/${companyId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: fieldKey, fieldValue: value, source: 'manual' }),
    });
    setCompanyData(prev => ({ ...prev, [fieldKey]: { value, source: 'manual' as FieldSource } }));
  };

  const saveContactField = async (fieldKey: string, value: string) => {
    if (!selectedContactId) return;
    await fetch(`/api/contacts/${selectedContactId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: fieldKey, fieldValue: value, source: 'manual' }),
    });
    setContactData(prev => ({ ...prev, [fieldKey]: { value, source: 'manual' as FieldSource } }));
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

      {/* Contact sections */}
      {selectedContactId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-zinc-500" />
            <h2 className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              About {selectedContactName ?? 'contact'}
            </h2>
          </div>
          {CONTACT_SECTIONS.map(section => (
            <ResearchSection
              key={section.key}
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
