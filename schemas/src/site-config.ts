import { z } from 'zod';
import { kebabId } from './common.ts';

const environment = z.strictObject({ url: z.url(), indexable: z.boolean() });

export const siteConfigSchema = z.strictObject({
  brand: z.strictObject({
    name: z.string().min(1),
    parent: z.string().min(1),
    tagline: z.string().min(1),
  }),
  environments: z
    .record(z.string(), environment)
    .refine((e) => 'development' in e && 'production' in e, {
      message: 'environments must define development and production.',
    }),
  navigation: z.strictObject({ minToolsPerCategory: z.int().min(1) }),
  home: z.strictObject({ popular: z.array(kebabId) }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
