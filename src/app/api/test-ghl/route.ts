import { NextResponse } from 'next/server';
import { GHLClient } from '@/lib/ghl';

export async function GET() {
  try {
    const ghl = new GHLClient(
      process.env.GHL_LOCATION_ID!,
      {
        access_token: process.env.GHL_ACCESS_TOKEN!,
        refresh_token: '',
        expires_at: new Date(Date.now() + 86400000),
      }
    );

    const contacts = await ghl.searchContacts('', 5);
    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}