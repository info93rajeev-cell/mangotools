/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  LOGISTICS_MISSING_INPUT: 'Enter a value here.',
  LOGISTICS_INVALID_NUMBER: 'Enter a number such as 45 or 45.5.',
  LOGISTICS_TOO_MANY_DECIMALS: 'Use at most {max} decimal places.',
  LOGISTICS_NOT_POSITIVE: 'This must be greater than zero.',
  LOGISTICS_QUANTITY_NOT_POSITIVE: 'Enter at least 1 carton.',
  LOGISTICS_QUANTITY_NOT_WHOLE: 'The number of cartons must be a whole number.',
  LOGISTICS_QUANTITY_TOO_LARGE: 'Enter at most {max} cartons.',
  LOGISTICS_VOLUME_ROUNDS_TO_ZERO: 'The volume is smaller than {smallest} m³ at this precision.',
};
