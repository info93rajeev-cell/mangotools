# engines/data — lane rules

- Pure TypeScript only: no DOM, network, storage, time, randomness or `Intl`.
- Implement codecs explicitly (no `JSON.parse` for formatting, no `btoa`/`atob`, no reliance on
  `encodeURIComponent` quirks) so behaviour is identical in every runtime.
- Never change an existing fixture's expected value. Add a new fixture with a cited source instead.
- Every error or warning code needs a message in `src/errors.ts`.
