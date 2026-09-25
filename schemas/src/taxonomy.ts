import { z } from 'zod';
import { kebabId, lengthBetween } from './common.ts';

export const categorySchema = z.strictObject({
  id: kebabId,
  slug: kebabId,
  name: z.string().min(2).max(40),
  icon: kebabId,
  order: z.int(),
  summary: lengthBetween(20, 120, 'Category summary'),
  seo: z.strictObject({
    title: lengthBetween(30, 60, 'Category SEO title'),
    description: lengthBetween(120, 160, 'Category SEO description'),
  }),
  about: z.array(z.string().min(1)).max(4).optional(),
  faq: z
    .array(z.strictObject({ q: z.string().min(5), a: z.string().min(5) }))
    .max(6)
    .optional(),
});

export const categoriesFileSchema = z.strictObject({ categories: z.array(categorySchema).min(1) });
export const professionsFileSchema = z.strictObject({
  professions: z.array(z.strictObject({ id: kebabId, name: z.string().min(2) })),
});
export const tagsFileSchema = z.strictObject({
  tags: z.array(z.strictObject({ id: kebabId, label: z.string().min(2) })),
});
export const synonymsFileSchema = z.strictObject({
  groups: z.array(z.array(z.string().min(1)).min(2)),
});
export const reservedSlugsFileSchema = z.strictObject({ reserved: z.array(z.string().min(1)) });

export type Category = z.infer<typeof categorySchema>;
