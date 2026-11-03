import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  buildLevelingRequest,
  createInitialRows,
  SAMPLE_CLOSING_RL,
  SAMPLE_ROWS,
  SAMPLE_START_RL,
} from './surveyLevelingModel.ts';
import { surveyStrings } from './surveyLevelingStrings.ts';
import type {
  SurveyCalculationOutput,
  SurveyLevelingRow,
  SurveyLevelingState,
} from './surveyLevelingTypes.ts';

const defaultRun: RunFn = (...args) => {
  if (typeof window !== 'undefined' && (window as unknown as { __customRun?: RunFn }).__customRun) {
    return (window as unknown as { __customRun: RunFn }).__customRun(...args);
  }
  return getWorkerHost().run(...args);
};

function resolveErrorMessage(code: string): string {
  const errMap = surveyStrings.errors as Record<string, string>;
  return errMap[code] ?? errMap.CALCULATION_ERROR;
}

function resolveTargetInputId(path: string): string | null {
  if (path === 'startRL') return 'survey-startRL';
  if (path === 'closingRL') return 'survey-closeRL';
  const obsMatch = /^observations\.(\d+)(?:\.(bs|is|fs))?$/.exec(path);
  if (obsMatch) {
    const idx = obsMatch[1];
    const key = obsMatch[2] ?? 'bs';
    return `survey-obs-${idx}-${key}`;
  }
  return null;
}

async function executeLeveling(
  runFn: RunFn,
  start: string,
  close: string,
  rows: SurveyLevelingRow[],
  signal: AbortSignal,
): Promise<{
  result: SurveyCalculationOutput | null;
  phase: SurveyLevelingState['phase'];
  errors: string[];
  cellErrors: Record<string, string>;
}> {
  const req = buildLevelingRequest(start, close, rows);
  try {
    const outcome = await runFn('survey.leveling.reduce@1', req.input, req.params, signal);
    if (signal.aborted) return { result: null, phase: 'idle', errors: [], cellErrors: {} };
    if (outcome.ok) {
      return {
        result: outcome.value as unknown as SurveyCalculationOutput,
        phase: 'result',
        errors: [],
        cellErrors: {},
      };
    }
    const code = outcome.error?.code ?? 'CALCULATION_ERROR';
    const path = outcome.error?.path ?? '';
    const message = resolveErrorMessage(code);
    const targetId = resolveTargetInputId(path);
    if (targetId) setTimeout(() => document.getElementById(targetId)?.focus(), 10);
    return {
      result: null,
      phase: 'error',
      errors: [message],
      cellErrors: path ? { [path]: message } : {},
    };
  } catch {
    return {
      result: null,
      phase: 'error',
      errors: [surveyStrings.errors.CALCULATION_ERROR],
      cellErrors: {},
    };
  }
}

function updateRowAt(
  prev: SurveyLevelingRow[],
  index: number,
  field: keyof SurveyLevelingRow,
  value: string,
): SurveyLevelingRow[] {
  const next = [...prev];
  if (next[index]) next[index] = { ...next[index], [field]: value };
  return next;
}

function appendNewRow(prev: SurveyLevelingRow[]): SurveyLevelingRow[] {
  return [
    ...prev,
    {
      id: `row-${Date.now()}-${prev.length}`,
      station: '',
      bs: '',
      is: '',
      fs: '',
      dist: '',
      remarks: '',
    },
  ];
}

function useSurveyRows(onInvalidate: () => void) {
  const [rows, setRows] = useState<SurveyLevelingRow[]>(() => SAMPLE_ROWS);
  return {
    rows,
    setRows,
    handleCellChange: (idx: number, f: keyof SurveyLevelingRow, v: string) => {
      setRows((p) => updateRowAt(p, idx, f, v));
      onInvalidate();
    },
    handleAddRow: () => {
      setRows(appendNewRow);
      onInvalidate();
    },
    handleRemoveRow: (idx: number) => {
      setRows((p) => (p.length > 2 ? p.filter((_, i) => i !== idx) : p));
      onInvalidate();
    },
  };
}

export function useSurveyLeveling(customRun?: RunFn) {
  const runFn = customRun ?? defaultRun;
  const [startRL, setStartRLState] = useState(SAMPLE_START_RL);
  const [closingRL, setClosingRLState] = useState(SAMPLE_CLOSING_RL);
  const [calcState, setCalcState] = useState<{
    result: SurveyCalculationOutput | null;
    phase: SurveyLevelingState['phase'];
    errors: string[];
    cellErrors: Record<string, string>;
  }>({ result: null, phase: 'idle', errors: [], cellErrors: {} });

  const abortRef = useRef<AbortController | null>(null);

  const invalidate = () => {
    setCalcState((prev) => ({
      ...prev,
      result: null,
      phase: prev.phase === 'result' ? 'stale' : prev.phase,
      errors: [],
      cellErrors: {},
    }));
  };

  const rowOps = useSurveyRows(invalidate);

  const calculate = async (s = startRL, c = closingRL, r = rowOps.rows) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setCalcState((prev) => ({ ...prev, phase: 'calculating' }));
    const outcome = await executeLeveling(runFn, s, c, r, ctrl.signal);
    if (!ctrl.signal.aborted) setCalcState(outcome);
  };

  const loadSample = () => {
    setStartRLState(SAMPLE_START_RL);
    setClosingRLState(SAMPLE_CLOSING_RL);
    rowOps.setRows(SAMPLE_ROWS);
    void calculate(SAMPLE_START_RL, SAMPLE_CLOSING_RL, SAMPLE_ROWS);
  };

  const reset = () => {
    abortRef.current?.abort();
    setStartRLState('');
    setClosingRLState('');
    rowOps.setRows(createInitialRows());
    setCalcState({ result: null, phase: 'idle', errors: [], cellErrors: {} });
  };

  useEffect(() => {
    void calculate();
    return () => abortRef.current?.abort();
  }, []);

  return {
    startRL,
    setStartRL: (val: string) => {
      setStartRLState(val);
      invalidate();
    },
    closingRL,
    setClosingRL: (val: string) => {
      setClosingRLState(val);
      invalidate();
    },
    rows: rowOps.rows,
    result: calcState.result,
    phase: calcState.phase,
    isStale: calcState.phase === 'stale',
    errors: calcState.errors,
    cellErrors: calcState.cellErrors,
    handleCellChange: rowOps.handleCellChange,
    handleAddRow: rowOps.handleAddRow,
    handleRemoveRow: rowOps.handleRemoveRow,
    calculate: () => calculate(startRL, closingRL, rowOps.rows),
    loadSample,
    reset,
  };
}
