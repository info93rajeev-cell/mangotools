import { describe, expect, it } from 'vitest';
import {
  checkPage,
  cspScriptHashes,
  entryModules,
  headersFile,
  pageFacts,
  sha256,
  staticImports,
} from './postbuild-rules.ts';

const SITE = 'https://tools.mangopie.in';

function html(parts: { head?: string; body?: string; template?: string }) {
  const description = 'x'.repeat(130);
  return `<!doctype html><html lang="en" data-template="${parts.template ?? 'tool'}"><head><title>GST Calculator</title><meta name="description" content="${description}"><link rel="canonical" href="${SITE}/gst-calculator">${parts.head ?? ''}</head><body>${parts.body ?? '<h1>GST</h1>'}</body></html>`;
}

describe('post-build page checks', () => {
  it('accepts a well-formed page', () => {
    const script = 'console.log(1)';
    const page = pageFacts(
      'a.html',
      html({
        head: `<meta http-equiv="content-security-policy" content="script-src 'self' ${sha256(script)}"><script>${script}</script>`,
      }),
    );
    expect(checkPage(page, SITE)).toEqual([]);
  });

  it('reports headings, titles, descriptions and canonicals', () => {
    const bad = html({ body: '<h1>a</h1><h1>b</h1>' })
      .replace('<title>GST Calculator</title>', `<title>${'t'.repeat(61)}</title>`)
      .replace(/content="x+"/, 'content="short"')
      .replace(`${SITE}/gst-calculator`, 'http://localhost/gst-calculator');
    const problems = checkPage(pageFacts('a.html', bad), SITE).join('\n');
    expect(problems).toContain('2 <h1>');
    expect(problems).toContain('title is 61');
    expect(problems).toContain('description is 5');
    expect(problems).toContain('canonical');
  });

  it('reports third-party hosts, broken JSON-LD and unhashed inline scripts', () => {
    const page = pageFacts(
      'a.html',
      html({
        head: '<script type="application/ld+json">{"@context":"https://schema.org",</script><script>alert(1)</script>',
        body: '<h1>x</h1><img src="https://cdn.example.com/a.png"><svg xmlns="http://www.w3.org/2000/svg"></svg>',
      }),
    );
    const problems = checkPage(page, SITE).join('\n');
    expect(problems).toContain('cdn.example.com');
    expect(problems).not.toContain('w3.org');
    expect(problems).toContain('JSON-LD does not parse');
    expect(problems).toContain('not allowed by the page CSP');
  });

  it('writes _headers with every script hash and frame-ancestors', () => {
    const text = headersFile({
      scriptHashes: ["'sha256-b'", "'sha256-a'", "'sha256-a'"],
      indexable: false,
    });
    expect(text).toContain("script-src 'self' 'sha256-a' 'sha256-b';");
    expect(text).toContain("frame-ancestors 'none'");
    expect(text).toContain('X-Robots-Tag: noindex');
    expect(headersFile({ scriptHashes: [], indexable: true })).not.toContain('X-Robots-Tag');
    expect(
      cspScriptHashes("default-src 'self'; script-src 'self' 'sha256-x'; style-src 'self'"),
    ).toEqual(["'sha256-x'"]);
  });

  it('finds entry modules and static imports but not dynamic imports', () => {
    const page =
      '<astro-island component-url="/assets/A.js" renderer-url="/assets/client.js"></astro-island><script type="module" src="/assets/page.js"></script>';
    expect(entryModules(page).sort()).toEqual([
      '/assets/A.js',
      '/assets/client.js',
      '/assets/page.js',
    ]);
    const code =
      'import{a as b}from"./x.js";import"./y.js";export*from"./z.js";const m=import("./lazy.js");';
    expect(staticImports(code).sort()).toEqual(['./x.js', './y.js', './z.js']);
  });
});
