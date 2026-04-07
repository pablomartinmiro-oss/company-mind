'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Phone, Building2, Settings, Brain } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Daily HQ' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/companies', icon: Building2, label: 'Companies' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[72px] z-20 flex flex-col items-center py-5 gap-3 bg-white/40 backdrop-blur-xl border-r border-white/50">
      {/* Brand mark — 40x40 coral gradient circle */}
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
        <a
          href="/settings"
          title="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-400 hover:bg-white/40 hover:text-zinc-700 transition-all"
        >
          <Settings className="h-[18px] w-[18px]" />
        </a>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 backdrop-blur border border-white/60 text-zinc-600 text-[10px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white/70 transition-all"
        >
          PM
        </button>
      </div>
    </div>
  );
}
