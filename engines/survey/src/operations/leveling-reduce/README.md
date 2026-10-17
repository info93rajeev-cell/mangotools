# survey.leveling.reduce@1

Rise & Fall reduction of 2–50 ordered observations, in metres. `startRL` is required for success;
`closingRL` is optional. Params accept only `method: rise-fall` (the default). Strict schemas reject
unknown keys; `executeOperation` validates structure, then params, then the TASK-010A domain stages.
The bounded `SURVEY_LEVELING_` catalogue never includes field-book values in error details.

## Exact arithmetic and change points

Inputs accept ordinary decimal strings with at most six fractional digits, including typed trailing
zeros. Signed RLs are allowed, staff readings must be non-negative, and zero is not blank. This is
an input precision limit, **not a field measurement-accuracy claim**. No rounding/tolerance or display
precision parameter is used. Public Numeric addition/subtraction/comparison preserve exact values;
outputs normalize trailing zeros and negative zero. Later UI display rounding is a separate concern.

The first row contains BS only; interior rows contain IS or a change point's FS+BS; the last row
contains FS only. Duplicate labels do not link observations. At each later point, previous usable
reading minus incoming IS/FS gives rise (positive) or fall magnitude (negative). Add rise and subtract
fall from the preceding RL. A CP's incoming FS gives its RL, then outgoing BS starts the next setup.
**Never calculate a rise/fall between FS and BS on the same change point.** Consecutive CPs are valid.

Exact checks compare sumBS − sumFS with sumRise − sumFall and with endingRL − startingRL. A pass
proves arithmetic consistency, not field correctness or survey compliance. Working contains only
the previous RL/reading, incoming reading, rise, fall and result, never station labels or remarks.
Rows echo supplied labels/remarks unchanged; absent readings and first-row rise/fall are null.

Signed misclosure is computed closing RL minus known closing RL. Positive means the computed
closing RL is higher. This sign convention is not claimed universal. Without a known closing RL,
closingRL and misclosure are null. There is no allowable-error threshold, certification, automatic
adjustment or distribution. Height of instrument and Bowditch are explicitly not implemented.

## Approved professional sources and golden fixtures

The founder-approved dossier supplies these readings and expected RLs; no new research was done.
Source numerical values are preserved; output strings use canonical normalization, not print precision.

1. FAO / A. G. Coche, *Simple Methods for Aquaculture — Topography*, §§8.0–8.1,
   specifically §8.1(5–8): [official chapter](https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6707e/x6707e08.htm).
   Fixture `001-fao-change-point`: RLs 100, 101.17, 102.26; all deltas 2.26.
   FAO publishes readings/RLs; this fixture's rises/falls are derived using the approved contract.
2. NIMI / Directorate General of Training, Government of India, *Surveyor, 1st Year — Trade
   Practical*, NSQF Level 4, first edition October 2022, Exercise 1.8.54, printed p.168 (context p.167):
   [official manual](https://bharatskills.gov.in/pdf/E_Books/CTS/62/English/TP/Surveyor%20-%201st%20Year%20-%20TP%20%28NSQF%202022%29.pdf).
   Fixture `002-nimi-intermediate-sights`: eleven A–K observations, ending RL 98.26;
   sumBS 5.41, sumFS 7.15, sumRise 3.155, sumFall 4.895, all deltas −1.74.
3. Prof. J. K. Ghosh, IIT Roorkee / NPTEL, *Surveying*, Module 4, Lesson 13,
   [Table 13.1](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/42.htm)
   and [arithmetic-check section](https://archive.nptel.ac.in/content/storage2/courses/105107122/modules/module4/html/46.htm).
   Fixture `003-nptel-consecutive-change-points`: RLs 100, 101.13, 98.245, 97.65;
   sumBS 4.795, sumFS 7.145, sumRise 1.13, sumFall 3.48, all deltas −2.35.

Other fixtures hand-check contract errors and their precedence. Colocated tests cover signed
misclosure, precision, privacy, non-mutation and byte-identical repeated Node output. Browser hash
parity is a separate future validation, not established by those Node tests. No observation is adjusted.
