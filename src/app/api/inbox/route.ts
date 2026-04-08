import { NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';
import { isGhlAuthError } from '@/lib/ghl-errors';
import { log } from '@/lib/log';

export async function GET() {
  try {
    const { tenantId } = await getTenantForUser();

    // Try GHL first
    try {
      const ghl = await getGHLClientForTenant(tenantId);
      const data = await ghl.getConversations(30);
      const conversations = data?.conversations ?? [];

      if (conversations.length === 0) {
        return NextResponse.json({ unread: [], needsReply: [] });
      }

      const unread: unknown[] = [];
      const needsReply: unknown[] = [];

      for (const convo of conversations) {
        let messages: unknown[] = [];
        try {
          const msgData = await ghl.getConversationMessages(convo.id);
          messages = (msgData?.messages ?? []).slice(0, 10);
        } catch { /* ignore */ }

        const entry = {
          id: convo.id,
          contactId: convo.contactId,
          contactName: convo.contactName ?? convo.fullName ?? 'Unknown',
          contactEmail: convo.email ?? convo.contactEmail ?? null,
          contactPhone: convo.phone ?? convo.contactPhone ?? null,
          lastMessageBody: convo.lastMessageBody ?? '',
          lastMessageType: convo.lastMessageType ?? 'SMS',
          lastMessageDate: convo.lastMessageDate ?? convo.dateUpdated ?? new Date().toISOString(),
          unreadCount: convo.unreadCount ?? 0,
          messages,
        };

        if (convo.unreadCount > 0) {
          unread.push(entry);
        } else if (convo.lastMessageDirection === 'inbound') {
          needsReply.push(entry);
        }
      }

      return NextResponse.json({ unread, needsReply });
    } catch (ghlErr) {
      if (!isGhlAuthError(ghlErr)) throw ghlErr;

      // Fallback to local DB
      log.info('inbox_ghl_fallback', { tenantId });
      const { data: conversations } = await supabaseAdmin
        .from('inbox_conversations')
        .select('*, company:companies(name)')
        .eq('tenant_id', tenantId)
        .order('last_message_at', { ascending: false })
        .limit(30);

      const withMessages = await Promise.all((conversations ?? []).map(async (conv) => {
        const { data: messages } = await supabaseAdmin
          .from('inbox_messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('sent_at', { ascending: true })
          .limit(10);
        return {
          id: conv.id,
          contactId: conv.contact_ghl_id,
          contactName: (conv.company as { name: string } | null)?.name ?? 'Unknown',
          lastMessageBody: conv.last_message_snippet ?? '',
          lastMessageType: conv.channel?.toUpperCase() ?? 'SMS',
          lastMessageDate: conv.last_message_at,
          unreadCount: conv.unread_count ?? 0,
          messages: messages ?? [],
        };
      }));

      const unread = withMessages.filter(c => c.unreadCount > 0);
      const needsReply = withMessages.filter(c => c.unreadCount === 0);

      return NextResponse.json({ unread, needsReply, source: 'local' });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    log.error('inbox_fetch_failed', { error: msg });
    return NextResponse.json({ error: 'Failed to load inbox', detail: msg }, { status: 502 });
  }
}
