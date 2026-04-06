import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';
import { getTenantForUser } from '@/lib/get-tenant';

const CHANNEL_MAP: Record<string, 'SMS' | 'Email' | 'WhatsApp'> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { contactId, message, channel } = await req.json();
    const ghl = await getGHLClientForTenant(tenantId);
    const type = CHANNEL_MAP[channel] ?? 'SMS';

    await ghl.sendMessage({
      type,
      contactId,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
