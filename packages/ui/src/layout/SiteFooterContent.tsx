import s from './sharedBottom.module.css';
import { sharedFooterCategories, sharedBottomText as t } from './sharedBottomStrings.ts';
import type { NavCategory } from './types.ts';
export interface SiteFooterContentProps {
  brand: string;
  tagline: string;
  categories: NavCategory[];
  pages?: NavCategory[];
}
/** Shared site footer; Astro pages and interactive local previews use identical markup. */
export function SiteFooterContent({
  brand,
  tagline,
  categories,
  pages = [],
}: SiteFooterContentProps) {
  return (
    <footer class={`site-footer no-print ${s.footer}`}>
      <div class={s.footerInner}>
        <div class={s.brandRow}>
          <a href="/" class={s.brand}>
            <b>B</b>
            {brand}
          </a>
          <p>{tagline}</p>
          <nav aria-label={t.info}>
            {pages.map((p) => (
              <a key={p.url} href={p.url}>
                {p.name}
              </a>
            ))}
          </nav>
        </div>
        <nav class={s.categories} aria-label={t.categories}>
          <h2>{t.categories}</h2>
          <a href="/tools">{t.allTools}</a>
          {categories
            .filter((c) => sharedFooterCategories.some((approved) => approved.url === c.url))
            .map((c) => (
              <a key={c.url} href={c.url}>
                {c.name}
              </a>
            ))}
        </nav>
      </div>
    </footer>
  );
}
