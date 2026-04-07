// src/mastra/tools/call-analysis.ts
// FIXED: Includes speaker map, call type auto-detection, better error handling

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../../lib/supabase';
import { getTenant, getGHLClientForTenant } from '../../lib/tenant-context';
import { getTenantId } from './get-tenant-id';

const anthropic = new Anthropic();

export const analyzeCall = createTool({
  id: 'analyze_call',
  description: 'Analyze a call transcript to produce scoring, coaching, suggested actions, and data point updates. Use when a user asks to analyze, score, or review a specific call.',
  inputSchema: z.object({
    callId: z.string().describe('The call ID to analyze'),
  }),
  outputSchema: z.object({
    analysis: z.record(z.unknown()),
    message: z.string(),
  }),
  execute: async (input, executionContext) => {
    const resourceId = getTenantId(executionContext);
    // ── Load call + tenant ──
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', input.callId)
      .single();

    if (!call) throw new Error('Call not found');
    if (!call.transcript_text) throw new Error('Call has no transcript. Wait for transcription to complete.');

    const tenant = await getTenant(call.tenant_id);
    const rubric = tenant.scoring_rubric && Object.keys(tenant.scoring_rubric).length > 0
      ? tenant.scoring_rubric
      : getDefaultRubric();

    // ── Build speaker context ──
    const speakerMap = call.speaker_map || {};
    const speakerContext = Object.keys(speakerMap).length > 0
      ? `Speaker roles: ${Object.entries(speakerMap).map(([k, v]) => `${k} = ${v}`).join(', ')}`
      : 'Speaker roles have not been identified. Infer who is the sales rep and who is the prospect from context.';

    // ── Load contact context if linked ──
    let contactContext = 'No contact linked to this call.';
    if (call.contact_ghl_id && resourceId) {
      try {
        const ghl = await getGHLClientForTenant(resourceId);
        const contactData = await ghl.getContact(call.contact_ghl_id);
        const c = contactData.contact || contactData;
        contactContext = `Contact: ${c.firstName || ''} ${c.lastName || ''} (${c.email || 'no email'}). Tags: ${(c.tags || []).join(', ') || 'none'}.`;
      } catch {
        contactContext = 'Could not load contact data from CRM.';
      }
    }

    // ── Load previous call feedback for few-shot learning ──
    const { data: recentFeedback } = await supabaseAdmin
      .from('feedback_log')
      .select('feedback_type, original_value, edited_value, context')
      .eq('tenant_id', call.tenant_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const feedbackExamples = recentFeedback && recentFeedback.length > 0
      ? `\n## Learning from Past Feedback\nThe user has previously edited these suggestions. Learn from their preferences:\n${recentFeedback.map(f =>
          `- Type: ${f.feedback_type} | Original: ${JSON.stringify(f.original_value)} → Edited to: ${JSON.stringify(f.edited_value)}`
        ).join('\n')}`
      : '';

    // ── Build the prompt ──
    const prompt = `You are an expert sales coach analyzing a call transcript.

## Scoring Rubric
${JSON.stringify(rubric, null, 2)}

## Speaker Information
${speakerContext}

## Contact Context
${contactContext}
${feedbackExamples}

## Call Transcript
${call.transcript_text}

## Instructions
Analyze this call and return a JSON object with this EXACT structure (no other text, no markdown fences):

{
  "call_type": "<detected call type: discovery, demo, follow_up, closing, support, or other>",
  "score": {
    "overall": <weighted score 1-100>,
    "criteria": [
      {
        "name": "<criterion name>",
        "score": <1-10>,
        "weight": <from rubric>,
        "evidence": "<specific quote from transcript>",
        "feedback": "<1-2 sentence explanation>"
      }
    ]
  },
  "coaching": {
    "strengths": ["<specific thing done well with example>"],
    "improvements": [
      {
        "area": "<what to improve>",
        "current": "<what they did>",
        "suggested": "<what to do instead>",
        "example_script": "<actual words they could say>"
      }
    ],
    "summary": "<2-3 sentence coaching summary>"
  },
  "next_steps": [
    {
      "action_type": "<create_note|create_task|move_pipeline|update_contact|send_email>",
      "type": "<follow_up|scheduling|admin|new_lead>",
      "description": "<human-readable description>",
      "payload": {},
      "priority": "<high|medium|low>",
      "reasoning": "<why this action is needed>"
    }
  ],
  "data_point_updates": [
    {
      "field": "<field name like budget, timeline, decision_maker, pain_points>",
      "suggested_value": "<value extracted from call>",
      "evidence": "<quote from transcript>",
      "confidence": "<high|medium|low>"
    }
  ],
  "call_summary": "<3-4 sentence summary>"
}

CRITICAL: Return ONLY valid JSON. No preamble, no code fences, no explanation outside the JSON.`;

    // ── Call Claude with retry on JSON parse failure ──
    let analysis: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();

      try {
        analysis = JSON.parse(cleaned);
        break;
      } catch {
        if (attempt === 0) {
          console.warn('Call analysis JSON parse failed, retrying...');
          continue;
        }
        throw new Error(`Failed to parse analysis after 2 attempts. Raw output: ${cleaned.substring(0, 200)}...`);
      }
    }

    if (!analysis) throw new Error('Analysis returned null');

    // ── Store results ──
    await supabaseAdmin
      .from('calls')
      .update({
        call_type: (analysis.call_type as string) || null,
        score: analysis.score,
        coaching: analysis.coaching,
        next_steps: analysis.next_steps,
        data_point_updates: analysis.data_point_updates,
        call_summary: (analysis.call_summary as string) || null,
        status: 'complete',
      })
      .eq('id', input.callId);

    // ── Create call_actions for suggested next steps ──
    const nextSteps = analysis.next_steps as Array<Record<string, unknown>> || [];
    if (nextSteps.length > 0) {
      const actions = nextSteps.map(step => ({
        call_id: input.callId,
        tenant_id: call.tenant_id,
        action_type: step.action_type as string,
        description: step.description as string,
        suggested_payload: step,
        priority: (step.priority as string) || 'medium',
        status: 'suggested',
      }));

      await supabaseAdmin.from('call_actions').insert(actions);
    }

    // ── Store extracted data points ──
    const dataUpdates = analysis.data_point_updates as Array<Record<string, unknown>> || [];
    if (dataUpdates.length > 0 && call.contact_ghl_id) {
      for (const dp of dataUpdates) {
        await supabaseAdmin
          .from('contact_data_points')
          .upsert({
            tenant_id: call.tenant_id,
            contact_ghl_id: call.contact_ghl_id,
            field_name: dp.field as string,
            field_value: dp.suggested_value as string,
            source: 'call',
            source_call_id: input.callId,
            confidence: (dp.confidence as string) || 'medium',
          }, { onConflict: 'tenant_id,contact_ghl_id,field_name' });
      }
    }

    const overallScore = (analysis.score as Record<string, unknown>)?.overall;

    return {
      analysis,
      message: `Call analyzed. Score: ${overallScore}/100. Type: ${analysis.call_type}. ${nextSteps.length} actions suggested. ${dataUpdates.length} data points extracted.`,
    };
  },
});

function getDefaultRubric() {
  return {
    criteria: [
      { name: 'Rapport Building', weight: 15, description: 'Did the rep build genuine rapport?', scoring_guide: '1-3: No rapport. 4-6: Some effort. 7-9: Strong connection. 10: Exceptional.' },
      { name: 'Needs Discovery', weight: 25, description: 'Did the rep uncover pain points?', scoring_guide: '1-3: No discovery. 4-6: Surface. 7-9: Deep probing. 10: Hidden needs uncovered.' },
      { name: 'Active Listening', weight: 20, description: 'Did the rep listen more than talk?', scoring_guide: '1-3: Talked over. 4-6: Listened but forgot. 7-9: Referenced answers. 10: Masterful.' },
      { name: 'Value Proposition', weight: 20, description: 'Was value clearly articulated?', scoring_guide: '1-3: Generic. 4-6: Some tailoring. 7-9: Specific. 10: Compelling.' },
      { name: 'Next Steps', weight: 20, description: 'Were clear next steps established?', scoring_guide: '1-3: None. 4-6: Vague. 7-9: Specific commitment. 10: Locked in.' },
    ],
  };
}
