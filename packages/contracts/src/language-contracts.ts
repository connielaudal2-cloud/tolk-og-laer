import { z } from 'zod';

export const supportedSourceLanguage = z.enum(['fr', 'ary']);
export type SupportedSourceLanguage = z.infer<typeof supportedSourceLanguage>;
