create type public.lesson_item_type as enum (
  'text',
  'listening',
  'pronunciation',
  'translation',
  'recall',
  'grammar',
  'vocabulary'
);
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
create type public.review_state as enum ('pending', 'completed', 'suspended');

create table public.learning_categories (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages(id) on delete restrict,
  slug text not null,
  title text not null,
  description text,
  sequence integer not null check (sequence > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language_id, slug),
  unique (language_id, sequence)
);

create table public.learning_chapters (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.learning_categories(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sequence integer not null check (sequence > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug),
  unique (category_id, sequence)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.learning_chapters(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sequence integer not null check (sequence > 0),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  difficulty numeric(4,3) check (difficulty is null or difficulty between 0 and 1),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug),
  unique (chapter_id, sequence)
);

create table public.lesson_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  item_type public.lesson_item_type not null,
  sequence integer not null check (sequence > 0),
  source_text text,
  norwegian_translation text,
  transliteration text,
  explanation text,
  audio_asset_path text,
  image_asset_path text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, sequence)
);

create table public.user_course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  language_id uuid not null references public.languages(id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, language_id)
);

create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  status public.progress_status not null default 'not_started',
  mastery numeric(4,3) not null default 0 check (mastery between 0 and 1),
  attempts integer not null default 0 check (attempts >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id),
  constraint lesson_progress_completion_consistency check (
    (status = 'completed' and completed_at is not null) or
    (status <> 'completed')
  )
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_item_id uuid not null references public.lesson_items(id) on delete cascade,
  state public.review_state not null default 'pending',
  due_at timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.00),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_item_id)
);

create table public.pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  lesson_item_id uuid not null references public.lesson_items(id) on delete restrict,
  score numeric(4,3) check (score is null or score between 0 and 1),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  provider text,
  provider_model text,
  feedback jsonb not null default '{}'::jsonb check (jsonb_typeof(feedback) = 'object'),
  audio_retained boolean not null default false,
  audio_storage_path text,
  created_at timestamptz not null default now(),
  constraint pronunciation_audio_retention_consistency check (
    (audio_retained and audio_storage_path is not null) or
    (not audio_retained and audio_storage_path is null)
  )
);

create trigger learning_categories_set_updated_at before update on public.learning_categories
for each row execute function private.set_updated_at();
create trigger learning_chapters_set_updated_at before update on public.learning_chapters
for each row execute function private.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function private.set_updated_at();
create trigger lesson_items_set_updated_at before update on public.lesson_items
for each row execute function private.set_updated_at();
create trigger user_course_enrollments_set_updated_at before update on public.user_course_enrollments
for each row execute function private.set_updated_at();
create trigger user_lesson_progress_set_updated_at before update on public.user_lesson_progress
for each row execute function private.set_updated_at();
create trigger review_items_set_updated_at before update on public.review_items
for each row execute function private.set_updated_at();
