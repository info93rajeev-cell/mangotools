/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  ESTIMATE_INVALID_NUMBER: 'Enter a number such as 1250 or 1250.50.',
  ESTIMATE_TOO_MANY_DECIMALS: 'Use at most {max} decimal places.',
  ESTIMATE_NEGATIVE_AMOUNT: 'The amount cannot be negative.',
  ESTIMATE_NEGATIVE_VALUE: 'This value cannot be negative.',
  ESTIMATE_GST_RATE_OUT_OF_RANGE: 'The GST rate must be between 0% and 100%.',
  ESTIMATE_MISSING_INPUT: 'Enter a value here.',
  ESTIMATE_PRICE_ZERO: 'The selling price must be greater than zero.',
  ESTIMATE_MARGIN_OUT_OF_RANGE: 'The margin must be less than 100%.',
  ESTIMATE_MARKUP_OUT_OF_RANGE: 'The markup must be greater than −100%.',
  ESTIMATE_MARKUP_UNDEFINED: 'Markup cannot be calculated when the cost is zero.',
};
