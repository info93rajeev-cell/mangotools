# DECISION — Deterministic Numeric Geometry Kernel

| | |
|---|---|
| Status | Route A approved by founder in issues #159/#160; this record is proposed for founder application, not yet a merged accepted record. |
| Scope | Narrow additive Numeric library family; production implementation governed separately by #161. |
| Dependencies | #158 Traverse design, #159 API/bounds decision, #160 feasibility evidence; separate platform harness prerequisite #162. |
| Existing behavior | Every decimal-string API, rounding rule, money/percentage and Rise & Fall contract/fixture remains unchanged. |

## Decision

Use a separate bounded portable IEEE-754 binary64 geometry family, not a conversion of Numeric's
decimal arithmetic to numbers. Publish only these four named functions from the public Numeric entry:

```ts
type GeometryResult =
  | { ok: true; value: number }
  | {
      ok: false;
      code: 'NUMERIC_GEOMETRY_INVALID_NUMBER' | 'NUMERIC_GEOMETRY_OUT_OF_RANGE';
      argument: 'degrees' | 'x' | 'y';
    };
degreesToRadians(degrees: number): GeometryResult;
sinDegrees(degrees: number): GeometryResult;
cosDegrees(degrees: number): GeometryResult;
hypot2(x: number, y: number): GeometryResult;
```

Primitive finite degree values in [0,360); -0 accepted as zero. Signed norm components have absolute
value <=1e8, including tiny/subnormal values. No coercion, wrapping or clamping. Check all
type/finiteness failures in signature order before range failures in signature order.
Never throw for user input. Normalize output -0 to +0, and nothing else.

At exactly 0/90/180/270 degrees, (sin,cos) is respectively (0,1)/(1,0)/(0,-1)/(-1,0).
Do not snap neighboring floats. Degree-to-radian conversion remains approximate at irrational values.

## Algorithm policy and rejected alternative

Route A uses deterministic degree-space reduction before conversion, pinned split constants,
fixed-order sine/cosine polynomial evaluation and deterministic scaled hypot with a fixed private
software sqrt procedure. Production constants, coefficients, steps and error argument must be
reviewed/pinned under #161; the disposable prototype is evidence, not production source to copy.
No native Math.sin/cos/hypot/sqrt or runtime-specific answer path; no new runtime dependency.
No public sqrt, atan2/acos, general angle parser or general mathematics expansion.

Native Math was rejected because ECMA-262 implementation-approximated transcendental answers do not
establish identical bits across hosts. #160 measured thousands of cross-runtime discrepancies,
including after tested canonicalization schemes; reducing decimal precision also harms accuracy.
Only -0 normalization is approved, never canonical decimal truncation.

## Evidence, provenance and production proof gate

Independent MPFR4.2.2 via gmpy2 2.3.2 used exact binary64 inputs at256bits, cross-checked at512bits,
with zero rounded-reference disagreements. Frozen #160 evidence includes41,349 angles,8,857 norm
pairs and2,048 bounded accumulation/residual experiments. Route A yielded zero mismatches among
151,336 values/runtime on Node24.19.0, Chromium141.0.7390.37, Firefox142.0.1 and WebKit26.0.
Observed maximum sine/cosine errors were1.357876427129827e-16/1.5235687766752277e-16;
maximum normal norm relative error was2.9961443807005154e-16.
These are finite-corpus observations, not universally correctly rounded outputs or an all-domain proof.

Frozen candidate SHA256:
1144796ff5f0b8adb568d79aa8942378dcc385c4535aef54a8c0eb1f75178371.
Oracle source SHA256:
0b92ba23063b3d258caf1050451fc2f074b870d52db06ade1b6904bc8e54f6b5.
Input vector SHA256:
c25d90609fd7a4af305896bc1479690cf064f0d65e04cc75843de3fced633f94.
Full dossier: https://github.com/info93rajeev-cell/mangotools/issues/160#issuecomment-6234395920.

With epsilon=2^-52 and q=Number.MIN_VALUE, #159's targets are:
conversion abs error <=2*epsilon*abs(real d*pi/180)+q; trig <=2*epsilon;
hypot <=4*epsilon*real hypot(x,y)+q. Tiny/subnormal cases require additional scale/ULP checks.
The production analytic gate covers reduction, compensation, truncation, coefficient/evaluation
rounding, underflow, sqrt convergence and end-to-end #158 propagation for <=50legs of <=1e6m.
Preserve #158 tauM=1e-9+32*epsilon*max(1,abs(startN),abs(startE),P); never zero true misclosure.
The observed maximum residual/tauM of0.021508630638689387 is evidence, not proof.
Stop if analysis cannot support the unchanged contract.

Static reference vectors must come independently from MPFR/high precision, with input/reference
bits and generation provenance. Actual public exports must additionally agree bit-for-bit, with
canonical JSON/hash checks, under Node24/Chromium/Firefox/WebKit in the merged legal harness.
Reference accuracy bounds and cross-runtime exact equality are separate assertions.
Independent advisory review, immutable existing fixtures, full verification and <400 changed
executable/test lines / <=12codefiles are production gates; split rather than compress if exceeded.

## Survey boundary and sequencing

Leveling remains exact decimal-string Rise & Fall. Future closed Traverse computation and Bowditch
adjustment are separate operations (#158); adjustment must preserve independently auditable raw
computation and may not conceal bearing/sign/closure mistakes. Professional Survey golden datasets
remain a separate gate. No Survey implementation is authorized by this record.
Do not resume #161 until #162's prerequisite PR is merged and governance is founder-approved/applied.
No TASK-011B until Numeric is merged. No money/decimal behavior change, UI, presets or dependencies.

## Sources

- https://github.com/info93rajeev-cell/mangotools/issues/158
- https://github.com/info93rajeev-cell/mangotools/issues/159
- https://github.com/info93rajeev-cell/mangotools/issues/160
- NIST DLMF4.19: https://dlmf.nist.gov/4.19 (series, not the full floating-point proof).
- MPFR manual: https://www.mpfr.org/mpfr-current/mpfr.html (independent reference arithmetic).
- ECMA-262: https://tc39.es/ecma262/multipage/numbers-and-dates.html.
