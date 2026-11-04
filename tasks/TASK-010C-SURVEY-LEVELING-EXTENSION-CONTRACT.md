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
     - §3.7.3 *Arithmetic Checks*: Establishes $\sum \text{BS} - \sum \text{FS} = \sum \text{Rise} - \sum \text{Fall} = \text{Last RL} - \text{First RL}$. Notes: "This check proves the arithmetic only; it does not check the accuracy of the staff readings themselves."
     - §3.9 *Permissible Error (Misclosure)*: General formula $E = \pm m \sqrt{K}\text{ mm}$ ($K$ in km) and setup-based $E = \pm m \sqrt{n}$. Establishes $m = 24\text{ mm}/\sqrt{\text{km}}$ as standard civil site practice.
     - §3.10 *Adjustment of Level Networks*: Proportional distribution by distance ($c_i = -e \times D_i / D_{\text{total}}$) and by instrument setups.
3. **Punmia, B. C., Jain, A. K. & Jain, A. K. (2005): *Surveying (Vol. 1)* (16th ed.). Laxmi Publications. ISBN: 81-7008-853-4.**
   - **Publisher Catalog:** [Laxmi Publications](https://www.laxmipublications.com/)
   - **Chapter 5 *Levelling*:**
     - §5.16 *Booking and Reducing Levels*: Non-comparison of FS and BS on the same row.
     - §5.19 *Arithmetical Checks*: Details the two independent equality checks.
     - §5.23 *Permissible Error in Levelling*: Categorizes closing tolerance $E = C\sqrt{D}\text{ m}$:
       - Rough leveling: $E = \pm 0.100\sqrt{D}\text{ m} = \pm 100\sqrt{K}\text{ mm}$
       - Ordinary leveling: $E = \pm 0.024\sqrt{D}\text{ m} = \pm 24\sqrt{K}\text{ mm}$
       - Accurate leveling: $E = \pm 0.012\sqrt{D}\text{ m} = \pm 12\sqrt{K}\text{ mm}$
       - Precise leveling: $E = \pm 0.006\sqrt{D}\text{ m} = \pm 6\sqrt{K}\text{ mm}$
     - §5.25 *Adjustment of Levelling Network*: Distance-proportional and setup-proportional formulas.
4. **NPTEL / IIT Roorkee (Prof. J. K. Ghosh): *Surveying*, Module 4 *Levelling*.**
   - **Permanent Archive:** [Module 4 Lesson 13](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/42.htm) and [Arithmetic Checks](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/46.htm).
   - Confirms standard BS/IS/FS booking table, change point handling, and arithmetic checks.
5. **NIMI / DGT Government of India (Oct 2022): *Surveyor — Trade Practical (NSQF Level 4)*.**
   - **Official Manual:** [Bharat Skills E-Book](https://bharatskills.gov.in/pdf/E_Books/CTS/62/English/TP/Surveyor%20-%201st%20Year%20-%20TP%20%28NSQF%202022%29.pdf) (Exercise 1.8.54).
   - Confirms eleven-station practical booking format and intermediate sight reduction.

*(Note: BS 5606:1990 was withdrawn by BSI in 2022 and is a building guide; its previous attribution for $C = 24\text{ mm}/\sqrt{\text{km}}$ is retracted in favor of the primary engineering textbooks above).*

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
   - Distance in kilometres: $K = D_{\text{total}} / 1000$.
2. **Allowable Error Formula:**
   $$E_{\text{allow}} = \pm C \sqrt{K} \text{ mm}$$
   - $C$ is an explicit input parameter in units of **$\text{mm}/\sqrt{\text{km}}$**.
   - Default is $C = 24\text{ mm}/\sqrt{\text{km}}$ for ordinary civil construction; options include $12$ (Third Order) and $6$ (Second Order). $C$ is **never treated as a universal immutable constant**.
3. **Deterministic Numerical Policy for $\sqrt{K}$ and Acceptance:**
   - **Engine Kernel:** $K$ and $\sqrt{K}$ are evaluated deterministically using IEEE 754 double precision (`binary64` via `Math.sqrt(K)`).
   - **Acceptance Criterion:** The closure decision compares the **unrounded absolute misclosure in millimetres** against the **unrounded calculated allowable threshold**:
     $$\text{pass} \iff |e| \times 1000 \le C \sqrt{K} + 10^{-9}\text{ mm}$$
     *(The $10^{-9}\text{ mm}$ epsilon prevents machine-precision edge rejections on exact boundaries).*
   - **Displayed Allowable Limit:** Rounded half-up to 1 decimal place in millimetres ($\pm X.X\text{ mm}$). Acceptance does **not** evaluate against the displayed 0.1 mm rounded number.

---

## 6. Correction Distribution & Adjusted RLs

The total error to compensate is $-e$. Three approved methods:

### Method A: Distance-Proportional Adjustment (`adjBy: "distance"`)
Applied when station distances $d_i$ are measured:
$$c_i = -e \times \frac{D_i}{D_{\text{total}}}$$
- Start ($i = 0$): $D_0 = 0 \implies c_0 = 0$.
- Terminal Station ($i = n$): $D_n = D_{\text{total}} \implies c_n = -e$.
- **Terminal Constraint:** $\text{Adjusted RL}_n \equiv \text{RL}_{\text{known}}$ strictly.

### Method B: Setup-Proportional Adjustment (`adjBy: "setup"`)
Standard when sight distances are uniform or distances are not chained:
- **Physical Rationale:** Systematic and accidental errors in leveling accumulate across instrument relocations (setups).
- Let $N_{\text{setups}}$ be total instrument setups ($N_{\text{setups}} = 1 + N_{\text{CP}}$).
- Intermediate Sights (IS) belong to the setup between preceding and succeeding change points. They share that setup's line of collimation and receive that setup's cumulative correction.
- Station $i$ observed during setup $s_i \in \{1, \dots, N_{\text{setups}}\}$ receives:
  $$c_i = -e \times \frac{s_i}{N_{\text{setups}}}$$
- At terminal station ($i=n$): $s_n = N_{\text{setups}} \implies c_n = -e$.

### Method C: No Adjustment (`adjBy: "none"`)
$c_i = 0$, $\text{Adjusted RL}_i = \text{RL}_i$.

### Worked Comparison: Distance vs. Setup Adjustment
Sample level run ($N_{\text{setups}} = 3$, $D_{\text{total}} = 160\text{ m}$, $RL_{\text{known}} = 99.805\text{ m}$, $e = -0.005\text{ m}$, total correction $-e = +5.0\text{ mm}$):

| Station | Type | Dist (m) | Cum (m) | Setup | Raw RL (m) | Dist Corr ($c_i$) | Dist Adj RL (m) | Setup Corr ($c_i$) | Setup Adj RL (m) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BM-1** | Start | 0 | 0 | 0 | 100.000 | 0.0 mm | **100.000** | 0.0 mm | **100.000** |
| **A** | IS | 30 | 30 | 1 | 100.300 | +0.9 mm | **100.301** | +1.7 mm | **100.302** |
| **CP1** | CP | 30 | 60 | 1 | 99.500 | +1.9 mm | **99.502** | +1.7 mm | **99.502** |
| **B** | IS | 25 | 85 | 2 | 99.200 | +2.7 mm | **99.203** | +3.3 mm | **99.203** |
| **CP2** | CP | 35 | 120 | 2 | 99.700 | +3.8 mm | **99.704** | +3.3 mm | **99.703** |
| **BM-2** | Close | 40 | 160 | 3 | 99.800 | +5.0 mm | **99.805** | +5.0 mm | **99.805** |

### Relationship Between Reported Corrections & Rounded Adjusted RLs
1. Theoretical correction $c_i$ is computed as an exact rational.
2. In the level-book table, the **reported correction** is displayed in millimetres rounded half-up to 1 decimal place ($0.1\text{ mm}$).
3. The **Adjusted RL** is computed by adding unrounded $c_i$ (in metres) to unrounded $\text{RL}_i$, then rounding half-up to 3 decimal places (1 mm):
   $$\text{Adjusted RL}_i = \text{round}_3(\text{RL}_i + c_i)$$
   This prevents rounding errors from compounding.
4. **Terminal Invariant:** To prevent rounding drift on the closing benchmark, $\text{Adjusted RL}_n \equiv \text{RL}_{\text{known}}$ strictly.

---

## 7. Missing Data & Validation Failure Order

1. `SURVEY_LEVELING_MISSING_START_RL`: Absent or whitespace-only start benchmark RL.
2. `SURVEY_LEVELING_MISSING_DISTANCE`: An intermediate or closing row has an absent/empty distance while `adjBy: "distance"` is requested.
3. `SURVEY_LEVELING_NEGATIVE_DISTANCE`: Distance value $< 0$.
4. `SURVEY_LEVELING_ZERO_TOTAL_DISTANCE`: Sum of distances is zero when `adjBy: "distance"` is requested.
5. `SURVEY_LEVELING_INVALID_DECIMAL`: Non-numeric decimal input.
6. **Open Line Fallback:** If `closingRL` is omitted while `adjBy` is `"distance"` or `"setup"`, the engine falls back to `adjBy: "none"` without failing, leaving misclosure and corrections `null`.

---

## 8. Boundaries for Height of Instrument (HI) Method

1. **Shared Invariants:** HI uses identical observation inputs (BS, IS, FS, CP), distances, and closing benchmarks.
2. **Collimation Equations:**
   - At setup $j$ (row $k$ with BS): $\text{HI}_j = \text{RL}_k + \text{BS}_k$.
   - For stations $m$ observed from setup $j$: $\text{RL}_m = \text{HI}_j - (\text{IS}_m \text{ or } \text{FS}_m)$.
3. **Checks Distinction:**
   - Primary HI check: $\sum \text{BS} - \sum \text{FS} = \text{Ending RL} - \text{Starting RL}$.
   - Standard HI does not compute rises or falls, so intermediate sights are not verified by the two primary deltas.
   - HI is isolated in its own approved operation/parameter extension (`survey.leveling.hi@1` or `method: "height-of-instrument"`).

---

## 9. Open Review Decisions

1. **Operation Versioning:**
   - *Option A (Recommended):* Single operation `survey.leveling.reduce@2` accepting `params: { method: 'rise-fall' | 'height-of-instrument', adjBy: 'distance' | 'setup' | 'none', kConstant: string }`.
   - *Option B:* Separate chained operation `survey.leveling.adjust@1`.
2. **Display of Zero Corrections:**
   - Start benchmark displays `0.0 mm` correction, or `—`. Recommended: `0.0` matching visual mockups.
