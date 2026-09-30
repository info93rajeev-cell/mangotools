import { z } from 'zod';
import { isoDate, lengthBetween } from './common.ts';

/**
 * Site information pages (About, Privacy, Disclaimer). Their text lives in content/pages/, which is
 * human-only: agents never write it. A page is published in production only when a person has set
 * `status: approved`; drafts render only in development and preview builds, marked as drafts.
 */
export const SITE_PAGE_SLUGS = ['about', 'privacy', 'disclaimer'] as const;
export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

/**
 * Front matter parsers turn an unquoted `2026-09-30` into a Date, and Astro then serialises it as
 * `2026-09-30T00:00:00.000Z`. Accept those forms and keep the plain date.
 */
const MIDNIGHT_UTC = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/;
function asIsoDate(value: unknown): unknown {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return (value as Date).toISOString().slice(0, 10);
  }
  return typeof value === 'string' ? (MIDNIGHT_UTC.exec(value)?.[1] ?? value) : value;
}

export const pageFrontMatterSchema = z.strictObject({
  title: lengthBetween(30, 60, 'Page title'),
  description: lengthBetween(120, 160, 'Page description'),
  heading: z.string().min(3).max(80),
  /** Markdown front matter parsers turn an unquoted date into a Date; accept both forms. */
  lastUpdated: z.preprocess(asIsoDate, isoDate),
  status: z.enum(['draft', 'approved']),
});

export type PageFrontMatter = z.infer<typeof pageFrontMatterSchema>;

export interface SitePageSource {
  /** File path, used in error messages. */
  file: string;
  frontMatter: unknown;
  /** Markdown body. */
  body: string;
}

/** Review notes that drafts carry for the founder; an approved page must not contain any. */
const REVIEW_NOTE = /\[(FOUNDER|LEGAL REVIEW)\b/;

export interface SelectedPage {
  slug: SitePageSlug;
  file: string;
  frontMatter: PageFrontMatter;
  draft: boolean;
}

const slugOf = (file: string) => /([^/\\]+)\.md$/.exec(file)?.[1] ?? file;

function toPage(source: SitePageSource): SelectedPage {
  const slug = slugOf(source.file);
  if (!(SITE_PAGE_SLUGS as readonly string[]).includes(slug)) {
    throw new Error(`${source.file}: unknown site page. Allowed: ${SITE_PAGE_SLUGS.join(', ')}.`);
  }
  const parsed = pageFrontMatterSchema.safeParse(source.frontMatter);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`${source.file}: invalid front matter — ${problems.join('; ')}`);
  }
  const frontMatter = parsed.data;
  if (frontMatter.status === 'approved' && REVIEW_NOTE.test(source.body)) {
    throw new Error(
      `${source.file}: approved page still contains a [FOUNDER …] or [LEGAL REVIEW …] note.`,
    );
  }
  return {
    slug: slug as SitePageSlug,
    file: source.file,
    frontMatter,
    draft: frontMatter.status !== 'approved',
  };
}

/**
 * The pages to build, in footer order. Production builds (`includeDrafts: false`) publish only
 * approved pages; development and preview builds also render drafts.
 */
export function selectSitePages(
  sources: SitePageSource[],
  options: { includeDrafts: boolean },
): SelectedPage[] {
  return sources
    .map(toPage)
    .filter((page) => options.includeDrafts || !page.draft)
    .sort((a, b) => SITE_PAGE_SLUGS.indexOf(a.slug) - SITE_PAGE_SLUGS.indexOf(b.slug));
}
