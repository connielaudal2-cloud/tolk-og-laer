import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import { extractRealtimeAccessToken } from './websocket.js';

const requestWithProtocols = (value: string | string[] | undefined) =>
  ({ headers: { 'sec-websocket-protocol': value } }) as IncomingMessage;

describe('extractRealtimeAccessToken', () => {
  it('requires both the realtime protocol and auth protocol', () => {
    expect(
      extractRealtimeAccessToken(
        requestWithProtocols('tolk-og-laer.realtime.v1, auth.header.payload.signature'),
      ),
    ).toBe('header.payload.signature');
    expect(extractRealtimeAccessToken(requestWithProtocols('auth.token'))).toBeNull();
    expect(extractRealtimeAccessToken(requestWithProtocols('tolk-og-laer.realtime.v1'))).toBeNull();
  });

  it('normalizes repeated protocol header values', () => {
    expect(
      extractRealtimeAccessToken(
        requestWithProtocols(['tolk-og-laer.realtime.v1', 'auth.header.payload.signature']),
      ),
    ).toBe('header.payload.signature');
  });
});
