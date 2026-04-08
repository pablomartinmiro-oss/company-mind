import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';
import { isGhlAuthError } from '@/lib/ghl-errors';
import { log } from '@/lib/log';

const CHANNEL_MAP: Record<string, 'SMS' | 'Email' | 'WhatsApp'> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { contactId, conversationId, message, channel } = await req.json();

    // Try GHL first
    try {
      const ghl = await getGHLClientForTenant(tenantId);
      const type = CHANNEL_MAP[channel] ?? 'SMS';
      await ghl.sendMessage({ type, contactId, message });
      return NextResponse.json({ success: true });
    } catch (ghlErr) {
      if (!isGhlAuthError(ghlErr)) throw ghlErr;

      // Fallback: insert into local DB
      log.info('inbox_send_ghl_fallback', { tenantId });
      if (!conversationId) {
        return NextResponse.json({ error: 'conversationId required for local send' }, { status: 400 });
      }

      await supabaseAdmin.from('inbox_messages').insert({
        tenant_id: tenantId,
        conversation_id: conversationId,
        direction: 'outbound',
        channel: channel ?? 'sms',
        body: message,
      });

      await supabaseAdmin
        .from('inbox_conversations')
        .update({
          last_message_snippet: message,
          last_message_direction: 'outbound',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .eq('id', conversationId)
        .eq('tenant_id', tenantId);

      return NextResponse.json({ success: true, source: 'local' });
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
