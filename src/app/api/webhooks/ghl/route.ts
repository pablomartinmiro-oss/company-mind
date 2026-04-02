// src/app/api/webhooks/ghl/route.ts
// FIXED: Added signature verification, deduplication, job queue pattern
// No more fire-and-forget — webhook just records the job, a worker processes it

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantByLocationId } from '@/lib/tenant-context';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // ── STEP 1: Verify webhook signature ──
    const rawBody = await req.text();
    const signature = req.headers.get('x-ghl-signature') || req.headers.get('x-webhook-signature');

    if (process.env.GHL_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expected) {
        console.warn('GHL webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || payload.event;

    // ── STEP 2: Filter for call events only ──
    let isCallEvent = false;

    if (eventType === 'InboundMessage' || eventType === 'OutboundMessage') {
      const message = payload.message || payload;
      if (message.messageType === 'TYPE_CALL' || message.type === 'TYPE_CALL') {
        isCallEvent = true;
      }
    }
    if (eventType === 'CallCompleted' || payload.workflow_trigger === 'call_completed') {
      isCallEvent = true;
    }

    if (!isCallEvent) {
      return NextResponse.json({ status: 'skipped', reason: 'not a call event' });
    }

    // ── STEP 3: Extract fields ──
    const locationId = (payload.locationId || payload.location_id) as string;
    const contactId = (payload.contactId || payload.contact_id) as string;
    const sourceId = (payload.messageId || payload.message_id || payload.id || crypto.randomUUID()) as string;

    if (!locationId) {
      return NextResponse.json({ error: 'No locationId' }, { status: 400 });
    }

    // ── STEP 4: Resolve tenant ──
    const tenant = await getTenantByLocationId(locationId);
    if (!tenant) {
      return NextResponse.json({ error: 'Unknown location' }, { status: 404 });
    }

    // ── STEP 5: Deduplicate ──
    const { data: existing } = await supabaseAdmin
      .from('calls')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('source', 'ghl')
      .eq('source_id', sourceId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: 'duplicate', callId: existing.id });
    }

    // ── STEP 6: Extract recording URL ──
    const recordingUrl = extractRecordingUrl(payload);

    // ── STEP 7: Duration routing (Rule 4) ──
    const durationSeconds = (payload.duration as number) || 0;
    const isShortCall = durationSeconds > 0 && durationSeconds < 45;

    // ── STEP 8: Create call record ──
    const { data: call, error: callError } = await supabaseAdmin
      .from('calls')
      .insert({
        tenant_id: tenant.id,
        source: 'ghl',
        source_id: sourceId,
        contact_ghl_id: contactId || null,
        contact_name: (payload.contactName || payload.contact_name || null) as string | null,
        recording_url: recordingUrl,
        direction: (payload.direction as string) || 'unknown',
        duration_seconds: durationSeconds,
        status: isShortCall ? 'skipped' : recordingUrl ? 'pending' : 'error',
        error_message: isShortCall
          ? 'No answer or too short (under 45s)'
          : recordingUrl ? null : 'No recording URL in webhook payload',
        metadata: {
          webhook_event: eventType,
          duration_tier: durationSeconds < 45 ? 'skip' : durationSeconds < 90 ? 'short' : 'full',
        },
        called_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (callError || !call) {
      console.error('Failed to create call:', callError);
      return NextResponse.json({ error: 'Failed to create call' }, { status: 500 });
    }

    // ── STEP 9: Queue transcription job (skip if under 45s) ──
    if (!isShortCall && recordingUrl) {
      await supabaseAdmin.from('call_jobs').insert({
        call_id: call.id,
        tenant_id: tenant.id,
        job_type: 'transcribe',
        status: 'pending',
      });
    }

    return NextResponse.json({
      status: isShortCall ? 'skipped' : 'queued',
      callId: call.id,
      reason: isShortCall ? 'Duration under 45s — skipped per Rule 4' : undefined,
    });
  } catch (error) {
    console.error('GHL webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function extractRecordingUrl(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.recordingUrl,
    payload.recording_url,
    payload.attachments && Array.isArray(payload.attachments)
      ? (payload.attachments as Array<{ url?: string }>)[0]?.url
      : null,
    payload.message && typeof payload.message === 'object'
      ? (payload.message as Record<string, unknown>).recordingUrl
      : null,
    payload.message && typeof payload.message === 'object'
      ? (payload.message as Record<string, unknown>).recording_url
      : null,
  ];

  for (const url of candidates) {
    if (typeof url === 'string' && url.startsWith('http')) {
      return url;
    }
  }
  return null;
}
