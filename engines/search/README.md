# engines/search

Client-side tool search built on MiniSearch (MIT).

| Operation | Purpose |
|---|---|
| `search.index.build@1` | Build a serialized index from tool documents (runs at build time in Node) |
| `search.query@1` | Query a serialized index (prefix + fuzzy 0.2; boosts: name 3, synonyms 2, short name 2) |

`createSearcher(serialized)` returns a query function so callers (the runtime) keep the loaded index;
the engine itself holds no module-level state. Results are sorted by score, then id, for determinism.
Relevance cases for real tools live in `tests/unit/search-relevance.test.ts`.

## Changelog
- 0.1.0 — first version (TASK-001).
