import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { tenantId } = await getTenantForUser();
    const { id: companyId } = await ctx.params;
    const body = await req.json();

    const allowedFields = ['name', 'industry', 'lead_source', 'website', 'location', 'mrr', 'setup_fee'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    const { error } = await supabaseAdmin
      .from('companies')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
