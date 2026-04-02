// src/lib/assemblyai.ts
// AssemblyAI integration for call transcription

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export interface TranscriptionResult {
  id: string;
  text: string;
  utterances: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
    sentiment: string;
  }>;
  sentiment_analysis_results: Array<{
    text: string;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence: number;
    speaker: string;
  }>;
  summary: string;
  duration: number;
  chapters: Array<{
    headline: string;
    summary: string;
    start: number;
    end: number;
  }>;
}

export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speaker_labels: true,        // Who said what
    sentiment_analysis: true,     // Sentiment per utterance
    auto_chapters: true,          // Auto-segment into topics
    summarization: true,          // Generate summary
    summary_model: 'informative',
    summary_type: 'bullets',
  });

  if (transcript.status === 'error') {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  return {
    id: transcript.id,
    text: transcript.text || '',
    utterances: (transcript.utterances || []).map(u => ({
      speaker: u.speaker,
      text: u.text,
      start: u.start,
      end: u.end,
      confidence: u.confidence,
      sentiment: 'NEUTRAL', // Will be enriched from sentiment_analysis_results
    })),
    sentiment_analysis_results: (transcript.sentiment_analysis_results || []).map(s => ({
      text: s.text,
      sentiment: s.sentiment,
      confidence: s.confidence,
      speaker: s.speaker || 'unknown',
    })),
    summary: transcript.summary || '',
    duration: transcript.audio_duration || 0,
    chapters: (transcript.chapters || []).map(c => ({
      headline: c.headline,
      summary: c.summary,
      start: c.start,
      end: c.end,
    })),
  };
}

export async function transcribeFile(filePath: string): Promise<TranscriptionResult> {
  // For local file uploads, AssemblyAI can accept a file upload
  const uploadUrl = await client.files.upload(filePath);
  return transcribeAudio(uploadUrl);
}
