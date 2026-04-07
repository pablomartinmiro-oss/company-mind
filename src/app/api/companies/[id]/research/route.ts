import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;

    const { data, error } = await supabaseAdmin
      .from('research')
      .select('field_name, field_value, source, source_detail')
      .eq('tenant_id', tenantId)
      .eq('scope', 'company')
      .eq('company_id', companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const shaped: Record<string, { value: string; source: string; source_detail?: string }> = {};
    for (const row of data ?? []) {
      shaped[row.field_name] = {
        value: row.field_value,
        source: row.source,
        source_detail: row.source_detail ?? undefined,
      };
    }
    return NextResponse.json({ research: shaped });
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
    const { id: companyId } = await ctx.params;
    const { fieldName, fieldValue, source, sourceDetail } = await req.json();

    const { error } = await supabaseAdmin
      .from('research')
      .upsert(
        {
          tenant_id: tenantId,
          scope: 'company',
          company_id: companyId,
          contact_id: null,
          section: '',
          field_name: fieldName,
          field_value: fieldValue,
          source: source ?? 'manual',
          source_detail: sourceDetail ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,company_id,field_name' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
