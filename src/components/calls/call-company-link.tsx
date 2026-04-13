'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface Props {
  contactGhlId: string;
}

export function CallCompanyLink({ contactGhlId }: Props) {
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!contactGhlId) return;
    fetch(`/api/contacts/${contactGhlId}/company`)
      .then(r => r.json())
      .then(data => {
        if (data.company_id && data.company_name) {
          setCompany({ id: data.company_id, name: data.company_name });
        }
      })
      .catch(() => {});
  }, [contactGhlId]);

  if (!company) return null;

  return (
    <Link
      href={`/companies/${company.id}`}
      className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-700 hover:underline underline-offset-2 transition-colors mb-3"
    >
      <Building2 className="h-3.5 w-3.5" />
      {company.name}
    </Link>
  );
}
