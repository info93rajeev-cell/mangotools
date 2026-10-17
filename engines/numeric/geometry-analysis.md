# Route A production algorithm and error argument

Scope: the four Numeric exports in #159/#161 only. Existing decimal.ts, its constructor/configuration,
rounding rules and fixtures are unchanged. No Survey operation or general sqrt API is introduced.
The founder separation recorded in #161 moves all-domain Bowditch residual policy to #171; it does
not weaken scalar accuracy, change #158 tauM or remove the accepted counterexample.

## Fixed algorithm

All operations below are separate binary64 operations, round-to-nearest/even; no fused multiply-add,
native transcendental, convergence-dependent loop, compiler-specific variant or decimal truncation.
Normalize only output -0 to +0. Validate all finite primitive types before ranges, in signature order.
Degrees are in [0,360); norm components have absolute value <=1e8. No coercion/clamp/modulo.

1. Dispatch exact 0/90/180/270 sine/cosine values. Otherwise count strict crossings of45/135/225/315
   degrees. Subtract90*quadrant exactly; the remainder is in [-45,45], by Sterbenz's lemma (or zero
   subtraction for quadrant0). This avoids rounding a `(d+45)/90` boundary decision.
2. Convert using DEG_HI=0.017453292519943295 and DEG_LO=2.9486522708701687e-19. Above the tiny
   cutoff use the standard split/TwoProduct subtraction sequence, splitter134217729=2^27+1,
   yielding head+exact product error. Add error+degree*DEG_LO in that order.
3. For absolute remainder <2^-26 degrees use remainder*DEG_HI and cosine1. This avoids intermediate
   underflow in error-free splitting; it preserves representable tiny sine values, not a snapped
   cardinal. The analogous degree-to-radian tiny branch uses the same direct product.
4. Otherwise set x=head, tail=error+remainder*DEG_LO, z=x*x. Horner-evaluate the coefficients in
   ascending arrays, starting from the last coefficient. Sine is x+(x*z)*P(z), cosine1+z*Q(z).
   Then apply (s+c*tail,c-s*tail), using the original s/c in both expressions; permute signs/quadrants.
   P coefficients are rounded (-1)^(k+1)/(2k+3)!, k=0..7 (degree17); Q uses (2k+2)!, k=0..8 (degree18).
5. For hypot take m=max(abs(x),abs(y)), n=min(...); axes return m exactly. Set r=n/m, t=1+r*r,
   root=1.5; perform exactly8 iterations root=0.5*(root+t/root); return m*root. The private sqrt
   sees t in [1,2], with no square of a large/small input magnitude. No overflow in accepted domain.

The coefficient literals and evaluation order in src/geometry.ts are normative for output bits.
Pinned constants, in ascending coefficient-array order:

| Constant | binary64 hex |
|---|---|
| DEG_HI | `3f91df46a2529d39` |
| DEG_LO | `3c15c1d8becdd291` |
| SMALL_DEGREES | `3e50000000000000` |
| SPLITTER | `41a0000002000000` |
| P[0] | `bfc5555555555555` |
| P[1] | `3f81111111111111` |
| P[2] | `bf2a01a01a01a01a` |
| P[3] | `3ec71de3a556c734` |
| P[4] | `be5ae64567f544e4` |
| P[5] | `3de6124613a86d09` |
| P[6] | `bd6ae7f3e733b81f` |
| P[7] | `3ce952c77030ad4a` |
| Q[0] | `bfe0000000000000` |
| Q[1] | `3fa5555555555555` |
| Q[2] | `bf56c16c16c16c17` |
| Q[3] | `3efa01a01a01a01a` |
| Q[4] | `be927e4fb7789f5c` |
| Q[5] | `3e21eed8eff8d898` |
| Q[6] | `bda93974a8c07c9d` |
| Q[7] | `3d2ae7f3e733b81f` |
| Q[8] | `bca6827863b97d97` |

The independent MPFR operation-order model uses the real exact-product residual, not a copied
TwoProduct implementation; it independently rounds each mathematical basic operation to binary64.
Its pinned algorithm bits are distinct from nearest mathematical-reference bits.

## Scalar error argument

Let u=2^-53, epsilon=2u, q=2^-1074. References mean real functions of the exact input binary64 value,
not the original decimal spelling. These bounds are not universal correct-rounding claims.

### Conversion and tiny values

The high constant has relative error <0.153u; adding the low part leaves absolute constant error
<2^-109. On the non-tiny bounded path, splitter/products have no overflow or nonzero underflow;
TwoProduct's residual is exact. Tail rounding and remaining constant error are second-order compared
with the final addition's u-relative bound. A safe conversion bound is1.2u*abs(real radians)+q,
below the required4u*abs(real radians)+q. Underflow in a final result costs at most q/2.

In the tiny branch, direct-product error is <1.154u relative plus q/2; the sine omission is bounded
by abs(theta)^3/6 and cosine omission by theta^2/2. Here abs(theta)<2.61e-10, so cosine1 is correctly
rounded and the sine omission adds <0.00011u relative. This branch fits the scalar targets and
requires independent tiny/subnormal ULP checks; a loose absolute trig tolerance cannot excuse zeroing.

### Fixed polynomials and tail

For |x|<.786 and z<.617, direct sums of the factorial coefficients give these conservative bounds:

| Weight | P (sine correction) | Q (cosine correction) |
|---|---:|---:|
| sum abs(a_k)*z^k | <.172 | <.527 |
| coefficient/Horner weight sum (2k+2)*abs(a_k)*z^k | <.355 | <1.107 |
| argument-square derivative weight sum k*abs(a_k)*z^k | <.0053 | <.0268 |

