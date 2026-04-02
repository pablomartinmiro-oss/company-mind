import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/mastra';
import { RequestContext } from '@mastra/core/request-context';
import { supabaseAdmin } from '@/lib/supabase';

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

export async function POST(req: Request) {
  const { messages, tenantId = TENANT_ID, context = {} } = await req.json();

  const agent = mastra.getAgent('companyMind');

  const requestContext = new RequestContext();
  requestContext.set('userName', context.userName ?? 'User');
  requestContext.set('userRole', context.userRole ?? 'member');
  requestContext.set('tenantName', context.tenantName ?? 'Company');
  requestContext.set('industry', context.industry ?? 'general');
  requestContext.set('currentPage', context.currentPage ?? 'dashboard');
  requestContext.set('currentContactId', context.currentContactId ?? null);
  requestContext.set('currentContactName', context.currentContactName ?? null);

  // Save user message
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
  if (lastUserMsg) {
    await supabaseAdmin.from('chat_messages').insert({
      tenant_id: tenantId,
      user_id: 'default',
      role: 'user',
      content: typeof lastUserMsg.content === 'string'
        ? lastUserMsg.content
        : lastUserMsg.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? '',
    });
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = await agent.stream(messages, {
        requestContext,
        maxSteps: 10,
      });

      let textPartId: string | null = null;
      let fullText = '';

      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'text-delta': {
            if (!textPartId) {
              textPartId = crypto.randomUUID();
              writer.write({ type: 'text-start', id: textPartId });
            }
            writer.write({ type: 'text-delta', id: textPartId, delta: chunk.payload.text });
            fullText += chunk.payload.text;
            break;
          }
          case 'text-end': {
            if (textPartId) {
              writer.write({ type: 'text-end', id: textPartId });
              textPartId = null;
            }
            break;
          }
          case 'tool-call': {
            if (textPartId) {
              writer.write({ type: 'text-end', id: textPartId });
              textPartId = null;
            }
            writer.write({
              type: 'tool-input-available',
              toolCallId: chunk.payload.toolCallId,
              toolName: chunk.payload.toolName,
              input: chunk.payload.args,
            });
            break;
          }
          case 'tool-result': {
            writer.write({
              type: 'tool-output-available',
              toolCallId: chunk.payload.toolCallId,
              output: chunk.payload.result,
            });
            break;
          }
          case 'step-start': {
            writer.write({ type: 'start-step' });
            break;
          }
          case 'step-finish': {
            if (textPartId) {
              writer.write({ type: 'text-end', id: textPartId });
              textPartId = null;
            }
            writer.write({ type: 'finish-step' });
            break;
          }
        }
      }

      if (textPartId) {
        writer.write({ type: 'text-end', id: textPartId });
      }

      // Save assistant message
      if (fullText) {
        await supabaseAdmin.from('chat_messages').insert({
          tenant_id: tenantId,
          user_id: 'default',
          role: 'assistant',
          content: fullText,
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
