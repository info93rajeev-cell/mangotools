import { z } from 'zod';
import { isoDate } from './common.ts';

export const contentFrontMatterSchema = z.strictObject({
  lastReviewed: isoDate,
  example: z.string().optional(),
});

export const REQUIRED_SECTIONS: Record<'T1' | 'T2' | 'T3' | 'T4', readonly string[]> = {
  T1: ['How to use', 'Method', 'Worked example', 'FAQ', 'References'],
  T2: ['How to use', 'Method', 'Worked example', 'FAQ', 'References'],
  T3: ['How to use', 'FAQ'],
  T4: ['How to use', 'FAQ'],
};

export type ContentFrontMatter = z.infer<typeof contentFrontMatterSchema>;
