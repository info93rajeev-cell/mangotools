# engines/numeric

Library engine: public functions, not operation descriptors.

## Existing exact decimal family

Deterministic decimal arithmetic for money, percentages and the existing Survey Leveling contract.
Values in and out of arithmetic functions are decimal strings. `big.js` is isolated internally and
never leaves the package. Existing parse/status/comparison return types remain unchanged.
`half-up` rounds halves away from zero; `half-even` remains available.
Division retains 20 decimal places before explicit presentation rounding.
No API, rounding configuration, existing calculation, fixture expectation or tolerance changes.

## Deterministic geometry family (0.2.0)

Route A and its boundary were approved through #159/#160. These additive public exports follow
#161; the existing decimal implementation and its isolated big.js configuration are unchanged:

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

Geometry uses primitive binary64 numbers, not decimal strings or money arithmetic.
Degree inputs must be finite and in [0,360); -0 is accepted as zero. Norm components must be finite
with absolute value <=1e8; signed, tiny and subnormal values are supported. No coercion or clamping.
Check all types/finiteness in argument order before ranges in argument order. Failures identify the
argument without echoing its value; never throw for invalid user inputs. Only output -0 becomes +0.
Exact cardinal sine/cosine outputs are specified at 0/90/180/270; adjacent inputs must not be snapped.

With epsilon=2^-52 and q=Number.MIN_VALUE, approved acceptance targets against exact-input real
references are: conversion absolute error <=2*epsilon*abs(d*pi/180)+q; sine/cosine <=2*epsilon;
hypot <=4*epsilon*sqrt(x*x+y*y)+q. Tiny/subnormal cases also require reference-scale/ULP checks.
These are bounded approximation guarantees, not a universal correct-rounding claim.
No native Math.sin/cos/hypot/sqrt may determine geometry answers. Use pinned degree reduction,
constants/evaluation order, polynomials and fixed software sqrt/scaled norm; no runtime dependency.

See [Numeric geometry decision](../../docs/decisions/DECISION-NUMERIC-GEOMETRY-KERNEL.md),
[API decision #159](https://github.com/info93rajeev-cell/mangotools/issues/159) and
[MPFR/prototype evidence #160](https://github.com/info93rajeev-cell/mangotools/issues/160#issuecomment-6234395920).
Prototype measurements do not establish all-domain error bounds. The production algorithm, scalar
error argument, constants, independent MPFR references and reproduction instructions are pinned in
[geometry-analysis.md](geometry-analysis.md). The merged library harness checks actual public exports
bit-for-bit in Node24/Chromium/Firefox/WebKit; mathematical accuracy is tested separately.
The [founder separation](https://github.com/info93rajeev-cell/mangotools/issues/161#issuecomment-6238338554)
supersedes Numeric's former obligation to prove every Bowditch residual fits tauM. The accepted
counterexample and unchanged tauM belong to [TASK-011A4 / #171](https://github.com/info93rajeev-cell/mangotools/issues/171).
No Traverse/Bowditch code or policy change is included or authorized here.

## Changelog

- 0.2.0 — Add bounded deterministic binary64 geometry APIs with independent MPFR vectors and
  public-library cross-runtime checks (#161). Decimal APIs, rounding and Leveling unchanged.
- 0.1.0 — First version (TASK-001).
