// src/app/api/jobs/process-calls/route.ts
// Background job processor for call transcription and analysis
// Trigger: Vercel Cron (every 1 min) or manual polling
//
// Add to vercel.json:
// { "crons": [{ "path": "/api/jobs/process-calls", "schedule": "* * * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { transcribeAudio } from '@/lib/assemblyai';

const BATCH_SIZE = 5;
const LOCK_TIMEOUT_MINUTES = 10;

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { processed: 0, failed: 0, errors: [] as string[] };

  try {
    // ── Claim pending jobs (with lock to prevent double-processing) ──
    const staleThreshold = new Date(Date.now() - LOCK_TIMEOUT_MINUTES * 60000).toISOString();

    const { data: jobs } = await supabaseAdmin
      .from('call_jobs')
      .select('*, calls(id, recording_url, tenant_id, contact_ghl_id)')
      .or(`status.eq.pending,and(status.eq.processing,locked_at.lt.${staleThreshold})`)
      .lte('next_retry_at', new Date().toISOString())
      .lt('attempts', 3)  // max 3 attempts column value check
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs to process', ...results });
    }

    // ── Process each job ──
    for (const job of jobs) {
      const call = job.calls;
      if (!call) continue;

      // Lock the job
      await supabaseAdmin
        .from('call_jobs')
        .update({ status: 'processing', locked_at: new Date().toISOString(), attempts: job.attempts + 1 })
        .eq('id', job.id);

      try {
        if (job.job_type === 'transcribe') {
          await processTranscription(job, call);
        } else if (job.job_type === 'analyze') {
          await processAnalysis(job, call);
        }

        // Mark job complete
        await supabaseAdmin
          .from('call_jobs')
          .update({ status: 'complete' })
          .eq('id', job.id);

        results.processed++;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';

        // Exponential backoff: 1min, 5min, 25min
        const backoffMs = Math.pow(5, job.attempts) * 60000;
        const nextRetry = new Date(Date.now() + backoffMs).toISOString();

        await supabaseAdmin
          .from('call_jobs')
          .update({
            status: job.attempts + 1 >= job.max_attempts ? 'failed' : 'pending',
            last_error: errMsg,
            locked_at: null,
            next_retry_at: nextRetry,
          })
          .eq('id', job.id);

        // If max retries reached, mark the call as error too
        if (job.attempts + 1 >= job.max_attempts) {
          await supabaseAdmin
            .from('calls')
            .update({ status: 'error', error_message: `Job failed after ${job.max_attempts} attempts: ${errMsg}` })
            .eq('id', call.id);
        }

        results.failed++;
        results.errors.push(`Job ${job.id}: ${errMsg}`);
      }
    }
  } catch (error) {
    console.error('Job processor error:', error);
    return NextResponse.json({ error: 'Processor failed', ...results }, { status: 500 });
  }

  return NextResponse.json(results);
}

async function processTranscription(
  job: Record<string, unknown>,
  call: { id: string; recording_url: string; tenant_id: string; contact_ghl_id: string | null }
) {
  if (!call.recording_url) {
    throw new Error('No recording URL');
  }

  // Update call status
  await supabaseAdmin
    .from('calls')
    .update({ status: 'transcribing' })
    .eq('id', call.id);

  // Transcribe
  const transcript = await transcribeAudio(call.recording_url);

  // Infer speaker roles from diarization
  // Heuristic: on outbound calls, Speaker A (first speaker) is usually the rep
  const speakerMap = inferSpeakerRoles(transcript.utterances);

  const actualDuration = Math.round(transcript.duration);
  const durationTier = actualDuration < 45 ? 'skip' : actualDuration < 90 ? 'short' : 'full';

  // Duration routing (Rule 4): skip analysis for very short calls
  if (durationTier === 'skip') {
    await supabaseAdmin
      .from('calls')
      .update({
        transcript: transcript,
        transcript_text: transcript.text,
        duration_seconds: actualDuration,
        speaker_map: speakerMap,
        status: 'skipped',
        error_message: 'No answer or too short (under 45s)',
        metadata: { duration_tier: 'skip' },
      })
      .eq('id', call.id);
    return;
  }

  // Store transcript
  await supabaseAdmin
    .from('calls')
    .update({
      transcript: transcript,
      transcript_text: transcript.text,
      duration_seconds: actualDuration,
      speaker_map: speakerMap,
      status: 'analyzing',
      metadata: { duration_tier: durationTier },
    })
    .eq('id', call.id);

  // Queue analysis job (short calls get flagged for lighter analysis)
  await supabaseAdmin.from('call_jobs').insert({
    call_id: call.id,
    tenant_id: call.tenant_id,
    job_type: 'analyze',
    status: 'pending',
    metadata: { duration_tier: durationTier },
  });
}

async function processAnalysis(
  job: Record<string, unknown>,
  call: { id: string; tenant_id: string; contact_ghl_id: string | null }
) {
  // Dynamically import to avoid circular deps
  const { analyzeCall } = await import('@/mastra/tools/call-analysis');

  await analyzeCall.execute!(
    { callId: call.id },
    { agent: { agentId: 'companyMind', toolCallId: '', messages: [], suspend: async () => {}, resourceId: call.tenant_id } }
  );
}

function inferSpeakerRoles(
  utterances: Array<{ speaker: string; text: string; start: number }>
): Record<string, string> {
  if (!utterances || utterances.length === 0) return {};

  // Get unique speakers sorted by first appearance
  const speakers = [...new Set(utterances.map(u => u.speaker))];

  if (speakers.length <= 1) {
    return { [speakers[0] || 'A']: 'unknown' };
  }

  // Heuristic: the speaker who talks first on most business calls is the caller (rep for outbound)
  // Also: the rep typically talks more in the first 30 seconds (intro + agenda setting)
  const first30s = utterances.filter(u => u.start < 30000);
  const wordCounts: Record<string, number> = {};
  for (const u of first30s) {
    wordCounts[u.speaker] = (wordCounts[u.speaker] || 0) + u.text.split(/\s+/).length;
  }

  // Speaker who talks more in first 30s is likely the rep (they're pitching/introducing)
  const sorted = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
  const repSpeaker = sorted[0]?.[0] || speakers[0];

  const map: Record<string, string> = {};
  for (const s of speakers) {
    map[s] = s === repSpeaker ? 'rep' : 'prospect';
  }

  return map;
}
