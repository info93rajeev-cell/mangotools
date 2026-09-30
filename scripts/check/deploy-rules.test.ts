import { describe, expect, it } from 'vitest';
import { type DistReader, deployEnvironment, deployProblems } from './deploy-rules.ts';

const SITE = 'https://beyondtheai.com';

function dist(files: Record<string, string>): DistReader {
  return { files: Object.keys(files), read: (f) => files[f] ?? null };
}

const production = {
  'index.html': '<meta name="robots" content="index, follow">',
  'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`,
  'sitemap-index.xml': '<sitemapindex/>',
  _headers:
    "/*\n  Content-Security-Policy: default-src 'self'\n\n/assets/*\n  Cache-Control: immutable\n\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n",
};

const preview = {
  'index.html': '<meta name="robots" content="noindex">',
  'robots.txt': 'User-agent: *\nDisallow: /\n',
  '_dev/components.html': '',
  _headers: "/*\n  Content-Security-Policy: default-src 'self'\n  X-Robots-Tag: noindex\n",
};

describe('deploy checks', () => {
  it('accepts a production build and a preview build', () => {
    expect(deployProblems(dist(production), 'production', SITE)).toEqual([]);
    expect(deployProblems(dist(preview), 'development', SITE)).toEqual([]);
  });

  it('refuses to deploy the development build as production', () => {
    expect(deployProblems(dist(preview), 'production', SITE)).toEqual([
      `robots.txt must allow crawling and point to ${SITE}/sitemap-index.xml`,
      'sitemap-index.xml is missing',
      'development pages (_dev/) are in the output',
      '_headers marks every page noindex',
      'the home page is not indexable',
    ]);
  });

  it('refuses to deploy an indexable build as a preview', () => {
    expect(deployProblems(dist(production), 'development', SITE)).toEqual([
      'robots.txt must disallow crawling outside production',
      '_headers must send X-Robots-Tag: noindex outside production',
      'the home page must be noindex outside production',
    ]);
  });

  it('requires MANGOTOOLS_ENV to be set explicitly', () => {
    expect(deployEnvironment(undefined)).toBeNull();
    expect(deployEnvironment('prod')).toBeNull();
    expect(deployEnvironment('production')).toBe('production');
    expect(deployEnvironment('development')).toBe('development');
  });
});
