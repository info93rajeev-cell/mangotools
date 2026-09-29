/**
 * Site information pages (About, Privacy, Disclaimer) from content/pages/*.md. The folder is
 * human-only. Production builds publish only pages whose front matter says `status: approved`;
 * development and preview builds also render drafts, marked as drafts and never indexed.
 */
import { type SelectedPage, selectSitePages } from '@mangotools/schemas';
import type { MarkdownInstance } from 'astro';
import { COPY } from './copy.ts';
import { isDevelopment } from './site.ts';

type PageModule = MarkdownInstance<Record<string, unknown>>;

const modules = import.meta.glob<PageModule>('../../../../content/pages/*.md', { eager: true });
const fileOf = (key: string) => key.replace(/^(\.\.\/)+/, '');

export interface SitePage extends SelectedPage {
  url: string;
  label: string;
  Content: PageModule['Content'];
}

const selected = selectSitePages(
  Object.entries(modules).map(([key, module]) => ({
    file: fileOf(key),
    frontMatter: module.frontmatter,
    body: module.rawContent(),
  })),
  { includeDrafts: isDevelopment },
);

export const sitePages: SitePage[] = selected.flatMap((page) => {
  const module = Object.entries(modules).find(([key]) => fileOf(key) === page.file)?.[1];
  return module
    ? [{ ...page, url: `/${page.slug}`, label: COPY.pages[page.slug], Content: module.Content }]
    : [];
});

/** Footer links: only pages that are built in this environment. */
export const pageLinks = sitePages.map((page) => ({ name: page.label, url: page.url }));
