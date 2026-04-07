'use client';

import { useState } from 'react';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { ChevronRight } from 'lucide-react';

interface CompanyContact {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  enrollments: { pipeline_name: string; stage: string }[];
  deal_value: string | null;
  days_in_stage: number;
}

interface Props {
  contacts: CompanyContact[];
  selectedStage: string | null;
  onClearStage: () => void;
}

function daysBadgeClass(days: number): string {
  if (days <= 1) return 'bg-emerald-500/10 text-emerald-300';
  if (days <= 3) return 'bg-amber-500/10 text-amber-300';
  return 'bg-red-500/10 text-red-400';
}

export function CompanyList({ contacts, selectedStage, onClearStage }: Props) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    const matchesSearch = !search ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = !selectedStage || c.enrollments.some(e => e.stage === selectedStage);
    return matchesSearch && matchesStage;
  });

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
        <input
          type="text"
          placeholder="Search name, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[12px] px-3 py-1.5 border border-white/[0.08] rounded-lg bg-[#0a0a0b] text-zinc-100 focus:outline-none focus:border-zinc-500"
        />
        {selectedStage && (
          <button
            onClick={onClearStage}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/[0.06] text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedStage}
            <span className="text-zinc-500">✕</span>
          </button>
        )}
      </div>

      {/* Company rows */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-zinc-600">No companies found.</p>
        </div>
      ) : (
        filtered.map((contact) => (
          <a
            key={contact.contact_id}
            href={`/contacts/${contact.contact_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] cursor-pointer"
          >
            {/* Days badge */}
            <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-center w-[44px] flex-shrink-0 ${daysBadgeClass(contact.days_in_stage)}`}>
              {contact.days_in_stage}d
            </span>

            {/* Company info — company name primary, contact name secondary */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-100">{contact.company_name || contact.contact_name}</p>
              {contact.company_name && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{contact.contact_name}</p>
              )}
            </div>

            {/* Multi-pipeline stage pills */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end max-w-[300px]">
              {contact.enrollments.map((e) => (
                <span
                  key={`${e.pipeline_name}-${e.stage}`}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STAGE_PILL_CLASSES[e.stage] ?? 'bg-white/[0.06] text-zinc-400'}`}
                  title={e.pipeline_name}
                >
                  <span className="text-[8px] opacity-60">{e.pipeline_name} · </span>{e.stage}
                </span>
              ))}
            </div>

            {/* Deal value */}
            <span className="text-[11px] font-mono text-zinc-500 min-w-[70px] text-right flex-shrink-0">
              {contact.deal_value ?? '—'}
            </span>

            {/* Chevron */}
            <ChevronRight className="text-[14px] text-zinc-600 flex-shrink-0 h-3.5 w-3.5" />
          </a>
        ))
      )}
    </>
  );
}
