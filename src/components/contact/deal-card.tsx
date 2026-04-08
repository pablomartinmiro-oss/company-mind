'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

function formatUsd(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

interface Props {
  companyId: string | null;
  mrr: number | null;
  setupFee: number | null;
}

export function DealCard({ companyId, mrr, setupFee }: Props) {
  const [mrrVal, setMrrVal] = useState(mrr);
  const [feeVal, setFeeVal] = useState(setupFee);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(field: string, value: number | null) {
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Save failed');
      if (field === 'mrr') setMrrVal(value);
      if (field === 'setup_fee') setFeeVal(value);
    } catch {
      setError('Failed to save');
      // Revert
      if (field === 'mrr') setMrrVal(mrr);
      if (field === 'setup_fee') setFeeVal(setupFee);
    }
    setSaving(false);
    setEditingField(null);
  }

  const disabled = !companyId;
  const arr = mrrVal ? mrrVal * 12 : null;

  return (
    <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl ring-1 ring-white/40 p-4">
      <h3 className="text-[10px] font-semibold tracking-widest uppercase text-[#71717a] mb-3">Deal</h3>

      <EditableRow
        label="MRR"
        value={mrrVal}
        format={v => formatUsd(v)}
        field="mrr"
        editing={editingField === 'mrr'}
        onEdit={() => !disabled && setEditingField('mrr')}
        onSave={v => save('mrr', v)}
        onCancel={() => setEditingField(null)}
        saving={saving}
        disabled={disabled}
      />

      <div className="flex items-center justify-between py-2 border-b border-white/40">
        <span className="text-[12px] text-[#52525b]">ARR</span>
        <span className="text-[13px] font-mono text-[#1a1a1a]">{arr ? formatUsd(arr) : '—'}</span>
      </div>

      <EditableRow
        label="Setup fee"
        value={feeVal}
        format={v => formatUsd(v)}
        field="setup_fee"
        editing={editingField === 'setup_fee'}
        onEdit={() => !disabled && setEditingField('setup_fee')}
        onSave={v => save('setup_fee', v)}
        onCancel={() => setEditingField(null)}
        saving={saving}
        disabled={disabled}
      />

      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function EditableRow({
  label, value, format, editing, onEdit, onSave, onCancel, saving, disabled,
}: {
  label: string;
  value: number | null;
  format: (v: number) => string;
  field: string;
  editing: boolean;
  onEdit: () => void;
  onSave: (v: number | null) => void;
  onCancel: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(String(value ?? ''));

  function handleSave() {
    const num = draft.trim() === '' ? null : parseInt(draft, 10);
    if (num !== null && (isNaN(num) || num < 0)) return;
    onSave(num);
  }

  if (editing) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/40">
        <span className="text-[12px] text-[#52525b]">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-[#52525b]">$</span>
          <input
            autoFocus
            type="number"
            min="0"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
            onBlur={handleSave}
            className="w-20 text-[13px] font-mono text-[#1a1a1a] bg-white/80 border border-white/80 rounded px-1.5 py-0.5 focus:outline-none focus:border-zinc-400"
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
      <span className="text-[13px] font-mono text-[#1a1a1a]">{value !== null && value !== undefined ? format(value) : '—'}</span>
    </div>
  );
}
