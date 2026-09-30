import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** URLs of the site information pages in content/pages/ that are approved for production. */
export function approvedSitePages(): string[] {
  const dir = join(process.cwd(), 'content/pages');
  return (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /^status:\s*approved\s*$/m.test(readFileSync(join(dir, f), 'utf8')))
    .map((f) => `/${f.replace(/\.md$/, '')}`)
    .sort();
}
