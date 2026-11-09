/**
 * Data contracts and UI state types for Survey Rise & Fall Leveling Workbench.
 */

export interface SurveyLevelingRow {
  id: string;
  station: string;
  bs: string;
  is: string;
  fs: string;
  dist: string;
  remarks: string;
}

export interface SurveyReducedRow {
  station?: string;
  bs: string | null;
  is: string | null;
  fs: string | null;
  hi?: string | null;
  rise: string | null;
  fall: string | null;
  rl: string;
  isChangePoint: boolean;
  remarks?: string;
  dist: string | null;
  corr: string | null;
  adjustedRL: string | null;
}

export interface SurveyCheck {
  id: string;
  labelKey: string;
  status: 'pass' | 'fail';
  expected: string;
  actual: string;
}

export interface SurveyCalculationOutput {
  rows: SurveyReducedRow[];
  startingRL: string;
  endingRL: string;
  sumBS: string;
  sumFS: string;
  sumRise: string | null;
  sumFall: string | null;
  bsFsDelta: string;
  riseFallDelta: string | null;
  rlDelta: string;
  closingRL: string | null;
  misclosure: string | null;
  checks: SurveyCheck[];
  totalDistanceKm: string | null;
  allowableError: string | null;
  closureStatus: 'pass' | 'fail' | 'criterion-not-provided' | 'distance-not-provided' | null;
  setupsCount: number;
}

export interface SurveyLevelingState {
  method: 'rise-fall' | 'height-of-instrument';
  startRL: string;
  closingRL: string;
  kConstant: string;
  adjBy: 'none' | 'distance' | 'setup';
  rows: SurveyLevelingRow[];
  result: SurveyCalculationOutput | null;
  phase: 'idle' | 'calculating' | 'result' | 'error' | 'stale';
  errors: string[];
  cellErrors: Record<string, string>;
}

export interface ProfilePoint {
  x: number;
  y: number;
  station: string;
  distLabel?: string;
  isBM: boolean;
  isCP: boolean;
  rl: number;
}

export interface SurveyProfilePlaceholderProps {
  result: SurveyCalculationOutput | null;
  closingRL?: string;
}
