'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TIME_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'All time', value: 'all' },
];

const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Qualification Call', value: 'qualification' },
  { label: 'Closing Call', value: 'closing' },
  { label: 'Follow Up', value: 'follow_up' },
  { label: 'Onboarding Call', value: 'onboarding' },
  { label: 'Admin Call', value: 'admin' },
];

const OUTCOME_OPTIONS = [
  { label: 'All outcomes', value: '' },
  { label: 'Follow-up scheduled', value: 'follow_up_scheduled' },
  { label: 'Not interested', value: 'not_interested' },
  { label: 'Closed', value: 'closed_won' },
  { label: 'No answer', value: 'no_answer' },
  { label: 'Voicemail', value: 'voicemail' },
];

const selectClass = 'text-[12px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-[#0a0a0b] text-zinc-400 focus:outline-none focus:border-zinc-500';

export function CallFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <select
        className={selectClass}
        value={searchParams.get('time') ?? '7'}
        onChange={(e) => updateParam('time', e.target.value)}
      >
        {TIME_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        className={selectClass}
        value={searchParams.get('type') ?? ''}
        onChange={(e) => updateParam('type', e.target.value)}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        className={selectClass}
        value={searchParams.get('outcome') ?? ''}
        onChange={(e) => updateParam('outcome', e.target.value)}
      >
        {OUTCOME_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
