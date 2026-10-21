/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  LOGISTICS_VALUE_TOO_LONG: 'Use at most 64 characters for a numeric value.',
  LOGISTICS_MEASUREMENT_TOO_LARGE: 'Use a measurement smaller than 1,000,000,000,000.',
  LOGISTICS_WEIGHT_UNIT_REQUIRED: 'Choose a unit for the supplied weight.',
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
  LOGISTICS_AMOUNT_NEGATIVE: 'This amount cannot be negative.',
  LOGISTICS_AMOUNT_TOO_LARGE: 'Enter at most {max}.',
  LOGISTICS_RATE_QUANTITY_NOT_POSITIVE: 'The quantity must be greater than zero.',
  LOGISTICS_CONTAINER_COUNT_NOT_WHOLE: 'The number of containers must be a whole number.',
  LOGISTICS_RATE_QUANTITY_TOO_LARGE: 'Enter a quantity of at most {max}.',
  LOGISTICS_COST_USER_RATE:
    'This estimate uses the rate you entered. Actual freight charges may depend on carrier, route, surcharges, taxes and other terms.',
  LOGISTICS_COST_MINIMUM_APPLIED:
    'The minimum charge is higher than quantity × rate, so the minimum charge is used.',
  LOGISTICS_NO_PACKAGES: 'Add at least one package with its dimensions and quantity.',
  LOGISTICS_TOO_MANY_PACKAGES: 'Use at most {max} package types in one calculation.',
  LOGISTICS_TOTAL_PIECES_TOO_LARGE: 'Enter at most {max} pieces in total.',
  LOGISTICS_DESCRIPTION_TOO_LONG: 'Use at most {max} characters.',
  LOGISTICS_PIECES_NOT_POSITIVE: 'Enter at least 1 piece.',
  LOGISTICS_PIECES_NOT_WHOLE: 'The number of pieces must be a whole number.',
  LOGISTICS_PIECES_TOO_LARGE: 'Enter at most {max} pieces.',
  LOGISTICS_PAYLOAD_TOO_LARGE: 'Enter a payload of at most {max} kg.',
  LOGISTICS_LOAD_PLANNING_AID:
    'This plan places rectangular packages with a fixed, repeatable method. It is a planning aid, not necessarily the most efficient arrangement, and it does not check weight distribution, load securing, door access or crushing.',
  LOGISTICS_CONTAINER_NOMINAL_REFERENCE:
    'Nominal reference capacities vary by carrier, manufacturer and container series. Confirm the specification of the actual container with your carrier.',
  LOGISTICS_LOAD_PARTIAL: '{unloaded} pieces could not be loaded. See each package for the reason.',
  LOGISTICS_LOAD_MULTIPLE_CONTAINERS:
    'This cargo needs {containers} containers of the selected type.',
  LOGISTICS_LOAD_WEIGHT_LIMIT_REACHED:
    'The weight limit was reached before the space was full, so more containers are needed.',
  LOGISTICS_LOAD_STACK_HEIGHT_ABOVE_CONTAINER:
    'The maximum stack height is higher than the container, so the container height is used.',
  LOGISTICS_LOAD_WEIGHTS_INCOMPLETE:
    'Some packages have no weight, so the payload check covers only the packages that have a weight.',
  LOGISTICS_LOAD_PAYLOAD_NOT_CHECKED:
    'No maximum payload was entered, so weights are totalled but not checked against a limit.',
};
