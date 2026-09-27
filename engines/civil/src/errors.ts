/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  CIVIL_MISSING_INPUT: 'Enter a value here.',
  CIVIL_INVALID_NUMBER: 'Enter a number such as 4 or 4.5.',
  CIVIL_TOO_MANY_DECIMALS: 'Use at most {max} decimal places.',
  CIVIL_NOT_POSITIVE: 'This must be greater than zero.',
  CIVIL_QUANTITY_NOT_POSITIVE: 'Enter at least 1 member.',
  CIVIL_QUANTITY_NOT_WHOLE: 'The number of members must be a whole number.',
  CIVIL_QUANTITY_TOO_LARGE: 'Enter at most {max} members.',
  CIVIL_WASTAGE_OUT_OF_RANGE: 'Enter a wastage percentage between 0 and 50.',
  CIVIL_DIMENSION_UNREALISTIC:
    'A dimension is larger than {max} m. Check the unit you selected — this may be a units mistake.',
  CIVIL_ESTIMATION_AID_ONLY: 'This is an estimation aid only.',
  CIVIL_VERIFY_BEFORE_CONSTRUCTION: 'Verify quantities before purchase or construction.',
  CIVIL_LOCAL_PRACTICE_VARIES:
    'Local measurement rules, site conditions, mix design, wastage, and construction practice may vary.',
  CIVIL_NOT_PROFESSIONAL_REPLACEMENT:
    'This tool does not replace a licensed engineer, architect, or professional quantity surveyor.',
  CIVIL_VOLUME_ONLY:
    'This tool calculates concrete volume only; it does not calculate reinforcement, mix design, material split, or cost.',
  CIVIL_BULKING_OUT_OF_RANGE: 'Enter a bulking/swell percentage between 0 and 50.',
  CIVIL_VERIFY_BEFORE_EXCAVATION:
    'Verify quantities before excavation, purchase, billing, or construction.',
  CIVIL_EXCAVATION_CONDITIONS_VARY:
    'Actual excavation may vary due to soil type, side slopes, shoring, over-excavation, compaction, site conditions, and measurement rules.',
  CIVIL_BULKING_VARIES: 'Bulking/swell varies by soil type and moisture content.',
  CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR:
    'This tool does not replace a licensed engineer, architect, contractor, or professional quantity surveyor.',
  CIVIL_EXCAVATION_SCOPE_LIMIT:
    'This tool does not calculate slope excavation, stepped excavation, dewatering, shoring, disposal cost, truck trips, or backfill compaction.',
  CIVIL_NOT_NEGATIVE: 'This cannot be negative.',
  CIVIL_OPENING_EXCEEDS_WALL_AREA: 'The opening area cannot be larger than the wall area.',
  CIVIL_VERIFY_BRICKWORK_BEFORE_CONSTRUCTION:
    'Verify brick sizes, wall thickness, openings, mortar joints, and wastage before purchase or construction.',
  CIVIL_BRICKWORK_CONDITIONS_VARY:
    'Brick sizes, mortar thickness, wall bonds, site cutting, breakage, and measurement rules may vary.',
  CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON:
    'This tool does not replace a licensed engineer, architect, contractor, mason, or professional quantity surveyor.',
  CIVIL_BRICKWORK_SCOPE_LIMIT:
    'This tool does not calculate structural design, reinforcement, labour cost, cement/sand mortar breakup, BOQ, or final billing.',
};
