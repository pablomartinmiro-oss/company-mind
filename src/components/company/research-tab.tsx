'use client';

import { useState } from 'react';
import { Building2, User } from 'lucide-react';
import { COMPANY_RESEARCH_SECTIONS, CONTACT_RESEARCH_SECTIONS } from '@/lib/research-sections';

interface ResearchField {
  field_name: string;
  field_value: string | null;
  source: string;
  section?: string;
}

interface Props {
  companyId: string;
  selectedContactId: string | null;
  selectedContactName: string | null;
  companyResearch: Record<string, ResearchField[]>;
  contactResearch: ResearchField[];
}

const SOURCE_BADGE: Record<string, string> = {
  api: 'bg-violet-50 text-violet-700 border border-violet-200',
  ai: 'bg-blue-50 text-blue-700 border border-blue-200',
  manual: 'bg-green-50 text-green-700 border border-green-200',
};

const SOURCE_DOT: Record<string, string> = {
  api: 'bg-violet-500',
  ai: 'bg-blue-500',
  manual: 'bg-green-500',
};

export function CompanyResearchTab({ companyId, selectedContactId, selectedContactName, companyResearch, contactResearch }: Props) {
  const [search, setSearch] = useState('');
  const [companyData, setCompanyData] = useState(companyResearch);
  const [contactData, setContactData] = useState(contactResearch);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editScope, setEditScope] = useState<'company' | 'contact'>('company');

  function getFieldData(fields: ResearchField[], fieldName: string): ResearchField | null {
    return fields.find(f => f.field_name === fieldName) ?? null;
  }

  async function saveField(scope: 'company' | 'contact', section: string, fieldName: string) {
    const endpoint = scope === 'company'
      ? `/api/companies/${companyId}/research`
      : `/api/contacts/${selectedContactId}/research`;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, fieldValue: editValue, section, source: 'manual' }),
      });

      if (scope === 'company') {
        const newData = { ...companyData };
        if (!newData[section]) newData[section] = [];
        const idx = newData[section].findIndex(f => f.field_name === fieldName);
        const entry = { field_name: fieldName, field_value: editValue, source: 'manual' };
        if (idx >= 0) newData[section][idx] = entry;
        else newData[section].push(entry);
        setCompanyData(newData);
      } else {
        const newData = [...contactData];
        const idx = newData.findIndex(f => f.field_name === fieldName);
        const entry = { field_name: fieldName, field_value: editValue, source: 'manual', section };
        if (idx >= 0) newData[idx] = entry;
        else newData.push(entry);
        setContactData(newData);
      }
    } catch { /* ignore */ }
    setEditingField(null);
  }

  function renderSections(
    sections: Record<string, string[]>,
    scope: 'company' | 'contact',
    allFields: ResearchField[],
    groupedData?: Record<string, ResearchField[]>,
  ) {
    return Object.entries(sections).map(([sectionName, fields]) => {
      const filteredFields = search
        ? fields.filter(f => f.toLowerCase().includes(search.toLowerCase()))
        : fields;

      if (filteredFields.length === 0) return null;

      return (
        <div key={sectionName} className="mb-5">
          <h3 className="text-[9px] font-semibold tracking-widest uppercase text-zinc-400 pb-1.5 mb-2 border-b border-white/40">
            {sectionName}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {filteredFields.map(fieldName => {
              const fieldData = groupedData
                ? (groupedData[sectionName] ?? []).find(f => f.field_name === fieldName) ?? null
                : getFieldData(allFields, fieldName);
              const isEditing = editingField === `${scope}:${fieldName}`;

              return (
                <div
                  key={fieldName}
                  onClick={() => {
                    if (!isEditing) {
                      setEditingField(`${scope}:${fieldName}`);
                      setEditValue(fieldData?.field_value ?? '');
                      setEditScope(scope);
                    }
                  }}
                  className="border border-white/40 rounded-lg p-2.5 cursor-pointer hover:border-white/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium text-zinc-500 tracking-wide uppercase">{fieldName}</span>
                    {fieldData?.source && (
                      <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_BADGE[fieldData.source] ?? 'bg-zinc-100 text-zinc-500'}`}>
                        {fieldData.source}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveField(scope, sectionName, fieldName);
                          if (e.key === 'Escape') setEditingField(null);
                        }}
                        className="text-[12px] w-full px-1.5 py-0.5 bg-white/50 border border-white/60 rounded text-[#1a1a1a] focus:outline-none focus:border-zinc-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); saveField(scope, sectionName, fieldName); }}
                          className="text-[10px] px-2 py-0.5 bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white rounded-full"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingField(null); }}
                          className="text-[10px] px-2 py-0.5 text-zinc-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[12px] mt-1 leading-snug ${fieldData?.field_value ? 'font-medium text-[#1a1a1a]' : 'text-zinc-400'}`}>
                      {fieldData?.field_value ?? '—'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[12px] px-3 py-1.5 bg-white/50 border border-white/60 rounded-lg text-[#1a1a1a] focus:outline-none focus:border-zinc-400"
        />
        <div className="flex items-center gap-3">
          {(['api', 'ai', 'manual'] as const).map((src) => (
            <div key={src} className="flex items-center gap-1.5 text-[11px] font-medium">
              <span className={`w-2 h-2 rounded-full ${SOURCE_DOT[src]}`} />
              {src.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Company-level research */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
          <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
            About the company
          </h3>
        </div>
        {renderSections(COMPANY_RESEARCH_SECTIONS, 'company', [], companyData)}
      </div>

      {/* Contact-level research */}
      {selectedContactId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <h3 className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">
              About {selectedContactName ?? 'contact'}
            </h3>
          </div>
          {renderSections(CONTACT_RESEARCH_SECTIONS, 'contact', contactData)}
        </div>
      )}
    </div>
  );
}
