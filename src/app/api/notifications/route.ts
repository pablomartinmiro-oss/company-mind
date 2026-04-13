import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET() {
  try {
    const { tenantId, userName } = await getTenantForUser();

    // Find recent activity entries that @mention the current user
    const { data, error } = await supabaseAdmin
      .from('activity_feed')
      .select('id, contact_id, type, content, author, created_at')
      .eq('tenant_id', tenantId)
      .eq('type', 'note')
      .neq('author', userName)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to entries that mention this user's name
    const mentionPattern = `@${userName}`;
    const mentions = (data ?? []).filter(entry => {
      const text = (entry.content as Record<string, unknown>)?.text;
      return typeof text === 'string' && text.includes(mentionPattern);
    });

    return NextResponse.json({ mentions });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
