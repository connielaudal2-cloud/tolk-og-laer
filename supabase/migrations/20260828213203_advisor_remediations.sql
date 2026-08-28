create index profiles_native_language_code_idx on public.profiles(native_language_code);
create index user_preferences_target_language_code_idx on public.user_preferences(translation_target_language_code);
create index translator_sessions_target_language_code_idx on public.translator_sessions(target_language_code);
create index translation_segments_target_language_code_idx on public.translation_segments(target_language_code);

create policy provider_usage_client_deny_all on public.provider_usage
as restrictive for all to anon, authenticated
using (false)
with check (false);

create policy audit_events_client_deny_all on public.audit_events
as restrictive for all to anon, authenticated
using (false)
with check (false);
