import {
  apiErrorResponse,
  createTranslationSessionRequest,
  createTranslationSessionResponse,
  endTranslationSessionRequest,
  endTranslationSessionResponse,
  type CreateTranslationSessionRequest,
  type CreateTranslationSessionResponse,
  type EndTranslationSessionRequest,
  type EndTranslationSessionResponse,
} from '@tolk-og-laer/contracts';

export class TranslationApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class TranslationSessionApi {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://localhost'))
      throw new Error('Translation API URL must use https:// outside local development');
  }

  async create(
    accessToken: string,
    input: CreateTranslationSessionRequest,
  ): Promise<CreateTranslationSessionResponse> {
    const body = createTranslationSessionRequest.parse(input);
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/v1/translation/sessions`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(body),
    });
    return this.parse(response, createTranslationSessionResponse);
  }

  async end(
    accessToken: string,
    sessionId: string,
    input: EndTranslationSessionRequest,
  ): Promise<EndTranslationSessionResponse> {
    const body = endTranslationSessionRequest.parse(input);
    const response = await this.fetcher(
      `${this.baseUrl.replace(/\/$/, '')}/v1/translation/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'PATCH',
        headers: this.headers(accessToken),
        body: JSON.stringify(body),
      },
    );
    return this.parse(response, endTranslationSessionResponse);
  }

  private headers(accessToken: string) {
    if (!accessToken) throw new Error('Access token is required');
    return {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    };
  }

  private async parse<T>(response: Response, schema: { parse(value: unknown): T }): Promise<T> {
    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      const parsedError = apiErrorResponse.safeParse(payload);
      if (parsedError.success)
        throw new TranslationApiError(response.status, parsedError.data.error.code, parsedError.data.error.message);
      throw new TranslationApiError(response.status, 'invalid_api_response', 'Translation API request failed');
    }
    return schema.parse(payload);
  }
}
