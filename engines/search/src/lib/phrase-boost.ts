/**
 * Deterministic, phrase/order-aware ranking boost added on top of MiniSearch's own bag-of-words
 * score. Fixes reversed converter queries ("csv to json" vs "json to csv") that a pure term-frequency
 * search cannot tell apart, since both tokenize to the same bag of words. Generic: no tool IDs are
 * hardcoded, only a small set of directional-phrase patterns ("X to Y", "convert X to Y", "X into Y").
 *
 * Tiers, highest first, each worth more than the sum of every tier below it so a document matching a
 * higher tier always outranks one that only matches lower tiers; the pre-existing MiniSearch score
 * still breaks ties within a tier:
 *   1. exact normalized title match (name or shortName)
 *   2. exact normalized phrase match (name, shortName, a synonym, or a summary sentence)
 *   3. directional converter phrase match ("X to Y" in the query, same order in the tool's own text)
 *   4. ordered token sequence match (the query's words appear in that order within one phrase)
 */

export interface PhraseFields {
  name: string;
  shortName: string;
  synonyms: string;
  summary: string;
}

const TIER_EXACT_TITLE = 1000;
const TIER_EXACT_PHRASE = 500;
const TIER_DIRECTIONAL = 250;
const TIER_ORDERED_TOKENS = 100;

const PUNCTUATION = /[^a-z0-9\s]/g;
const PHRASE_SEPARATOR = /[·.;]/;

/** Lowercases, strips simple punctuation and collapses whitespace. Never removes "to". */
export function normalizePhrase(text: string): string {
  return text.toLowerCase().replace(PUNCTUATION, ' ').replace(/\s+/g, ' ').trim();
}

function splitPhrases(field: string): string[] {
  return field
    .split(PHRASE_SEPARATOR)
    .map(normalizePhrase)
    .filter((phrase) => phrase !== '');
}

const DIRECTIONAL_QUERY =
  /^(?:convert|change|turn)\s+(.+?)\s+(?:to|into)\s+(.+)$|^(.+?)\s+(?:to|into)\s+(.+)$/;

/** Extracts (x, y) from a normalized "X to Y" / "convert X to Y" / "X into Y" query, if it is one. */
export function directionalPattern(normalizedQuery: string): { x: string; y: string } | null {
  const m = DIRECTIONAL_QUERY.exec(normalizedQuery);
  if (!m) return null;
  const x = (m[1] ?? m[3])?.trim();
  const y = (m[2] ?? m[4])?.trim();
  return x && y ? { x, y } : null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whether `phrase` contains x, then later "to"/"into", then later y — the same order as the query. */
function hasDirectionalOrder(phrase: string, x: string, y: string): boolean {
  const pattern = new RegExp(
    `\\b${escapeRegExp(x)}\\b.*\\b(?:to|into)\\b.*\\b${escapeRegExp(y)}\\b`,
  );
  return pattern.test(phrase);
}

/** Whether every token appears in `phrase`, in that order (not necessarily contiguous). */
function isOrderedSubsequence(tokens: string[], phrase: string): boolean {
  if (tokens.length === 0) return true;
  let next = 0;
  for (const word of phrase.split(' ')) {
    if (word === tokens[next]) next++;
    if (next === tokens.length) return true;
  }
  return false;
}

/** The phrase/order-aware boost for one candidate document against one (already trimmed) query. */
export function phraseBoost(query: string, fields: PhraseFields): number {
  const q = normalizePhrase(query);
  if (q === '') return 0;

  const name = normalizePhrase(fields.name);
  const shortName = normalizePhrase(fields.shortName);
  const phrases = [
    name,
    shortName,
    ...splitPhrases(fields.synonyms),
    ...splitPhrases(fields.summary),
  ];

  let boost = 0;
  if (q === name || q === shortName) boost += TIER_EXACT_TITLE;
  if (phrases.includes(q)) boost += TIER_EXACT_PHRASE;

  const direction = directionalPattern(q);
  if (direction && phrases.some((p) => hasDirectionalOrder(p, direction.x, direction.y))) {
    boost += TIER_DIRECTIONAL;
  }

  const tokens = q.split(' ').filter((t) => t !== '');
  if (phrases.some((p) => isOrderedSubsequence(tokens, p))) boost += TIER_ORDERED_TOKENS;

  return boost;
}
