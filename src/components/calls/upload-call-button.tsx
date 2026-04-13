'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { UploadCallModal } from './upload-call-modal';

interface CompanyOption {
  id: string;
  name: string;
  contacts: { contact_id: string; contact_name: string }[];
}

interface Props {
  companies: CompanyOption[];
}

export function UploadCallButton({ companies }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-zinc-900 text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 transition-all duration-150"
      >
        <Plus size={14} />
        Upload Call
      </button>
      <UploadCallModal isOpen={open} onClose={() => setOpen(false)} companies={companies} />
    </>
  );
}
