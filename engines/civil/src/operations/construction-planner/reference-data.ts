/**
 * Reference standards data and metadata for Construction Project Planner.
 * Every built-in constant records:
 * - standard and edition
 * - clause / table number
 * - page number (if verified against opened document)
 * - document source / URL or "not opened"
 *
 * UNVERIFIED rules are documented here and strictly configured as user inputs
 * with no pre-filled code values.
 */

export interface ReferenceCitation {
  readonly standard: string;
  readonly edition: string;
  readonly clauseOrTable: string;
  readonly page: number | 'not opened';
  readonly sourceUrlOrDocument: string;
  readonly status: 'VERIFIED' | 'UNVERIFIED' | 'REFERENCE_ONLY';
  readonly notes: string;
}

export const CITATION_STEEL_DENSITY: ReferenceCitation = {
  standard: 'IS 1786 / IS 875 (Part 1)',
  edition: 'IS 1786:2008 / IS 875 (Part 1):1987 (Reaffirmed 2018)',
  clauseOrTable: 'IS 1786:2008 Cl. 6.2; IS 875 (Part 1):1987 Table 1 Item 38',
  page: 2, // IS 1786 p. 2, IS 875 p. 14
  sourceUrlOrDocument: 'Bureau of Indian Standards official publication IS 1786:2008',
  status: 'VERIFIED',
  notes:
    'Density of reinforcement steel is specified as 7850 kg/m3 (0.00785 kg/mm2 per metre run).',
};

export const CITATION_REBAR_NOMINAL_WEIGHTS: ReferenceCitation = {
  standard: 'IS 1786',
  edition: '2008 (Fourth Revision)',
  clauseOrTable: 'Table 1: Nominal Cross-Sectional Area and Mass',
  page: 2,
  sourceUrlOrDocument: 'Bureau of Indian Standards official publication IS 1786:2008',
  status: 'VERIFIED',
  notes: 'Nominal mass per metre for sizes 4, 5, 6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40 mm.',
};

export const CITATION_STIRRUP_HOOK_EXTENSIONS: ReferenceCitation = {
  standard: 'IS 456',
  edition: '2000 (Fourth Revision, Reaffirmed 2021)',
  clauseOrTable: 'Clause 26.2.2.4(b)',
  page: 43,
  sourceUrlOrDocument: 'Bureau of Indian Standards official publication IS 456:2000',
  status: 'VERIFIED',
  notes:
    'For stirrups and ties, complete bend around a bar plus an extension of at least 8 bar diameters for 90° bend, 6 bar diameters for 135° bend, and 4 bar diameters for 180° bend. Condition 1 compliance: minimum 65 mm floor removed.',
};

export const CITATION_IS_2502_METHOD_A: ReferenceCitation = {
  standard: 'IS 2502',
  edition: '1963 (Reaffirmed 2004)',
  clauseOrTable: 'Clause 4.1, Table II, Table III, Table VIII, and Clause 5.1.1',
  page: 7, // Table II p. 7, Table III p. 8, Table VIII p. 13, Cl. 5.1.1 p. 6
  sourceUrlOrDocument: 'https://law.resource.org/pub/in/bis/S03/is.2502.1963.pdf',
  status: 'VERIFIED',
  notes:
    'Table II: H = 9d/11d/13d/17d and B = 5d/5.5d/6d/7d for k = 2/3/4/6, rounded to nearest 5 mm, min 75 mm. Table III: Ref E (U-bar) L = l + 2B, Ref D (L-bar) L = l + B. Table VIII: Ref A (closed tie) L = 2(A+E) + 24d with inside dimensions A and E. Cl. 5.1.1: specified cutting lengths rounded up to next whole 25 mm. Factor k is strictly an explicit user selection.',
};

export const CITATION_SITE_PRACTICE_METHOD_B: ReferenceCitation = {
  standard: 'None (Common Indian Site Practice)',
  edition: 'N/A',
  clauseOrTable: 'Common site practice deduction: 1d (45°), 2d (90°), 3d (135°), 4d (180°)',
  page: 'not opened',
  sourceUrlOrDocument: 'Site construction convention; not a published BIS code standard value',
  status: 'UNVERIFIED',
  notes:
    'Deducts bend elongation from out-to-out dimensions. Clearly labeled in BBS and UI as "Method: Site Practice Deductions (not a code standard)". Stirrup hook length is an explicit user input (no default).',
};

export const CITATION_SEISMIC_135_HOOK: ReferenceCitation = {
  standard: 'IS 13920',
  edition: '1993 vs 2016 discrepancy (6d min 65mm vs 10d min 75mm)',
  clauseOrTable: 'Clause 6.2.2 / Clause 8.1',
  page: 'not opened',
  sourceUrlOrDocument: 'Conflicting cross-edition texts not physically inspected',
  status: 'UNVERIFIED',
  notes:
    'Must be an explicit user input with NO pre-filled code value until confirmed against authentic BIS standard.',
};

export const CITATION_CONCRETE_COVER: ReferenceCitation = {
  standard: 'IS 456',
  edition: '2000 (Fourth Revision)',
  clauseOrTable: 'Table 16 (Nominal Cover to Meet Durability) and Clause 26.4.2',
  page: 47,
  sourceUrlOrDocument: 'Bureau of Indian Standards official publication IS 456:2000',
  status: 'REFERENCE_ONLY',
  notes:
    'Cover values (Mild 20mm, Moderate 30mm, Severe 45mm, Very Severe 50mm, Extreme 75mm, Footing min 50mm, Column min 40mm) are shown as reference advice only. Cover is an explicit user input.',
};

export const CITATION_LAP_LENGTH: ReferenceCitation = {
  standard: 'IS 456',
  edition: '2000 (Fourth Revision)',
  clauseOrTable: 'Clause 26.2.1',
  page: 42,
  sourceUrlOrDocument: 'Bureau of Indian Standards official publication IS 456:2000',
  status: 'UNVERIFIED',
  notes:
    'Development and lap length depends on bar diameter, bond stress, concrete grade, and bar surface type. Explicit user input with NO fixed assumption.',
};

/**
 * IS 456:2000 Table 16 nominal cover reference values (in mm) for display in reference UI.
 */
export const IS_456_COVER_REFERENCE_TABLE_16: Readonly<Record<string, number>> = {
  mild: 20,
  moderate: 30,
  severe: 45,
  verySevere: 50,
  extreme: 75,
};

/**
 * Stirrup hook extension factors per IS 456:2000 Cl. 26.2.2.4(b).
 * Returns multiplier of bar diameter d.
 */
export const IS_456_STIRRUP_HOOK_MULTIPLIERS = {
  deg90: 8,
  deg135: 6,
  deg180: 4,
} as const;

/**
 * Allowed internal bend factors k for IS 2502 Method A.
 * Factor k represents internal bend diameter in multiples of bar diameter (D = k * d).
 */
export const IS_2502_ALLOWED_K_FACTORS = [2, 3, 4, 6] as const;
export type IS2502KFactor = (typeof IS_2502_ALLOWED_K_FACTORS)[number];
