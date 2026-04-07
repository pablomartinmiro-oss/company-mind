'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SectionDefinition, FieldSource } from '@/lib/research/catalog';
import { ResearchField } from './research-field';

interface ResearchData {
  value: string;
  source: string;
  source_detail?: string;
}

interface ResearchSectionProps {
  section: SectionDefinition;
  data: Record<string, ResearchData>;
  onSave: (fieldKey: string, value: string) => Promise<void>;
}

export function ResearchSection({ section, data, onSave }: ResearchSectionProps) {
  const [collapsed, setCollapsed] = useState(section.collapsedByDefault ?? false);

  const filledCount = section.fields.filter(f => {
    const v = data[f.key]?.value;
    return v !== null && v !== undefined && v !== '';
  }).length;

  const completionPct = section.fields.length > 0
    ? Math.round((filledCount / section.fields.length) * 100)
    : 0;

  return (
    <div className="relative bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-3xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
          <div className="text-left">
            <h3 className="text-[13px] font-semibold text-zinc-900">{section.label}</h3>
            {section.description && <p className="text-[10px] text-zinc-500 mt-0.5">{section.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400">{filledCount}/{section.fields.length}</span>
          <div className="w-12 h-1 rounded-full bg-zinc-200/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#ff7a4d] to-[#ff5a2d] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          {section.fields.map(field => (
            <ResearchField
              key={field.key}
              field={field}
              value={data[field.key]?.value ?? null}
              source={data[field.key]?.source}
              sourceDetail={data[field.key]?.source_detail}
              onSave={(val) => onSave(field.key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
