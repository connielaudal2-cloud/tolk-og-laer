export type RealtimeIdentity = { userId: string };

export type RealtimeAuthConfig = {
  supabaseUrl: string;
  publishableKey: string;
  fetcher?: typeof fetch;
};

export class SupabaseRealtimeAuth {
  private readonly fetcher: typeof fetch;
  private readonly baseUrl: string;

  constructor(private readonly config: RealtimeAuthConfig) {
    this.baseUrl = config.supabaseUrl.replace(/\/$/, '');
    this.fetcher = config.fetcher ?? fetch;
  }

  async verifyAccessToken(accessToken: string): Promise<RealtimeIdentity | null> {
    const response = await this.fetcher(`${this.baseUrl}/auth/v1/user`, {
      headers: {
        apikey: this.config.publishableKey,
        authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as unknown;
    if (!body || typeof body !== 'object') return null;
    const id = (body as Record<string, unknown>).id;
    return typeof id === 'string' && id.length > 0 ? { userId: id } : null;
  }

  async canAccessSession(accessToken: string, sessionId: string): Promise<boolean> {
    const response = await this.fetcher(
      `${this.baseUrl}/rest/v1/translator_sessions?id=eq.${encodeURIComponent(sessionId)}&select=id&limit=1`,
      {
        headers: {
          apikey: this.config.publishableKey,
          authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!response.ok) return false;
    const rows = (await response.json()) as unknown;
    return Array.isArray(rows) && rows.length === 1 && (rows[0] as Record<string, unknown>).id === sessionId;
  }
}
