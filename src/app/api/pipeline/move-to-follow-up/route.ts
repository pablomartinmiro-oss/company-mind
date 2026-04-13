import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userName } = await getTenantForUser();
    const { companyId, stage } = await req.json();

    if (!companyId || !stage) {
      return NextResponse.json({ error: 'companyId and stage required' }, { status: 400 });
    }

    // Find Follow Up pipeline
    const { data: followUp } = await supabaseAdmin
      .from('pipelines')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', 'Follow Up')
      .single();

    if (!followUp) {
      return NextResponse.json({ error: 'Follow Up pipeline not found' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from('pipeline_companies')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .eq('pipeline_id', followUp.id)
      .maybeSingle();

    // Get contact_id from any existing enrollment
    const { data: anyEnrollment } = await supabaseAdmin
      .from('pipeline_companies')
      .select('contact_id')
      .eq('tenant_id', tenantId)
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle();

    const contactId = anyEnrollment?.contact_id ?? null;
    const now = new Date().toISOString();

    if (existing) {
      // Update existing Follow Up enrollment
      await supabaseAdmin
        .from('pipeline_companies')
        .update({ stage, stage_entered_at: now })
        .eq('id', existing.id);
    } else {
      // Create new enrollment
      await supabaseAdmin.from('pipeline_companies').insert({
        tenant_id: tenantId,
        company_id: companyId,
        contact_id: contactId,
        pipeline_id: followUp.id,
        stage,
        stage_entered_at: now,
      });
    }

    // Log the stage entry
    await supabaseAdmin.from('stage_log').insert({
      tenant_id: tenantId,
      company_id: companyId,
      contact_id: contactId,
      pipeline_id: followUp.id,
      stage,
      entered_at: now,
      moved_by: userName,
      source: 'manual',
      entry_number: 1,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
