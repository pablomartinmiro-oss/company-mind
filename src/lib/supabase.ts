// src/lib/supabase.ts
// Supabase client for server-side usage ONLY
import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role (bypasses RLS)
// Use this in API routes, webhooks, and background jobs
export const supabaseAdmin = createSupabaseClient(url, serviceKey);

// Server-side client with anon key (respects RLS)
// Use this when you want tenant-scoped queries
export const supabase = createSupabaseClient(url, anonKey);

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
