'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { timeAgo } from '@/lib/format';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

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
  const [userName, setUserName] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Resolve real user name from auth
  useEffect(() => {
    setSeenAt(localStorage.getItem(SEEN_KEY) ?? '');
    const sb = getSupabaseBrowser();
    if (!sb) return;
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data: row } = await sb.from('users').select('name').eq('auth_id', user.id).single();
      if (row?.name) setUserName(String(row.name));
    })();
  }, []);

  // Initial load from API
  useEffect(() => {
    let cancelled = false;
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { if (!cancelled) setMentions(data.mentions ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Realtime subscription — new activity_feed inserts push instantly
  useEffect(() => {
    if (!userName) return;
    const sb = getSupabaseBrowser();
    if (!sb) return;

    const channel = sb
      .channel('activity_mentions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            id: string;
            contact_id: string;
            type: string;
            content: { text?: string } | null;
            author: string | null;
            created_at: string;
          };

          if (row.type !== 'note') return;
          if (row.author === userName) return;
          const text = (row.content as Record<string, unknown>)?.text;
          if (typeof text !== 'string' || !text.includes(`@${userName}`)) return;

          setMentions(prev => [row, ...prev]);
        },
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [userName]);

  // Close on outside click
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

  const handleOpen = useCallback(() => {
    setOpen(prev => {
      if (!prev) {
        const now = new Date().toISOString();
        localStorage.setItem(SEEN_KEY, now);
        setSeenAt(now);
      }
      return !prev;
    });
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-500 hover:bg-white/40 hover:text-zinc-700 transition-all duration-150"
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#ff5a2d] text-white text-[9px] font-bold px-1 animate-pulse">
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
