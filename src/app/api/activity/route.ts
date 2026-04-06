import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { contactId, content, type } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('activity_feed')
      .insert({
        tenant_id: tenantId,
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
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
