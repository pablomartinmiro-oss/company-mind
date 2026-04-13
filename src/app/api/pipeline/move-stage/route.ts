import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

const GATED_PIPELINES = ['Onboarding', 'Upsell'];

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantForUser();
    const { companyId, contactId, pipelineId, newStage, movedBy, note, milestone } = await req.json();

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

    // 3. Perform the stage move (skip if this is just a milestone log for the current stage)
    const isMilestoneOnly = !!milestone;
    if (!isMilestoneOnly) {
      if (entityCompanyId) {
        await supabaseAdmin
          .from('pipeline_companies')
          .update({ stage: newStage, stage_entered_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .eq('company_id', entityCompanyId)
          .eq('pipeline_id', pipelineId);
      } else if (entityContactId) {
        await supabaseAdmin
          .from('pipeline_companies')
          .update({ stage: newStage, stage_entered_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .eq('contact_id', entityContactId)
          .eq('pipeline_id', pipelineId);
      }
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
      source: milestone ? 'manual' : 'manual',
      note: note ?? null,
      milestone: milestone ?? null,
      entry_number: (count ?? 0) + 1,
    });

    // 5. Cascade: auto-enroll in next pipeline when reaching trigger stages (skip for milestone-only logs)
    if (entityCompanyId && !isMilestoneOnly) {
      const cascades: { triggerPipeline: string; triggerStage: string; targetPipeline: string; targetStage: string }[] = [
        { triggerPipeline: 'Sales Pipeline', triggerStage: 'Closed', targetPipeline: 'Onboarding', targetStage: 'New Client' },
        { triggerPipeline: 'Onboarding', triggerStage: 'Operating', targetPipeline: 'Upsell', targetStage: 'Tier 1' },
      ];

      for (const c of cascades) {
        if (targetPipeline.name !== c.triggerPipeline || newStage !== c.triggerStage) continue;

        // Look up the target pipeline
        const { data: nextPipeline } = await supabaseAdmin
          .from('pipelines')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', c.targetPipeline)
          .single();
        if (!nextPipeline) continue;

        // Check if already enrolled
        const { data: existing } = await supabaseAdmin
          .from('pipeline_companies')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('company_id', entityCompanyId)
          .eq('pipeline_id', nextPipeline.id)
          .maybeSingle();
        if (existing) continue;

        const now = new Date().toISOString();

        // Get contact_id from current enrollment
        const { data: currentEnrollment } = await supabaseAdmin
          .from('pipeline_companies')
          .select('contact_id')
          .eq('tenant_id', tenantId)
          .eq('company_id', entityCompanyId)
          .eq('pipeline_id', pipelineId)
          .maybeSingle();

        // Enroll in target pipeline
        await supabaseAdmin.from('pipeline_companies').insert({
          tenant_id: tenantId,
          company_id: entityCompanyId,
          contact_id: currentEnrollment?.contact_id ?? entityContactId,
          pipeline_id: nextPipeline.id,
          stage: c.targetStage,
          stage_entered_at: now,
        });

        // Auto-log with api source
        await supabaseAdmin.from('stage_log').insert({
          tenant_id: tenantId,
          company_id: entityCompanyId,
          contact_id: currentEnrollment?.contact_id ?? entityContactId,
          pipeline_id: nextPipeline.id,
          stage: c.targetStage,
          entered_at: now,
          moved_by: movedBy ?? 'system',
          source: 'api',
          entry_number: 1,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
