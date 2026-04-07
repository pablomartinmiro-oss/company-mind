// src/app/api/webhooks/ghl/route.ts
// R3: GHL webhook receiver with signature verification, idempotency,
// and processing_status state machine on calls table.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTenantByLocationId } from '@/lib/tenant-context';
import { log } from '@/lib/log';
import crypto from 'crypto';

function verifyGhlSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.GHL_WEBHOOK_SECRET) return false;
  const hmac = crypto
    .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // ── 1. Get raw body for signature verification ──
  const rawBody = await req.text();
  const signature = req.headers.get('x-ghl-signature') || req.headers.get('x-webhook-signature');
  const signatureValid = verifyGhlSignature(rawBody, signature);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload.type || payload.event || 'unknown') as string;
  const locationId = (payload.locationId || payload.location_id) as string;
  const callId = (payload.callId || payload.messageId || payload.message_id || payload.id) as string;

  log.info('ghl_webhook_received', { type: eventType, locationId, callId, signatureValid });

  if (!locationId) {
    log.warn('ghl_webhook_rejected', { reason: 'no_location_id', type: eventType });
    return NextResponse.json({ error: 'No locationId' }, { status: 400 });
  }

  // ── 2. Find the tenant for this locationId ──
  const tenant = await getTenantByLocationId(locationId);

  if (!tenant) {
    // Log event but don't error — tenant may not be onboarded yet
    await supabaseAdmin.from('webhook_events').insert({
      source: 'ghl',
      event_type: eventType,
      external_id: callId || null,
      payload,
      signature_valid: signatureValid,
      error: 'Tenant not found for locationId',
    });
    return NextResponse.json({ received: true, processed: false });
  }

  // ── 3. Log the event for audit trail ──
  await supabaseAdmin.from('webhook_events').insert({
    tenant_id: tenant.id,
    source: 'ghl',
    event_type: eventType,
    external_id: callId || null,
    payload,
    signature_valid: signatureValid,
  });

  // ── 4. Reject invalid signatures in production ──
  if (!signatureValid && process.env.NODE_ENV === 'production' && process.env.GHL_WEBHOOK_SECRET) {
    log.warn('ghl_webhook_rejected', { reason: 'invalid_signature', type: eventType, locationId });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 5. Filter for call events only ──
  const isCallEvent = isGhlCallEvent(eventType, payload);
  if (!isCallEvent) {
    return NextResponse.json({ received: true, processed: false, reason: 'Event type ignored' });
  }

  if (!callId) {
    return NextResponse.json({ error: 'No callId in payload' }, { status: 400 });
  }

  // ── 6. Extract fields ──
  const contactId = (payload.contactId || payload.contact_id) as string | undefined;
  const contactName = (payload.contactName || payload.contact_name) as string | undefined;
  const recordingUrl = extractRecordingUrl(payload);
  const duration = (payload.duration as number) || 0;
  const direction = (payload.direction as string) || 'unknown';

  // ── 7. Skip calls under 60s (CLAUDE.md Rule 4) ──
  if (duration > 0 && duration < 60) {
    await supabaseAdmin
      .from('calls')
      .upsert({
        tenant_id: tenant.id,
        ghl_call_id: callId,
        contact_ghl_id: contactId || null,
        contact_name: contactName || null,
        duration_seconds: duration,
        direction,
        ghl_recording_url: recordingUrl,
        processing_status: 'skipped',
        processing_error: 'No answer or too short (under 60s)',
        called_at: (payload.startedAt as string) || new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,ghl_call_id',
      });

    return NextResponse.json({ received: true, processed: false, reason: 'Under 60s, skipped per Rule 4' });
  }

  // ── 8. Idempotent upsert — create call in pending state ──
  const { error: upsertError } = await supabaseAdmin
    .from('calls')
    .upsert({
      tenant_id: tenant.id,
      ghl_call_id: callId,
      contact_ghl_id: contactId || null,
      contact_name: contactName || null,
      duration_seconds: duration,
      direction,
      ghl_recording_url: recordingUrl,
      processing_status: 'pending',
      processing_attempts: 0,
      called_at: (payload.startedAt as string) || new Date().toISOString(),
    }, {
      onConflict: 'tenant_id,ghl_call_id',
      ignoreDuplicates: true,
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // ── 9. Return immediately. The cron worker picks this up. ──
  return NextResponse.json({ received: true, queued: true });
}

/**
 * Determine if a GHL webhook event is a call event.
 * GHL sends calls through multiple event types depending on configuration.
 */
function isGhlCallEvent(eventType: string, payload: Record<string, unknown>): boolean {
  // Direct call events
  if (eventType === 'CallEnded' || eventType === 'CallRecorded' || eventType === 'CallCompleted') {
    return true;
  }
  if (payload.workflow_trigger === 'call_completed') {
    return true;
  }
  // Message-type call events
  if (eventType === 'InboundMessage' || eventType === 'OutboundMessage') {
    const message = payload.message || payload;
    if (typeof message === 'object' && message !== null) {
      const msg = message as Record<string, unknown>;
      if (msg.messageType === 'TYPE_CALL' || msg.type === 'TYPE_CALL') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extract recording URL from various GHL payload formats.
 * GHL nests the URL differently depending on event type.
 */
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
