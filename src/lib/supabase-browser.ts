import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (_client) return _client;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  if (!url || !key) {
    console.warn('Supabase env vars missing — auth features disabled');
    return null;
  }
  _client = createBrowserClient(url, key);
  return _client;
}
