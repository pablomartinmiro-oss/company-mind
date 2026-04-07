'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-modal';

export function ReEnrichButton({ companyId }: { companyId: string }) {
  const [running, setRunning] = useState(false);
  const confirm = useConfirm();

  const handleClick = async () => {
    const confirmed = await confirm({
      title: 'Re-enrich contact data?',
      description: 'Claude will research this company using web search and AI inference. API and AI-sourced fields will be overwritten with fresh data. Manually entered fields are preserved.',
      confirmLabel: 'Re-enrich',
      variant: 'destructive',
    });
    if (!confirmed) return;

    setRunning(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/enrich`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await confirm({
          title: 'Enrichment complete',
          description: `Updated ${data.company_fields_updated + data.contact_fields_updated} fields.`,
          confirmLabel: 'OK',
          cancelLabel: null,
        });
        window.location.reload();
      } else {
        await confirm({
          title: 'Enrichment failed',
          description: data.error ?? 'An unknown error occurred.',
          confirmLabel: 'OK',
          cancelLabel: null,
          variant: 'destructive',
        });
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={running}
      className="bg-white/60 backdrop-blur border border-white/70 text-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-white/80 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      {running ? (
        <><Loader2 className="w-3 h-3 animate-spin" /> Enriching…</>
      ) : (
        <><Sparkles className="w-3 h-3" /> Re-enrich</>
      )}
    </button>
  );
}
