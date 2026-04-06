import { NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

const DEMO_CONVERSATIONS = {
  unread: [
    {
      id: 'demo-conv-001',
      contactId: 'demo-contact-001',
      contactName: 'Sarah Chen',
      lastMessageBody: 'Just reviewed the agreement, looks good to me. Can we get the countersigned version back today?',
      lastMessageType: 'SMS',
      lastMessageDate: new Date().toISOString(),
      unreadCount: 1,
      messages: [
        { id: 'm1', direction: 'outbound', body: 'Hey Sarah — sending over the pilot results summary now.', type: 'SMS', dateAdded: new Date(Date.now() - 86400000).toISOString() },
        { id: 'm2', direction: 'inbound', body: 'Got it, reviewing now. Numbers look strong.', type: 'SMS', dateAdded: new Date(Date.now() - 72000000).toISOString() },
        { id: 'm3', direction: 'inbound', body: 'Just reviewed the agreement, looks good to me. Can we get the countersigned version back today?', type: 'SMS', dateAdded: new Date().toISOString() },
      ],
    },
    {
      id: 'demo-conv-002',
      contactId: 'demo-contact-005',
      contactName: 'David Kim',
      lastMessageBody: 'Can we move the demo to Thursday at 2pm? Something came up Wednesday.',
      lastMessageType: 'Email',
      lastMessageDate: new Date().toISOString(),
      unreadCount: 1,
      messages: [
        { id: 'm4', direction: 'outbound', body: 'David — confirmed for Wednesday at 2pm. Sending calendar invite now.', type: 'Email', dateAdded: new Date(Date.now() - 86400000).toISOString() },
        { id: 'm5', direction: 'inbound', body: 'Can we move the demo to Thursday at 2pm? Something came up Wednesday.', type: 'Email', dateAdded: new Date().toISOString() },
      ],
    },
    {
      id: 'demo-conv-003',
      contactId: 'demo-contact-002',
      contactName: 'Marcus Thompson',
      lastMessageBody: 'Hey checking on the HVAC proposal — did you get a chance to pull those numbers together?',
      lastMessageType: 'WhatsApp',
      lastMessageDate: new Date().toISOString(),
      unreadCount: 1,
      messages: [
        { id: 'm6', direction: 'outbound', body: 'Marcus — proposal is almost ready, sending it over this afternoon.', type: 'WhatsApp', dateAdded: new Date(Date.now() - 86400000).toISOString() },
        { id: 'm7', direction: 'inbound', body: 'Hey checking on the HVAC proposal — did you get a chance to pull those numbers together?', type: 'WhatsApp', dateAdded: new Date().toISOString() },
      ],
    },
  ],
  needsReply: [
    {
      id: 'demo-conv-004',
      contactId: 'demo-contact-003',
      contactName: 'Lisa Patel',
      lastMessageBody: 'Following up on the SOC 2 report and DPA. Legal needs these before we can sign off.',
      lastMessageType: 'Email',
      lastMessageDate: new Date(Date.now() - 86400000).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm8', direction: 'inbound', body: 'Hi — we are close to signing but legal needs the SOC 2 report and DPA first.', type: 'Email', dateAdded: new Date(Date.now() - 172800000).toISOString() },
        { id: 'm9', direction: 'outbound', body: 'On it — will send those over today.', type: 'Email', dateAdded: new Date(Date.now() - 172800000).toISOString() },
        { id: 'm10', direction: 'inbound', body: 'Following up on the SOC 2 report and DPA. Legal needs these before we can sign off.', type: 'Email', dateAdded: new Date(Date.now() - 86400000).toISOString() },
      ],
    },
    {
      id: 'demo-conv-005',
      contactId: 'demo-contact-004',
      contactName: 'Jake Rivera',
      lastMessageBody: 'Still doing landscaping CRM demos this month? Would love to see how it works.',
      lastMessageType: 'SMS',
      lastMessageDate: new Date(Date.now() - 345600000).toISOString(),
      unreadCount: 0,
      messages: [
        { id: 'm11', direction: 'inbound', body: 'Still doing landscaping CRM demos this month? Would love to see how it works.', type: 'SMS', dateAdded: new Date(Date.now() - 345600000).toISOString() },
      ],
    },
  ],
};

export async function GET() {
  try {
    const { tenantId } = await getTenantForUser();
    const ghl = await getGHLClientForTenant(tenantId);
    const data = await ghl.getConversations(30);
    const conversations = data?.conversations ?? [];

    if (conversations.length === 0) {
      return NextResponse.json(DEMO_CONVERSATIONS);
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
    return NextResponse.json(DEMO_CONVERSATIONS);
  }
}
