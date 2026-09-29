import { describe, expect, it } from 'vitest';
import { checkHeaders, checkHome, checkRedirect, checkRobots, locs } from './smoke-rules.ts';

const SITE = 'https://beyondtheai.com';
const html = (robots: string) =>
  `<title>BeyondTheAI — Tools</title><link rel="canonical" href="${SITE}"><meta name="robots" content="${robots}">`;
const headers = {
  'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=()',
};

describe('smoke checks', () => {
  it('accepts a healthy production home page', () => {
    const res = { status: 200, headers, body: html('index, follow') };
    expect(checkHome(res, SITE, 'BeyondTheAI', false)).toEqual([]);
    expect(checkHeaders(res, false)).toEqual([]);
  });

  it('flags a development build served as production', () => {
    const res = {
      status: 200,
      headers: { ...headers, 'x-robots-tag': 'noindex' },
      body: html('noindex'),
    };
    expect(checkHome(res, SITE, 'BeyondTheAI', false)).toEqual([
      'home robots meta is "noindex", expected "index, follow"',
    ]);
    expect(checkHeaders(res, false)).toEqual(['production sends X-Robots-Tag: noindex']);
    expect(checkHeaders(res, true)).toEqual([]);
  });

  it('flags missing security headers', () => {
    expect(checkHeaders({ status: 200, headers: {}, body: '' }, false)).toHaveLength(4);
  });

  it('checks robots.txt, sitemap locations and redirects', () => {
    expect(checkRobots(`Allow: /\nSitemap: ${SITE}/sitemap-index.xml`, SITE, false)).toEqual([]);
    expect(checkRobots('Disallow: /', SITE, true)).toEqual([]);
    expect(checkRobots('Disallow: /', SITE, false)).toHaveLength(1);
    expect(locs(`<loc>${SITE}</loc><loc>${SITE}/tools</loc>`)).toEqual([SITE, `${SITE}/tools`]);
    const ok = { status: 301, headers: { location: `${SITE}/` }, body: '' };
    expect(checkRedirect(ok, `${SITE}/`, 'www')).toEqual([]);
    expect(checkRedirect({ status: 200, headers: {}, body: '' }, `${SITE}/`, 'www')).toEqual([
      `www: expected a 301/308 to ${SITE}/, got 200`,
    ]);
  });
});
