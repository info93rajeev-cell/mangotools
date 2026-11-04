/**
 * User-facing strings for Survey Rise & Fall Leveling Workbench.
 * Strictly decoupled from components and calculation state.
 */
export const surveyStrings = {
  category: 'Surveying',
  title: 'Rise & Fall Leveling Calculator',
  subtitle:
    'Reduce BS, IS and FS readings from a level book into reduced levels with arithmetic equality checks and closing misclosure.',
  privacyBadge: 'Runs on your device',
  fullScreen: 'Full screen',
  guide: 'Guide',

  // Level Book Card
  levelBookTitle: 'Level Book & Benchmarks',
  readingUnit: 'Reading unit',
  unitMetres: 'm',
  unitMillimetres: 'mm (Preview)',
  tabRiseFall: 'Rise & Fall',
  tabHI: 'Height of Instrument · HI method (Preview — PR 4)',
  startRL: 'Starting BM RL',
  closingRL: 'Closing BM RL (known)',
  closingRLPlaceholder: 'Leave blank if open',
  allowableConstant: 'Allowable error constant (Preview — PR 2)',
  adjustBy: 'Adjust misclosure by (Preview — PR 2)',
  adjustNone: "Don't adjust (raw reduction)",
  adjustDistance: 'Distance (PR 2)',
  adjustSetups: 'No. of setups (PR 2)',

  // Field Readings & Table
  fieldReadings: 'Field readings',
  trySample: 'Try sample',
  pasteExcel: 'Paste from Excel (Preview — PR 5)',
  colIndex: '#',
  colStation: 'Station',
  colBS: 'BS',
  colIS: 'IS',
  colFS: 'FS',
  colDist: 'Dist. (m)',
  colRemarks: 'Remarks',
  colDelete: 'Remove row',
  tagBM: 'BM',
  tagIS: 'IS',
  tagCP: 'CP',
  tagFS: 'FS',
  addRow: '＋ Add row',
  hintKeyboard:
    'Enter = next cell · A row with both FS and BS is a change point (CP) · Distance is from the previous station.',
  calculate: '▦ Calculate levels',
  reset: 'Reset',
  staleNotice: 'Input values changed — click Calculate levels to update results.',

  // Error Messages
  errors: {
    SURVEY_LEVELING_MISSING_START_RL: 'Starting benchmark RL is required.',
    SURVEY_LEVELING_INVALID_DECIMAL: 'Please enter a valid decimal number (e.g. 1.250).',
    SURVEY_LEVELING_TOO_MANY_DECIMALS: 'Maximum 6 decimal places allowed.',
    SURVEY_LEVELING_NEGATIVE_READING: 'Staff reading cannot be negative.',
    SURVEY_LEVELING_INVALID_READING_COMBINATION:
      'A station can only have BS, IS, FS, or a Change Point (BS + FS).',
    SURVEY_LEVELING_INVALID_SEQUENCE:
      'The first station requires a Backsight (BS); the final station requires a Foresight (FS).',
    SURVEY_LEVELING_CHANGE_POINT_INCONSISTENT:
      'Intermediate stations must have an IS or a Change Point (BS + FS).',
    SURVEY_LEVELING_TOO_FEW_OBSERVATIONS: 'At least 2 stations are required to reduce levels.',
    SURVEY_LEVELING_TOO_MANY_OBSERVATIONS: 'Maximum 50 stations allowed per level run.',
    SURVEY_LEVELING_UNKNOWN_INPUT: 'Unexpected input structure provided.',
    CALCULATION_ERROR: 'Calculation could not be completed with the current inputs.',
  },

  // Profile Card
  profileTitle: 'Level profile · RL along the line',
  profileNotice:
    'Internal review preview: profile plotting along the station distance axis requires validated distance data arriving with the PR 2 contract and PR 5 chart integration.',
  profileHighestRL: 'Highest RL',
  profileLowestRL: 'Lowest RL',
  profileLineLength: 'Line length',

  // Results Summary Card
  resultsTitle: 'Results Summary',
  statusNotCalculated: 'Not calculated',
  statusCalculated: '✓ Calculated',
  statusArithmeticError: '✕ Arithmetic error',
  statusCheckInputs: 'Check inputs',

  tileClosingRL: 'Closing RL',
  tileClosingRLObserved: 'Observed, before adjust',
  tileClosingRLKnown: 'Known BM {value} m',
  tileClosingRLOpen: 'Open line, no closing BM',

  tileMisclosure: 'Misclosure',
  tileMisclosureSub: 'Observed − known',
  tileMisclosureAddBM: 'Add closing BM RL',

  tileAllowable: 'Allowable',
  tileAllowableSub: 'Requires distance contract (PR 2)',

  tileSetups: 'Setups',
  tileSetupsSub: '{cps} change point{s} · {count} stations',

  // Arithmetic Checks
  checksTitle: 'Arithmetic checks',
  checksSubtitle: 'Two arithmetic equality checks confirming three agreeing deltas:',
  checkRiseFall: 'ΣRise − ΣFall = {rise} − {fall} = {delta} m',
  checkBsFs: 'ΣBS − ΣFS = {bs} − {fs} = {delta} m',
  checkFirstLast: 'Last RL − First RL = {last} − {first} = {delta} m',
  checkPass: 'Pass',
  checkFail: 'Mismatch',

  // Reduced Levels Table
  colRise: 'Rise',
  colFall: 'Fall',
  colRL: 'RL (m)',
  colCorr: 'Corr. (mm)',
  colAdjRL: 'Adjusted RL',

  // Actions
  print: '🖨 Print / Save PDF',
  copyBook: '⧉ Copy level book',
  copiedToast: 'Level book copied to clipboard',
  copyFailedToast:
    'Could not copy to clipboard. Please copy manually or check browser permissions.',

  // Accordions
  accNotesTitle: 'Allowable misclosure & adjustment notes',
  accNotesBody:
    'Allowable error = C × √K mm, where K is the levelled distance in km. Use the constant your specification requires — values such as 12, 24 or 100 are common for different classes of work. The adjustment spreads the closing error back along the line in proportion to distance (or number of setups), so the closing BM comes out exactly on its known RL.',
  accBookTitle: 'Reading the level book — BS, IS, FS, CP',
  accBookBody:
    'BS (back sight) is the first reading after setting up the instrument, usually on a BM or change point. IS (intermediate sight) is any reading between BS and FS. FS (fore sight) is the last reading before moving the instrument. At a change point the staff stays put: record the FS, shift the level, then record a BS on the same point — both go in the same row.',
  accWarningsTitle: 'Important Notes / Warnings',
  accWarningsBody:
    'Validation and reduction aid for surveying and civil works. Final measurements and benchmarks must always be checked and approved by a licensed surveyor or site engineer.',
} as const;

export type SurveyStringKey = keyof typeof surveyStrings;
