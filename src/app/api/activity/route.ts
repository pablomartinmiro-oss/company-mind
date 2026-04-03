import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export async function POST(req: NextRequest) {
  try {
    const { contactId, content, type } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('activity_feed')
      .insert({
        tenant_id: TENANT_ID,
        contact_id: contactId,
        type: type ?? 'note',
        content: { text: content },
        author: 'Pablo Martin',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entry: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
