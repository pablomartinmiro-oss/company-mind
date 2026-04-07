'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export function ReEnrichButton({ companyId }: { companyId: string }) {
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    if (!confirm('Re-enrich this company? This will use Claude to research the company and may take 30-60 seconds.')) return;
    setRunning(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/enrich`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Updated ${data.company_fields_updated + data.contact_fields_updated} fields`);
        window.location.reload();
      } else {
        alert(`Failed: ${data.error}`);
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
