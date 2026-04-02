// src/lib/ghl.ts
// Go High Level API v2 wrapper with automatic token refresh

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

interface GHLTokens {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

export class GHLClient {
  private locationId: string;
  private tokens: GHLTokens;
  private onTokenRefresh?: (tokens: GHLTokens) => Promise<void>;

  constructor(
    locationId: string,
    tokens: GHLTokens,
    onTokenRefresh?: (tokens: GHLTokens) => Promise<void>
  ) {
    this.locationId = locationId;
    this.tokens = tokens;
    this.onTokenRefresh = onTokenRefresh;
  }

  private async refreshTokenIfNeeded(): Promise<string> {
    // Refresh if token expires within 5 minutes
    if (new Date() > new Date(this.tokens.expires_at.getTime() - 5 * 60 * 1000)) {
      const res = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GHL_CLIENT_ID!,
          client_secret: process.env.GHL_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
        }),
      });

      if (!res.ok) throw new Error(`GHL token refresh failed: ${res.status}`);

      const data = await res.json();
      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000),
      };

      if (this.onTokenRefresh) {
        await this.onTokenRefresh(this.tokens);
      }
    }
    return this.tokens.access_token;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ) {
    const token = await this.refreshTokenIfNeeded();
    const url = new URL(`${GHL_BASE_URL}${path}`);

    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GHL API ${method} ${path} failed (${res.status}): ${errorText}`);
    }

    return res.json();
  }

  // ── Contacts ──
  async searchContacts(query: string, limit = 20) {
    return this.request('GET', '/contacts/', undefined, {
      locationId: this.locationId,
      query,
      limit: String(limit),
    });
  }

  async getContact(contactId: string) {
    return this.request('GET', `/contacts/${contactId}`);
  }

  async createContact(data: Record<string, unknown>) {
    return this.request('POST', '/contacts/', {
      ...data,
      locationId: this.locationId,
    });
  }

  async updateContact(contactId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/contacts/${contactId}`, data);
  }

  // ── Pipelines / Opportunities ──
  async listPipelines() {
    return this.request('GET', '/opportunities/pipelines', undefined, {
      locationId: this.locationId,
    });
  }

  async searchOpportunities(pipelineId?: string, stageId?: string) {
    const params: Record<string, string> = { locationId: this.locationId };
    if (pipelineId) params.pipelineId = pipelineId;
    if (stageId) params.stageId = stageId;
    return this.request('GET', '/opportunities/search', undefined, params);
  }

  async updateOpportunity(opportunityId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/opportunities/${opportunityId}`, data);
  }

  async createOpportunity(data: Record<string, unknown>) {
    return this.request('POST', '/opportunities/', {
      ...data,
      locationId: this.locationId,
    });
  }

  // ── Tasks ──
  async getContactTasks(contactId: string) {
    return this.request('GET', `/contacts/${contactId}/tasks`);
  }

  async createTask(contactId: string, data: Record<string, unknown>) {
    return this.request('POST', `/contacts/${contactId}/tasks`, data);
  }

  // ── Calendar ──
  async listCalendars() {
    return this.request('GET', '/calendars/', undefined, {
      locationId: this.locationId,
    });
  }

  async listCalendarEvents(calendarId: string, startTime: string, endTime: string) {
    return this.request('GET', `/calendars/events`, undefined, {
      locationId: this.locationId,
      calendarId,
      startTime,
      endTime,
    });
  }

  // ── Notes ──
  async createNote(contactId: string, body: string) {
    return this.request('POST', `/contacts/${contactId}/notes`, { body });
  }

  // ── Conversations ──
  async getConversations(limit = 20) {
    return this.request('GET', '/conversations/', undefined, {
      locationId: this.locationId,
      limit: String(limit),
    });
  }

  async getConversationMessages(conversationId: string) {
    return this.request('GET', `/conversations/${conversationId}/messages`);
  }

  async sendMessage(data: {
    type: 'SMS' | 'Email' | 'WhatsApp';
    contactId: string;
    message?: string;
    subject?: string;
    html?: string;
  }) {
    return this.request('POST', '/conversations/messages', {
      ...data,
      locationId: this.locationId,
    });
  }
}
