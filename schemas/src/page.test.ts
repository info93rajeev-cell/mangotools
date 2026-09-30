import { describe, expect, it } from 'vitest';
import { selectSitePages } from './page.ts';

const fm = (status: 'draft' | 'approved', extra: Record<string, unknown> = {}) => ({
  title: 'Privacy – How BeyondTheAI Handles Your Data',
  description:
    'How BeyondTheAI tools process your files and numbers in your browser, what the site stores on your device, and which requests reach the host.',
  heading: 'Privacy',
  lastUpdated: '2026-09-30',
  status,
  ...extra,
});

describe('selectSitePages', () => {
  const sources = [
    {
      file: 'content/pages/privacy.md',
      frontMatter: fm('draft'),
      body: 'Text [FOUNDER: add contact]',
    },
    { file: 'content/pages/disclaimer.md', frontMatter: fm('approved'), body: 'Text' },
    { file: 'content/pages/about.md', frontMatter: fm('approved'), body: 'Text' },
  ];

  it('publishes only approved pages in production, in footer order', () => {
    const pages = selectSitePages(sources, { includeDrafts: false });
    expect(pages.map((p) => p.slug)).toEqual(['about', 'disclaimer']);
    expect(pages.every((p) => !p.draft)).toBe(true);
  });

  it('renders drafts in development and preview builds, marked as drafts', () => {
    const pages = selectSitePages(sources, { includeDrafts: true });
    expect(pages.map((p) => [p.slug, p.draft])).toEqual([
      ['about', false],
      ['privacy', true],
      ['disclaimer', false],
    ]);
  });

  it('accepts lastUpdated as an unquoted YAML date', () => {
    const [page] = selectSitePages(
      [
        {
          file: 'content/pages/about.md',
          frontMatter: fm('approved', { lastUpdated: new Date('2026-09-30') }),
          body: '',
        },
      ],
      { includeDrafts: false },
    );
    expect(page?.frontMatter.lastUpdated).toBe('2026-09-30');
    const [serialised] = selectSitePages(
      [
        {
          file: 'content/pages/about.md',
          frontMatter: fm('approved', { lastUpdated: '2026-09-30T00:00:00.000Z' }),
          body: '',
        },
      ],
      { includeDrafts: false },
    );
    expect(serialised?.frontMatter.lastUpdated).toBe('2026-09-30');
  });

  it('builds nothing when content/pages has no files', () => {
    expect(selectSitePages([], { includeDrafts: true })).toEqual([]);
  });

  it('refuses to publish an approved page that still carries review notes', () => {
    for (const note of ['[FOUNDER: add contact]', '[LEGAL REVIEW: liability]']) {
      expect(() =>
        selectSitePages(
          [{ file: 'content/pages/privacy.md', frontMatter: fm('approved'), body: `A ${note}` }],
          { includeDrafts: false },
        ),
      ).toThrow('content/pages/privacy.md: approved page still contains');
    }
  });

  it('rejects unknown pages and invalid front matter with the file name', () => {
    expect(() =>
      selectSitePages(
        [{ file: 'content/pages/pricing.md', frontMatter: fm('approved'), body: '' }],
        {
          includeDrafts: true,
        },
      ),
    ).toThrow('content/pages/pricing.md: unknown site page');
    expect(() =>
      selectSitePages(
        [
          {
            file: 'content/pages/about.md',
            frontMatter: fm('approved', { description: 'short' }),
            body: '',
          },
        ],
        { includeDrafts: true },
      ),
    ).toThrow('content/pages/about.md: invalid front matter');
  });
});
