'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { STAGE_PILL_CLASSES } from '@/lib/pipeline-config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateContactModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const canSubmit = companyName.trim() !== '' && firstName.trim() !== '' && lastName.trim() !== '' && !loading;

  async function handleSubmit() {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          website: website.trim() || undefined,
          location: location.trim() || undefined,
          industry: industry.trim() || undefined,
          leadSource: leadSource.trim() || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      // Success — close modal and navigate to new company
      onClose();
      if (data.companyId) {
        router.push(`/companies/${data.companyId}`);
      } else {
        router.refresh();
      }
    } catch {
      setErrorMessage('Network error — please try again');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-[440px] max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-medium text-zinc-900">New Company</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Company fields */}
        <FieldBlock label="COMPANY NAME" value={companyName} onChange={setCompanyName} required />
        <FieldBlock label="WEBSITE" value={website} onChange={setWebsite} placeholder="www.example.com" />
        <FieldBlock label="LOCATION" value={location} onChange={setLocation} placeholder="Nashville, TN" />
        <FieldBlock label="INDUSTRY" value={industry} onChange={setIndustry} />
        <FieldBlock label="LEAD SOURCE" value={leadSource} onChange={setLeadSource} />

        <div className="border-t border-zinc-100 my-4" />

        {/* Primary contact */}
        <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-3">
          PRIMARY CONTACT
        </div>
        <FieldBlock label="FIRST NAME" value={firstName} onChange={setFirstName} required />
        <FieldBlock label="LAST NAME" value={lastName} onChange={setLastName} required />
        <FieldBlock label="EMAIL" value={email} onChange={setEmail} type="email" />
        <FieldBlock label="PHONE" value={phone} onChange={setPhone} type="tel" />

        <div className="border-t border-zinc-100 my-4" />

        {/* Adding To pills */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1.5">
            ADDING TO
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-zinc-100 text-zinc-500 text-[10px] px-2.5 py-1 rounded-full">
              Sales Pipeline
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full ${STAGE_PILL_CLASSES['New Lead']}`}>
              New Lead
            </span>
          </div>
        </div>

        {/* Inline error */}
        {errorMessage && (
          <p className="text-[12px] text-red-500 mt-2">{errorMessage}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="text-[13px] text-zinc-500 hover:text-zinc-800 px-3 py-2 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-all duration-150"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">
        {label}{required && ' *'}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150"
      />
    </div>
  );
}
