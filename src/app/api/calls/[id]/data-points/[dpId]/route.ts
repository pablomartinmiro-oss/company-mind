import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

interface RouteContext {
  params: Promise<{ id: string; dpId: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { dpId } = await ctx.params;
    const { field_value } = await req.json();

    if (typeof field_value !== 'string') {
      return NextResponse.json({ error: 'field_value required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('data_points')
      .update({ field_value, source: 'manual' })
      .eq('tenant_id', tenantId)
      .eq('id', dpId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
