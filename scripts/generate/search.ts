import { normalizeWords, type RegistryCategory, type RegistryTool } from '@mangotools/schemas';
import type { Taxonomy } from './taxonomy.ts';

export interface SearchDocumentInput {
  id: string;
  kind: 'tool';
  name: string;
  shortName: string;
  summary: string;
  synonyms: string;
  categoryName: string;
  tags: string;
}

/** Terms from synonym groups that match the tool's own terms, excluding terms it already has. */
export function expandSynonyms(terms: string[], groups: string[][]): string[] {
  const text = normalizeWords(terms.join(' '));
  const own = new Set(terms.map((t) => t.toLowerCase()));
  const added = new Set<string>();
  for (const group of groups) {
    if (!group.some((term) => text.includes(normalizeWords(term)))) continue;
    for (const term of group) if (!own.has(term)) added.add(term);
  }
  return [...added];
}

export function searchDocuments(
  tools: RegistryTool[],
  categories: RegistryCategory[],
  taxonomy: Taxonomy,
): SearchDocumentInput[] {
  return tools
    .filter((t) => t.listed)
    .map((t) => {
      const tags = t.tags.map((id) => taxonomy.tags.get(id) ?? id);
      const base = [t.name, t.shortName, ...t.synonyms, ...tags];
      const expanded = expandSynonyms(base, taxonomy.synonymGroups);
      return {
        id: t.id,
        kind: 'tool' as const,
        name: t.name,
        shortName: t.shortName,
        summary: t.summary,
        synonyms: [...t.synonyms, ...expanded].join(' · '),
        categoryName: categories.find((c) => c.id === t.category)?.name ?? t.category,
        tags: tags.join(' · '),
      };
    });
}
