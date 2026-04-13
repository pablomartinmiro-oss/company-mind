'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { timeAgo } from '@/lib/format';

interface Mention {
  id: string;
  contact_id: string;
  content: { text?: string } | null;
  author: string | null;
  created_at: string;
}

const SEEN_KEY = 'notifications_seen_at';

export function NotificationBell() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string>('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeenAt(localStorage.getItem(SEEN_KEY) ?? '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMentions(data.mentions ?? []);
      } catch { /* ignore */ }
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = seenAt
    ? mentions.filter(m => m.created_at > seenAt).length
    : mentions.length;

  function handleOpen() {
    setOpen(!open);
    if (!open) {
      const now = new Date().toISOString();
      localStorage.setItem(SEEN_KEY, now);
      setSeenAt(now);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-500 hover:bg-white/40 hover:text-zinc-700 transition-all duration-150"
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#ff5a2d] text-white text-[9px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-full ml-2 mb-0 z-50 w-[280px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] py-1 max-h-[320px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-zinc-100">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500">Mentions</span>
          </div>
          {mentions.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[12px] text-zinc-400">No mentions yet</p>
            </div>
          ) : (
            mentions.map(m => {
              const text = (m.content as Record<string, unknown>)?.text as string ?? '';
              const isUnread = seenAt ? m.created_at > seenAt : false;
              return (
                <a
                  key={m.id}
                  href={`/contacts/${m.contact_id}`}
                  className={`block px-3 py-2 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${isUnread ? 'bg-orange-50/40' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#1a1a1a]">{m.author}</span>
                    <span className="text-[10px] text-zinc-400">{timeAgo(m.created_at)}</span>
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a2d] flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2">{text}</p>
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
