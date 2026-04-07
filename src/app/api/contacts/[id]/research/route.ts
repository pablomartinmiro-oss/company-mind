import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: contactId } = await ctx.params;

    const { data, error } = await supabaseAdmin
      .from('research')
      .select('section, field_name, field_value, source')
      .eq('tenant_id', tenantId)
      .eq('contact_id', contactId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by section
    const grouped: Record<string, { field_name: string; field_value: string | null; source: string }[]> = {};
    for (const row of data ?? []) {
      if (!grouped[row.section]) grouped[row.section] = [];
      grouped[row.section].push({ field_name: row.field_name, field_value: row.field_value, source: row.source });
    }

    return NextResponse.json(grouped);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: contactId } = await ctx.params;
    const { fieldName, fieldValue, section, source } = await req.json();

    const { error } = await supabaseAdmin
      .from('research')
      .upsert(
        {
          tenant_id: tenantId,
          contact_id: contactId,
          section,
          field_name: fieldName,
          field_value: fieldValue,
          source: source ?? 'manual',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,contact_id,field_name' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
