import { NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';
import { log } from '@/lib/log';

export async function GET() {
  try {
    const { tenantId } = await getTenantForUser();
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
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    log.error('inbox_fetch_failed', { error: msg });
    if (msg.includes('no GHL access token') || msg.includes('No GHL')) {
      return NextResponse.json({ error: 'GHL not connected' }, { status: 401 });
    }
    return NextResponse.json({ error: 'GHL request failed', detail: msg }, { status: 502 });
  }
}
