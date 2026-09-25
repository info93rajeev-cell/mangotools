import {
  type Category,
  categoriesFileSchema,
  professionsFileSchema,
  reservedSlugsFileSchema,
  synonymsFileSchema,
  tagsFileSchema,
} from '@mangotools/schemas';
import type { z } from 'zod';
import { type Issue, issue, zodIssues } from './issues.ts';
import type { SourceFile, Sources } from './sources.ts';

export interface Taxonomy {
  categories: Category[];
  professions: Set<string>;
  tags: Map<string, string>;
  synonymGroups: string[][];
  reserved: Set<string>;
}

function parseFile<T>(source: SourceFile, schema: z.ZodType<T>, issues: Issue[]): T | null {
  if (source.data === undefined) return null;
  const parsed = schema.safeParse(source.data);
  if (parsed.success) return parsed.data;
  issues.push(...zodIssues(source.file, parsed.error));
  return null;
}

function checkUnique(file: string, label: string, ids: string[], issues: Issue[]) {
  const seen = new Set<string>();
  ids.forEach((id, index) => {
    if (seen.has(id)) issues.push(issue(file, `Duplicate ${label} "${id}".`, { path: `${index}` }));
    seen.add(id);
  });
}

function checkCategories(file: string, categories: Category[], reserved: Set<string>): Issue[] {
  const issues: Issue[] = [];
  checkUnique(
    file,
    'category id',
    categories.map((c) => c.id),
    issues,
  );
  checkUnique(
    file,
    'category order',
    categories.map((c) => String(c.order)),
    issues,
  );
  categories.forEach((c, index) => {
    const path = `categories.${index}`;
    if (c.slug !== c.id) issues.push(issue(file, 'Category slug must equal id.', { path }));
    if (reserved.has(c.slug)) {
      issues.push(issue(file, `Category slug "${c.slug}" is reserved.`, { path }));
    }
  });
  return issues;
}

/** Validates the taxonomy files and returns them in usable form (null when any file is invalid). */
export function validateTaxonomy(t: Sources['taxonomy']): {
  taxonomy: Taxonomy | null;
  issues: Issue[];
} {
  const issues: Issue[] = [];
  const categories = parseFile(t.categories, categoriesFileSchema, issues);
  const professions = parseFile(t.professions, professionsFileSchema, issues);
  const tags = parseFile(t.tags, tagsFileSchema, issues);
  const synonyms = parseFile(t.synonyms, synonymsFileSchema, issues);
  const reserved = parseFile(t.reserved, reservedSlugsFileSchema, issues);
  if (!categories || !professions || !tags || !synonyms || !reserved) {
    return { taxonomy: null, issues };
  }
  const reservedSet = new Set(reserved.reserved);
  issues.push(...checkCategories(t.categories.file, categories.categories, reservedSet));
  checkUnique(
    t.professions.file,
    'profession',
    professions.professions.map((p) => p.id),
    issues,
  );
  checkUnique(
    t.tags.file,
    'tag',
    tags.tags.map((x) => x.id),
    issues,
  );
  synonyms.groups.forEach((group, index) => {
    if (group.some((term) => term !== term.toLowerCase())) {
      issues.push(issue(t.synonyms.file, 'Synonyms are lowercase.', { path: `groups.${index}` }));
    }
  });
  const taxonomy: Taxonomy = {
    categories: [...categories.categories].sort((a, b) => a.order - b.order),
    professions: new Set(professions.professions.map((p) => p.id)),
    tags: new Map(tags.tags.map((x) => [x.id, x.label])),
    synonymGroups: synonyms.groups,
    reserved: reservedSet,
  };
  return { taxonomy, issues };
}
