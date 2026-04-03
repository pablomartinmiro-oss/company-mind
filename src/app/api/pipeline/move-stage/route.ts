import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { contactId, pipelineId, newStage, tenantId, movedBy, note } = await req.json();

    // Update pipeline_contacts
    await supabaseAdmin
      .from('pipeline_contacts')
      .update({ stage: newStage, stage_entered_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('contact_id', contactId)
      .eq('pipeline_id', pipelineId);

    // Count existing entries for entry_number
    const { count } = await supabaseAdmin
      .from('stage_log')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('contact_id', contactId)
      .eq('pipeline_id', pipelineId)
      .eq('stage', newStage);

    // Insert stage log
    await supabaseAdmin.from('stage_log').insert({
      tenant_id: tenantId,
      contact_id: contactId,
      pipeline_id: pipelineId,
      stage: newStage,
      moved_by: movedBy,
      source: 'manual',
      note: note || null,
      entry_number: (count ?? 0) + 1,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
