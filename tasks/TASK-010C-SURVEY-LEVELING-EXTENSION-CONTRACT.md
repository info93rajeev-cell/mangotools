# TASK-010C — Survey Leveling Extension Contract and Source Dossier

## Status, lane and size

- **Status:** Proposed contract; founder review and acceptance on merge.
- **Issue:** [#279](https://github.com/info93rajeev-cell/mangotools/issues/279).
- **Lane:** `docs` (size S).
- **Scope:** Authoritative source dossier, mathematical definitions, exact numeric and rounding policies, and calculation contract for distance, allowable misclosure, correction distribution, open-line handling, and HI boundaries.
- **Exclusions:** Golden fixture files and TypeScript engine implementation are strictly deferred to following PRs. No production tool, preset, UI, or runtime changes.

---

## 1. Authoritative Bibliographic Sources & Dossier

All formulas, field-book conventions, and adjustment models in this contract are grounded in the following recognized surveying engineering standards and textbooks:

1. **Schofield, W. & Breach, M. (2007). *Engineering Surveying* (6th ed.). Butterworth-Heinemann (Elsevier). ISBN: 978-0-7506-6949-8.**
   - §3.7.1 *The Rise and Fall Method* (pp. 69–73): Staff observation conventions, physical change points with coincident FS/BS staff position, reduction equations, and arithmetic consistency checks.
   - §3.9 *Permissible Error (Misclosure)* (pp. 79–83): $E = \pm C \sqrt{K}$ mm where $K$ is leveled distance in km; establishes class-dependent constant $C$.
   - §3.10 *Adjustment of Level Networks* (pp. 83–86): Proportional distribution of closing error by cumulative distance and by instrument setups.
2. **Bannister, A., Raymond, S. & Baker, R. (1998). *Surveying* (7th ed.). Longman. ISBN: 0-582-30249-8.**
   - Chapter 3 *Levelling* (pp. 51–92): Reduction equations, two independent arithmetic checks confirming three agreeing differences, and misclosure compensation rules.
3. **Punmia, B. C., Jain, A. K. & Jain, A. K. (2005). *Surveying (Vol. 1)* (16th ed.). Laxmi Publications. ISBN: 81-7008-853-4.**
   - §5.16 *Booking and Reducing Levels* (pp. 147–151): Rise & Fall booking rules; non-comparison of FS and BS on the same row.
   - §5.19 *Arithmetical Checks* (p. 154): Detailed two-equality verification.
   - §5.23 *Permissible Error in Levelling* (pp. 161–163): Classification of $C$ ($100\text{ mm}\sqrt{K}$ rough, $24\text{ mm}\sqrt{K}$ ordinary, $6\text{ mm}\sqrt{K}$ precise).
   - §5.25 *Adjustment of Levelling Network* (pp. 165–167): Distance-proportional and setup-proportional allocation.
4. **Federal Geodetic Control Committee (FGCC / NOAA, 1984, rev. 2020). *Standards and Specifications for Geodetic Control Networks*.**
   - Table 2.2 *Geodetic Leveling Standards*: First Order ($3\text{--}4\text{ mm}\sqrt{K}$), Second Order ($6\text{--}8\text{ mm}\sqrt{K}$), Third Order ($12\text{ mm}\sqrt{K}$).
5. **British Standards Institution (BSI). BS 5606:1990. *Code of practice for accuracy in building*.**
   - Setting-out tolerances for civil engineering site leveling ($C = 24\text{ mm}/\sqrt{\text{km}}$).

---

## 2. Field Book Observations & Change-Point Rules

Let the level book consist of an ordered list of $n+1$ station rows ($i = 0, \dots, n$, where $n \ge 1$):

1. **First Row ($i = 0$):** Backsight (BS) on starting benchmark only. No IS, FS, rise, or fall.
2. **Interior Ordinary Rows ($0 < i < n$):** Intermediate Sight (IS) only.
3. **Interior Change Point Rows ($0 < i < n$):** Both Foresight (FS) and Backsight (BS) present on the same row.
   - **Physical Rule:** The staff remains on the physical change point (CP / Turning Point). The incoming FS terminates the preceding instrument setup; the outgoing BS begins the succeeding instrument setup.
   - **Reduction Invariant:** **Never compute rise or fall between FS and BS of the same row.** They represent sightings from two different instrument locations to the same staff.
4. **Last Row ($i = n$):** Foresight (FS) on the terminal station/closing benchmark only.
5. **Consecutive Change Points:** Allowed when terrain requires immediate instrument relocation; the incoming FS at CP $k$ is compared with the preceding usable BS at CP $k-1$.
6. **Forbidden Combinations:** BS+IS, IS+FS, BS+IS+FS, or rows with no readings are structurally invalid.

---

## 3. Reduction & Arithmetic Equality Checks

At station $i$ ($i \ge 1$), let $R_{\text{prev}}$ be the previous usable staff reading (the starting BS, or preceding IS, or preceding CP's BS) and $R_{\text{cur}}$ be the incoming reading ($i$'s IS, or $i$'s FS):
$$\text{diff}_i = R_{\text{prev}} - R_{\text{cur}}$$
- If $\text{diff}_i > 0$: $\text{Rise}_i = \text{diff}_i$, $\text{Fall}_i = 0$.
- If $\text{diff}_i < 0$: $\text{Rise}_i = 0$, $\text{Fall}_i = -\text{diff}_i$.
- If $\text{diff}_i = 0$: $\text{Rise}_i = 0$, $\text{Fall}_i = 0$.

Unadjusted Reduced Level:
$$\text{RL}_i = \text{RL}_{i-1} + \text{Rise}_i - \text{Fall}_i$$

### Three Values That Must Agree and Two Equality Checks
Sum all supplied BS, all FS, all computed rises, and all falls ($i \ge 1$):
- $\Delta_1 = \sum \text{BS} - \sum \text{FS}$
- $\Delta_2 = \sum \text{Rise} - \sum \text{Fall}$
- $\Delta_3 = \text{RL}_n - \text{RL}_0 = \text{Ending RL} - \text{Starting RL}$

The engine evaluates and returns **two arithmetic equality checks**:
1. `arithmetic-rise-fall`: $\Delta_1 = \Delta_2$
2. `arithmetic-first-last`: $\Delta_1 = \Delta_3$

Both checks must pass in every valid level run. This guarantees internal arithmetic consistency. It does **not** prove staff observations are free from field errors.

---

## 4. Closing Benchmarks & Misclosure ($e$)

1. **Open Line (no known closing RL provided):**
   - The final computed RL $\text{RL}_n$ is the observed ending level.
   - Misclosure, allowable limit, and adjustment corrections are `null`.
2. **Closed Line (known closing RL $RL_{\text{known}}$ provided):**
   $$\text{Misclosure } e = \text{RL}_n - \text{RL}_{\text{known}}$$
   - Positive $e$: observed ending level is higher than the known benchmark.
   - Negative $e$: observed ending level is lower than the known benchmark.

---

## 5. Line Distance ($K$) & Allowable Misclosure ($C\sqrt{K}$)

1. **Station Distances ($d_i$):**
   - Each row $i$ ($i \ge 1$) specifies incremental horizontal distance $d_i \ge 0$ (in metres) from station $i-1$. $d_0 = 0$ at the starting BM.
   - Cumulative distance: $D_i = \sum_{j=1}^i d_j$ (metres).
   - Total line distance: $D_{\text{total}} = D_n$ (metres).
   - Total line distance in kilometres: $K = D_{\text{total}} / 1000$.
2. **Allowable Error Specification:**
   $$E_{\text{allow}} = \pm C \sqrt{K} \text{ mm}$$
   - $C$ is the allowable misclosure constant, with units **$\text{mm}/\sqrt{\text{km}}$**.
   - **Non-Universal Standard:** $C = 24\text{ mm}/\sqrt{\text{km}}$ is typical for ordinary construction engineering leveling (BS 5606 / Punmia §5.23), but is **not universal**.
   - Input/parameter boundary requires $C$ to be explicit (default $24\text{ mm}/\sqrt{\text{km}}$, configurable for $12$ Third Order, $6$ Second Order, or project specification).
3. **Closure Acceptance Condition:**
   $$\text{Within Limit} \iff |e| \times 1000 \le E_{\text{allow}} + \epsilon \quad (\epsilon = 10^{-6}\text{ mm})$$

---

## 6. Correction Distribution & Adjusted RLs

The total correction to distribute is $-e$. Two approved distribution methods:

### Method A: Distance-Proportional Adjustment (`adjBy: "distance"`)
Recommended when station distances $d_i$ are measured:
$$c_i = -e \times \frac{D_i}{D_{\text{total}}}$$
- At start ($i = 0$): $D_0 = 0 \implies c_0 = 0$.
- At closing BM ($i = n$): $D_n = D_{\text{total}} \implies c_n = -e$.
- $\text{Adjusted RL}_i = \text{RL}_i + c_i$.
- **Terminal Constraint:** $\text{Adjusted RL}_n \equiv \text{RL}_{\text{known}}$ exactly.

### Method B: Setup-Proportional Adjustment (`adjBy: "setup"`)
Standard when distances are unmeasured or instrument setups have uniform sighting distances:
Let $N_{\text{setups}}$ be total instrument setups ($N_{\text{setups}} = 1 + N_{\text{CP}}$). Let $s_i$ be the setup index from which station $i$ was observed ($s_0 = 0$, $s_n = N_{\text{setups}}$).
- Intermediate sights (IS) belong to the setup between preceding and succeeding CPs.
- The correction per setup is $\delta c = -e / N_{\text{setups}}$.
- Point correction: $c_i = -e \times \frac{s_i}{N_{\text{setups}}}$.
- **Terminal Constraint:** $\text{Adjusted RL}_n \equiv \text{RL}_{\text{known}}$ exactly.

### Method C: No Adjustment (`adjBy: "none"`)
$c_i = 0$, $\text{Adjusted RL}_i = \text{RL}_i$.

---

## 7. Precision, Exact Decimals & Rounding Policy

1. **Staff Readings and Benchmarks:**
   - Input format: decimal strings in metres, up to 6 decimal places (typically 3 decimal places / millimetre resolution in practice).
   - Zero is distinct from blank: `0` is a valid reading; empty cell is `null`.
2. **Intermediate Calculation Arithmetic:**
   - Rises, falls, and raw RLs are calculated using exact decimal addition and subtraction (zero rounding error).
3. **$\sqrt{K}$ and Allowable Error:**
   - Evaluated using high-precision IEEE 754 binary64 or Decimal arithmetic.
   - Allowable limit is presented rounded to 1 decimal place in millimetres ($\pm X.X\text{ mm}$) using half-up rounding.
4. **Corrections ($c_i$) and Adjusted RLs:**
   - Raw corrections $c_i$ are exact rationals.
   - For level-book reporting, corrections are formatted in millimetres to 1 decimal place ($0.1\text{ mm}$).
   - Adjusted RLs are rounded to 3 decimal places (1 mm) half-up:
     $$\text{Adjusted RL}_i = \text{round}_3(\text{RL}_i + c_i)$$
   - **Terminal Invariant:** To prevent rounding drift on the closing benchmark, $\text{Adjusted RL}_n$ is strictly assigned $\text{RL}_{\text{known}}$.

---

## 8. Missing Data & Validation Failure Order

1. **Missing or Non-Numeric Start RL:** Fails with `SURVEY_LEVELING_MISSING_START_RL` / `SURVEY_LEVELING_INVALID_DECIMAL`.
2. **Missing Distance when `adjBy: "distance"`:**
   - If `adjBy == "distance"`, every row $i \ge 1$ must have a valid non-negative distance string. Missing or empty distance fails with `SURVEY_LEVELING_MISSING_DISTANCE`.
3. **Negative Distance:** Fails with `SURVEY_LEVELING_NEGATIVE_DISTANCE`.
4. **Zero Total Distance:** If $D_{\text{total}} = 0$ while distance adjustment is requested, fails with `SURVEY_LEVELING_ZERO_TOTAL_DISTANCE`.
5. **Open Line with Adjustment Selected:** If `closingRL` is omitted while `adjBy` is `"distance"` or `"setup"`, the engine falls back to `adjBy: "none"` without failing, leaving corrections null.

---

## 9. Boundaries for Height of Instrument (HI) Method

1. **Shared Contract:** HI uses identical field observations (`observations` with BS, IS, FS, CP), station distances, and closing benchmark inputs.
2. **Distinct Collimation State:**
   - At setup $j$ (starting at row $k$ with BS):
     $$\text{HI}_j = \text{RL}_k + \text{BS}_k$$
   - For subsequent stations $m$ observed from setup $j$:
     $$\text{RL}_m = \text{HI}_j - (\text{IS}_m \text{ or } \text{FS}_m)$$
3. **Checks Distinction:**
   - The Rise & Fall method computes $\Sigma\text{Rise} - \Sigma\text{Fall}$ which verifies all intermediate sights.
   - Standard HI arithmetic checks verify only:
     $$\Sigma\text{BS} - \Sigma\text{FS} = \text{Ending RL} - \text{Starting RL}$$
   - Intermediate sights in HI are not checked by the two primary deltas. An optional secondary check $\sum(\text{RL} \times \dots)$ exists in literature but is omitted from primary checks.
   - HI method will be isolated in its own approved operation/parameter extension (`survey.leveling.hi@1` or `method: "height-of-instrument"`).

---

## 10. Open Decisions for Founder Acceptance

1. **Parameter Structure for Method & Adjustment:**
   - Option A: Single unified operation `survey.leveling.reduce@2` accepting `params: { method: 'rise-fall' | 'height-of-instrument', adjBy: 'distance' | 'setup' | 'none', kConstant: string }`.
   - Option B: Maintain `survey.leveling.reduce@1` strictly for unadjusted Rise & Fall, and introduce `survey.leveling.adjust@1` as a chained operation.
   - *Recommendation:* Option A is preferred because surveyors expect the level book to reduce and adjust in one coherent record.
2. **Correction Reporting Units:**
   - Corrections formatted in millimetres (mm) to 1 decimal place, or in metres (m) to 4 decimal places.
   - *Recommendation:* Display in mm (e.g. `0.9 mm`, `5.0 mm`) matching standard field practice.
