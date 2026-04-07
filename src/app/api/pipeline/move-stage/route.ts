import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

const GATED_PIPELINES = ['Onboarding', 'Upsell'];

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { companyId, contactId, pipelineId, newStage, movedBy, note } = await req.json();

    // Resolve the entity ID — prefer companyId, fall back to contactId for legacy calls
    const entityCompanyId = companyId ?? null;
    const entityContactId = contactId ?? null;

    // 1. Look up the target pipeline
    const { data: targetPipeline } = await supabaseAdmin
      .from('pipelines')
      .select('name, stages')
      .eq('id', pipelineId)
      .eq('tenant_id', tenantId)
      .single();

    if (!targetPipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // 2. Stage gate: if entering a gated pipeline for the first time, check Sales Closed
    if (entityCompanyId && GATED_PIPELINES.includes(targetPipeline.name)) {
      const { data: existing } = await supabaseAdmin
        .from('pipeline_companies')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('company_id', entityCompanyId)
        .eq('pipeline_id', pipelineId)
        .maybeSingle();

      if (!existing) {
        // New entry — check Sales Pipeline closed
        const { data: salesPipeline } = await supabaseAdmin
          .from('pipelines')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', 'Sales Pipeline')
          .single();

        if (salesPipeline) {
          const { data: salesEntry } = await supabaseAdmin
            .from('pipeline_companies')
            .select('stage')
            .eq('tenant_id', tenantId)
            .eq('company_id', entityCompanyId)
            .eq('pipeline_id', salesPipeline.id)
            .maybeSingle();

          if (!salesEntry || salesEntry.stage !== 'Closed') {
            return NextResponse.json({
              error: `Company must be Closed in Sales Pipeline before entering ${targetPipeline.name}`,
              code: 'STAGE_GATE_VIOLATION',
            }, { status: 422 });
          }
        }
      }
    }

    // 3. Perform the stage move
    if (entityCompanyId) {
      await supabaseAdmin
        .from('pipeline_companies')
        .update({ stage: newStage, stage_entered_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('company_id', entityCompanyId)
        .eq('pipeline_id', pipelineId);
    } else if (entityContactId) {
      // Legacy contact-based move
      await supabaseAdmin
        .from('pipeline_companies')
        .update({ stage: newStage, stage_entered_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('contact_id', entityContactId)
        .eq('pipeline_id', pipelineId);
    }

    // 4. Log the stage transition
    const { count } = await supabaseAdmin
      .from('stage_log')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('pipeline_id', pipelineId)
      .eq('stage', newStage);

    await supabaseAdmin.from('stage_log').insert({
      tenant_id: tenantId,
      company_id: entityCompanyId,
      contact_id: entityContactId,
      pipeline_id: pipelineId,
      stage: newStage,
      moved_by: movedBy ?? 'system',
      source: 'manual',
      note: note ?? null,
      entry_number: (count ?? 0) + 1,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
