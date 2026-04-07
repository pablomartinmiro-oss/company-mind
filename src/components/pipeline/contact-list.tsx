'use client';

import { useState } from 'react';
import Link from 'next/link';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { scoreBg, scoreGrade } from '@/lib/format';
import { ChevronRight } from 'lucide-react';

interface PipelineContact {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  stage: string;
  score: number | null;
  deal_value: string | null;
  days_in_stage: number;
}

interface Props {
  contacts: PipelineContact[];
  selectedStage: string | null;
  onClearStage: () => void;
}

function daysBadgeClass(days: number): string {
  if (days <= 1) return 'bg-emerald-50 text-emerald-600';
  if (days <= 3) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
}

export function ContactList({ contacts, selectedStage, onClearStage }: Props) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    const matchesSearch = !search ||
      c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = !selectedStage || c.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
        <input
          type="text"
          placeholder="Search name, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[12px] px-3 py-1.5 border border-white/[0.08] rounded-lg bg-white/[0.03] text-zinc-100 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-500"
        />
        {selectedStage && (
          <button
            onClick={onClearStage}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedStage}
            <span className="text-zinc-400">✕</span>
          </button>
        )}
      </div>

      {/* Company rows */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-zinc-300">No companies found.</p>
        </div>
      ) : (
        filtered.map((contact) => (
          <Link
            key={`${contact.contact_id}-${contact.stage}`}
            href={`/contacts/${contact.contact_id}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 cursor-pointer"
          >
            {/* Days badge */}
            <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-center w-[44px] flex-shrink-0 ${daysBadgeClass(contact.days_in_stage)}`}>
              {contact.days_in_stage}d
            </span>

            {/* Company info — company name primary, contact name secondary */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-zinc-100">{contact.company_name || contact.contact_name}</p>
              {contact.company_name && (
                <p className="text-[11px] text-zinc-400 mt-0.5">{contact.contact_name}</p>
              )}
            </div>

            {/* Stage pill */}
            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STAGE_PILL_CLASSES[contact.stage] ?? 'bg-zinc-100 text-zinc-500'}`}>
              {contact.stage}
            </span>

            {/* Score pill */}
            {contact.score != null ? (
              <span className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${scoreBg(contact.score)}`}>
                {contact.score} {scoreGrade(contact.score).letter}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-300 flex-shrink-0">—</span>
            )}

            {/* Deal value */}
            <span className="text-[11px] font-mono text-zinc-400 min-w-[70px] text-right flex-shrink-0">
              {contact.deal_value ?? '—'}
            </span>

            {/* Chevron */}
            <ChevronRight className="text-[14px] text-zinc-300 flex-shrink-0 h-3.5 w-3.5" />
          </Link>
        ))
      )}
    </>
  );
}
