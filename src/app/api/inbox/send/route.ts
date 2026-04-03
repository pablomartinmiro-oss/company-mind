import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForTenant } from '@/lib/tenant-context';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

const CHANNEL_MAP: Record<string, 'SMS' | 'Email' | 'WhatsApp'> = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export async function POST(req: NextRequest) {
  try {
    const { contactId, message, channel } = await req.json();
    const ghl = await getGHLClientForTenant(TENANT_ID);
    const type = CHANNEL_MAP[channel] ?? 'SMS';

    await ghl.sendMessage({
      type,
      contactId,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
