import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTolkOgLaerClient,
  signInWithEmail,
  signOut,
  type TolkOgLaerClient,
} from '@tolk-og-laer/api-client';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for remote RLS tests`);
  return value;
};

describe('remote Supabase RLS', () => {
  let userA: TolkOgLaerClient;
  let userB: TolkOgLaerClient;
  let userAId: string;
  let userBId: string;
  let languageId: string;

  beforeAll(async () => {
    const config = {
      url: required('SUPABASE_URL'),
      publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
      options: { auth: { persistSession: false, autoRefreshToken: false } },
    };
    userA = createTolkOgLaerClient(config);
    userB = createTolkOgLaerClient(config);

    const [{ data: authA, error: errorA }, { data: authB, error: errorB }] = await Promise.all([
      signInWithEmail(
        userA,
        required('RLS_TEST_USER_A_EMAIL'),
        required('RLS_TEST_USER_A_PASSWORD'),
      ),
      signInWithEmail(
        userB,
        required('RLS_TEST_USER_B_EMAIL'),
        required('RLS_TEST_USER_B_PASSWORD'),
      ),
    ]);
    expect(errorA).toBeNull();
    expect(errorB).toBeNull();
    userAId = authA.user!.id;
    userBId = authB.user!.id;

    const { data, error } = await userA.from('languages').select('id').eq('code', 'de').single();
    expect(error).toBeNull();
    languageId = data!.id;
  });

  afterAll(async () => {
    if (userA && languageId) {
      await userA.from('user_course_enrollments').delete().eq('language_id', languageId);
    }
    await Promise.all([userA && signOut(userA), userB && signOut(userB)]);
  });

  it('allows each user to read only their own profile', async () => {
    const own = await userA.from('profiles').select('id');
    const other = await userA.from('profiles').select('id').eq('id', userBId);
    expect(own.error).toBeNull();
    expect(own.data).toEqual([{ id: userAId }]);
    expect(other.error).toBeNull();
    expect(other.data).toEqual([]);
  });

  it('allows public reference content and hides private tables from anon', async () => {
    const anon = createTolkOgLaerClient({
      url: required('SUPABASE_URL'),
      publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
      options: { auth: { persistSession: false, autoRefreshToken: false } },
    });
    const languages = await anon.from('languages').select('code');
    const categories = await anon.from('learning_categories').select('id');
    const profiles = await anon.from('profiles').select('id');
    expect(languages.error).toBeNull();
    expect(languages.data).toHaveLength(5);
    expect(categories.error).toBeNull();
    expect(categories.data).toHaveLength(96);
    expect(profiles.error?.code).toBe('42501');
  });

  it('enforces own insert, update and delete policies', async () => {
    const marker = randomUUID();
    const inserted = await userA
      .from('user_course_enrollments')
      .insert({ language_id: languageId })
      .select('id, user_id')
      .single();
    expect(inserted.error).toBeNull();
    expect(inserted.data?.user_id).toBe(userAId);

    const ownUpdate = await userA
      .from('user_preferences')
      .update({ preferred_voice_id: marker })
      .eq('user_id', userAId)
      .select('preferred_voice_id');
    const crossUpdate = await userB
      .from('user_preferences')
      .update({ preferred_voice_id: marker })
      .eq('user_id', userAId)
      .select('preferred_voice_id');
    expect(ownUpdate.data).toEqual([{ preferred_voice_id: marker }]);
    expect(crossUpdate.data).toEqual([]);

    const crossInsert = await userB
      .from('user_course_enrollments')
      .insert({ user_id: userAId, language_id: languageId });
    expect(crossInsert.error?.code).toBe('42501');

    const deleted = await userA
      .from('user_course_enrollments')
      .delete()
      .eq('id', inserted.data!.id)
      .select('id');
    expect(deleted.data).toEqual([{ id: inserted.data!.id }]);
  });

  it('keeps server-only cost data unavailable to clients', async () => {
    const result = await userA.from('provider_usage').select('id');
    expect(result.error?.code).toBe('42501');
  });
});
