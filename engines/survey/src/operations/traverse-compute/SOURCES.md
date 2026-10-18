# Approved raw observation sources and independent expectations

Founder clearance: Issue #173; dossier
[comment 6239556277](https://github.com/info93rajeev-cell/mangotools/issues/173#issuecomment-6239556277),
clearance recorded in [comment 6239765768](https://github.com/info93rajeev-cell/mangotools/issues/173#issuecomment-6239765768).
Professional sources supply observations, not the independently derived results below.
No source tolerance is used to relax exact deterministic fixture comparisons.

## 001 — ssgec-lab-p18

- Institution: Shantilal Shah Engineering College, Civil Engineering Department, Bhavnagar.
- Document: Surveying laboratory manual, B.E.–II (3rd semester), Traverse Survey calculation
  exercise, printed p.18 / PDF p.21 of 36. Edition/publication date is not stated.
- [Institutional PDF](https://ssgec.ac.in/admin/upload_nb/5bade8a23963b0.64745605.pdf).
- SHA-256: `645b23aed41155d4f2ee62e868adaef9ec1c3489b6fd2e0a60f7d23f22d51187`.
- Source explicitly uses metres and whole-degree WCB. Printed resolution is 1 m / 1°;
  this is not an instrument-accuracy claim. No published start or raw component answers.
- Start N=0,E=0 is our derived local origin, not a published benchmark.

| Leg | Published distance (m) | Published WCB | Engine azimuth (°) |
|---|---:|---:|---:|
| A–B | 110 | 110° | 110 |
| B–C | 80 | 170° | 170 |
| C–D | 95 | 250° | 250 |
| D–A | 160 | 350° | 350 |

Independent exact-source MPFR closure: fN≈8.670490859214554 m, fE≈0.203535098434198 m,
e≈8.672879468551247 m; P=445 m. Large misclosure is deliberately preserved, not rejected.
Pinned binary64 fixture e=8.672879468551232 m.

## 002 — gate-ge2025-q52

- Authoring body: GATE 2025, organizing institute IIT Roorkee; official IIT Guwahati archive.
- Geomatics Engineering (GE), Part B Surveying & Mapping, Q52, printed/PDF p.32 of 49.
  Year 2025 is printed; no invented publication day or archive-based edition.
- [Official paper](https://gate2026.iitg.ac.in/doc/download/2025/GE2025.pdf).
- SHA-256: `0ac730940196dba95b83706ef5114370a06b6ac3a2fae943c36aabd25dbb2c96`.
- Table is an inspected image, explicitly Length(m) and WCB. Resolution 0.01 m / 1 arcminute.
  It supplies observations, not published raw components/closure. Question distractors are not
  raw closure references. Start N=0,E=0 is a derived local origin.

| Leg | Published distance (m) | Published WCB | Engine azimuth (°) |
|---|---:|---:|---:|
| P–Q | 201.54 | 62°42′ | 62.7 |
| Q–R | 189.68 | 154°54′ | 154.9 |
| R–S | 231.94 | 202°32′ | 202.53333333333333 |
| S–T | 272.55 | 281°44′ | 281.73333333333335 |
| T–P | 256.83 | 22°00′ | 22 |

Independent exact-source MPFR: fN≈−0.011436834752220222 m, fE≈0.02505167398515665 m,
e≈0.027538837277709577 m; P=1152.54 m. Maximum component difference due solely to
nearest-binary64 input conversion is 7.29114e-14 m. Pinned fixture e=0.027538837277669457 m.

## 003 — unsw-loop-example2-raw-bearings

- Institution: UNSW Surveying & Geospatial Engineering, Civil & Environmental Engineering.
- Bruce R. Harvey (editor/part author), Survey Computations, version 20 July 2023 as printed.
- Chapter 4 Example 2: PDF p.141 / printed 4-14 distances and start; PDF p.143 / 4-16 raw
  sheet; PDF p.144 / 4-17 original Bearing DMS column BEFORE angular balancing.
- [Institutional textbook](https://www.unsw.edu.au/content/dam/pdfs/engineering/civil-environmental/sage/teaching-and-learning/textbook-and-theses/BRH_Survey_Comps_Textbook.pdf).
- SHA-256: `678fa404f7ca5a660235d945d09f53fa02f86d3cc3072f95fd199efb426bf58a`.
- Published start: E=1000 m, N=3000 m. Distances 0.001 m / bearings 1 arcsecond / start
  0.01 m printed resolution. The adopted baseline DA=210° is NOT substituted for the
  computed raw closing bearing 209°59′28″ (32″ angular misclose).

| Leg | Published distance (m) | Original raw WCB | Engine azimuth (°) |
|---|---:|---:|---:|
| A–B | 95.027 | 104°55′20″ | 104.92222222222222 |
| B–C | 32.785 | 5°31′43″ | 5.528611111111111 |
| C–D | 81.071 | 284°36′45″ | 284.6125 |
| D–A | 33.044 | 209°59′28″ | 209.9911111111111 |

Do NOT adopt the later corrected 104°55′28″ / 5°31′59″ / 284°37′09″ / 210° bearings or
PDF p.145 / 4-18 adjusted components. No component/closure answers are published for our
approved raw stage. Independent exact-source MPFR: fN≈−0.004558043800483764 m,
fE≈0.01468439133823611 m, e≈0.01537553616176009 m, P=241.927 m.
Maximum input-conversion component difference is 1.504961e-14 m.
Pinned fixture e=0.015375536161765383 m; ordered binary64 P=241.92699999999996 m.

## Conversion, oracle and binary64 layers

All three sources explicitly use metres; no foot definition is inferred. DMS conversion is
the exact rational d+m/60+s/3600, rounded ONCE to nearest binary64 for engine input. Distances
are likewise nearest binary64 of their exact source decimal. No source observation is corrected.
All station sequences are connected closed loops with distinct interior station IDs.

`reference.json` is static MPFR 4.2.2 / gmpy2 2.3.2 evidence from the approved dossier:
512-bit mathematical references cross-checked at 1024 bits for matching nearest-binary64
component/coordinate/closure values. It retains original rational/source values, converted
input bits and independent exact-binary64-input mathematical component references.
Its original SHA-256 is `658caff2504943d17df44d736bb9310bc7cfcdd83f34d382d9867a140b854c5c`.
Original cases JSON: `075569a50495d8903b57ff9fb1293d87b9f937c1ff18d6a9914dd09c0aeab3d6`;
source verifier: `dbc7adeb5853705a025ec21c55a9efd500f1f38316224c5fb78e70982dd9ca3d`.
Those original-artifact hashes identify the dossier, not a claim about repository reformatting.

Exact fixture expectations additionally account for the approved Numeric algorithm, which is
not universally correctly rounded real trig. The independent offline model reuses
`engines/numeric/reference/generate-geometry.py`'s MPFR `pinned_bits` and `step`: each specified
basic operation is evaluated from exact binary64 operands by MPFR then rounded to binary64.
It imports NO production TypeScript. Model each latitude/departure multiplication, coordinate
addition, independent from-zero component/perimeter sum, pinned hypot and ratios in contract
order. Fixtures freeze those resulting binary64 values, not rounded dossier summaries or
values captured solely from the Survey implementation. No numeric tolerance is necessary.
The reproducible offline model is `engines/survey/reference/generate-traverse.py`, with its
source observations in `cases.json`. With external gmpy2 available, run that script from any
directory; `--check` reproduces the three frozen professional references exactly (excluding
WorkingSteps). Its JSON stdout separates MPFR mathematical and fixed-order binary64 layers.
The four additional hand/regression cases are not extra professional source datasets.
The reference files are already merged through PR #177 and are not changed by this operation.
The generator writes nothing and adds no project/runtime dependency.

## Rejected / separate evidence

NPTEL Example 29-6 / Table 29.5 remains rejected: BC's published distance/bearing and components
contradict each other. Never substitute a guessed 94°03′ for 94°42′ or mix columns.
Memphis Group Example 1 remains rejected as a metre golden fixture. Neither is used here.
#171's 50-leg case is an ADDITIONAL numerical-policy regression, not a fourth professional
source. It must compute raw geometry successfully; Bowditch's residual question is separate.
