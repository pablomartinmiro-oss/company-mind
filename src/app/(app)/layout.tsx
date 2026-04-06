import { checkEnvVars } from '@/lib/env-check';
import { AppShell } from '@/components/layout/app-shell';

// Run env check once in dev on server startup
checkEnvVars();

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
