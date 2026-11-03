import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  buildLevelingRequest,
  createInitialRows,
  SAMPLE_CLOSING_RL,
  SAMPLE_ROWS,
  SAMPLE_START_RL,
} from './surveyLevelingModel.ts';
import type {
  SurveyCalculationOutput,
  SurveyLevelingRow,
  SurveyLevelingState,
} from './surveyLevelingTypes.ts';

const workerRun: RunFn = (...args) => getWorkerHost().run(...args);

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
    const code = outcome.error?.code ?? 'INVALID_INPUT';
    const path = outcome.error?.path ?? '';
    return {
      result: null,
      phase: 'error',
      errors: [path ? `${code}: ${path}` : code],
      cellErrors: path ? { [path]: code } : {},
    };
  } catch {
    return { result: null, phase: 'error', errors: ['Calculation error'], cellErrors: {} };
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

export function useSurveyLeveling(customRun?: RunFn) {
  const runFn = customRun ?? workerRun;
  const [startRL, setStartRL] = useState(SAMPLE_START_RL);
  const [closingRL, setClosingRL] = useState(SAMPLE_CLOSING_RL);
  const [rows, setRows] = useState<SurveyLevelingRow[]>(() => SAMPLE_ROWS);
  const [state, setState] = useState<{
    result: SurveyCalculationOutput | null;
    phase: SurveyLevelingState['phase'];
    errors: string[];
    cellErrors: Record<string, string>;
  }>({ result: null, phase: 'idle', errors: [], cellErrors: {} });

  const abortRef = useRef<AbortController | null>(null);

  const calculate = async (
    overrideStart = startRL,
    overrideClose = closingRL,
    overrideRows = rows,
  ) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((prev) => ({ ...prev, phase: 'calculating' }));
    const outcome = await executeLeveling(
      runFn,
      overrideStart,
      overrideClose,
      overrideRows,
      ctrl.signal,
    );
    if (!ctrl.signal.aborted) setState(outcome);
  };

  const loadSample = () => {
    setStartRL(SAMPLE_START_RL);
    setClosingRL(SAMPLE_CLOSING_RL);
    setRows(SAMPLE_ROWS);
    void calculate(SAMPLE_START_RL, SAMPLE_CLOSING_RL, SAMPLE_ROWS);
  };

  const reset = () => {
    abortRef.current?.abort();
    setStartRL('');
    setClosingRL('');
    setRows(createInitialRows());
    setState({ result: null, phase: 'idle', errors: [], cellErrors: {} });
  };

  useEffect(() => {
    void calculate();
    return () => abortRef.current?.abort();
  }, []);

  return {
    startRL,
    setStartRL,
    closingRL,
    setClosingRL,
    rows,
    result: state.result,
    phase: state.phase,
    errors: state.errors,
    cellErrors: state.cellErrors,
    handleCellChange: (idx: number, f: keyof SurveyLevelingRow, v: string) =>
      setRows((p) => updateRowAt(p, idx, f, v)),
    handleAddRow: () => setRows(appendNewRow),
    handleRemoveRow: (idx: number) =>
      setRows((p) => (p.length > 2 ? p.filter((_, i) => i !== idx) : p)),
    calculate: () => calculate(startRL, closingRL, rows),
    loadSample,
    reset,
  };
}
