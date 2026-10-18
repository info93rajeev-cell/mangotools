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

## Explicit unpublished operation evidence (#174)

`unpublished-operations.spec.ts` is a separate test-only path, not an expansion of the
published registry or generated fixture set. `unpublished-targets.ts` explicitly approves
only the merged `survey.leveling.reduce@1` public package entry and a minimum of 37 fixtures.
Fixture discovery reads real engine fixtures independently of presets. The Node tests check
all 37 unchanged expectations (3 successes, 34 errors); empty discovery, missing descriptors,
unapproved operations and empty runs fail closed.

The browser bundle imports the actual package specifier through its exports map, then resolves
the real descriptor and calls public Core `executeOperation` with the same input/params as Node.
It runs in a disposable browser worker on a Playwright-intercepted test document. No route,
asset, production loader, runtime publication or engine code is added. The shared in-memory
bundling extraction preserves the existing public-library path.

Full Results, exact decimal strings, recursively observed binary64 bits, canonical JSON and
SHA256 must match Node 24 in Chromium, Firefox and WebKit; only approved -0 normalization applies.
No tolerance or precision reduction is used. Existing published-operation and Numeric library
checks remain in the same unchanged determinism projects and CI command.

Future approved Traverse fixtures can use the same collector, public descriptor runner, worker
and observations by explicitly extending the reviewed test-owned target list and coverage tests.
This prerequisite does not select, copy, implement or validate the uncommitted Traverse draft.
Do not resume #173 until this prerequisite PR is merged.

TASK-011A3-P1 / issue #162. No Numeric, Survey, runtime or fixture expectation changes.
