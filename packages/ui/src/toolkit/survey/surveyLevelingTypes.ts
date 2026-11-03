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
  rise: string | null;
  fall: string | null;
  rl: string;
  isChangePoint: boolean;
  remarks?: string;
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
  sumRise: string;
  sumFall: string;
  bsFsDelta: string;
  riseFallDelta: string;
  rlDelta: string;
  closingRL: string | null;
  misclosure: string | null;
  checks: SurveyCheck[];
}

export interface SurveyLevelingState {
  startRL: string;
  closingRL: string;
  rows: SurveyLevelingRow[];
  result: SurveyCalculationOutput | null;
  phase: 'idle' | 'calculating' | 'result' | 'error';
  errors: string[];
  cellErrors: Record<string, string>;
}
