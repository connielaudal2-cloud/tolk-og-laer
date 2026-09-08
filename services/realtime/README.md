# Realtime service

Long-lived WebSocket runtime for transient translator audio and control events.

## Runtime

- Node.js 24
- HTTP health check: `GET /healthz`
- WebSocket endpoint: `/v1/realtime`
- Required subprotocols: `tolk-og-laer.realtime.v1`, `auth.<supabase_access_token>`
- Raw audio is not persisted by this service.

## Required environment

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `PORT` (defaults to 8080)

Optional controls are documented in the repository `.env.example`.

## Container

Build from repository root with `Dockerfile.realtime`.

The service must run on a host that supports long-lived WebSocket connections. Do not deploy the realtime transport as a Netlify Function or Supabase Edge Function.
