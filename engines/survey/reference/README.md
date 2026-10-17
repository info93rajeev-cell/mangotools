# Frozen Traverse professional reference evidence

TASK-011B reference-only prerequisite [#176](https://github.com/info93rajeev-cell/mangotools/issues/176).
Approved source dossier: [#173 comment 6239556277](https://github.com/info93rajeev-cell/mangotools/issues/173#issuecomment-6239556277);
founder clearance: [comment 6239765768](https://github.com/info93rajeev-cell/mangotools/issues/173#issuecomment-6239765768).
The separate browser prerequisite is [PR #175](https://github.com/info93rajeev-cell/mangotools/pull/175).
No production operation, API, package version, fixture, target, runtime or dependency is changed.

## Frozen source contract

`cases.json` contains exactly three approved professional datasets. Top-level `start` and `legs`
are observations (leg tuples: from, to, exact distance text, [degrees, minutes, seconds]);
`document` records institutional URLs, printed/PDF locators, published precision and source hashes.
All distances are explicitly metres; no foot assumption or source correction is introduced.
Printed resolution is not an instrument-accuracy claim. No publication date is invented.

- `ssgec-lab-p18`: four published whole-metre/whole-degree legs. The local zero origin is
  derived, not source-published. Its large raw misclosure is deliberately retained.
- `gate-ge2025-q52`: five published metric legs; minute WCB notation remains in the DMS tuples.
  The zero origin is derived, not published. The source's question answers are not closure data.
- `unsw-loop-example2-raw-bearings`: ONLY the raw/pre-angular-balance stage. Published start
  N=3000 m/E=1000 m; AB104°55′20″, BC5°31′43″, CD284°36′45″, DA209°59′28″.
  Later angular-balanced/Bowditch columns are excluded. NPTEL remains rejected; Memphis excluded.

`frozen` is **independently derived evidence**, not a claim that the source printed these answers:

1. DMS is interpreted as an exact rational, then converted once to nearest binary64. Source
   decimal distances remain strings before the same exact-rational conversion. `inputBits`
   records big-endian binary64 start components and each distance/azimuth pair.
2. `mathematicalReference` uses MPFR's own trig/sqrt on source observations at 512 bits.
   Recalculation at 1024 bits must produce identical nearest-binary64 components, coordinates
   and closure values. These strings retain high precision; they are not fixture tolerances.
3. `binary64Reference` separately models the approved fixed-order Numeric algorithm and ordered
   binary64 multiplications/additions/norm/ratios. It reuses the existing **offline**
   `engines/numeric/reference/generate-geometry.py` MPFR model, not any production package.
   Each basic model operation is MPFR-evaluated at 2048 bits then rounded to binary64.
   Full raw endpoint/closure results are retained, with no Bowditch or forced closure.

MPFR 4.2.2, gmpy2 2.3.2, nearest/ties-to-even assumptions and the imported model's SHA256 are
frozen per case. Code hashes normalize CRLF to LF for cross-platform regeneration; source PDF
hashes are raw bytes. The three locally inspected PDFs were re-hashed against the approved
dossier. Mathematical references agree with that dossier at nearest-binary64 precision;
pinned results agree exactly with the three already prepared professional fixture expectations.

## Reproduce without project dependencies or writes

Use external Python with gmpy2 2.3.2 / MPFR 4.2.2 available; these are NOT runtime dependencies.
From the repository root, run `python engines/survey/reference/generate-traverse.py --check`.
Omit `--check` to print regenerated references as JSON. Both modes write nothing; paths are
resolved relative to the script, so running from another directory also works.
The check compares complete frozen records exactly, including precision strings, input bits,
model results and provenance. No tolerance is used. Do not update frozen evidence to accommodate
a production mismatch; investigate and return to the founder/source gate.

This split freezes only the three professional cases, not the four additional hand/regression
cases in the preserved TASK-011B draft. After this PR merges, that draft must retain these
merged reference files rather than overwrite them; its production/tests remain a separate PR.
Do not resume TASK-011B before founder approval and merge. No Bowditch is implemented here.
