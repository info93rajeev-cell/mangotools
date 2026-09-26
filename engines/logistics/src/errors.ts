/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  LOGISTICS_MISSING_INPUT: 'Enter a value here.',
  LOGISTICS_INVALID_NUMBER: 'Enter a number such as 45 or 45.5.',
  LOGISTICS_TOO_MANY_DECIMALS: 'Use at most {max} decimal places.',
  LOGISTICS_NOT_POSITIVE: 'This must be greater than zero.',
  LOGISTICS_QUANTITY_NOT_POSITIVE: 'Enter at least 1 carton.',
  LOGISTICS_QUANTITY_NOT_WHOLE: 'The number of cartons must be a whole number.',
  LOGISTICS_QUANTITY_TOO_LARGE: 'Enter at most {max} cartons.',
  LOGISTICS_DIVISOR_OUT_OF_RANGE: 'Enter a divisor between 1,000 and 10,000 cm³ per kg.',
  LOGISTICS_WEIGHT_TOO_LARGE: 'Enter at most {max} kg per package.',
  LOGISTICS_VOLUME_ROUNDS_TO_ZERO: 'The volume is smaller than {smallest} m³ at this precision.',
  LOGISTICS_USABLE_PERCENT_OUT_OF_RANGE: 'Enter a usable space percentage between 1 and 100.',
  LOGISTICS_CARTON_EXCEEDS_CONTAINER:
    'This carton does not fit inside the container in any orientation tried.',
  LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED:
    'A volume fit does not guarantee the cartons will physically load. Packaging, pallets, the door opening and load securing are not modelled.',
  LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING:
    'This is a simple, single-orientation grid estimate, not an advanced 3D loading plan.',
  LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL:
    'Verify the final loading plan with your freight forwarder or logistics professional before shipment.',
  LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME:
    'The requested quantity is more than the estimated volume capacity.',
  LOGISTICS_CONTAINER_OVER_CAPACITY_GRID:
    'The requested quantity is more than the simple loading grid estimate.',
  LOGISTICS_CARTON_EXCEEDS_PALLET_BASE:
    "This carton's footprint does not fit the pallet base in any orientation tried.",
  LOGISTICS_CARTON_TALLER_THAN_STACK_LIMIT:
    'This carton is taller than the maximum stack height allowed.',
  LOGISTICS_PALLET_NOT_LOAD_SAFETY:
    'This is a simple grid fit, not a pallet load-safety validation.',
  LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT:
    "Verify the final pallet load before shipment, with your logistics or warehouse professional and your carrier's requirements.",
  LOGISTICS_PALLET_DIMENSIONS_VARY:
    'Pallet dimensions, safe stack height and load capacity vary by pallet type, condition, packaging, warehouse practice and carrier requirements.',
  LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED: 'This quantity needs more than one pallet.',
};
