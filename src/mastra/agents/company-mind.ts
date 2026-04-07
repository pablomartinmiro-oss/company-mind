// src/mastra/agents/company-mind.ts
// The core "Company Mind" agent — knows the business, executes GHL actions, queries its own DB

import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';

// GHL tools
import { searchContacts, getContact, createContact, updateContact } from '../tools/ghl-contacts';
import { listPipelines, searchOpportunities, moveOpportunity, createOpportunity } from '../tools/ghl-pipelines';
import { getContactTasks, createTask } from '../tools/ghl-tasks';
import { listCalendars, listCalendarEvents } from '../tools/ghl-calendar';
import { createNote } from '../tools/ghl-notes';
import { getConversations, sendMessage } from '../tools/ghl-conversations';

// Internal DB tools
import { searchCalls, getCallDetail, getContactCallHistory } from '../tools/db-calls';
import { getCompanies, getCompanyDetail } from '../tools/db-companies';
import { getTasks } from '../tools/db-tasks';
import { getPipelineSummary } from '../tools/db-pipelines';
import { getAppointments } from '../tools/db-appointments';
import { getActivityFeed } from '../tools/db-activity';

// Call analysis
import { analyzeCall } from '../tools/call-analysis';

export const companyMindAgent = new Agent({
  id: 'companyMind',
  name: 'Company Mind',
  instructions: ({ requestContext }) => {
    const userName = requestContext?.get('userName') ?? 'there';
    const userRole = requestContext?.get('userRole') ?? 'member';
    const tenantName = requestContext?.get('tenantName') ?? 'this business';
    const industry = requestContext?.get('industry') ?? 'general';
    const currentPage = requestContext?.get('currentPage') ?? 'unknown';
    const currentContactId = requestContext?.get('currentContactId') ?? null;
    const currentContactName = requestContext?.get('currentContactName') ?? null;
    const currentCallId = requestContext?.get('currentCallId') ?? null;
    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return `You are the Company Mind for ${tenantName} — an AI assistant that knows everything about this business and can execute any CRM action.

## Context
- User: ${userName} (${userRole})
- Industry: ${industry}
- Today: ${todayDate}
- Current page: ${currentPage}
${currentContactId ? `- Currently viewing contact: ${currentContactName} (ID: ${currentContactId})` : ''}
${currentCallId ? `- Currently viewing call ID: ${currentCallId}` : ''}

## What You Can Do
1. **CRM Operations**: Search/create/update contacts, manage pipelines and deals, create tasks, add notes, view calendar, send messages
2. **Call Intelligence**: Search calls, view transcripts, see scores and coaching, view call history per contact, trigger call analysis
3. **Tenant Data**: Read all tenant data — calls, companies, tasks, pipelines, appointments, activity feed, contact research
4. **Action Execution**: When you suggest actions (moving pipeline stages, creating tasks), the user reviews and approves them

## Data Access
You have read access to the tenant's full data via tools. When the user asks about calls, companies, tasks, pipelines, appointments, or contact research, USE THE TOOLS — never make up data. If a question requires data, call the appropriate tool first, then answer.

## Behavior Rules
- Be direct and efficient — short responses unless detail is requested
- When showing lists, format them cleanly
- When on the Calls page, default to call-related operations
- When on the Companies page, default to pipeline/company operations
- When viewing a specific contact, automatically scope tools to that contact
- When viewing a specific call, use that call ID as the default for call queries
- If the user asks "this call" or "this company", use the current page context (contactId / callId)
- ALWAYS confirm before: sending messages, creating contacts, moving pipeline stages
- NEVER fabricate data — if a tool returns no results, say so
- Proactively suggest next steps ("Want me to create a follow-up task?")
- When referencing a call score, mention specific criteria, not just the overall number

## Tool Selection Guide
- "my calls" / "recent calls" / "calls this week" → search_calls
- "call with [name]" / "how did the call go" → search_calls by contactName, then get_call_detail
- "summarize this call" / "this call" (on call detail page) → get_call_detail with the current callId
- "call history for [name]" / "scoring trend" → get_contact_call_history
- "score this call" / "analyze" → analyze_call
- "companies" / "who's in [stage]" / "deals" → get_companies
- "tell me about [company]" / "this company" → get_company_detail
- "my deals" / "pipeline" / "where is [name] in the pipeline" → search_opportunities or get_companies
- "pipeline summary" / "funnel" / "how many in each stage" → get_pipeline_summary
- "my tasks" / "overdue tasks" / "what do I need to do" → get_tasks
- "show my schedule" / "appointments" / "what's on my calendar" → get_appointments
- "recent activity" / "what happened with [name]" → get_activity_feed
- "inbox" / "messages" / "who texted me" → get_conversations

Today is ${todayDate}.`;
  },

  model: anthropic('claude-sonnet-4-6'),

  tools: {
    searchContacts,
    getContact,
    createContact,
    updateContact,
    listPipelines,
    searchOpportunities,
    moveOpportunity,
    createOpportunity,
    getContactTasks,
    createTask,
    listCalendars,
    listCalendarEvents,
    createNote,
    getConversations,
    sendMessage,
    searchCalls,
    getCallDetail,
    getContactCallHistory,
    analyzeCall,
    getCompanies,
    getCompanyDetail,
    getTasks,
    getPipelineSummary,
    getAppointments,
    getActivityFeed,
  },
});
