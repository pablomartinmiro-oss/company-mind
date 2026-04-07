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
import { log } from '@/lib/log';

const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const BATCH_SIZE = 5;

export async function GET(req: NextRequest) {
  const tickStart = Date.now();

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

    log.info('cron_tick_start', {
      pending: pendingCalls?.length ?? 0,
    });

    for (const call of pendingCalls || []) {
      try {
        if (!call.ghl_recording_url) {
          log.warn('call_processing_error', { callId: call.id, state: 'pending', error: 'no_recording_url' });
          await markFailed(call.id, 'No recording URL provided by GHL');
          results.failed++;
          continue;
        }

        log.info('call_processing_start', { callId: call.id, state: 'pending', attempt: (call.processing_attempts || 0) + 1 });

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
        log.error('call_processing_error', { callId: call.id, state: 'pending', error: msg });
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
            log.warn('call_processing_error', { callId: call.id, state: 'transcribing', error: 'timeout' });
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

          log.info('transcription_complete', {
            callId: call.id,
            duration_seconds: call.duration_seconds,
            word_count: result.text.split(/\s+/).length,
            preview: result.text.slice(0, 80),
          });

          await supabaseAdmin
            .from('calls')
            .update({
              transcript: formatted,
              processing_status: 'analyzing',
            })
            .eq('id', call.id);

          results.transcribing_polled++;
        } else if (result.status === 'error') {
          log.error('call_processing_error', { callId: call.id, state: 'transcribing', error: result.error });
          await markFailed(call.id, `AssemblyAI error: ${result.error}`);
          results.failed++;
        }
        // If still queued/processing, leave it — next cron tick checks again
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log.error('call_processing_error', { callId: call.id, state: 'transcribing', error: msg });
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
      const analysisStart = Date.now();
      try {
        log.info('call_processing_start', { callId: call.id, state: 'analyzing' });

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

        // Read back the score for logging
        const { data: updated } = await supabaseAdmin
          .from('calls')
          .select('score')
          .eq('id', call.id)
          .single();

        const overall = (updated?.score as { overall?: number } | null)?.overall;

        log.info('analysis_complete', {
          callId: call.id,
          overall_score: overall ?? null,
          analysis_ms: Date.now() - analysisStart,
        });

        results.analyzing_completed++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log.error('call_processing_error', { callId: call.id, state: 'analyzing', error: msg });
        results.errors.push(`analyzing ${call.id}: ${msg}`);
        await markFailed(call.id, `Analysis failed: ${msg}`);
        results.failed++;
      }
    }

    log.info('cron_tick_end', {
      ...results,
      total_ms: Date.now() - tickStart,
    });

    return NextResponse.json({ success: true, ...results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error('cron_tick_fatal', { error: msg, total_ms: Date.now() - tickStart });
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
