import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  buildLevelingRequest,
  createInitialRows,
  SAMPLE_ADJ_BY,
  SAMPLE_CLOSING_RL,
  SAMPLE_K_CONSTANT,
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
  const win = typeof window !== 'undefined' ? (window as unknown as { __customRun?: RunFn }) : null;
  return win?.__customRun ? win.__customRun(...args) : getWorkerHost().run(...args);
};

const resolveErrorMessage = (code: string): string =>
  (surveyStrings.errors as Record<string, string>)[code] ?? surveyStrings.errors.CALCULATION_ERROR;

function resolveTargetInputId(path: string): string | null {
  if (path === 'startRL') return 'survey-startRL';
  if (path === 'closingRL') return 'survey-closeRL';
  if (path === 'kConstant') return 'survey-allowable-const';
  if (path === 'adjBy') return 'survey-adjust-by';
  const m = /^observations\.(\d+)(?:\.(bs|is|fs|dist))?$/.exec(path);
  return m ? `survey-obs-${m[1]}-${m[2] ?? 'bs'}` : null;
}

async function executeLeveling(
  runFn: RunFn,
  start: string,
  close: string,
  rows: SurveyLevelingRow[],
  adjBy: 'none' | 'distance' | 'setup',
  kConstant: string,
  method: 'rise-fall' | 'height-of-instrument',
  signal: AbortSignal,
): Promise<{
  result: SurveyCalculationOutput | null;
  phase: SurveyLevelingState['phase'];
  errors: string[];
  cellErrors: Record<string, string>;
}> {
  const req = buildLevelingRequest(start, close, rows, adjBy, kConstant, method);
  try {
    const outcome = await runFn('survey.leveling.reduce@2', req.input, req.params, signal);
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
    if (signal.aborted) return { result: null, phase: 'idle', errors: [], cellErrors: {} };
    const err = surveyStrings.errors.CALCULATION_ERROR;
    return { result: null, phase: 'error', errors: [err], cellErrors: {} };
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

function useSurveyBenchmarks(onInvalidate: () => void) {
  const [method, setMethodState] = useState<'rise-fall' | 'height-of-instrument'>('rise-fall');
  const [startRL, setStartRLState] = useState(SAMPLE_START_RL);
  const [closingRL, setClosingRLState] = useState(SAMPLE_CLOSING_RL);
  const [kConstant, setKConstantState] = useState('');
  const [adjBy, setAdjByState] = useState<'none' | 'distance' | 'setup'>('none');
  const setWithInv =
    <T>(setter: (v: T) => void) =>
    (val: T) => {
      setter(val);
      onInvalidate();
    };
  return {
    method,
    startRL,
    closingRL,
    kConstant,
    adjBy,
    setMethodState,
    setStartRLState,
    setClosingRLState,
    setKConstantState,
    setAdjByState,
    setMethod: setWithInv(setMethodState),
    setStartRL: setWithInv(setStartRLState),
    setClosingRL: setWithInv(setClosingRLState),
    setKConstant: setWithInv(setKConstantState),
    setAdjBy: setWithInv(setAdjByState),
  };
}

const INITIAL_CALC_STATE = {
  result: null,
  phase: 'idle' as const,
  errors: [],
  cellErrors: {},
};

function useSurveyCalculation(
  runFn: RunFn,
  bm: ReturnType<typeof useSurveyBenchmarks>,
  rowOps: ReturnType<typeof useSurveyRows>,
) {
  const [calcState, setCalcState] = useState<{
    result: SurveyCalculationOutput | null;
    phase: SurveyLevelingState['phase'];
    errors: string[];
    cellErrors: Record<string, string>;
  }>(INITIAL_CALC_STATE);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const invalidate = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    reqIdRef.current++;
    setCalcState((prev) => ({
      ...prev,
      result: null,
      phase:
        prev.phase === 'result' || prev.phase === 'calculating' || prev.phase === 'stale'
          ? 'stale'
          : prev.phase,
      errors: [],
      cellErrors: {},
    }));
  };

  const calculate = async (
    s = bm.startRL,
    c = bm.closingRL,
    r = rowOps.rows,
    a = bm.adjBy,
    k = bm.kConstant,
    m = bm.method,
  ) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const currentReqId = ++reqIdRef.current;
    setCalcState((prev) => ({ ...prev, phase: 'calculating' }));
    const outcome = await executeLeveling(runFn, s, c, r, a, k, m, ctrl.signal);
    if (!ctrl.signal.aborted && currentReqId === reqIdRef.current) {
      setCalcState(outcome);
    }
  };

  return { calcState, setCalcState, abortRef, reqIdRef, invalidate, calculate };
}

function useSurveyActions(
  bm: ReturnType<typeof useSurveyBenchmarks>,
  rowOps: ReturnType<typeof useSurveyRows>,
  calc: ReturnType<typeof useSurveyCalculation>,
) {
  const loadSample = () => {
    calc.abortRef.current?.abort();
    calc.abortRef.current = null;
    calc.reqIdRef.current++;
    bm.setStartRLState(SAMPLE_START_RL);
    bm.setClosingRLState(SAMPLE_CLOSING_RL);
    bm.setKConstantState(SAMPLE_K_CONSTANT);
    bm.setAdjByState(SAMPLE_ADJ_BY);
    rowOps.setRows(SAMPLE_ROWS);
    void calc.calculate(
      SAMPLE_START_RL,
      SAMPLE_CLOSING_RL,
      SAMPLE_ROWS,
      SAMPLE_ADJ_BY,
      SAMPLE_K_CONSTANT,
      bm.method,
    );
  };

  const reset = () => {
    calc.abortRef.current?.abort();
    calc.abortRef.current = null;
    calc.reqIdRef.current++;
    bm.setStartRLState('');
    bm.setClosingRLState('');
    bm.setKConstantState('');
    bm.setAdjByState('none');
    rowOps.setRows(createInitialRows());
    calc.setCalcState(INITIAL_CALC_STATE);
  };

  return { loadSample, reset };
}

export function useSurveyLeveling(customRun?: RunFn) {
  const runFn = customRun ?? defaultRun;
  const invRef = useRef<() => void>(() => {});
  const bm = useSurveyBenchmarks(() => invRef.current());
  const rowOps = useSurveyRows(() => invRef.current());
  const calc = useSurveyCalculation(runFn, bm, rowOps);
  invRef.current = calc.invalidate;
  const { loadSample, reset } = useSurveyActions(bm, rowOps, calc);

  useEffect(() => {
    void calc.calculate();
    return () => calc.abortRef.current?.abort();
  }, []);

  return {
    method: bm.method,
    setMethod: bm.setMethod,
    startRL: bm.startRL,
    setStartRL: bm.setStartRL,
    closingRL: bm.closingRL,
    setClosingRL: bm.setClosingRL,
    kConstant: bm.kConstant,
    setKConstant: bm.setKConstant,
    adjBy: bm.adjBy,
    setAdjBy: bm.setAdjBy,
    rows: rowOps.rows,
    result: calc.calcState.result,
    phase: calc.calcState.phase,
    isStale: calc.calcState.phase === 'stale',
    errors: calc.calcState.errors,
    cellErrors: calc.calcState.cellErrors,
    handleCellChange: rowOps.handleCellChange,
    handleAddRow: rowOps.handleAddRow,
    handleRemoveRow: rowOps.handleRemoveRow,
    calculate: () =>
      calc.calculate(bm.startRL, bm.closingRL, rowOps.rows, bm.adjBy, bm.kConstant, bm.method),
    loadSample,
    reset,
  };
}
