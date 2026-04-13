'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface Props {
  contactName: string;
  contactGhlId: string;
}

export function CallHeaderInfo({ contactName, contactGhlId }: Props) {
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

  const names = contactName
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  const isMulti = names.length > 1;

  return (
    <div>
      {/* Company name as primary heading when multi-contact, or when company is known */}
      {company && isMulti ? (
        <Link
          href={`/companies/${company.id}`}
          className="text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight hover:underline underline-offset-4 inline-flex items-center gap-2"
        >
          {company.name}
          <Building2 className="h-5 w-5 text-zinc-400" />
        </Link>
      ) : (
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight">
          {names[0] ?? contactName}
        </h1>
      )}

      {/* Contact pills for multi-contact calls */}
      {isMulti && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {names.map(name => (
            <span
              key={name}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Company link for single-contact calls */}
      {company && !isMulti && (
        <Link
          href={`/companies/${company.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-700 hover:underline underline-offset-2 transition-colors mt-1"
        >
          <Building2 className="h-3.5 w-3.5" />
          {company.name}
        </Link>
      )}
    </div>
  );
}
