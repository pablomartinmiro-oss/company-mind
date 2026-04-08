'use client';

import { useState } from 'react';
import Link from 'next/link';
import { scoreGrade } from '@/lib/format';
import { CALL_TYPE_PILL, CALL_TYPE_LABELS } from '@/lib/pipeline-config';
import { MentionInput } from '@/components/ui/mention-input';

interface ActivityEntry {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  author: string | null;
  created_at: string;
}

interface Props {
  contactId: string;
  initialEntries: ActivityEntry[];
}

export function ActivityFeed({ contactId, initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [noteText, setNoteText] = useState('');
  const [posting, setPosting] = useState(false);

  async function postNote() {
    if (!noteText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, content: noteText, type: 'note' }),
      });
      const data = await res.json();
      if (data.entry) {
        setEntries([data.entry, ...entries]);
      }
      setNoteText('');
    } catch { /* ignore */ }
    setPosting(false);
  }

  return (
    <div>
      {/* Note input with @ mention autocomplete */}
      <MentionInput
        value={noteText}
        onChange={setNoteText}
        placeholder="Add a note... use @ to tag a team member"
        className="bg-white/50 border border-white/60 rounded-lg px-3 py-2 text-[13px] text-[#1a1a1a] w-full resize-none min-h-[64px] mb-2 focus:outline-none focus:border-zinc-400"
      />
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-zinc-500">@ to mention · Shift+Enter for new line</span>
        <button
          onClick={postNote}
          disabled={posting || !noteText.trim()}
          className="px-3 py-1.5 bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] text-white text-[12px] font-medium rounded-full disabled:opacity-40"
        >
          Post
        </button>
      </div>

      {/* Feed */}
      {entries.map((entry) => {
        const initials = entry.author
          ? entry.author.split(' ').map((n) => n[0]).join('').slice(0, 2)
          : '?';

        return (
          <div key={entry.id} className="flex gap-2.5 py-3 border-b border-white/30 last:border-0">
            {/* Avatar */}
            <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-semibold ${
              entry.type === 'note'
                ? 'bg-zinc-700 text-white'
                : entry.type === 'call_logged'
                ? 'bg-blue-50 text-blue-700 text-[11px]'
                : 'bg-white/30 text-zinc-500 text-[12px]'
            }`}>
              {entry.type === 'stage_moved' ? '⇄' : entry.type === 'call_logged' ? String((entry.content as Record<string, unknown>)?.score ?? '?') : initials}
            </div>

            <div className="flex-1 min-w-0">
              {/* Meta */}
              <div className="flex items-center gap-1.5">
                {entry.author && <span className="text-[11px] font-medium text-[#1a1a1a]">{entry.author}</span>}
                <span className="text-[11px] text-zinc-500">
                  {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}
                  {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Content */}
              {entry.type === 'note' && (
                <p className="text-[12px] text-zinc-700 leading-relaxed mt-0.5">
                  {String((entry.content as Record<string, unknown>)?.text ?? '')}
                </p>
              )}
              {entry.type === 'call_logged' && (
                <Link
                  href={`/calls/${(entry.content as Record<string, unknown>)?.callId}`}
                  className="border border-white/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/30 mt-1 block"
                >
                  <div className="flex items-center gap-2">
                    {Boolean((entry.content as Record<string, unknown>)?.callType) && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        CALL_TYPE_PILL[String((entry.content as Record<string, unknown>).callType)] ?? 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {CALL_TYPE_LABELS[String((entry.content as Record<string, unknown>).callType)] ?? String((entry.content as Record<string, unknown>).callType)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {String((entry.content as Record<string, unknown>)?.summary ?? '')}
                  </p>
                </Link>
              )}
              {entry.type === 'stage_moved' && (
                <div className="inline-flex items-center gap-1.5 text-[12px] text-zinc-700 bg-white/30 rounded-lg px-3 py-1.5 mt-1">
                  {String((entry.content as Record<string, unknown>)?.from ?? '')} → {String((entry.content as Record<string, unknown>)?.to ?? '')}
                  <span className="text-[10px] text-zinc-500 ml-1">
                    {String((entry.content as Record<string, unknown>)?.pipeline ?? '')}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-[13px] text-zinc-400">No activity yet.</p>
        </div>
      )}
    </div>
  );
}
