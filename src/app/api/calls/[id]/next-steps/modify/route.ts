import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getTenantForUser } from '@/lib/get-tenant';

export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getTenantForUser();
    await params;
    const { instruction, currentFields, actionType } = await req.json();

    if (!instruction?.trim()) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are modifying a CRM action card based on the user's instruction.

ACTION TYPE: ${actionType}
CURRENT FIELDS:
${JSON.stringify(currentFields, null, 2)}

USER INSTRUCTION: "${instruction}"

Return ONLY a JSON object with the updated field values. Only include fields that changed. Use the same field keys as the current fields.
No markdown fences — just the JSON object.`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const updatedFields = JSON.parse(match[0]);
    return NextResponse.json({ fields: updatedFields });
  } catch (err) {
    if (err instanceof Error && err.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
