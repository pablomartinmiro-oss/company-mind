import { NextResponse } from 'next/server';
import { getTenantForUser } from '@/lib/get-tenant';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeCall } from '@/lib/ai/call-analysis';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { tenantId, userName } = await getTenantForUser();
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string;
    const contactId = formData.get('contactId') as string;
    const contactName = formData.get('contactName') as string;
    const contactIdsRaw = formData.get('contactIds') as string;
    const repName = formData.get('repName') as string;
    const callType = formData.get('callType') as string;
    const calledAt = formData.get('calledAt') as string;

    let allContactIds: string[] = [];
    try { allContactIds = JSON.parse(contactIdsRaw || '[]'); } catch { allContactIds = [contactId]; }

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (!companyId || !contactId) {
      return NextResponse.json({ error: 'Company and contact are required' }, { status: 400 });
    }

    const isText = file.name.endsWith('.txt') || file.type === 'text/plain';
    const isVideo = file.name.endsWith('.mp4') || file.type.startsWith('video/');

    if (!isText && !isVideo) {
      return NextResponse.json({ error: 'Only .mp4 and .txt files supported' }, { status: 400 });
    }

    let transcriptText: string | null = null;
    let recordingUrl: string | null = null;
    let durationSeconds: number | null = null;

    if (isText) {
      // Read transcript directly
      transcriptText = await file.text();
      // Estimate duration from word count (~150 wpm for conversation)
      const wordCount = transcriptText.split(/\s+/).length;
      durationSeconds = Math.max(60, Math.round((wordCount / 150) * 60));
    } else {
      // Upload MP4 to Supabase Storage
      const bytes = await file.arrayBuffer();
      const filename = `calls/${tenantId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('recordings')
        .upload(filename, bytes, { contentType: file.type });

      if (uploadError) {
        // If bucket doesn't exist, create it
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          await supabaseAdmin.storage.createBucket('recordings', { public: false });
          const { error: retryError } = await supabaseAdmin.storage
            .from('recordings')
            .upload(filename, bytes, { contentType: file.type });
          if (retryError) {
            return NextResponse.json({ error: 'File upload failed: ' + retryError.message }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: 'File upload failed: ' + uploadError.message }, { status: 500 });
        }
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('recordings')
        .getPublicUrl(filename);
      recordingUrl = urlData.publicUrl;
    }

    // Insert call record
    const { data: call, error: callError } = await supabaseAdmin
      .from('calls')
      .insert({
        tenant_id: tenantId,
        source: 'manual_upload',
        contact_ghl_id: contactId,
        contact_name: contactName || null,
        call_type: callType || null,
        recording_url: recordingUrl,
        duration_seconds: durationSeconds,
        direction: 'outbound',
        called_at: calledAt || new Date().toISOString(),
        transcript: transcriptText,
        transcript_text: transcriptText,
        processing_status: transcriptText ? 'analyzing' : 'pending',
        rep_name: repName || userName,
        metadata: { uploaded_by: userName, company_id: companyId, contact_ids: allContactIds },
      })
      .select('id')
      .single();

    if (callError || !call) {
      return NextResponse.json({ error: 'Failed to create call record: ' + (callError?.message ?? 'unknown') }, { status: 500 });
    }

    // If we have a transcript, analyze immediately (fire and forget)
    if (transcriptText) {
      analyzeCall(tenantId, call.id).catch(err => {
        console.error('[upload] call analysis failed:', err);
      });
    }

    return NextResponse.json({ success: true, callId: call.id });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
