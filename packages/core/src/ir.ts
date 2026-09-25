/** One line of "show the work": a formula (resolved from preset strings) with its actual numbers. */
export interface WorkingStep {
  ref: string;
  formulaKey: string;
  variables: Record<string, string>;
  result: string;
  noteKey?: string;
}

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'na';

export interface Check {
  id: string;
  labelKey: string;
  status: CheckStatus;
  expected?: string;
  actual?: string;
  explanationKey?: string;
}
