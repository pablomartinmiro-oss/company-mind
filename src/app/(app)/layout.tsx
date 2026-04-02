'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import {
  LayoutDashboard,
  GitBranch,
  Phone,
  Settings,
  Brain,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Daily HQ', icon: LayoutDashboard },
  { href: '/calls', label: 'Calls', icon: Phone },
  { href: '/pipelines', label: 'Pipelines', icon: GitBranch },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pipelines': 'Pipelines',
  '/calls': 'Calls',
  '/settings': 'Settings',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const currentPage = pageNames[pathname] ?? pageNames[Object.keys(pageNames).find(k => pathname.startsWith(k)) ?? ''] ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]">
      {/* ── Sidebar ── */}
      <aside className="relative flex w-[232px] shrink-0 flex-col border-r border-zinc-200/60 bg-[#fafafa]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pb-1 pt-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 shadow-sm">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-zinc-900">Company Mind</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-6">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-zinc-900 text-white shadow-sm shadow-zinc-900/10'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                  >
                    <item.icon className={cn('h-[15px] w-[15px]', isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600')} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 text-zinc-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User area */}
        <div className="border-t border-zinc-200/60 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-semibold text-white shadow-sm">
              PM
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-zinc-800">Pablo Martin</p>
              <p className="truncate text-[10px] text-zinc-400">Owner</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>

      {/* ── Chat panel ── */}
      <ChatPanel
        currentPage={currentPage}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
}
