'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Phone, Building2, Settings, LogOut, Brain } from 'lucide-react';
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
    <div className="w-16 shrink-0 bg-[#1c1916] flex flex-col items-center py-4 gap-2 rounded-l-[28px] border-r border-white/[0.06]">
      {/* Brand mark — coral square with brain icon (coral use #1) */}
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff6a3d] mb-4">
        <Brain className="h-4 w-4 text-white" />
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150 ${
                isActive
                  ? 'text-white bg-[rgba(255,106,61,0.12)]'
                  : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {/* Coral left bar for active item (coral use #2) */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full bg-[#ff6a3d]" />
              )}
              <Icon className="h-[18px] w-[18px]" />
            </a>
          );
        })}
      </div>

      {/* Bottom: settings + avatar */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <a
          href="/settings"
          title="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Settings className="h-[18px] w-[18px]" />
        </a>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-white text-[10px] font-semibold hover:bg-zinc-600 transition-colors"
        >
          PM
        </button>
      </div>
    </div>
  );
}
