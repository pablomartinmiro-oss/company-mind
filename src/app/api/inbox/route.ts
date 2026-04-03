import { NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export async function GET() {
  try {
    const ghl = await getGHLClientForTenant(TENANT_ID);
    const data = await ghl.getConversations(30);
    const conversations = data?.conversations ?? [];

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
  } catch {
    return NextResponse.json({ unread: [], needsReply: [] });
  }
}
