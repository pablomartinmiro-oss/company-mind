'use client';

import { useState, useEffect } from 'react';
import { CONTACT_SECTIONS } from '@/lib/research/catalog';
import { ResearchSection } from '@/components/research/research-section';

interface ResearchData {
  value: string;
  source: string;
  source_detail?: string;
}

interface Props {
  contactId: string;
  initialData?: Record<string, ResearchData>;
}

export function ContactResearchPanel({ contactId, initialData }: Props) {
  const [data, setData] = useState<Record<string, ResearchData>>(initialData ?? {});
  const [loaded, setLoaded] = useState(!!initialData);

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    fetch(`/api/contacts/${contactId}/research`)
      .then(r => r.json())
      .then(res => {
        if (!cancelled) {
          setData(res.research ?? {});
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [contactId, initialData]);

  const saveField = async (fieldKey: string, value: string) => {
    await fetch(`/api/contacts/${contactId}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName: fieldKey, fieldValue: value, source: 'manual' }),
    });
    setData(prev => ({ ...prev, [fieldKey]: { value, source: 'manual' } }));
  };

  if (!loaded) {
    return <div className="text-[12px] text-zinc-400 py-4">Loading research...</div>;
  }

  return (
    <div className="space-y-4">
      {CONTACT_SECTIONS.map(section => (
        <ResearchSection
          key={`${contactId}-${section.key}`}
          section={section}
          data={data}
          onSave={saveField}
        />
      ))}
    </div>
  );
}
