'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Phone, Building2, Settings, Brain, LogOut } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { CURRENT_USER } from '@/lib/tenant-context';
import { getTeamMember } from '@/lib/pipeline-config';
import { useConfirm } from '@/components/ui/confirm-modal';
import { NotificationBell } from './notification-bell';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Daily HQ' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/companies', icon: Building2, label: 'Companies' },
];

function UserAvatarMenu() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: CURRENT_USER.name, email: CURRENT_USER.email });
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const confirmDialog = useConfirm();

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      sb.from('users').select('name').eq('auth_id', data.user.id).single()
        .then(({ data: appUser }) => {
          if (appUser?.name) {
            setCurrentUser({ name: appUser.name as string, email: data.user!.email ?? '' });
          }
        });
    });
  }, []);

  const member = getTeamMember(currentUser.name);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignOut = async () => {
    const confirmed = await confirmDialog({
      title: 'Sign out?',
      confirmLabel: 'Sign out',
    });
    if (!confirmed) return;
    const sb = getSupabaseBrowser();
    if (sb) await sb.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold text-white ${member.avatarClass} hover:scale-105 transition-transform`}
      >
        {member.initials}
      </button>

      {open && (
        <div className="absolute bottom-full left-full ml-2 mb-0 z-50 min-w-[200px] bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_-8px_rgba(28,25,22,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] py-1">
          <div className="px-3 py-1.5 border-b border-zinc-100">
            <div className="text-[11px] font-medium text-[#1a1a1a]">{currentUser.name}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{currentUser.email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); router.push('/settings'); }}
            className="w-full text-left px-3 py-1.5 text-[11px] text-zinc-600 flex items-center gap-2 hover:bg-zinc-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-1.5 text-[11px] text-[#ff6a3d] flex items-center gap-2 hover:bg-zinc-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[72px] z-20 flex flex-col items-center py-5 gap-3 bg-white/40 backdrop-blur-xl border-r border-white/50">
      {/* Brand mark */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] shadow-[0_4px_12px_rgba(255,106,61,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] mb-3">
        <Brain className="h-[18px] w-[18px] text-white" />
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 ${
                isActive
                  ? 'bg-white/70 backdrop-blur border border-white/60 shadow-[0_2px_8px_rgba(28,25,22,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] text-[#ff6a3d]'
                  : 'text-zinc-500 hover:bg-white/40 hover:text-zinc-700'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </a>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <NotificationBell />
        <UserAvatarMenu />
      </div>
    </div>
  );
}
