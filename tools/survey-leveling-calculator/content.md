---
lastReviewed: 2026-11-08
example: 001-six-station-level-run
---

## How to use

1. In Level Book & Benchmarks, enter your Starting Benchmark RL in metres (e.g. 100.000). If you are running a closed loop or closing on a known benchmark, enter the Known Closing BM RL; for an open traverse run, leave it blank.
2. Select your reduction method using the method tabs: **Rise & Fall** or **Height of Instrument** (Collimation method).
3. Optionally enter an Allowable Error Constant $C$ in $\text{mm}/\sqrt{\text{km}}$ (such as 12, 24, or 100) and choose an Adjustment Method: **Don't adjust** (raw reduction), **Distance-proportional**, or **Setup-proportional**.
4. In Field Readings, enter your observed staff readings: Backsight (BS), Intermediate Sight (IS), Foresight (FS), incremental station Distance in metres, and Station names/Remarks.
   - For an instrument change point (CP), record both the incoming Foresight and outgoing Backsight on the same row.
   - To import multiple readings quickly, click **Paste from Excel** to paste tabular data copied from Excel, Google Sheets, or a CSV file with live sequence validation.
5. Review the Results Summary, elevation profile chart, arithmetic checks table, and reduced levels table. Click **Calculate levels** whenever inputs change.
6. Use **Copy level book** to copy the formatted reduction to your clipboard, or **Print / Save PDF** for field records and submittals.

## Method

Differential leveling determines the relative elevation of points above a vertical datum through horizontal lines of sight on a graduated leveling staff.

### Rise & Fall Method

The Rise & Fall method calculates the difference in elevation between consecutive staff stations:
- Difference: $\Delta h = \text{Reading}_i - \text{Reading}_{i+1}$
- If $\Delta h > 0$, the ground rises: $\text{Rise} = \Delta h$ and $\text{RL}_{i+1} = \text{RL}_i + \text{Rise}$.
- If $\Delta h < 0$, the ground falls: $\text{Fall} = |\Delta h|$ and $\text{RL}_{i+1} = \text{RL}_i - \text{Fall}$.
- Arithmetic checks (three agreeing deltas):
  $$\sum \text{BS} - \sum \text{FS} = \sum \text{Rise} - \sum \text{Fall} = \text{Last RL} - \text{First RL}$$
Every intermediate observation enters into the rise/fall calculation, providing an arithmetic check on every intermediate level.

### Height of Instrument (Collimation) Method

The Height of Instrument (HI) method calculates the elevation of the line of sight for each instrument setup:
- For setup 1 on benchmark: $\text{HI} = \text{RL}_{\text{start}} + \text{BS}_1$.
- For intermediate sights (IS) and fore sights (FS): $\text{RL} = \text{HI} - \text{Staff Reading}$.
- At an intermediate change point (CP):
  $$\text{RL}_{\text{CP}} = \text{HI}_{\text{current}} - \text{FS}_{\text{incoming}}$$
  $$\text{HI}_{\text{next}} = \text{RL}_{\text{CP}} + \text{BS}_{\text{outgoing}}$$
- Arithmetic check:
  $$\sum \text{BS} - \sum \text{FS} = \text{Last RL} - \text{First RL}$$
The HI method minimizes arithmetic steps when multiple intermediate sights are taken from a single instrument position, such as in longitudinal sectioning and cross-sectional surveys.

### Misclosure, Tolerance & Adjustment

When closing on a known benchmark or returning to the starting benchmark:
- Misclosure: $e = \text{Observed Closing RL} - \text{Known Closing RL}$.
- Allowable Error: $E_{\text{allowable}} = C \times \sqrt{K} \text{ mm}$, where $K$ is total line distance in kilometres and $C$ is the project specification constant in $\text{mm}/\sqrt{\text{km}}$.
- Distance-proportional adjustment distributes $-e$ cumulatively by measured distance:
  $$c_i = -e \times \frac{D_i}{D_{\text{total}}}$$
- Setup-proportional adjustment distributes $-e$ equally across instrument setups:
  $$c_i = -e \times \frac{S_i}{S_{\text{total}}}$$

### Preview-Only Controls

The Reading Unit control is fixed to metres ($\text{m}$), which is the international standard for surveying level reductions. The millimetre ($\text{mm}$) reading unit option is identified as preview-only and will be enabled in a future release.

## Worked example

