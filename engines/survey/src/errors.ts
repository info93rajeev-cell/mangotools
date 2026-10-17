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

export const traverseMessages = {
  SURVEY_TRAVERSE_TOO_FEW_LEGS: 'Enter at least three legs.',
  SURVEY_TRAVERSE_TOO_MANY_LEGS: 'Use at most 50 legs.',
  SURVEY_TRAVERSE_COORDINATE_OUT_OF_RANGE:
    'Starting coordinates must be within the supported bounds.',
  SURVEY_TRAVERSE_INVALID_STATION: 'Use a nonblank station identifier of at most 60 characters.',
  SURVEY_TRAVERSE_NON_POSITIVE_DISTANCE: 'Distance must be positive.',
  SURVEY_TRAVERSE_DISTANCE_OUT_OF_RANGE: 'Distance exceeds the supported bound.',
  SURVEY_TRAVERSE_AZIMUTH_OUT_OF_RANGE:
    'Use an azimuth from zero inclusive to 360 degrees exclusive.',
  SURVEY_TRAVERSE_SELF_LEG: 'A leg must connect different stations.',
  SURVEY_TRAVERSE_DISCONNECTED_SEQUENCE: 'Adjacent legs must connect in the supplied order.',
  SURVEY_TRAVERSE_NOT_CLOSED: 'The final leg must return to the first station.',
  SURVEY_TRAVERSE_REPEATED_STATION: 'Interior stations must not repeat.',
  SURVEY_TRAVERSE_NUMERIC_RANGE: 'The computation exceeds the supported numeric range.',
};