Coefficient rounding, fixed Horner operations, z rounding and final correction products are bounded
by .786*.617*(.355+.0053+3*.172)u <.427u for sine and
.617*(1.107+.0268+2*.527)u <1.351u for cosine. Allow u for each base final addition and tail final
addition. Taylor remainders are <=.786^19/19! (sine) and .786^20/20! (cosine). The tail is <1e-16;
its quadratic remainder, error-free conversion residual, and higher-order floating-point terms
together with those Taylor remainders contribute <.01u. Thus both absolute errors are <3.5u,
strictly below the required2epsilon=4u. Sign/quadrant permutation adds no rounding error.
Cardinals are explicitly exact; adjacent bearings are not snapped.

### Scaled norm and fixed sqrt

For normal r, division/square/addition perturb t by at most
u*(1+4r^2)/(1+r^2)+O(u^2) relatively. Taking sqrt contributes at most1.25u+O(u^2).
For relative root error e, exact Newton gives e'=e^2/(2*(1+e)). A conservative rounded recurrence
uses B=abs(e): next B <=B^2/(2*(1-B))+u/(2*(1-B))+u*(1+B^2/(2*(1-B)))+O(u^2).
Starting B<=.5, eight steps reduce the arithmetic error below1.51u; the successive large-error
bounds are .25,.042,.00092,4.3e-7,9.3e-14, then the rounding floor. Final multiplication adds u.
A conservative safe norm bound is6u*real norm+q, below the required8u*real norm+q.
If r or r*r underflows, its contribution to t is far below u and t rounds to1. If m is subnormal,
r remains safe after scaling and only the final product needs the q/2 absolute allowance. Axes and
zero return exact magnitudes. The norm is nonnegative and finite throughout the accepted domain.

### Kernel-attributable raw geometry, not adjustment policy

With exact accumulation of weighted components, kernel trig perturbation is <=3.5u*P per component
(<=1.943e-8m at P=5e7m); its norm perturbation is <=sqrt(2)*3.5u*P (<=2.748e-8m), plus norm error.
Each ordinary binary64 component product adds <=u*L rounding. The 50-term numeric-only regression
separates exact sums of rounded products, independent MPFR references, and a correctly rounded-trig
baseline; it also checks the resulting norm. This is not a Survey engine or a proof about naive
accumulation, perimeter/correction correlation, coordinates or final Bowditch residuals. Those remain
unresolved in #171. No minimum-distance floor, tauM change or hidden misclosure correction is made.

## Reference and deterministic evidence

reference/generate-geometry.py imports no candidate or production code. The mathematical oracle is
MPFR4.2.2 via external gmpy2 2.3.2, using exact integer-ratio inputs at512bits; nearest binary64
references cross-check at1024bits with zero disagreements. The separate2048-bit exact-operation
model pins expected algorithm bits without obtaining answers from TypeScript. Non-tiny products
have enough precision for exact intermediate arithmetic; every model operation then rounds once.
Static vectors include exact input bits, high-precision decimal references, nearest-reference bits
and separate algorithm bits. Unit error checks use exact binary64-to-decimal conversion and an
isolated test-only Big constructor, not shortest-decimal floating-point subtraction or relaxed limits.

The 124 cases cover cardinals/adjacent floats, all quadrants,30/45/60, reduction/tiny boundaries,
nearzero/360, subnormals, axes/3-4-5/sign/swaps/equal/unequal components and allowed extremes.
The public-library fixture appends those cases and typed failures without changing its existing
decimal cases. All real public exports, results, exact bits, canonical JSON and SHA256 are compared
in Node24/Chromium/Firefox/WebKit by the unchanged merged harness. No tolerance is used for equality.

Offline reproduction: with gmpy2 available only in an external Python environment, run
`python engines/numeric/reference/generate-geometry.py`; compare its output structurally with
reference/geometry.json. No MPFR/gmpy2 code or dependency is shipped in the browser or runtime.
Run `pnpm exec vitest run engines/numeric` and the three existing determinism projects afterward.

Frozen #160 evidence remains unchanged: candidate SHA256
1144796ff5f0b8adb568d79aa8942378dcc385c4535aef54a8c0eb1f75178371;
oracle SHA2560b92ba23063b3d258caf1050451fc2f074b870d52db06ade1b6904bc8e54f6b5;
input SHA256c25d90609fd7a4af305896bc1479690cf064f0d65e04cc75843de3fced633f94.
The production threshold reduction/tiny branch and canonical TwoProduct sequence were reviewed
separately; frozen prototype measurements are not represented as production tests or a proof.

The final production public exports were also rerun against the unchanged frozen MPFR corpus:
41,349 bearings for each of three angular functions and 8,857 norm pairs (132,904 scalar checks).
No approved error target failed. Maximum observed absolute errors were 4.44028e-16 radians,
1.35788e-16 sine, 1.52357e-16 cosine and 2.84755e-8 norm units. These empirical maxima supplement,
but do not replace, the analytic bounds or prove a future Bowditch accumulation/residual policy.

## Sources and authority

- Issues159/160/161, founder separation comment6238338554; unresolved Survey policy issue171.
- NIST DLMF4.19 (series): https://dlmf.nist.gov/4.19;4.21 (addition): https://dlmf.nist.gov/4.21.
- Ogita/Rump/Oishi, Accurate Sum and Dot Product, algorithms4–5 (splitting/error-free product):
  https://www.tuhh.de/ti3/paper/rump/OgRuOi04a.pdf.
- GNU MPFR4.2.2 manual (reference arithmetic): https://www.mpfr.org/mpfr-current/mpfr.html.
- ECMA-262 basic Number operations; no implementation-approximated Math transcendental in this path:
  https://tc39.es/ecma262/multipage/numbers-and-dates.html.