A six-station level run starts on BM-1 ($\text{RL} = 100.000\text{ m}$) and closes on known BM-2 ($\text{RL} = 99.805\text{ m}$) over a total distance of 160 m ($K = 0.160\text{ km}$) with specification constant $C = 24\text{ mm}/\sqrt{\text{km}}$:
- **BM-1** (0 m): $\text{BS} = 1.500\text{ m} \rightarrow \text{RL} = 100.000\text{ m}$ (HI = 101.500 m)
- **A** (30 m): $\text{IS} = 1.200\text{ m} \rightarrow \text{Rise} = 0.300\text{ m} \rightarrow \text{Raw RL} = 100.300\text{ m}$ (Corr $+0.9\text{ mm} \rightarrow 100.301\text{ m}$)
- **CP1** (30 m): $\text{FS} = 2.000\text{ m}, \text{BS} = 0.800\text{ m} \rightarrow \text{Fall} = 0.800\text{ m} \rightarrow \text{Raw RL} = 99.500\text{ m}$ (Corr $+1.9\text{ mm} \rightarrow 99.502\text{ m}$)
- **B** (25 m): $\text{IS} = 1.100\text{ m} \rightarrow \text{Fall} = 0.300\text{ m} \rightarrow \text{Raw RL} = 99.200\text{ m}$ (Corr $+2.7\text{ mm} \rightarrow 99.203\text{ m}$)
- **CP2** (35 m): $\text{FS} = 0.600\text{ m}, \text{BS} = 2.300\text{ m} \rightarrow \text{Rise} = 0.500\text{ m} \rightarrow \text{Raw RL} = 99.700\text{ m}$ (Corr $+3.8\text{ mm} \rightarrow 99.704\text{ m}$)
- **BM-2** (40 m): $\text{FS} = 2.200\text{ m} \rightarrow \text{Rise} = 0.100\text{ m} \rightarrow \text{Raw RL} = 99.800\text{ m}$ (Corr $+5.0\text{ mm} \rightarrow 99.805\text{ m}$)

Arithmetic check: $\sum \text{BS} - \sum \text{FS} = 4.600 - 4.800 = -0.200\text{ m}$, $\sum \text{Rise} - \sum \text{Fall} = 0.900 - 1.100 = -0.200\text{ m}$, and $\text{Ending RL} - \text{Starting RL} = 99.800 - 100.000 = -0.200\text{ m}$. All three checks pass identically.
Misclosure is $99.800 - 99.805 = -0.005\text{ m} = -5.0\text{ mm}$, well within the allowable limit of $24 \times \sqrt{0.160} = 9.6\text{ mm}$.

## FAQ

### What is the difference between Rise & Fall and Height of Instrument?

Both methods yield mathematically identical reduced levels. The Rise & Fall method provides an independent arithmetic check on every intermediate sight ($\sum \text{Rise} - \sum \text{Fall}$), making it ideal for high-precision engineering benchmarks. The Height of Instrument (Collimation) method requires fewer arithmetic steps per station, making it standard for longitudinal site profiles and cross-sections.

### How do I record a change point (CP)?

At an instrument change point, the leveling staff remains stationary on the change point while the leveling instrument is moved to a new station. Enter both the Foresight (FS) from the old instrument position and the Backsight (BS) from the new instrument position in the same table row.

### Can I paste readings directly from Excel or Google Sheets?

Yes. Click **Paste from Excel** to open the paste dialog. Paste copied rows formatted with tab or comma delimiters. The parser automatically detects headers or maps columns positionally (Station, BS, IS, FS, Distance, Remarks) and verifies sequence integrity before allowing import.

### How does the calculator adjust closing errors?

When closing on a known benchmark, you can choose Distance-proportional adjustment (which distributes error according to the measured distance of each leg) or Setup-proportional adjustment (which distributes error equally per instrument setup). In both cases, the final adjusted RL reconciles exactly to the known benchmark elevation.

### Are my field observations uploaded to any remote server?

No. 100% of the leveling reduction, arithmetic checks, and line adjustments run locally in your browser. No project data or coordinates are transmitted over the network.

## References

- Bannister, A., Raymond, S., & Baker, R. (1998). *Surveying* (7th ed.). Pearson Education / Prentice Hall.
- Schofield, W., & Breach, M. (2007). *Engineering Surveying* (6th ed.). Butterworth-Heinemann.
- Anderson, J. M., & Mikhail, E. M. (1998). *Surveying: Theory and Practice* (7th ed.). McGraw-Hill.
- U.S. Federal Geodetic Control Subcommittee (FGCS). *Standards and Specifications for Geodetic Control Networks*. Vertical control accuracy classifications.
