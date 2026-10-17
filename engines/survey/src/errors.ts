/** Bounded messages; no field-book content is interpolated into errors. */
export const messages = {
  SURVEY_LEVELING_MISSING_START_RL: 'Enter the starting reduced level.',
  SURVEY_LEVELING_EMPTY_OBSERVATIONS: 'Enter observations.',
  SURVEY_LEVELING_TOO_FEW_OBSERVATIONS: 'Enter at least two observations.',
  SURVEY_LEVELING_TOO_MANY_OBSERVATIONS: 'Use at most 50 observations.',
  SURVEY_LEVELING_INVALID_DECIMAL: 'Enter an ordinary decimal number in metres.',
  SURVEY_LEVELING_TOO_MANY_DECIMALS: 'Use at most six fractional digits.',
  SURVEY_LEVELING_NEGATIVE_READING: 'Staff readings cannot be negative.',
  SURVEY_LEVELING_INVALID_READING_COMBINATION: 'Use BS, IS, FS, or a change-point FS and BS.',
  SURVEY_LEVELING_INVALID_SEQUENCE: 'Start with BS only and finish with FS only.',
  SURVEY_LEVELING_CHANGE_POINT_INCONSISTENT: 'Interior rows need IS or both FS and BS.',
};
