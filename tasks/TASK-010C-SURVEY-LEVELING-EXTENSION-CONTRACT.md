# TASK-010C — Survey Leveling Extension Contract and Source Dossier

## Status, lane and size

- **Status:** Proposed contract; founder review and acceptance on merge.
- **Issue:** [#279](https://github.com/info93rajeev-cell/mangotools/issues/279).
- **Pull Request:** [#280](https://github.com/info93rajeev-cell/mangotools/pull/280).
- **Lane:** `docs` (size S).
- **Scope:** Authoritative source dossier, mathematical definitions, deterministic numerical policies, and calculation contract for distance, allowable error, adjustment distribution, open-line handling, and HI boundaries.
- **Exclusions:** Golden fixture files and TypeScript engine implementation are strictly deferred to subsequent PRs.

---

## 1. Authoritative Bibliographic Sources & Primary Citations

All formulas, field-book conventions, and adjustment models in this contract are verified against primary publications and recognized institutional textbooks:

1. **Federal Geodetic Control Committee (FGCC / NOAA, September 1984): *Standards and Specifications for Geodetic Control Networks*.**
   - **Primary Document:** National Geodetic Survey, NOAA, Rockville, MD (September 1984 publication).
   - **Official NOAA Link:** [1984-stds-specs-geodetic-control-networks.pdf](https://www.ngs.noaa.gov/FGCS/tech_pub/1984-stds-specs-geodetic-control-networks.pdf)
   - **Table 2.2 *Elevation Accuracy Standards* (p. 2-3):** Maximum elevation difference accuracy index $b$ ($\text{mm}/\sqrt{\text{km}}$):
     - First-Order, Class I: $0.5\text{ mm}/\sqrt{K}$
     - First-Order, Class II: $0.7\text{ mm}/\sqrt{K}$
     - Second-Order, Class I: $1.0\text{ mm}/\sqrt{K}$
     - Second-Order, Class II: $1.3\text{ mm}/\sqrt{K}$
     - Third-Order: $2.0\text{ mm}/\sqrt{K}$
     - *Note:* Table 2.2 defines relative control network accuracy; geodetic loop and section closure standards (USACE EM 1110-1-1005 / FGCS guidelines) permit up to $12\text{ mm}\sqrt{K}$ for Third-Order engineering control.
2. **Schofield, W. & Breach, M. (2007): *Engineering Surveying* (6th ed.). Butterworth-Heinemann (Elsevier). ISBN: 978-0-7506-6949-8.**
   - **Publisher Catalog:** [Elsevier Engineering Surveying](https://www.elsevier.com/books/engineering-surveying/schofield/978-0-7506-6949-8)
   - **Chapter 3 *Levelling*:**
     - §3.7.1 *The Rise and Fall Method*: Staff reading conventions (BS, IS, FS), physical change point (CP) semantics where incoming FS and outgoing BS share staff location, and reduction equations.
     - §3.7.3 *Arithmetic Checks*: Establishes $\sum \text{BS} - \sum \text{FS} = \sum \text{Rise} - \sum \text{Fall} = \text{Last RL} - \text{First RL}$.
     - §3.9 *Permissible Error (Misclosure)*: General functional form $E = \pm m \sqrt{K}\text{ mm}$ ($K$ in km) and setup-based $E = \pm m \sqrt{n}$.
     - §3.10 *Adjustment of Level Networks*: Proportional distribution by distance ($c_i = -e \times D_i / D_{\text{total}}$) and by instrument setups.
3. **Punmia, B. C., Jain, A. K. & Jain, A. K. (2005): *Surveying (Vol. 1)* (16th ed.). Laxmi Publications. ISBN: 81-7008-853-4.**
   - **Publisher Catalog:** [Laxmi Publications](https://www.laxmipublications.com/)
   - **Chapter 5 *Levelling*:**
     - §5.16 *Booking and Reducing Levels*: Non-comparison of FS and BS on the same row.
     - §5.19 *Arithmetical Checks*: Details the two independent equality checks.
     - §5.23 *Permissible Error in Levelling*: Formulates the square-root distance relationship $E = C\sqrt{D}$.
     - §5.25 *Adjustment of Levelling Network*: Distance-proportional and setup-proportional formulas.
4. **NPTEL / IIT Roorkee (Prof. J. K. Ghosh): *Surveying*, Module 4 *Levelling*.**
   - **Accessible Course Web Archive Pages:**
     - [Lesson 13 — Rise and Fall Method](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/42.htm): Establishes relative rise and fall principles from differential staff readings.
     - [Lesson 13 — Arithmetic Check for Reduction of Level](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/46.htm): Documents the three agreeing differences ($\sum\text{BS} - \sum\text{FS} = \sum\text{Rise} - \sum\text{Fall} = \text{Last RL} - \text{First RL}$) with worked level net Table 13.3.
     - [Lesson 13 — Example Ex13-3 (Adjustment of Level Net)](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/49.htm): Demonstrates setup-proportional adjustment where total circuit closing error is divided equally per instrument setup.
5. **NIMI / DGT Government of India (Oct 2022): *Surveyor — Trade Practical (NSQF Level 4)*.**
   - **Official Manual:** [Bharat Skills E-Book](https://bharatskills.gov.in/pdf/E_Books/CTS/62/English/TP/Surveyor%20-%201st%20Year%20-%20TP%20%28NSQF%202022%29.pdf) (Exercise 1.8.54).
   - Confirms eleven-station practical booking format and intermediate sight reduction.

*(Note on standards: BS 5606:1990 was withdrawn by BSI in 2022 and applies to building component fit tolerances rather than civil leveling circuits. The engine enforces no automatic default for allowable error constant C; the value 24 is used solely as an illustrative preset in the 'Try sample' button and is not an authoritative standard).*

---

## 2. Field Book Observations & Change-Point Rules

Let the level book consist of an ordered list of $n+1$ station rows ($i = 0, \dots, n$, where $n \ge 1$):

1. **First Row ($i = 0$):** Backsight (BS) on starting benchmark only. No IS, FS, rise, or fall.
2. **Interior Ordinary Rows ($0 < i < n$):** Intermediate Sight (IS) only.
3. **Interior Change Point Rows ($0 < i < n$):** Both Foresight (FS) and Backsight (BS) present on the same row.
   - **Physical Rule:** The staff remains stationary on the physical change point (CP / Turning Point). The incoming FS terminates the preceding instrument setup; the outgoing BS begins the succeeding instrument setup.
   - **Reduction Invariant:** **Never compute rise or fall between FS and BS of the same row.** They observe the same staff position from different instrument setups.
4. **Last Row ($i = n$):** Foresight (FS) on the terminal station/closing benchmark only.
5. **Consecutive Change Points:** Allowed when terrain requires immediate instrument relocation; incoming FS at CP $k$ is compared with preceding usable BS at CP $k-1$.
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
   - `closureStatus` is `null`.
2. **Closed Line (known closing RL $\text{RL}_{\text{known}}$ provided):**
   $$\text{Misclosure } e = \text{RL}_n - \text{RL}_{\text{known}} \quad (\text{metres})$$
   $$\text{Misclosure in millimetres: } e_{\text{mm}} = e \times 1000 \quad (\text{mm})$$
   - Positive $e$: observed ending level is higher than the known benchmark.
   - Negative $e$: observed ending level is lower than the known benchmark.

---

## 5. Line Distance ($K$) & Allowable Misclosure ($C\sqrt{K}$)

1. **Station Distances ($d_i$) and $d_0 = 0$ Invariant:**
   - Each row $i$ ($i \ge 1$) specifies incremental horizontal distance $d_i \ge 0$ (in metres) from station $i-1$.
   - **$d_0 = 0$ Invariant:** At the starting BM ($i = 0$), there is no preceding station; distance must be `0` or omitted (which normalizes to `0`). Supplying a nonzero distance ($d_0 > 0$) is rejected with `SURVEY_LEVELING_START_DISTANCE_NONZERO` on `observations.0.dist` to prevent silent misattribution or data offset. A nonzero first-station distance is never silently dropped or retained while excluded from total line distance.
   - Cumulative distance: $D_i = \sum_{j=1}^i d_j$ (metres).
   - Total line distance: $D_{\text{total}} = D_n$ (metres).
   - Leveled distance in kilometres: $K = D_{\text{total}} / 1000$.
2. **Allowable Error Formula & Status of Parameter $C$:**
   $$E_{\text{allow}} = \pm C \sqrt{K} \text{ mm}$$
   - **Strictly Project-Specified:** $C$ is an explicit, optional input parameter (`kConstant`, string) in units of **$\text{mm}/\sqrt{\text{km}}$**. There is **no automatic engine default**.
   - **User Requirement for Tolerance Evaluation:** The user must explicitly supply a project-specified $C$ for allowable error and closure pass/fail evaluation.
   - **Missing Criterion Behaviour:** When $C$ is absent or empty:
     - The engine computes all raw reduced levels, arithmetic checks, and closing misclosure $e$.
     - `allowableError` is returned as `null`.
     - `closureStatus` is returned as `'criterion-not-provided'`.
     - The UI displays allowable limit as `—` and status badge as `Criterion not provided`.
     - Adjustment distribution (distance or setup) proceeds normally if requested, since adjustment distributes observed misclosure $-e$ and does not require an allowable error threshold.
   - **Missing Distance Behaviour on Closed Lines:** When a closed line supplies $C$ (`kConstant`) but lacks one or more required station distances (either partially absent or entirely absent):
     - Distance-proportional adjustment (`adjBy: "distance"`): Strictly requires complete station distances; missing any distance raises `SURVEY_LEVELING_MISSING_DISTANCE`.
     - Setup adjustment or unadjusted (`adjBy: "setup"` or `adjBy: "none"`): The engine completes reduction, arithmetic checks, closing misclosure, and setup adjustments.
     - `allowableError` is returned as `null`.
     - `totalDistanceKm` is returned as `null`.
     - `closureStatus` is returned as `'distance-not-provided'` (distinguishing it from `'criterion-not-provided'`).
     - The UI displays allowable limit as `—` and status badge as `Distance not provided`.
   - **Status of $C = 24$:** The value $24$ is retained **only** in an explicitly labelled "Try sample" dataset as an illustrative example. Loading a sample must not imply that 24 is an authoritative standard or universal default.
   - **UI Copy Obligation:** In the empty workbench state, the input field has no pre-filled value (placeholder: `"e.g. 12 or 24"`). Label: `"Allowable error constant C (mm/√km) [Optional]"`. Helper copy: `"Enter your contract or survey specification constant C. Leaving blank calculates misclosure without a pass/fail tolerance check."`
3. **Deterministic Numerical Policy for $\sqrt{K}$ and Acceptance:**
   - **Kernel Evaluation:** When $C$ is provided, $K$ and $\sqrt{K}$ are evaluated deterministically using IEEE 754 double precision (`binary64` via `Math.sqrt(K)`).
   - **Acceptance Criterion:** When $C$ is present and total distance $K$ is available, the closure comparison evaluates against the unrounded threshold:
     $$\text{closureStatus} = \begin{cases}
     \text{'pass'} & \text{if } |e_{\text{mm}}| \le C\sqrt{K} + 10^{-9}\text{ mm} \\
     \text{'fail'} & \text{if } |e_{\text{mm}}| > C\sqrt{K} + 10^{-9}\text{ mm}
     \end{cases}$$
     When $C$ is absent, $\text{closureStatus} = \text{'criterion-not-provided'}$.
     When $C$ is present but distance is missing, $\text{closureStatus} = \text{'distance-not-provided'}$.
   - **Displayed Allowable Limit:** When $C$ is present, formatted rounded half-up to 1 decimal place in millimetres ($\pm X.X\text{ mm}$). Acceptance does **not** evaluate against the displayed 0.1 mm rounded number.

---

## 6. Correction Distribution & Adjusted RLs

Total error to compensate:
$$\text{Total Correction: } C_{\text{total, m}} = -e \quad (\text{metres}) \quad \iff \quad C_{\text{total, mm}} = -e_{\text{mm}} \quad (\text{mm})$$

### Method A: Distance-Proportional Adjustment (`adjBy: "distance"`)
Applied when station distances $d_i$ are measured:
- **Theoretical correction in metres ($c_{i,\text{m}}$):**
  $$c_{i,\text{m}} = -e \times \frac{D_i}{D_{\text{total}}} \quad (\text{metres})$$
- **Theoretical correction in millimetres ($c_{i,\text{mm}}$):**
  $$c_{i,\text{mm}} = c_{i,\text{m}} \times 1000 = -e_{\text{mm}} \times \frac{D_i}{D_{\text{total}}} \quad (\text{mm})$$
- Start ($i = 0$): $D_0 = 0 \implies c_{0,\text{m}} = 0\text{ m}$ ($c_{0,\text{mm}} = 0\text{ mm}$).
- Terminal Station ($i = n$): $D_n = D_{\text{total}} \implies c_{n,\text{m}} = -e\text{ m}$ ($c_{n,\text{mm}} = -e_{\text{mm}}\text{ mm}$).

### Method B: Setup-Proportional Adjustment (`adjBy: "setup"`)
Standard when sight distances are uniform or distances are unchained:
- **Physical Rationale:** Systematic and collimation errors accumulate per instrument relocation (setup). All Intermediate Sights (IS) observed during a setup share that setup's line of collimation and receive the exact same correction as the Change Point (CP) closing that setup.
- Let $N_{\text{setups}}$ be total instrument setups ($N_{\text{setups}} = 1 + N_{\text{CP}}$).
- Station $i$ observed during setup $s_i \in \{1, \dots, N_{\text{setups}}\}$ receives:
  $$c_{i,\text{m}} = -e \times \frac{s_i}{N_{\text{setups}}} \quad (\text{metres})$$
  $$c_{i,\text{mm}} = c_{i,\text{m}} \times 1000 = -e_{\text{mm}} \times \frac{s_i}{N_{\text{setups}}} \quad (\text{mm})$$
- Terminal Station ($i = n$): $s_n = N_{\text{setups}} \implies c_{n,\text{m}} = -e\text{ m}$ ($c_{n,\text{mm}} = -e_{\text{mm}}\text{ mm}$).

### Method C: No Adjustment (`adjBy: "none"`)
$c_{i,\text{m}} = 0\text{ m}$, $c_{i,\text{mm}} = 0\text{ mm}$, $\text{Adjusted RL}_i = \text{RL}_i$.

### Adjusted RL Equation & Unit Conversion
For all methods, the Adjusted RL at station $i$ converts the correction to metres and rounds half-up to 3 decimal places (1 mm):
$$\text{Adjusted RL}_i = \text{round}_3\left(\text{RL}_i + c_{i,\text{m}}\right) = \text{round}_3\left(\text{RL}_i + \frac{c_{i,\text{mm}}}{1000}\right)$$

- **Level Book Correction Display:** The level book displays `corr` in millimetres rounded half-up to 1 decimal place: $\text{round}_1(c_{i,\text{mm}})\text{ mm}$.
- **Terminal Invariant:** To prevent floating-point rounding drift on the closing benchmark, $\text{Adjusted RL}_n \equiv \text{RL}_{\text{known}}$ strictly.

### Reconciled Worked Comparison Table
Sample level run ("Try sample" example with illustrative $C = 24\text{ mm}/\sqrt{\text{km}}$, $N_{\text{setups}} = 3$, $D_{\text{total}} = 160\text{ m}$, $\text{RL}_{\text{known}} = 99.805\text{ m}$, observed closing $\text{RL}_n = 99.800\text{ m}$, misclosure $e = -0.005\text{ m} = -5.0\text{ mm}$, total correction $+5.0\text{ mm}$, allowable error $\pm 9.6\text{ mm}$ [pass]):

| Station | Type | Dist (m) | Cum $D_i$ (m) | Setup ($s_i$) | Raw RL (m) | Dist $c_{i,\text{mm}}$ (exact) | Dist Display Corr | Dist Adjusted RL (m) | Setup $c_{i,\text{mm}}$ (exact) | Setup Display Corr | Setup Adjusted RL (m) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BM-1** | Start BM | 0 | 0 | 0 | 100.000 | $0.0\text{ mm}$ | `0.0 mm` | **100.000** | $0.0\text{ mm}$ | `0.0 mm` | **100.000** |
| **A** | IS | 30 | 30 | 1 | 100.300 | $+0.9375\text{ mm}$ | `+0.9 mm` | **100.301** | $+1.6667\text{ mm}$ | `+1.7 mm` | **100.302** |
| **CP1** | CP | 30 | 60 | 1 | 99.500 | $+1.8750\text{ mm}$ | `+1.9 mm` | **99.502** | $+1.6667\text{ mm}$ | `+1.7 mm` | **99.502** |
| **B** | IS | 25 | 85 | 2 | 99.200 | $+2.65625\text{ mm}$ | `+2.7 mm` | **99.203** | $+3.3333\text{ mm}$ | `+3.3 mm` | **99.203** |
| **CP2** | CP | 35 | 120 | 2 | 99.700 | $+3.7500\text{ mm}$ | `+3.8 mm` | **99.704** | $+3.3333\text{ mm}$ | `+3.3 mm` | **99.703** |
| **BM-2** | Closing BM | 40 | 160 | 3 | 99.800 | $+5.0000\text{ mm}$ | `+5.0 mm` | **99.805** | $+5.0000\text{ mm}$ | `+5.0 mm` | **99.805** |

*Value reconciliation notes:*
- Station A (Distance): $\text{round}_3(100.300 + 0.0009375) = \text{round}_3(100.3009375) = 100.301\text{ m}$.
- Station A (Setup): $\text{round}_3(100.300 + 0.0016667) = \text{round}_3(100.3016667) = 100.302\text{ m}$.
- Station CP1 (Distance): $\text{round}_3(99.500 + 0.001875) = \text{round}_3(99.501875) = 99.502\text{ m}$.
- Station CP1 (Setup): $\text{round}_3(99.500 + 0.0016667) = \text{round}_3(99.5016667) = 99.502\text{ m}$.
- Station B (Distance): $\text{round}_3(99.200 + 0.00265625) = \text{round}_3(99.20265625) = 99.203\text{ m}$.
- Station B (Setup): $\text{round}_3(99.200 + 0.0033333) = \text{round}_3(99.2033333) = 99.203\text{ m}$.
- Station CP2 (Distance): $\text{round}_3(99.700 + 0.00375) = \text{round}_3(99.70375) = 99.704\text{ m}$.
- Station CP2 (Setup): $\text{round}_3(99.700 + 0.0033333) = \text{round}_3(99.7033333) = 99.703\text{ m}$.
- Terminal Station BM-2: Enforces $\text{Adjusted RL} \equiv \text{RL}_{\text{known}} = 99.805\text{ m}$.

---

## 7. Selected Operation & API Shape: `survey.leveling.reduce@2`

This contract definitively selects a **single unified operation: `survey.leveling.reduce@2`**.

### Architectural Rationale & Why Not `adjust@1`
1. **Domain Coherence:** In surveying engineering, booking observations, computing rises/falls, verifying arithmetic checks, evaluating misclosure against allowable limits, and distributing corrections are parts of a single unified level-book calculation.
2. **Rejection of Chained `adjust@1`:** Splitting reduction and adjustment into two separate operations would force client applications and AI agents to make duplicate round-trips over worker/REST/MCP boundaries, duplicate row and observation data structures, and manage fragile intermediate calculation state. A single operation provides atomic, deterministic execution.

### Backward Compatibility with `survey.leveling.reduce@1`
1. Per repository blueprint §3.1 and ADR-0001, **`survey.leveling.reduce@1` is preserved immutable and intact** alongside all 37 determinism fixtures.
2. Existing consumers, benchmark suites, and tests calling `survey.leveling.reduce@1` continue operating without breaking changes throughout the deprecation lifecycle.
3. `survey.leveling.reduce@2` is introduced as the superset contract incorporating distances, allowable error verification, and adjustment distribution.

### Specification of `survey.leveling.reduce@2`
- **Input Schema:**
  - `startRL`: string (optional decimal metres, e.g. `"100.000"`).
  - `closingRL`: string (optional decimal metres, e.g. `"99.805"`).
  - `observations`: array of station objects:
    - `station`: optional string (opaque label)
    - `remarks`: optional string
    - `bs`: optional string (metres)
    - `is`: optional string (metres)
    - `fs`: optional string (metres)
    - `dist`: optional string (incremental distance $d_i \ge 0$ in metres from preceding station; $d_0 = 0$).
- **Params Schema:**
  - `method`: `z.enum(['rise-fall', 'height-of-instrument']).default('rise-fall')`
  - `adjBy`: `z.enum(['none', 'distance', 'setup']).default('none')`
  - `kConstant`: `z.string().optional()` (strictly project-specified allowable error constant $C$ in $\text{mm}/\sqrt{\text{km}}$; no automatic engine default).
- **Output Schema:**
  - `rows`: array of result rows extending `@1` with:
    - `hi`: string | null (Height of Instrument collimation elevation in metres for setup rows; null for intermediate/closing rows and under Rise & Fall)
    - `dist`: string | null (incremental distance in metres)
    - `corr`: string | null (formatted correction in mm to 1 decimal place, e.g. `"+0.9"`)
    - `adjustedRL`: string | null (adjusted elevation in metres to 3 decimal places, e.g. `"100.301"`)
  - Top-level metrics extending `@1`:
    - `sumRise`: string | null (total of rises in metres; null under HI method)
    - `sumFall`: string | null (total of falls in metres; null under HI method)
    - `riseFallDelta`: string | null (difference sumRise - sumFall; null under HI method)
    - `totalDistanceKm`: string | null (total leveled distance $K$ in km to 3 decimal places)
    - `allowableError`: string | null (allowable limit in mm to 1 decimal place, e.g. `"9.6"`, or `null` if $C$ absent)
    - `closureStatus`: `z.enum(['pass', 'fail', 'criterion-not-provided', 'distance-not-provided']).nullable()`
    - `setupsCount`: number (total instrument setups count)

---

## 8. Missing Data & Validation Failure Order

1. `SURVEY_LEVELING_MISSING_START_RL`: Absent or whitespace-only start benchmark RL.
2. `SURVEY_LEVELING_START_DISTANCE_NONZERO`: Starting station distance $> 0$ (must be 0 or omitted).
3. `SURVEY_LEVELING_MISSING_DISTANCE`: An intermediate or closing row has an absent/empty distance while `adjBy: "distance"` is requested.
4. `SURVEY_LEVELING_NEGATIVE_DISTANCE`: Distance value $< 0$.
5. `SURVEY_LEVELING_ZERO_TOTAL_DISTANCE`: Sum of distances is zero when `adjBy: "distance"` is requested.
6. `SURVEY_LEVELING_INVALID_DECIMAL`: Non-numeric decimal input.
7. **Open Line Fallback:** If `closingRL` is omitted while `adjBy` is `"distance"` or `"setup"`, the engine falls back to `adjBy: "none"` without failing, leaving misclosure, allowable error, and corrections `null`, and `closureStatus: null`.
8. **Missing Allowable Error Criterion ($C$ absent):** Not an error. When `closingRL` is present but `kConstant` is omitted or empty, the engine succeeds, computes closing misclosure $e$, leaves `allowableError: null`, and sets `closureStatus: 'criterion-not-provided'`. If `adjBy` is requested, adjustment proceeds normally.
9. **Missing Distance with Criterion ($C$ present):** Not an error under `adjBy: "none"` or `adjBy: "setup"`. When `closingRL` and `kConstant` are present but station distances are partially or entirely absent, the engine succeeds, computes closing misclosure $e$ and setup adjustments, leaves `allowableError: null` and `totalDistanceKm: null`, and sets `closureStatus: 'distance-not-provided'`.

---

## 9. Explicit Boundaries & Schema Resolution for Height of Instrument (HI) Method

1. **Parameter Activation:** `survey.leveling.reduce@2` fully supports `method: 'height-of-instrument'` alongside `rise-fall`.
2. **Collimation Equations:**
   - At setup $j$ (station $k$ with Backsight $\text{BS}_k$): compute collimation elevation $\text{HI}_j = \text{RL}_k + \text{BS}_k$.
   - For stations $m$ observed from setup $j$: derive station elevation $\text{RL}_m = \text{HI}_j - (\text{IS}_m \text{ or } \text{FS}_m)$.
   - Change points (row $p$ with incoming $\text{FS}_p$ and outgoing $\text{BS}_p$):
     - Compute station RL from previous instrument height and incoming foresight: $\text{RL}_p = \text{HI}_{j} - \text{FS}_p$.
     - Establish new setup collimation height for subsequent observations: $\text{HI}_{j+1} = \text{RL}_p + \text{BS}_p$.
     - **Strict invariant:** Never compare $\text{FS}_p$ and $\text{BS}_p$ as consecutive staff readings.
3. **Truthful HI Representation & Checks (Schema Conflict Resolution):**
   - **No Fabricated Rise/Fall Values:** Standard HI does not compute rises or falls; intermediate sights are not verified by difference checks.
   - **Row Output (`rows`):**
     - `hi`: string (metres) on setup rows (station 0 and CP rows where BS is observed); `null` on intermediate and terminal FS-only rows. (For `rise-fall` method, `hi` is always `null`).
     - `rise`: `null` on all rows under HI method.
     - `fall`: `null` on all rows under HI method.
   - **Top-Level Metrics:**
     - `sumRise`: `null` under HI method.
     - `sumFall`: `null` under HI method.
     - `riseFallDelta`: `null` under HI method.
   - **Arithmetic Checks (`checks`):**
     - Emits exclusively the first/last check: `id: 'arithmetic-first-last'`, testing $\sum \text{BS} - \sum \text{FS} = \text{Ending RL} - \text{Starting RL}$.
     - Check `id: 'arithmetic-rise-fall'` is omitted entirely under HI method.
   - **Working Steps (`working`):**
     - Setup collimation: `ref: 'observations.k.hi'`, `formulaKey: 'leveling.working.hi.setup'`, `variables: { rl, bs }`, `result: hi`.
     - Station elevation: `ref: 'observations.m.rl'`, `formulaKey: 'leveling.working.hi.rl'`, `variables: { hi, reading }`, `result: rl`.
