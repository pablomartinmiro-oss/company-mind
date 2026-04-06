// Helper to extract tenant ID from tool execution context.
// Reads from requestContext (preferred) or falls back to agent.resourceId (legacy).

interface ExecutionContext {
  requestContext?: { get: (key: string) => unknown };
  agent?: { resourceId?: string };
}

export function getTenantId(ctx: ExecutionContext): string {
  const id =
    (ctx.requestContext?.get('tenantId') as string | undefined) ??
    ctx.agent?.resourceId;
  if (!id) throw new Error('Missing tenant ID in execution context');
  return id;
}
