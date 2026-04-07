// src/app/api/cron/process-calls/route.ts
// R3: Background worker called by Vercel Cron every minute.
// Picks up calls in processing states and advances them through the pipeline:
//   pending → transcribing → analyzing → complete
//
// Each cron tick handles a batch of calls at each stage independently.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  submitForTranscription,
  pollTranscript,
  formatTranscriptWithSpeakers,
} from '@/lib/transcription/assemblyai';
import { analyzeCall } from '@/lib/ai/call-analysis';

const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const BATCH_SIZE = 5;

export async function GET(req: NextRequest) {
  // Auth check — only Vercel cron should call this
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    pending_picked_up: 0,
    transcribing_polled: 0,
    analyzing_completed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // ── STEP 1: Pick up pending calls → submit to AssemblyAI ──
    const { data: pendingCalls } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('processing_status', 'pending')
      .lt('processing_attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    for (const call of pendingCalls || []) {
      try {
        if (!call.ghl_recording_url) {
          await markFailed(call.id, 'No recording URL provided by GHL');
          results.failed++;
          continue;
        }

        // Advance to transcribing and increment attempt counter
        await supabaseAdmin
          .from('calls')
          .update({
            processing_status: 'transcribing',
            processing_started_at: new Date().toISOString(),
            processing_attempts: (call.processing_attempts || 0) + 1,
          })
          .eq('id', call.id);

        // Submit to AssemblyAI (returns immediately)
        const transcriptId = await submitForTranscription(call.ghl_recording_url);

        await supabaseAdmin
          .from('calls')
          .update({ assemblyai_transcript_id: transcriptId })
          .eq('id', call.id);

        results.pending_picked_up++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`pending ${call.id}: ${msg}`);
        await markFailed(call.id, `Submit failed: ${msg}`);
        results.failed++;
      }
    }

    // ── STEP 2: Poll in-flight transcriptions ──
    const { data: transcribingCalls } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('processing_status', 'transcribing')
      .not('assemblyai_transcript_id', 'is', null)
      .order('processing_started_at', { ascending: true })
      .limit(BATCH_SIZE);

    for (const call of transcribingCalls || []) {
      try {
        // Timeout check
        if (call.processing_started_at) {
          const startedAt = new Date(call.processing_started_at).getTime();
          if (Date.now() - startedAt > PROCESSING_TIMEOUT_MS) {
            await markFailed(call.id, 'Transcription timeout (10 min)');
            results.failed++;
            continue;
          }
        }

        const result = await pollTranscript(call.assemblyai_transcript_id!);

        if (result.status === 'completed' && result.text) {
          const formatted = result.speakers
            ? formatTranscriptWithSpeakers(result.speakers)
            : result.text;

          await supabaseAdmin
            .from('calls')
            .update({
              transcript: formatted,
              processing_status: 'analyzing',
            })
            .eq('id', call.id);

          results.transcribing_polled++;
        } else if (result.status === 'error') {
          await markFailed(call.id, `AssemblyAI error: ${result.error}`);
          results.failed++;
        }
        // If still queued/processing, leave it — next cron tick checks again
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`transcribing ${call.id}: ${msg}`);
      }
    }

    // ── STEP 3: Run R2 analysis on calls that have transcripts ──
    const { data: analyzingCalls } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('processing_status', 'analyzing')
      .not('transcript', 'is', null)
      .order('processing_started_at', { ascending: true })
      .limit(BATCH_SIZE);

    for (const call of analyzingCalls || []) {
      try {
        // analyzeCall takes (tenantId, callId) — sets processing_status to
        // 'complete' and populates score, coaching, next_steps, data_points
        await analyzeCall(call.tenant_id, call.id);

        // Set the completion timestamp (analyzeCall already sets processing_status)
        await supabaseAdmin
          .from('calls')
          .update({
            processing_completed_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        results.analyzing_completed++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`analyzing ${call.id}: ${msg}`);
        await markFailed(call.id, `Analysis failed: ${msg}`);
        results.failed++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      success: false,
      error: msg,
      results,
    }, { status: 500 });
  }
}

async function markFailed(callId: string, error: string) {
  await supabaseAdmin
    .from('calls')
    .update({
      processing_status: 'failed',
      processing_error: error,
      processing_completed_at: new Date().toISOString(),
    })
    .eq('id', callId);
}
