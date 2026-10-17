# Cross-runtime determinism

`determinism.spec.ts` retains the operation/worker fixture harness unchanged.
`public-library.spec.ts` additionally runs actual public Numeric library exports in Node 24
and each existing Chromium/Firefox/WebKit determinism project (`pnpm test:e2e --project=determinism-chromium
--project=determinism-firefox --project=determinism-webkit`). Normal CI already runs these projects.

The platform-owned support modules resolve package self-reference through its public exports map.
The browser build imports that package specifier, reusing Astro's installed Vite build dependency;
it does not import application code, require a new dependency or hard-code an internal source file.
The bundle is in memory (`write: false`), with application configuration/public assets disabled.
Playwright intercepts a test-only document; no test route, bundle or Numeric import enters the site.
`checkNoDirectEngineImport`, runtime workers and production builds are unchanged.

Results retain exact decimal strings and recursively record every finite number as big-endian
binary64 hex, normalizing only negative zero. Full results, bits, canonical JSON and SHA-256 must
match Node and the independently expected values. Unsupported/nonfinite outputs fail explicitly.
The decimal vectors are hand-verified ordinary arithmetic and the existing documented rounding
contract, not captured implementation outputs. Public `compare` exercises number-bit comparisons.

Future approved Numeric APIs can add independent static vectors without fake operations or copied
implementations. This prerequisite adds no geometry API or proof. Geometry reference-error bounds
must be tested separately from exact cross-runtime equality. Node 24 is enforced by the spec.

TASK-011A3-P1 / issue #162. No Numeric, Survey, runtime or fixture expectation changes.
