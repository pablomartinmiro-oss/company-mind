import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantForUser } from '@/lib/get-tenant';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { tenantId } = await getTenantForUser();
  const { id } = await params;

  // Fetch pipeline_contacts (actual columns: contact_id, pipeline_id, stage)
  const { data: pcRows } = await supabaseAdmin
    .from('pipeline_contacts')
    .select('pipeline_id, stage')
    .eq('tenant_id', tenantId)
    .eq('contact_id', id);

  if (!pcRows || pcRows.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch pipeline names
  const pipelineIds = [...new Set(pcRows.map((r) => r.pipeline_id))];
  const { data: pipelines } = await supabaseAdmin
    .from('pipelines')
    .select('id, name')
    .in('id', pipelineIds);

  const nameMap: Record<string, string> = {};
  for (const p of pipelines ?? []) {
    nameMap[p.id] = p.name;
  }

  return NextResponse.json(
    pcRows.map((r) => ({
      pipeline_name: nameMap[r.pipeline_id] ?? 'Unknown',
      current_stage: r.stage,
    }))
  );
}
