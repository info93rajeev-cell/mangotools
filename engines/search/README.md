# engines/search

Client-side tool search built on MiniSearch (MIT).

| Operation | Purpose |
|---|---|
| `search.index.build@1` | Build a serialized index from tool documents (runs at build time in Node) |
| `search.query@1` | Query a serialized index (prefix + fuzzy 0.2; boosts: name 3, synonyms 2, short name 2) |

`createSearcher(serialized)` returns a query function so callers (the runtime) keep the loaded index;
the engine itself holds no module-level state. Results are sorted by score, then id, for determinism.
Relevance cases for real tools live in `tests/unit/search-relevance.test.ts`.

On top of MiniSearch's own bag-of-words score, `lib/phrase-boost.ts` adds a small, deterministic
ranking boost so reversed converter queries ("csv to json" vs "json to csv") resolve to the right
tool — a plain term-frequency score can't tell those two apart, since they tokenize to the same bag
of words. See that file's own doc comment for the four boost tiers.

## Changelog
- 0.2.0 — phrase/order-aware ranking boost added (TASK-008F): exact normalized title match, exact
  normalized phrase match, directional "X to Y" / "convert X to Y" / "X into Y" match, and ordered
  token sequence match, each worth more than the sum of every tier below it. Generic (no tool IDs
  hardcoded); added on top of the existing score, so unrelated queries are unaffected.
- 0.1.0 — first version (TASK-001).
