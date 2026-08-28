create type public.translator_session_status as enum ('starting', 'active', 'paused', 'ended', 'failed');
create type public.segment_state as enum ('partial', 'stabilized', 'final', 'corrected');
create type public.speaker_label as enum ('Person 1', 'Person 2', 'Person 3');
create type public.provider_operation as enum (
  'speech_to_text', 'language_identification', 'speaker_diarization',
  'translation', 'text_to_speech', 'speech_enhancement', 'summary'
);
create type public.audit_action as enum ('create', 'update', 'delete', 'publish', 'unpublish', 'auth', 'export');

create table public.translator_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status public.translator_session_status not null default 'starting',
  target_language_code text not null default 'nb' references public.languages(code) on update cascade,
  retention_mode public.retention_mode not null default 'none',
  environment public.app_environment not null default 'production',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint translator_session_end_consistency check (
    (status in ('ended', 'failed') and ended_at is not null) or
    (status not in ('ended', 'failed'))
  )
);

create table public.translator_speakers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.translator_sessions(id) on delete cascade,
  stable_label public.speaker_label not null,
  detected_language_codes text[] not null default '{}',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, stable_label)
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.translator_sessions(id) on delete cascade,
  speaker_id uuid not null references public.translator_speakers(id) on delete cascade,
  sequence bigint not null check (sequence >= 0),
  revision integer not null default 0 check (revision >= 0),
  state public.segment_state not null default 'partial',
  source_language_code text,
  source_dialect_code text,
  start_ms bigint not null check (start_ms >= 0),
  end_ms bigint check (end_ms is null or end_ms >= start_ms),
  transcript_text text not null,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  critical_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(critical_fields) = 'object'),
  created_at timestamptz not null default now(),
  unique (session_id, sequence, revision)
);

create table public.translation_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.translator_sessions(id) on delete cascade,
  transcript_segment_id uuid not null references public.transcript_segments(id) on delete cascade,
  sequence bigint not null check (sequence >= 0),
  revision integer not null default 0 check (revision >= 0),
  state public.segment_state not null default 'partial',
  target_language_code text not null default 'nb' references public.languages(code) on update cascade,
  translated_text text not null,
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  critical_fields_verified boolean not null default false,
  correction_reason text,
  created_at timestamptz not null default now(),
  unique (session_id, sequence, revision),
  unique (transcript_segment_id, revision)
);

create table public.conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.translator_sessions(id) on delete cascade,
  summary_text text not null,
  source_segment_count integer not null check (source_segment_count >= 0),
  critical_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(critical_fields) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.translator_session_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.translator_sessions(id) on delete cascade,
  first_partial_latency_ms integer check (first_partial_latency_ms is null or first_partial_latency_ms >= 0),
  first_translation_latency_ms integer check (first_translation_latency_ms is null or first_translation_latency_ms >= 0),
  reconnect_count integer not null default 0 check (reconnect_count >= 0),
  dropped_segment_count integer not null default 0 check (dropped_segment_count >= 0),
  degraded_duration_ms bigint not null default 0 check (degraded_duration_ms >= 0),
  average_confidence numeric(4,3) check (average_confidence is null or average_confidence between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.translator_sessions(id) on delete set null,
  operation public.provider_operation not null,
  provider text not null,
  model text not null,
  request_id text,
  input_units numeric(16,4) not null default 0 check (input_units >= 0),
  output_units numeric(16,4) not null default 0 check (output_units >= 0),
  cost_amount numeric(14,6) not null default 0 check (cost_amount >= 0),
  cost_currency text not null default 'USD' check (cost_currency ~ '^[A-Z]{3}$'),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  succeeded boolean not null,
  error_category text,
  created_at timestamptz not null default now(),
  unique (provider, request_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action public.audit_action not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create trigger translator_sessions_set_updated_at before update on public.translator_sessions
for each row execute function private.set_updated_at();
create trigger translator_speakers_set_updated_at before update on public.translator_speakers
for each row execute function private.set_updated_at();
create trigger conversation_summaries_set_updated_at before update on public.conversation_summaries
for each row execute function private.set_updated_at();
create trigger translator_session_metrics_set_updated_at before update on public.translator_session_metrics
for each row execute function private.set_updated_at();
