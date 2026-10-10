/** English messages for every error and warning code this engine can return. */
export const messages: Readonly<Record<string, string>> = {
  REFERENCE_MISSING_INPUT: 'Enter a value here.',
  REFERENCE_INVALID_DATE: 'Use a real calendar date in the form YYYY-MM-DD.',
  REFERENCE_INVALID_DATASET_VERSION: 'The dataset version must be 1 to {max} characters.',
  REFERENCE_INVALID_INTERVAL: 'A record ends before it starts.',
  REFERENCE_INVALID_NUMBER: 'Enter a number such as 1250 or 1250.50.',
  REFERENCE_MALFORMED_RANGE:
    'A range needs a lower or upper bound, with the lower bound below the upper.',
  REFERENCE_UNIT_MISMATCH: 'The unit does not match the unit used by the reference data.',
  REFERENCE_DUPLICATE_RECORD_ID: 'Two reference records share the same id.',
  REFERENCE_TOO_MANY_RECORDS: 'The reference data has more than {max} records.',
  REFERENCE_NO_MATCH: 'No reference record applies to this date and these conditions.',
  REFERENCE_AMBIGUOUS: '{count} reference records apply; none was chosen.',
};
