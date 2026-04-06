'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Brain, Settings, LogOut } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

const navItems = [
  { href: '/dashboard', label: 'Daily HQ' },
  { href: '/calls', label: 'Calls' },
  { href: '/pipeline', label: 'Pipeline' },
];

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pipeline': 'Pipeline',
  '/calls': 'Calls',
  '/settings': 'Settings',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentPage = pageNames[pathname] ?? pageNames[Object.keys(pageNames).find(k => pathname.startsWith(k)) ?? ''] ?? 'Dashboard';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* ── Top bar ── */}
      <header className="h-[52px] shrink-0 border-b border-zinc-200/60 bg-white flex items-center px-5 gap-6 z-10">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-zinc-900">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-900">Company Mind</span>
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/settings">
            <Settings className="h-4 w-4 text-zinc-400 hover:text-zinc-600 transition-colors" />
          </Link>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-7 w-7 rounded-full bg-zinc-900 text-white text-[11px] font-semibold flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              PM
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
