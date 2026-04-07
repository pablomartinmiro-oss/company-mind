'use client';

import { useState } from 'react';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';
import { ChevronRight } from 'lucide-react';
import { getCompanyLabel } from '@/lib/company-labels';

interface CompanyRow {
  company_id: string;
  company_name: string;
  industry?: string | null;
  lead_source?: string | null;
  enrollments: { pipeline_name: string; stage: string }[];
  deal_value: string | null;
  days_in_stage: number;
  contact_count?: number;
  primary_contact_name?: string | null;
  primary_contact_role?: string | null;
}

interface Props {
  contacts: CompanyRow[];
  selectedStage: string | null;
  onClearStage: () => void;
}

const ROLE_PILL: Record<string, string> = {
  decision_maker: 'bg-violet-100/60 text-violet-700',
  champion: 'bg-emerald-100/60 text-emerald-700',
  influencer: 'bg-blue-100/60 text-blue-700',
  gatekeeper: 'bg-amber-100/60 text-amber-700',
  user: 'bg-zinc-100/60 text-zinc-500',
};

const ROLE_LABEL: Record<string, string> = {
  decision_maker: 'DM',
  champion: 'Champ',
  influencer: 'Infl',
  gatekeeper: 'GK',
  user: 'User',
};

function daysBadgeClass(days: number): string {
  if (days <= 1) return 'bg-emerald-50 text-emerald-600';
  if (days <= 3) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
}

export function CompanyList({ contacts, selectedStage, onClearStage }: Props) {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    const matchesSearch = !search ||
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.primary_contact_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesStage = !selectedStage || c.enrollments.some(e => e.stage === selectedStage);
    return matchesSearch && matchesStage;
  });

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/30">
        <input
          type="text"
          placeholder="Search company or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[12px] px-3 py-1.5 bg-white/50 border border-white/60 rounded-lg text-[#1a1a1a] focus:outline-none focus:border-zinc-400"
        />
        {selectedStage && (
          <button
            onClick={onClearStage}
            className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/30 text-zinc-700 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedStage}
            <span className="text-zinc-500">✕</span>
          </button>
        )}
      </div>

      {/* Company rows */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[13px] text-zinc-400">No companies found.</p>
        </div>
      ) : (
        filtered.map((company) => (
          <a
            key={company.company_id}
            href={`/companies/${company.company_id}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/30 last:border-0 hover:bg-white/30 cursor-pointer transition-colors"
          >
            {/* Days badge */}
            <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded text-center w-[44px] flex-shrink-0 ${daysBadgeClass(company.days_in_stage)}`}>
              {company.days_in_stage}d
            </span>

            {/* Company info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{company.company_name}</p>
                {(() => {
                  const label = getCompanyLabel(company.industry);
                  return label.label ? <span className={label.className}>{label.label}</span> : null;
                })()}
              </div>
            </div>

            {/* Lead source */}
            {company.lead_source && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 bg-teal-100/60 text-teal-700 border border-teal-200/40">
                {company.lead_source}
              </span>
            )}

            {/* Stage pills */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end max-w-[200px]">
              {company.enrollments.map((e) => (
                <span
                  key={`${e.pipeline_name}-${e.stage}`}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STAGE_PILL_CLASSES[e.stage] ?? 'bg-zinc-100 text-zinc-500'}`}
                >
                  {e.stage}
                </span>
              ))}
            </div>

            {/* Contact count */}
            {(company.contact_count ?? 0) > 0 && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 bg-blue-100/60 text-blue-700 border border-blue-200/40">
                {company.contact_count} {company.contact_count === 1 ? 'contact' : 'contacts'}
              </span>
            )}

            {/* Primary contact + role */}
            {company.primary_contact_name && (
              <div className="text-[11px] text-zinc-500 min-w-[100px] truncate flex items-center gap-1.5 flex-shrink-0">
                <span className="truncate">{company.primary_contact_name}</span>
                {company.primary_contact_role && (
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${ROLE_PILL[company.primary_contact_role] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {ROLE_LABEL[company.primary_contact_role] ?? company.primary_contact_role}
                  </span>
                )}
              </div>
            )}

            {/* Deal value */}
            <span className="text-[11px] font-mono text-zinc-500 min-w-[70px] text-right flex-shrink-0">
              {company.deal_value ?? '—'}
            </span>

            {/* Chevron */}
            <ChevronRight className="text-[14px] text-zinc-300 flex-shrink-0 h-3.5 w-3.5" />
          </a>
        ))
      )}
    </>
  );
}
