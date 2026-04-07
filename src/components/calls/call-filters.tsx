'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SelectPill } from '@/components/ui/select-pill';

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
      <SelectPill
        value={searchParams.get('time') ?? '7'}
        onChange={(v) => updateParam('time', v)}
        options={TIME_OPTIONS}
      />
      <SelectPill
        value={searchParams.get('type') ?? ''}
        onChange={(v) => updateParam('type', v)}
        options={TYPE_OPTIONS}
        placeholder="All types"
      />
      <SelectPill
        value={searchParams.get('outcome') ?? ''}
        onChange={(v) => updateParam('outcome', v)}
        options={OUTCOME_OPTIONS}
        placeholder="All outcomes"
      />
    </div>
  );
}
