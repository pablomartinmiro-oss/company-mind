'use client';

import { useState } from 'react';
import { SALES_RESEARCH_SECTIONS, ONBOARDING_RESEARCH_SECTIONS } from '@/lib/pipeline-config';

interface ResearchField {
  field_name: string;
  field_value: string | null;
  source: string;
}

interface Props {
  contactId: string;
  researchData: Record<string, ResearchField[]>;
  pipelineNames: string[];
}

const SOURCE_BADGE: Record<string, string> = {
  api: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  ai: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  manual: 'bg-green-500/10 text-green-300 border border-green-500/20',
};

const SOURCE_DOT: Record<string, string> = {
  api: 'bg-violet-500',
  ai: 'bg-blue-500',
  manual: 'bg-green-500',
};

export function ResearchTab({ contactId, researchData, pipelineNames }: Props) {
  const [search, setSearch] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [data, setData] = useState(researchData);

  // Determine which sections to show
  const isSales = pipelineNames.some((n) => ['Sales Pipeline', 'Follow Up'].includes(n));
  const isOnboarding = pipelineNames.some((n) => ['Onboarding', 'Upsell'].includes(n));

  const sections: Record<string, string[]> = {};
  if (isSales || (!isSales && !isOnboarding)) {
    Object.assign(sections, SALES_RESEARCH_SECTIONS);
  }
  if (isOnboarding) {
    Object.assign(sections, ONBOARDING_RESEARCH_SECTIONS);
  }

  function getFieldData(fieldName: string): ResearchField | null {
    for (const fields of Object.values(data)) {
      const found = fields.find((f) => f.field_name === fieldName);
      if (found) return found;
    }
    return null;
  }

  async function saveField(section: string, fieldName: string) {
    try {
      await fetch(`/api/contacts/${contactId}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, fieldValue: editValue, section, source: 'manual' }),
      });
      // Update local state
      const newData = { ...data };
      if (!newData[section]) newData[section] = [];
      const idx = newData[section].findIndex((f) => f.field_name === fieldName);
      if (idx >= 0) {
        newData[section][idx] = { field_name: fieldName, field_value: editValue, source: 'manual' };
      } else {
        newData[section].push({ field_name: fieldName, field_value: editValue, source: 'manual' });
      }
      setData(newData);
    } catch { /* ignore */ }
    setEditingField(null);
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
          className="flex-1 text-[12px] px-3 py-1.5 border border-white/[0.08] rounded-lg bg-[#0a0a0b] text-zinc-100 focus:outline-none focus:border-zinc-500"
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

      {/* Sections */}
      {Object.entries(sections).map(([sectionName, fields]) => {
        const filteredFields = search
          ? fields.filter((f) => f.toLowerCase().includes(search.toLowerCase()))
          : fields;

        if (filteredFields.length === 0) return null;

        return (
          <div key={sectionName} className="mb-5">
            <h3 className="text-[9px] font-semibold tracking-widest uppercase text-zinc-500 pb-1.5 mb-2 border-b border-white/[0.04]">
              {sectionName}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {filteredFields.map((fieldName) => {
                const fieldData = getFieldData(fieldName);
                const isEditing = editingField === fieldName;

                return (
                  <div
                    key={fieldName}
                    onClick={() => {
                      if (!isEditing) {
                        setEditingField(fieldName);
                        setEditValue(fieldData?.field_value ?? '');
                      }
                    }}
                    className="border border-white/[0.06] rounded-lg p-2.5 cursor-pointer hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium text-zinc-500 tracking-wide uppercase">{fieldName}</span>
                      {fieldData?.source && (
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${SOURCE_BADGE[fieldData.source] ?? 'bg-white/[0.06] text-zinc-400'}`}>
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
                            if (e.key === 'Enter') saveField(sectionName, fieldName);
                            if (e.key === 'Escape') setEditingField(null);
                          }}
                          className="text-[12px] w-full px-1.5 py-0.5 border border-white/[0.08] rounded bg-[#0a0a0b] text-zinc-100 focus:outline-none focus:border-zinc-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); saveField(sectionName, fieldName); }}
                            className="text-[10px] px-2 py-0.5 bg-white text-zinc-900 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingField(null); }}
                            className="text-[10px] px-2 py-0.5 text-zinc-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-[12px] mt-1 leading-snug ${fieldData?.field_value ? 'font-medium text-zinc-100' : 'text-zinc-600'}`}>
                        {fieldData?.field_value ?? '—'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
