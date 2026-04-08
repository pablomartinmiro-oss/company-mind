'use client';

import { useState } from 'react';
import type { FieldDefinition, FieldSource } from '@/lib/research/catalog';
import { SourceBadge } from './source-badge';

interface ResearchFieldProps {
  field: FieldDefinition;
  value: string | null;
  source?: string;
  sourceDetail?: string;
  onSave: (newValue: string) => Promise<void>;
}

export function ResearchField({ field, value, source, sourceDetail, onSave }: ResearchFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  const hasValue = value !== null && value !== undefined && value !== '';
  const displaySource = (source ?? field.primarySource) as FieldSource;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const colSpan =
    field.type === 'longtext' ? 'col-span-3' :
    field.type === 'multiselect' ? 'col-span-2' :
    'col-span-1';

  return (
    <div
      className={`${colSpan} relative bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-3 hover:bg-white/60 hover:border-white/70 transition-all cursor-pointer group`}
      onClick={() => !editing && setEditing(true)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[9px] font-medium text-zinc-500 tracking-wide uppercase leading-tight">
          {field.label}
        </span>
        {hasValue && <SourceBadge source={displaySource} sourceDetail={sourceDetail} />}
      </div>

      {editing ? (
        field.type === 'longtext' ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); } }}
            className="w-full mt-1 text-[12px] text-[#1a1a1a] bg-white/80 border border-white/80 rounded-lg p-2 focus:outline-none focus:border-[#ff6a3d]/40 resize-none min-h-[60px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : field.type === 'select' ? (
          <select
            autoFocus
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onBlur={handleSave}
            className="w-full mt-1 text-[11px] text-[#1a1a1a] bg-white/95 backdrop-blur-xl border border-white/60 rounded-lg p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:outline-none focus:border-[#ff6a3d]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">—</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            autoFocus
            type={field.type === 'number' || field.type === 'score' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
            }}
            className="w-full mt-1 text-[12px] text-[#1a1a1a] bg-white/80 border border-white/80 rounded-lg px-2 py-1 focus:outline-none focus:border-[#ff6a3d]/40"
            onClick={(e) => e.stopPropagation()}
          />
        )
      ) : hasValue ? (
        <div className="text-[12px] text-[#1a1a1a] font-medium leading-snug break-words">{value}</div>
      ) : (
        <div className="text-[12px] text-zinc-300 italic">—</div>
      )}
    </div>
  );
}
