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
  unitMillimetres: 'mm (preview only)',
  unitMetresTooltip:
    'Reading unit: Metres (standard surveying unit; mm input is preview-only in this release)',
  tabRiseFall: 'Rise & Fall',
  tabHI: 'Height of Instrument',
  startRL: 'Starting BM RL',
  closingRL: 'Closing BM RL (known)',
  closingRLPlaceholder: 'Leave blank if open',
  allowableConstant: 'Allowable constant C',
  allowableConstantPlaceholder: 'e.g. 12 or 24',
  allowableConstantHelper: 'Optional (skips tolerance check)',
  allowableConstantFullExplanation:
    'Enter your contract or survey specification constant C. Leaving blank calculates misclosure without a pass/fail tolerance check.',
  adjustBy: 'Adjustment method',
  adjustNone: "Don't adjust (raw reduction)",
  adjustDistance: 'Distance-proportional',
  adjustSetups: 'Setup-proportional',

  // Field Readings & Table
  fieldReadings: 'Field readings',
  trySample: 'Try sample',
  pasteExcel: 'Paste from Excel',

  // Paste from Excel Modal
  pasteModalTitle: 'Paste Level Book from Excel / Spreadsheet',
  pasteModalSubtitle:
    'Paste tab-separated or comma-separated rows copied from Excel, Google Sheets, or CSV.',
  pasteInputLabel: 'Spreadsheet data (Ctrl+V / ⌘V)',
  pasteInputPlaceholder:
    'Paste rows here (e.g. Station, BS, IS, FS, Dist, Remarks)...\nExample:\nBM-1\t1.500\t\t\t0\tStart BM\nA\t\t1.200\t\t30\t\nCP1\t0.800\t\t2.000\t30\tChange point\nBM-2\t\t\t2.200\t40\tClosing BM',
  pasteFromClipboard: '📋 Paste from clipboard',
  pasteClear: 'Clear',
  pasteClose: 'Close modal',
  pastePreviewTitle: 'Review pasted rows',
  pasteReplaceBtn: 'Replace level book',
  pasteCancelBtn: 'Cancel',
  pasteNoData: 'No rows detected yet. Paste spreadsheet data into the box above.',
  pasteHeaderDetected: 'Header row detected and mapped automatically',
  pasteNoHeaderDetected:
    'No header detected — columns mapped positionally (Station, BS, IS, FS, Dist, Remarks)',
  pasteValidBanner: 'All {count} rows valid and ready to import.',
  pasteErrorBanner: 'Found errors in {count} row(s). Correct your data before applying.',
  pasteAppliedToast: 'Level book replaced with {count} pasted rows.',
  pasteClipboardError: 'Could not access clipboard. Please paste manually into the text area.',

  // Paste Validation Messages
  pasteErrEmpty: 'Station has no staff readings (BS, IS, or FS)',
  pasteErrInvalidReading: 'Invalid decimal reading (max 6 decimal places)',
  pasteErrNegativeReading: 'Staff reading cannot be negative',
  pasteErrCombination: 'Invalid reading combination: cannot mix IS with BS or FS',
  pasteErrStartBS: 'First station must have Backsight (BS)',
  pasteErrStartBSOnly:
    'First observation must be a starting backsight (BS) only, not a change point or foresight',
  pasteErrEndFS: 'Final station must have Foresight (FS)',
  pasteErrEndFSOnly:
    'Final observation must be a closing foresight (FS) only, not a change point or backsight',
  pasteErrCP: 'Intermediate change point requires both incoming FS and outgoing BS',
  pasteErrDist: 'Invalid distance: must be a non-negative decimal',
  pasteErrDistZero: 'First station distance must be 0 if provided',
  pasteErrMinRows: 'At least 2 stations are required for leveling reduction',
  pasteErrMaxRows: 'Maximum 50 stations allowed per level run',
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
    SURVEY_LEVELING_START_DISTANCE_NONZERO: 'Starting station distance must be 0 or omitted.',
    SURVEY_LEVELING_MISSING_DISTANCE:
      'Distance from previous station is required for distance-based adjustment.',
    SURVEY_LEVELING_NEGATIVE_DISTANCE: 'Distances cannot be negative.',
    SURVEY_LEVELING_ZERO_TOTAL_DISTANCE: 'Total measured distance must be greater than zero.',
    SURVEY_LEVELING_METHOD_UNSUPPORTED:
      'Height of instrument method is not yet supported in this version.',
    SURVEY_LEVELING_UNKNOWN_INPUT: 'Unexpected input structure provided.',
    CALCULATION_ERROR: 'Calculation could not be completed with the current inputs.',
  },

  // Profile Card
  profileTitle: 'Level profile · RL along the line',
  profileTitleAdjusted: 'Level profile · Adjusted RL along the line',
  profileNotice: 'Profile chart will render once observations are entered and calculated.',
  profileHighestRL: 'Highest RL',
  profileHighestRLAdjusted: 'Highest adjusted RL',
  profileLowestRL: 'Lowest RL',
  profileLowestRLAdjusted: 'Lowest adjusted RL',
  profileLineLength: 'Line length',

  // Results Summary Card
  resultsTitle: 'Results Summary',
  statusNotCalculated: 'Not calculated',
  statusCalculated: '✓ Calculated',
  statusArithmeticError: '✕ Arithmetic error',
  statusCheckInputs: 'Check inputs',
  statusCriterionNotProvided: 'Criterion not provided',
  statusDistanceNotProvided: 'Distance not provided',
  statusWithinLimit: 'Within limit',
  statusOutsideLimit: 'Outside limit',

  tileClosingRL: 'Closing RL',
  tileClosingRLObserved: 'Observed, before adjust',
  tileClosingRLKnown: 'Known BM {value} m',
  tileClosingRLOpen: 'Open line, no closing BM',

  tileMisclosure: 'Misclosure',
  tileMisclosureSub: 'Observed − known',
  tileMisclosureAddBM: 'Add closing BM RL',

  tileAllowable: 'Allowable limit',
  tileAllowableSub: 'Based on C·√K',

  tileSetups: 'Setups & Line',
  tileSetupsSub: '{cps} change point{s} · {count} stations',

  // Arithmetic Checks
  checksTitle: 'Arithmetic checks',
  checksSubtitle: 'Two arithmetic equality checks confirming three agreeing deltas:',
  checksSubtitleHI:
    'Collimation arithmetic check (Backsights − Foresights = Ending RL − Starting RL):',
  checkRiseFall: 'ΣRise − ΣFall = {rise} − {fall} = {delta} m',
  checkBsFs: 'ΣBS − ΣFS = {bs} − {fs} = {delta} m',
  checkFirstLast: 'Last RL − First RL = {last} − {first} = {delta} m',
  checkPass: 'Pass',
  checkFail: 'Mismatch',

  // Reduced Levels Table
  resultsTableAria: 'Reduced levels calculation results table',
  colHI: 'HI (m)',
  colRise: 'Rise',
  colFall: 'Fall',
  colRL: 'Raw RL (m)',
  colCorr: 'Corr. (mm)',
  colAdjRL: 'Adjusted RL (m)',

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
  accMethodTitle: 'Method',
  accMethodRF:
    'Rise & Fall reduction method: calculates elevation differences between consecutive stations (Rise or Fall), then applies deltas to preceding levels with three agreeing deltas arithmetic equality checks.',
  accMethodHI:
    'Height of Instrument (Collimation) method: calculates the line of collimation (HI = RL + BS) for each instrument setup, then derives station levels (RL = HI − Staff reading) with backsights minus foresights collimation arithmetic checks.',
  accWarningsTitle: 'Important Notes / Warnings',
  accWarningsBody:
    'Validation and reduction aid for surveying and civil works. Final measurements and benchmarks must always be checked and approved by a licensed surveyor or site engineer.',
} as const;

export type SurveyStringKey = keyof typeof surveyStrings;
