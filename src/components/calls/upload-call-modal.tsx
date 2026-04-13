'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, FileText, FileVideo, Check } from 'lucide-react';
import { TEAM_MEMBERS, CALL_TYPE_LABELS } from '@/lib/pipeline-config';

interface CompanyOption {
  id: string;
  name: string;
  contacts: { contact_id: string; contact_name: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyOption[];
}

export function UploadCallModal({ isOpen, onClose, companies }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [repName, setRepName] = useState<string>(TEAM_MEMBERS[0]?.name ?? '');
  const [callType, setCallType] = useState('proposal');
  const [calledAt, setCalledAt] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const selectedCompany = companies.find(c => c.id === companyId);
  const contacts = selectedCompany?.contacts ?? [];
  const canSubmit = file && companyId && selectedContacts.length > 0 && repName && !loading;

  const isVideo = file?.type?.startsWith('video/') || file?.name?.endsWith('.mp4');
  const isText = file?.type === 'text/plain' || file?.name?.endsWith('.txt');

  function toggleContact(id: string) {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!file || !companyId || selectedContacts.length === 0) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const primaryContact = selectedContacts[0];
      const primaryName = contacts.find(c => c.contact_id === primaryContact)?.contact_name ?? '';
      const allNames = selectedContacts.map(id => contacts.find(c => c.contact_id === id)?.contact_name ?? '').filter(Boolean);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);
      formData.append('contactId', primaryContact);
      formData.append('contactName', allNames.join(', '));
      formData.append('contactIds', JSON.stringify(selectedContacts));
      formData.append('repName', repName);
      formData.append('callType', callType);
      formData.append('calledAt', new Date(calledAt).toISOString());

      const res = await fetch('/api/calls/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Upload failed');
        setLoading(false);
        return;
      }
      onClose();
      router.push(`/calls/${data.callId}`);
    } catch {
      setErrorMessage('Network error — please try again');
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = f.name.endsWith('.mp4') || f.name.endsWith('.txt') || f.type === 'text/plain' || f.type.startsWith('video/');
    if (!valid) {
      setErrorMessage('Only .mp4 and .txt files are supported');
      return;
    }
    setErrorMessage('');
    setFile(f);
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl w-[460px] max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[15px] font-medium text-zinc-900">Upload Call</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-all duration-150">
            <X size={16} />
          </button>
        </div>

        {/* File upload */}
        <div className="mb-4">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">FILE *</div>
          <input ref={fileRef} type="file" accept=".mp4,.txt,video/mp4,text/plain" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg bg-white">
              {isVideo ? <FileVideo className="h-4 w-4 text-violet-500" /> : <FileText className="h-4 w-4 text-blue-500" />}
              <span className="text-[13px] text-zinc-700 flex-1 truncate">{file.name}</span>
              <button onClick={() => setFile(null)} className="text-zinc-400 hover:text-zinc-700"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-4 border-2 border-dashed border-zinc-200 rounded-lg text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all duration-150"
            >
              <Upload className="h-4 w-4" />
              <span className="text-[12px]">Drop .mp4 or .txt file, or click to browse</span>
            </button>
          )}
        </div>

        <div className="border-t border-zinc-100 my-4" />

        {/* Company */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">COMPANY *</div>
          <select
            value={companyId}
            onChange={e => { setCompanyId(e.target.value); setSelectedContacts([]); }}
            className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150"
          >
            <option value="">Select company...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Contacts (multi-select) */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">
            CONTACTS ON CALL * <span className="normal-case tracking-normal text-zinc-300">(select all that apply)</span>
          </div>
          {!companyId ? (
            <p className="text-[12px] text-zinc-400 py-2">Select a company first</p>
          ) : contacts.length === 0 ? (
            <p className="text-[12px] text-zinc-400 py-2">No contacts for this company</p>
          ) : (
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              {contacts.map(c => {
                const checked = selectedContacts.includes(c.contact_id);
                return (
                  <button
                    key={c.contact_id}
                    type="button"
                    onClick={() => toggleContact(c.contact_id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-zinc-100 last:border-0 transition-all duration-150 ${
                      checked ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                      checked ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300'
                    }`}>
                      {checked && <Check className="h-2 w-2" />}
                    </div>
                    <span className="text-[13px] text-zinc-700">{c.contact_name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Team member */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">TEAM MEMBER *</div>
          <select
            value={repName}
            onChange={e => setRepName(e.target.value)}
            className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150"
          >
            {TEAM_MEMBERS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        {/* Call type */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">CALL TYPE *</div>
          <select
            value={callType}
            onChange={e => setCallType(e.target.value)}
            className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150"
          >
            {Object.entries(CALL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Date/time */}
        <div className="mb-3">
          <div className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mb-1">DATE & TIME *</div>
          <input
            type="datetime-local"
            value={calledAt}
            onChange={e => setCalledAt(e.target.value)}
            className="w-full text-[13px] px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-400 transition-all duration-150"
          />
        </div>

        {/* Error */}
        {errorMessage && <p className="text-[12px] text-red-500 mt-2">{errorMessage}</p>}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-zinc-100">
          <button onClick={onClose} className="text-[13px] text-zinc-500 hover:text-zinc-800 px-3 py-2 transition-all duration-150">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-all duration-150"
          >
            {loading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
}
