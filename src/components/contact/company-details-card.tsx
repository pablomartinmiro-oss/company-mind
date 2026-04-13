'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LEAD_SOURCES } from '@/lib/pipeline-config';

interface Props {
  companyId: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  leadSource: string | null;
}

export function CompanyDetailsCard({ companyId, website, location, industry, leadSource }: Props) {
  const [values, setValues] = useState({ website, location, industry, leadSource });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !companyId;

  async function save(field: string, dbField: string, value: string | null) {
    if (!companyId) return;
    setSaving(true);
    setError(null);
    const prev = { ...values };
    const next = { ...values, [field]: value };
    setValues(next);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [dbField]: value || null }),
      });
      if (!res.ok) throw new Error('Save failed');

      // If all 4 detail fields are now filled, trigger enrichment
      if (next.website && next.location && next.industry && next.leadSource) {
        fetch(`/api/companies/${companyId}/enrich`, { method: 'POST' })
          .catch(err => console.error('enrichment trigger failed:', err));
      }
    } catch {
      setError('Failed to save');
      setValues(prev);
    }
    setSaving(false);
    setEditingField(null);
  }

  return (
    <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl ring-1 ring-white/40 p-4">
      <h3 className="text-[10px] font-semibold tracking-widest uppercase text-[#71717a] mb-3">Company Details</h3>

      <EditableTextRow
        label="Website"
        value={values.website}
        editing={editingField === 'website'}
        onEdit={() => !disabled && setEditingField('website')}
        onSave={v => save('website', 'website', v)}
        onCancel={() => setEditingField(null)}
        saving={saving && editingField === 'website'}
        disabled={disabled}
      />

      <EditableTextRow
        label="Location"
        value={values.location}
        editing={editingField === 'location'}
        onEdit={() => !disabled && setEditingField('location')}
        onSave={v => save('location', 'location', v)}
        onCancel={() => setEditingField(null)}
        saving={saving && editingField === 'location'}
        disabled={disabled}
      />

      <EditableTextRow
        label="Industry"
        value={values.industry}
        editing={editingField === 'industry'}
        onEdit={() => !disabled && setEditingField('industry')}
        onSave={v => save('industry', 'industry', v)}
        onCancel={() => setEditingField(null)}
        saving={saving && editingField === 'industry'}
        disabled={disabled}
      />

      <EditableSelectRow
        label="Lead Source"
        value={values.leadSource}
        options={LEAD_SOURCES as unknown as string[]}
        editing={editingField === 'leadSource'}
        onEdit={() => !disabled && setEditingField('leadSource')}
        onSave={v => save('leadSource', 'lead_source', v)}
        onCancel={() => setEditingField(null)}
        saving={saving && editingField === 'leadSource'}
        disabled={disabled}
      />

      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function EditableTextRow({
  label, value, editing, onEdit, onSave, onCancel, saving, disabled,
}: {
  label: string;
  value: string | null;
  editing: boolean;
  onEdit: () => void;
  onSave: (v: string | null) => void;
  onCancel: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(value ?? '');

  function handleSave() {
    onSave(draft.trim() || null);
  }

  if (editing) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/40">
        <span className="text-[12px] text-[#52525b]">{label}</span>
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
            onBlur={handleSave}
            className="w-36 text-[13px] text-[#1a1a1a] bg-white/80 border border-white/80 rounded px-1.5 py-0.5 focus:outline-none focus:border-zinc-400"
          />
          {saving && <Loader2 className="w-3 h-3 animate-spin text-[#71717a]" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-white/40 ${disabled ? '' : 'cursor-pointer hover:bg-white/30'}`}
      onClick={onEdit}
    >
      <span className="text-[12px] text-[#52525b]">{label}</span>
      <span className="text-[13px] text-[#1a1a1a]">{value ?? '—'}</span>
    </div>
  );
}

function EditableSelectRow({
  label, value, options, editing, onEdit, onSave, onCancel, saving, disabled,
}: {
  label: string;
  value: string | null;
  options: string[];
  editing: boolean;
  onEdit: () => void;
  onSave: (v: string | null) => void;
  onCancel: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/40 last:border-0">
        <span className="text-[12px] text-[#52525b]">{label}</span>
        <div className="flex items-center gap-1">
          <select
            autoFocus
            value={value ?? ''}
            onChange={e => onSave(e.target.value || null)}
            onBlur={onCancel}
            className="text-[13px] text-[#1a1a1a] bg-white/80 border border-white/80 rounded px-1.5 py-0.5 focus:outline-none focus:border-zinc-400"
          >
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {saving && <Loader2 className="w-3 h-3 animate-spin text-[#71717a]" />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-white/40 last:border-0 ${disabled ? '' : 'cursor-pointer hover:bg-white/30'}`}
      onClick={onEdit}
    >
      <span className="text-[12px] text-[#52525b]">{label}</span>
      <span className="text-[13px] text-[#1a1a1a]">{value ?? '—'}</span>
    </div>
  );
}
