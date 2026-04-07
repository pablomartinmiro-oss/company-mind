import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { companyId, pipelineId } = await req.json();

    const { error } = await supabaseAdmin
      .from('pipeline_companies')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .eq('pipeline_id', pipelineId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
