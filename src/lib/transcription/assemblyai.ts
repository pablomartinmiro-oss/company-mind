// src/lib/transcription/assemblyai.ts
// Async submit/poll transcription client for the R3 call processing pipeline.
// The existing src/lib/assemblyai.ts uses synchronous transcribe() — this module
// uses submit() + get() for the cron-based state machine pattern.

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export interface TranscriptionResult {
  transcriptId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string | null;
  speakers: SpeakerSegment[] | null;
  error: string | null;
}

export interface SpeakerSegment {
  speaker: string;        // 'A' or 'B' (AssemblyAI labels)
  text: string;
  start: number;          // ms
  end: number;            // ms
}

/**
 * Submit an audio URL to AssemblyAI for transcription with speaker diarization.
 * Returns the transcript ID immediately. Use pollTranscript() to check status.
 */
export async function submitForTranscription(audioUrl: string): Promise<string> {
  const transcript = await client.transcripts.submit({
    audio_url: audioUrl,
    speaker_labels: true,
    speakers_expected: 2,
    language_code: 'en',
    format_text: true,
    punctuate: true,
  });

  return transcript.id;
}

/**
 * Check the status of an existing transcript. Returns full result if complete.
 */
export async function pollTranscript(transcriptId: string): Promise<TranscriptionResult> {
  const transcript = await client.transcripts.get(transcriptId);

  let speakers: SpeakerSegment[] | null = null;
  if (transcript.status === 'completed' && transcript.utterances) {
    speakers = transcript.utterances.map(u => ({
      speaker: u.speaker,
      text: u.text,
      start: u.start,
      end: u.end,
    }));
  }

  return {
    transcriptId: transcript.id,
    status: transcript.status as TranscriptionResult['status'],
    text: transcript.text || null,
    speakers,
    error: transcript.error || null,
  };
}

/**
 * Format speaker segments into a clean transcript string.
 * Speaker A → "Rep" if rep speaks first (most common), Speaker B → "Prospect"
 * AI heuristic: whoever talks first in a sales call is usually the rep
 */
export function formatTranscriptWithSpeakers(speakers: SpeakerSegment[]): string {
  if (!speakers || speakers.length === 0) return '';

  const firstSpeaker = speakers[0].speaker;
  const labelFor = (s: string) => s === firstSpeaker ? 'Rep' : 'Prospect';

  return speakers
    .map(s => `${labelFor(s.speaker)}: ${s.text}`)
    .join('\n\n');
}
