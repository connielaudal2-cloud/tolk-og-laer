import { z } from 'zod';
import { supportedSourceLanguage } from './index.js';

export const translationRetentionMode = z.enum(['none', 'session', 'until_deleted']);

export const createTranslationSessionRequest = z.object({
  sourceLanguages: z.array(supportedSourceLanguage).min(1).max(2),
  targetLanguage: z.literal('nb'),
  retentionMode: translationRetentionMode.default('none'),
});

export const createTranslationSessionResponse = z.object({
  sessionId: z.string().uuid(),
  status: z.literal('starting'),
  targetLanguage: z.literal('nb'),
  retentionMode: translationRetentionMode,
});

export const endTranslationSessionRequest = z.object({
  status: z.enum(['ended', 'failed']),
  reason: z.string().max(120).optional(),
});

export const endTranslationSessionResponse = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(['ended', 'failed']),
  endedAt: z.string().datetime(),
});

export const apiErrorResponse = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().uuid().optional(),
  }),
});

export type TranslationRetentionMode = z.infer<typeof translationRetentionMode>;
export type CreateTranslationSessionRequest = z.infer<typeof createTranslationSessionRequest>;
export type CreateTranslationSessionResponse = z.infer<typeof createTranslationSessionResponse>;
export type EndTranslationSessionRequest = z.infer<typeof endTranslationSessionRequest>;
export type EndTranslationSessionResponse = z.infer<typeof endTranslationSessionResponse>;
