-- Foreign-key, ownership and high-frequency query indexes.
create index learning_categories_language_sequence_idx on public.learning_categories(language_id, sequence);
create index learning_chapters_category_sequence_idx on public.learning_chapters(category_id, sequence);
create index lessons_chapter_sequence_idx on public.lessons(chapter_id, sequence);
create index lesson_items_lesson_sequence_idx on public.lesson_items(lesson_id, sequence);
create index user_course_enrollments_user_idx on public.user_course_enrollments(user_id);
create index user_course_enrollments_language_idx on public.user_course_enrollments(language_id);
create index user_lesson_progress_user_status_idx on public.user_lesson_progress(user_id, status);
create index user_lesson_progress_lesson_idx on public.user_lesson_progress(lesson_id);
create index review_items_user_due_pending_idx on public.review_items(user_id, due_at) where state = 'pending';
create index review_items_lesson_item_idx on public.review_items(lesson_item_id);
create index pronunciation_attempts_user_created_idx on public.pronunciation_attempts(user_id, created_at desc);
create index pronunciation_attempts_lesson_item_idx on public.pronunciation_attempts(lesson_item_id);
create index translator_sessions_user_started_idx on public.translator_sessions(user_id, started_at desc);
create index translator_speakers_session_idx on public.translator_speakers(session_id);
create index transcript_segments_session_sequence_idx on public.transcript_segments(session_id, sequence, revision);
create index transcript_segments_speaker_idx on public.transcript_segments(speaker_id);
create index translation_segments_session_sequence_idx on public.translation_segments(session_id, sequence, revision);
create index translation_segments_transcript_idx on public.translation_segments(transcript_segment_id);
create index provider_usage_user_created_idx on public.provider_usage(user_id, created_at desc);
create index provider_usage_session_idx on public.provider_usage(session_id);
create index provider_usage_created_operation_idx on public.provider_usage(created_at, operation);
create index audit_events_actor_created_idx on public.audit_events(actor_user_id, created_at desc);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);

alter table public.languages enable row level security;
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.learning_categories enable row level security;
alter table public.learning_chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_items enable row level security;
alter table public.user_course_enrollments enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.review_items enable row level security;
alter table public.pronunciation_attempts enable row level security;
alter table public.translator_sessions enable row level security;
alter table public.translator_speakers enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.translation_segments enable row level security;
alter table public.conversation_summaries enable row level security;
alter table public.translator_session_metrics enable row level security;
alter table public.provider_usage enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.languages, public.learning_categories, public.learning_chapters,
  public.lessons, public.lesson_items to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.user_course_enrollments to authenticated;
grant select on public.user_lesson_progress, public.review_items to authenticated;
grant select, insert on public.pronunciation_attempts to authenticated;
grant select, insert, update, delete on public.translator_sessions to authenticated;
grant select on public.translator_speakers, public.transcript_segments,
  public.translation_segments, public.conversation_summaries,
  public.translator_session_metrics to authenticated;
grant all on all tables in schema public to service_role;

create policy languages_public_read on public.languages for select to anon, authenticated
using (is_active);
create policy learning_categories_public_read on public.learning_categories for select to anon, authenticated
using (status = 'published');
create policy learning_chapters_public_read on public.learning_chapters for select to anon, authenticated
using (
  status = 'published' and exists (
    select 1 from public.learning_categories c
    where c.id = category_id and c.status = 'published'
  )
);
create policy lessons_public_read on public.lessons for select to anon, authenticated
using (
  status = 'published' and exists (
    select 1 from public.learning_chapters ch
    join public.learning_categories c on c.id = ch.category_id
    where ch.id = chapter_id and ch.status = 'published' and c.status = 'published'
  )
);
create policy lesson_items_public_read on public.lesson_items for select to anon, authenticated
using (
  status = 'published' and exists (
    select 1 from public.lessons l
    join public.learning_chapters ch on ch.id = l.chapter_id
    join public.learning_categories c on c.id = ch.category_id
    where l.id = lesson_id and l.status = 'published'
      and ch.status = 'published' and c.status = 'published'
  )
);

create policy profiles_own_select on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_own_update on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy user_preferences_own_select on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy user_preferences_own_insert on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy user_preferences_own_update on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy user_preferences_own_delete on public.user_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy enrollments_own_select on public.user_course_enrollments for select to authenticated
using ((select auth.uid()) = user_id);
create policy enrollments_own_insert on public.user_course_enrollments for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy enrollments_own_update on public.user_course_enrollments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy enrollments_own_delete on public.user_course_enrollments for delete to authenticated
using ((select auth.uid()) = user_id);

create policy lesson_progress_own_select on public.user_lesson_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy review_items_own_select on public.review_items for select to authenticated
using ((select auth.uid()) = user_id);
create policy pronunciation_attempts_own_select on public.pronunciation_attempts for select to authenticated
using ((select auth.uid()) = user_id);
create policy pronunciation_attempts_own_insert on public.pronunciation_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy translator_sessions_own_select on public.translator_sessions for select to authenticated
using ((select auth.uid()) = user_id);
create policy translator_sessions_own_insert on public.translator_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy translator_sessions_own_update on public.translator_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy translator_sessions_own_delete on public.translator_sessions for delete to authenticated
using ((select auth.uid()) = user_id);

create policy translator_speakers_owner_read on public.translator_speakers for select to authenticated
using (exists (
  select 1 from public.translator_sessions s
  where s.id = session_id and s.user_id = (select auth.uid())
));
create policy transcript_segments_owner_read on public.transcript_segments for select to authenticated
using (exists (
  select 1 from public.translator_sessions s
  where s.id = session_id and s.user_id = (select auth.uid())
));
create policy translation_segments_owner_read on public.translation_segments for select to authenticated
using (exists (
  select 1 from public.translator_sessions s
  where s.id = session_id and s.user_id = (select auth.uid())
));
create policy conversation_summaries_owner_read on public.conversation_summaries for select to authenticated
using (exists (
  select 1 from public.translator_sessions s
  where s.id = session_id and s.user_id = (select auth.uid())
));
create policy translator_session_metrics_owner_read on public.translator_session_metrics for select to authenticated
using (exists (
  select 1 from public.translator_sessions s
  where s.id = session_id and s.user_id = (select auth.uid())
));

-- provider_usage and audit_events intentionally have no client policies.
