// src/lib/supabase.ts
// Supabase client for server-side usage
// NOTE: Do not import this file from client components.
// Guard against empty env vars to prevent crash if accidentally bundled client-side.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// Dummy URL used when env vars are missing (module still loads without crashing)
const DUMMY = 'https://placeholder.supabase.co';
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

// Server-side client with service role (bypasses RLS)
// Use this in API routes, webhooks, and background jobs
export const supabaseAdmin = createSupabaseClient(
  url || DUMMY,
  serviceKey || DUMMY_KEY
);

// Server-side client with anon key (respects RLS)
// Use this when you want tenant-scoped queries
export const supabase = createSupabaseClient(
  url || DUMMY,
  anonKey || DUMMY_KEY
);

// Helper: get a tenant-scoped query helper
export function tenantQuery(tenantId: string) {
  return {
    calls: () => supabaseAdmin.from('calls').select('*').eq('tenant_id', tenantId),
    callActions: (callId: string) =>
      supabaseAdmin.from('call_actions').select('*').eq('call_id', callId).eq('tenant_id', tenantId),
    feedbackLog: () => supabaseAdmin.from('feedback_log').select('*').eq('tenant_id', tenantId),
    chatMessages: (userId: string) =>
      supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
  };
}
