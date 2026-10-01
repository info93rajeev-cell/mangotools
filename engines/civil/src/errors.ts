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
  CIVIL_OPENING_EXCEEDS_SURFACE_AREA: 'The opening area cannot be larger than the surface area.',
  CIVIL_VERIFY_PLASTER_BEFORE_CONSTRUCTION:
    'Verify plaster thickness, surface dimensions, openings, and wastage before purchase, billing, or construction.',
  CIVIL_PLASTER_CONDITIONS_VARY:
    'Actual plaster quantity may vary due to wall unevenness, surface preparation, thickness variation, site cutting, waste, and measurement rules.',
  CIVIL_PLASTER_SCOPE_LIMIT:
    'This tool does not calculate cement/sand material breakup, labour cost, scaffolding, curing, BOQ, or final billing.',
  CIVIL_TILES_PER_BOX_NOT_POSITIVE: 'Enter at least 1 tile per box, or leave it blank.',
  CIVIL_TILES_PER_BOX_NOT_WHOLE: 'The number of tiles per box must be a whole number.',
  CIVIL_TILES_PER_BOX_TOO_LARGE: 'Enter at most {max} tiles per box.',
  CIVIL_VERIFY_TILE_BEFORE_INSTALLATION:
    'Verify tile sizes, room dimensions, and wastage before purchase or installation.',
  CIVIL_TILE_CONDITIONS_VARY:
    'Actual tile quantity may vary due to cutting at edges and corners, breakage, pattern layout, grout width, and measurement rules.',
  CIVIL_TILE_SCOPE_LIMIT:
    'This tool does not calculate grout or adhesive quantity, material or labour cost, diagonal or pattern layouts, or a bill of quantities (BOQ).',
  CIVIL_COATS_NOT_POSITIVE: 'Enter at least 1 coat.',
  CIVIL_COATS_NOT_WHOLE: 'The number of coats must be a whole number.',
  CIVIL_COATS_TOO_LARGE: 'Enter at most {max} coats.',
  CIVIL_VERIFY_PAINT_BEFORE_APPLICATION:
    'Verify surface area, coats, coverage, and wastage before purchase or application.',
  CIVIL_PAINT_CONDITIONS_VARY:
    'Actual paint usage may vary due to surface texture and porosity, application method, paint brand and type, and site conditions.',
  CIVIL_NOT_PROFESSIONAL_REPLACEMENT_PAINTER:
    'This tool does not replace a licensed engineer, architect, contractor, or professional painter.',
  CIVIL_PAINT_SCOPE_LIMIT:
    'This tool does not calculate primer, putty, or labour, brand-specific coverage, cost, or a bill of quantities (BOQ).',
  CIVIL_OPENINGS_INVALID: 'The openings list could not be read. Re-enter the openings.',
  CIVIL_OPENINGS_TOO_MANY: 'Enter at most {max} opening rows.',
  CIVIL_DEDUCTIONS_EXCEED_AREA:
    'Openings and deductions must be smaller than the gross area — otherwise nothing is left to calculate.',
  CIVIL_WYTHES_OUT_OF_RANGE: 'Enter a whole number of brick skins from 1 to {max}.',
  CIVIL_SWELL_OUT_OF_RANGE: 'Enter a swell percentage between 0 and 100.',
  CIVIL_ASSUMPTION_WASTAGE:
    'Includes a {percent}% wastage allowance — an editable estimating allowance, not a standard.',
  CIVIL_ASSUMPTION_NO_WASTAGE:
    'No wastage allowance is included (0%). Most jobs need some allowance for cutting and breakage.',
  CIVIL_ASSUMPTION_OVERAGE:
    'The order volume includes a {percent}% overage — an editable estimating allowance, not a requirement.',
  CIVIL_ASSUMPTION_NO_OVERAGE:
    'No overage is included (0%): the order volume equals the geometric volume.',
  CIVIL_ASSUMPTION_MORTAR_JOINT:
    'Each brick is counted with a {joint} {unit} mortar joint added to its length and height. This is an editable preset, not a universal joint size.',
  CIVIL_ASSUMPTION_WYTHES:
    'Counted for a wall {wythes} brick skin(s) thick: face-area count × {wythes}. Bond pattern, headers and collar joints are not modelled.',
  CIVIL_ASSUMPTION_BAG_YIELD:
    'Bags use the yield you entered ({yield} {unit} per bag). Check the yield printed on your product — bags of the same weight can yield different volumes.',
  CIVIL_ASSUMPTION_SWELL:
    'Loose volume uses a {percent}% swell — an approximate, editable estimate. Actual swell depends on soil type and moisture.',
  CIVIL_ASSUMPTION_TRUCK:
    'Truck loads use the usable truck volume you entered ({capacity} {unit} per load), rounded up to whole loads.',
  CIVIL_ASSUMPTION_COVERAGE:
    'Uses your coverage rate of {coverage} {unit} per coat — an editable estimate. Check the rate stated for your product and surface.',
  CIVIL_ASSUMPTION_CONTAINER:
    'Containers are rounded up to whole {size} {unit} containers, using the size you entered.',
  CIVIL_ASSUMPTION_PLASTER_PRODUCT:
    'Bags use the yield or coverage you entered for your product. Plaster systems differ — use the figure stated by your product, not a generic one.',
  CIVIL_ASSUMPTION_TILE_FACE:
    'Tiles are counted from tile face area plus the wastage allowance. Grout joints are not deducted, and layout cuts are covered only by the allowance.',
  CIVIL_ASSUMPTION_BOX_COVERAGE:
    'Boxes use the coverage per box you entered ({coverage} {unit} per box), rounded up to whole boxes.',
  CIVIL_EXCAVATION_SCOPE_LIMIT_V2:
    'This tool calculates geometric volume only. It does not cover slope stability, shoring design, excavation safety, dewatering, geotechnical design, disposal cost, or backfill compaction.',
  CIVIL_PAINT_SCOPE_LIMIT_V2:
    'This tool does not calculate primer, putty, labour, cost, or a bill of quantities (BOQ). Coverage varies by product and surface.',
  CIVIL_TILE_SCOPE_LIMIT_V2:
    'This tool does not calculate grout or adhesive quantity, skirting, layout-specific cuts, material or labour cost, or a bill of quantities (BOQ).',
  CIVIL_INFO_PLASTER_MATERIAL:
    'To also estimate bags, choose a material estimate and enter the yield or coverage stated by your plaster product.',
};
