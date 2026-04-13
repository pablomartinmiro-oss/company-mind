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
    const filtered = (data ?? []).filter(entry => {
      const text = (entry.content as Record<string, unknown>)?.text;
      return typeof text === 'string' && text.includes(mentionPattern);
    });

    // Resolve contact_id → company_id for navigation links
    const contactIds = [...new Set(filtered.map(m => m.contact_id))];
    const { data: links } = contactIds.length > 0
      ? await supabaseAdmin
          .from('company_contacts')
          .select('contact_id, company_id')
          .eq('tenant_id', tenantId)
          .in('contact_id', contactIds)
      : { data: [] };

    const companyMap: Record<string, string> = {};
    for (const l of links ?? []) companyMap[l.contact_id] = l.company_id;

    const mentions = filtered.map(m => ({
      ...m,
      company_id: companyMap[m.contact_id] ?? null,
    }));

    return NextResponse.json({ mentions });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
