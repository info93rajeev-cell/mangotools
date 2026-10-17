# survey.traverse.compute@1

Unadjusted closed-loop geometry only. Contract: [#158](https://github.com/info93rajeev-cell/mangotools/issues/158)
and [TASK-011B / #173](https://github.com/info93rajeev-cell/mangotools/issues/173).
The source gate was cleared by the founder for exactly the three raw cases in [SOURCES.md](SOURCES.md).

## Boundary and arithmetic

Strict input contains `start: {northingM, eastingM}` and ordered `legs` of
`{from, to, distanceM, azimuthDeg}`; strict params are empty. Numbers are finite primitive
binary64. Station IDs are nonblank, 1–60 characters, verbatim and case-sensitive.
Accept 3–50 legs, start components within ±1e9 m, positive distances ≤1e6 m, and azimuths
in [0,360), clockwise from north. There is no DMS/quadrant parser or automatic reconnection.

Positive latitude is north; positive departure is east. Each component is distance times
the public Numeric `cosDegrees` / `sinDegrees` result. Coordinates repeatedly add each
component to the previous coordinate. Independently accumulate components from zero,
and distances from zero, strictly left-to-right. No compensation, rounding or reordering.
Closure uses public `hypot2` on component sums, never subtraction of absolute coordinates.
Relative precision is linear misclosure / perimeter; ratio denominator is its inverse.
Exact computed zero gives relative precision 0, denominator null, `zero-misclosure` status.
Small nonzero closure is never clamped. Output negative zero is normalized to positive zero.

Output contains `type: closed-loop`, echoed/computed legs, n+1 coordinates (start then raw
endpoints), closure totals and bounded Core WorkingSteps. Numeric strings in working steps
record component, coordinate and closure stages; station IDs never become formula variables.
The final endpoint is not overwritten. No field-quality threshold applies to raw compute.

## Errors, order and privacy

Core validates strict input before strict params. Domain checks then stop at the first:

1. Count: TOO_FEW_LEGS, TOO_MANY_LEGS (`legs`).
2. Start northing then easting: COORDINATE_OUT_OF_RANGE (`start.<component>`).
3. Each leg in order, from/to/distance/azimuth: INVALID_STATION, NON_POSITIVE_DISTANCE,
   DISTANCE_OUT_OF_RANGE, AZIMUTH_OUT_OF_RANGE (`legs.i.<field>`).
4. Separate complete topology scans: SELF_LEG (`legs.i.to`), DISCONNECTED_SEQUENCE
   (`legs.i.from`), NOT_CLOSED (final `to`), REPEATED_STATION (first repeated `from`).
5. NUMERIC_RANGE (`legs.i` or first affected `closure.<field>`).

All domain codes carry `SURVEY_TRAVERSE_`; English catalogue and `errors.<code>` keys contain
no user values/details. Nonfinite arithmetic or ratios fail atomically, never partial success.
For example a valid subnormal east displacement can make perimeter / misclosure overflow;
that is NUMERIC_RANGE at `closure.closureRatioDenominator`, not a fabricated infinite ratio.

## Evidence and exclusions

Static professional fixtures assert all raw legs, coordinates and closure numbers, without
numeric tolerance. `reference.json` preserves the independent high-precision source/input
references separately from the pinned binary64 expected values. Hand-verified fixtures cover
cardinals, minimum count, quadrants and validation precedence. #171's 50-leg scale-disparity
case successfully computes; its adjustment residual remains a separate unresolved policy.
PR #175 provides the separate unpublished-operation harness. Its reviewed test-owned target
list selects all 38 Traverse fixtures through the actual public Survey package entry, comparing
full Results, recursive binary64 bits, canonical JSON and hashes without precision reduction.
The three professional cases also assert exact equality with PR #177's merged frozen
`binary64Reference` values. Published-operation suite passes alone do not establish Traverse
browser determinism; the dedicated unpublished-operation checks are required.

No adjustment/Bowditch/Transit, residual correction, area, plot, angle parsing, Leveling,
Numeric implementation change, UI, preset or tool publication is included.
