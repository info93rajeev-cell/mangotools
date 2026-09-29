# Deployment runbook — BeyondTheAI on Cloudflare Pages

**Status:** Round 1 launch procedure. Steps marked **Founder** need Cloudflare, DNS or Google account
access and are done by a person. Nothing here adds analytics, third-party scripts or a new dependency.

## 1. What gets deployed

| Environment | Branch | `MANGOTOOLS_ENV` | Output | Indexing |
|---|---|---|---|---|
| Production | `production` (see §3) | `production` | `apps/web/dist` | indexable; canonical `https://beyondtheai.com` |
| Preview | every other branch and PR | `development` | `apps/web/dist` | `noindex` (meta, `X-Robots-Tag`, `robots.txt: Disallow: /`), no sitemap |

The only deployment build command is:

```sh
pnpm build:deploy
```

It runs `pnpm gen`, builds the site for `MANGOTOOLS_ENV`, runs the post-build checks, then checks
that the output matches the environment (`scripts/check/deploy-rules.ts`):

- `MANGOTOOLS_ENV` **must be set** to `production` or `development`. It is never defaulted, so a
  production environment with a missing variable fails the deploy instead of shipping the
  development (noindex) build.
- Production output must be indexable, contain the sitemap, have no `/_dev/` pages and no site-wide
  `X-Robots-Tag`. Preview output must be noindex everywhere.

Never deploy the output of plain `pnpm build`: it is the development build.

## 2. Cloudflare Pages project (Founder)

Workers & Pages → Create → Pages → connect the GitHub repository.

| Setting | Value |
|---|---|
| Build image | v3 |
| Framework preset | None |
| Build command | `pnpm build:deploy` |
| Build output directory | `apps/web/dist` |
| Root directory | `/` (repository root) |

Variables (Settings → Variables and Secrets), per environment:

| Variable | Production | Preview |
|---|---|---|
| `MANGOTOOLS_ENV` | `production` | `development` |
| `PNPM_VERSION` | `10.28.0` | `10.28.0` |
| `NODE_VERSION` | not needed — the build image reads `.node-version` (24) | same |

The v3 build image does not read `packageManager` from `package.json`, which is why
`PNPM_VERSION` is set explicitly. No secrets are needed.

## 3. Production only from an approved commit (Founder)

1. Settings → Builds & deployments → **Production branch: `production`**. Protect the branch in
   GitHub so that only you can push to it.
2. Normal work merges to `main` through PRs with green CI. Each branch and PR gets a noindex preview.
3. To release, pick a `main` commit whose CI is green and which you have approved, then run:

   ```sh
   git push origin <approved-commit-sha>:production
   ```

   Pushing to `production` starts the production deployment. Optionally tag the commit
   (`git tag release-YYYY-MM-DD`).
4. Rollback: Pages → Deployments → choose an earlier production deployment → **Rollback**.

## 4. Domain, HTTPS and redirects (Founder)

1. The `beyondtheai.com` zone must be on Cloudflare DNS, which apex domains on Pages require.
2. Pages project → Custom domains → add **`beyondtheai.com`**.
3. **www → apex (301):**
   1. Add a DNS record: `A` · name `www` · IPv4 `192.0.2.1` · Proxied.
   2. Create a Bulk Redirect List: source `www.beyondtheai.com`, target `https://beyondtheai.com`,
      status **301**. Turn on: preserve query string, subpath matching, preserve path suffix, include
      subdomains.
   3. Create a Bulk Redirect Rule that uses the list.

   `_redirects` cannot redirect between hosts, which is why this is done in Cloudflare.
4. SSL/TLS → Edge Certificates: **Always Use HTTPS: on**; minimum TLS version 1.2.
   HSTS (Edge Certificates): turn it on only after HTTPS works on apex and www. Start with a short
   `max-age` and no preload; lengthen it later.
5. The old host `tools.mangopie.in` was never public, so it needs no redirect.
6. `*.pages.dev`: the production `_headers` send `X-Robots-Tag: noindex` for
   `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*`. Cloudflare also marks
   every preview deployment noindex.

## 5. Keep these Cloudflare features OFF (Founder)

Each of these injects scripts or collects data. That would break the CSP and the privacy claims.

- Web Analytics / Browser Insights for this project. Cloudflare injects its beacon automatically
  when you enable it.
- Zaraz, Rocket Loader, Email Address Obfuscation.
- Bot Fight Mode "JavaScript detections" and other challenge scripts. If you turn on a security
  feature that sets a cookie (for example `__cf_bm`), name it on the Privacy page first.
- Any "HTML rewrite" or "script injection" feature.

If engagement analytics is ever wanted, stop and open a separate, privacy-approved task for a
cookieless design that sends no content: never user input, file names, document values, search text
or results.

## 6. Headers served (`apps/web/dist/_headers`)

Written by `scripts/check/postbuild.ts`. The CSP carries the hashes of every inline script.

- `/*`: `Content-Security-Policy` (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, …),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`; `X-Robots-Tag: noindex` outside
  production.
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`.
- The build fails if `_headers` exceeds Cloudflare's limits: 100 rules, 2,000 characters per line.

## 7. After every production deployment

```sh
pnpm smoke                                        # checks https://beyondtheai.com
pnpm smoke -- --pages-dev https://<project>.pages.dev
```

The smoke test checks:
- home page: status, canonical, `index, follow`, brand;
- security headers, and no `X-Robots-Tag` on production;
- `robots.txt`, and all 40 sitemap URLs return 200 on `https://beyondtheai.com`;
- `/tools/` is not a duplicate, unknown pages return 404, `/_dev/*` is absent;
- long-lived caching on `/assets/*`;
- `https://www.beyondtheai.com/` and `http://beyondtheai.com/` return a 301/308 to
  `https://beyondtheai.com/`.

For a preview deployment:

```sh
pnpm smoke -- --preview --base <preview URL>
```

It must pass the noindex checks.

## 8. Google Search Console (Founder)

1. Add a **Domain** property for `beyondtheai.com`. Verify it with the DNS TXT record Google gives
   you, added in Cloudflare DNS. This needs no meta tag, file or script on the site.
2. Sitemaps → submit `https://beyondtheai.com/sitemap-index.xml`.
3. URL Inspection → request indexing for `https://beyondtheai.com/` and `/tools`.
4. After a few days, check Pages / Indexing for errors: duplicate canonicals, `noindex` on
   production pages, 404s.

## 9. Launch checklist

- [ ] CI green on `main`, including Chromium, Firefox and WebKit.
- [ ] Founder approved the About, Privacy and Disclaimer text (`content/pages/`, `status: approved`),
      or launch without those pages; the footer then shows no links to them.
- [ ] Pages project configured as in §2; `production` branch protected.
- [ ] Custom domain, www redirect and HTTPS as in §4; features in §5 off.
- [ ] Commit pushed to `production`; deployment succeeded (`build:deploy` log shows `production`).
- [ ] `pnpm smoke` passes against https://beyondtheai.com; `--pages-dev` check passes.
- [ ] Search Console verified and sitemap submitted.
