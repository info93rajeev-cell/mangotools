# engines/search — lane rules

- Only this package imports `minisearch`.
- Keep index and query options in `src/lib/options.ts` so build and query always agree.
- Every tool must stay findable by its name and at least one synonym (relevance test).
