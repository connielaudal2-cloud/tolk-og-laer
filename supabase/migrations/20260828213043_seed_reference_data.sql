insert into public.languages (
  id, code, name, native_name, direction,
  is_learning_language, is_translation_source, is_translation_target, is_active
)
values
  ('00000000-0000-4000-8000-000000000001', 'nb', 'Norwegian', 'Norsk bokmål', 'ltr', false, false, true, true),
  ('00000000-0000-4000-8000-000000000002', 'fr', 'French', 'Français', 'ltr', true, true, false, true),
  ('00000000-0000-4000-8000-000000000003', 'ary', 'Moroccan Arabic / Darija', 'الدارجة المغربية', 'rtl', true, true, false, true),
  ('00000000-0000-4000-8000-000000000004', 'de', 'German', 'Deutsch', 'ltr', true, false, false, true),
  ('00000000-0000-4000-8000-000000000005', 'vi', 'Vietnamese', 'Tiếng Việt', 'ltr', true, false, false, true)
on conflict (code) do update set
  name = excluded.name,
  native_name = excluded.native_name,
  direction = excluded.direction,
  is_learning_language = excluded.is_learning_language,
  is_translation_source = excluded.is_translation_source,
  is_translation_target = excluded.is_translation_target,
  is_active = excluded.is_active;

with category_seed(sequence, slug, title) as (
  values
    (1, 'foundations', 'Grunnlag'),
    (2, 'grammar', 'Grammatikk'),
    (3, 'verbs-and-conjugation', 'Verb og bøying'),
    (4, 'pronunciation', 'Uttale'),
    (5, 'listening', 'Lytteforståelse'),
    (6, 'numbers', 'Tall'),
    (7, 'time-and-dates', 'Tid og dato'),
    (8, 'food-and-meals', 'Mat og måltider'),
    (9, 'ordering-food-and-drinks', 'Bestille mat og drikke'),
    (10, 'travel', 'Reise'),
    (11, 'hotel', 'Hotell'),
    (12, 'transport', 'Transport'),
    (13, 'work', 'Arbeid'),
    (14, 'social-communication', 'Sosial kommunikasjon'),
    (15, 'health', 'Helse'),
    (16, 'emergencies', 'Nødsituasjoner'),
    (17, 'shopping', 'Shopping'),
    (18, 'money', 'Penger'),
    (19, 'family-and-relationships', 'Familie og relasjoner'),
    (20, 'daily-life', 'Hverdagsliv'),
    (21, 'culture-and-etiquette', 'Kultur og etikette'),
    (22, 'laws-and-rules', 'Landsspesifikke lover og regler'),
    (23, 'reading-and-writing', 'Lesing og skriving'),
    (24, 'real-world-situations', 'Praktiske situasjoner')
)
insert into public.learning_categories (language_id, slug, title, sequence, status)
select l.id, c.slug, c.title, c.sequence, 'published'::public.content_status
from public.languages l
cross join category_seed c
where l.code in ('fr', 'ary', 'de', 'vi')
on conflict (language_id, slug) do update set
  title = excluded.title,
  sequence = excluded.sequence,
  status = excluded.status;
