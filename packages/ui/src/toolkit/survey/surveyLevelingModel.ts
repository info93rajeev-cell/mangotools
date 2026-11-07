import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export const SAMPLE_START_RL = '100.000';
export const SAMPLE_CLOSING_RL = '99.805';
export const SAMPLE_K_CONSTANT = '24';
export const SAMPLE_ADJ_BY: 'none' | 'distance' | 'setup' = 'distance';

export const SAMPLE_ROWS: SurveyLevelingRow[] = [
  { id: 'row-1', station: 'BM-1', bs: '1.500', is: '', fs: '', dist: '0', remarks: 'Start BM' },
  { id: 'row-2', station: 'A', bs: '', is: '1.200', fs: '', dist: '30', remarks: '' },
  {
    id: 'row-3',
    station: 'CP1',
    bs: '0.800',
    is: '',
    fs: '2.000',
    dist: '30',
    remarks: 'Change point',
  },
  { id: 'row-4', station: 'B', bs: '', is: '1.100', fs: '', dist: '25', remarks: '' },
  {
    id: 'row-5',
    station: 'CP2',
    bs: '2.300',
    is: '',
    fs: '0.600',
    dist: '35',
    remarks: 'Change point',
  },
  { id: 'row-6', station: 'BM-2', bs: '', is: '', fs: '2.200', dist: '40', remarks: 'Closing BM' },
];

export function createInitialRows(): SurveyLevelingRow[] {
  return [
    { id: 'row-1', station: 'BM-1', bs: '', is: '', fs: '', dist: '0', remarks: 'Start BM' },
    { id: 'row-2', station: '', bs: '', is: '', fs: '', dist: '', remarks: '' },
  ];
}

export function isChangePointRow(row: SurveyLevelingRow): boolean {
  return row.bs.trim() !== '' && row.fs.trim() !== '';
}

export function detectRowTag(row: SurveyLevelingRow, index: number, total: number): string {
  const bs = row.bs.trim() !== '';
  const is = row.is.trim() !== '';
  const fs = row.fs.trim() !== '';
  if (index === 0 && bs) return 'BM';
  if (bs && fs) return 'CP';
  if (is) return 'IS';
  if (index === total - 1 && fs) return 'FS';
  return String(index + 1);
}

export function formatLevelReading(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') return '—';
  const trimmed = value.trim();
  const num = Number(trimmed);
  if (Number.isNaN(num)) return trimmed;
  if (num === 0) return '0.000';
  const fixed = num.toFixed(3);
  if (fixed === '0.000') {
    return trimmed;
  }
  return fixed;
}

export const formatReading = formatLevelReading;

export function formatSigned(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') return '—';
  const trimmed = value.trim();
  const num = Number(trimmed);
  if (Number.isNaN(num)) return trimmed;
  if (num === 0) return '0.000';
  const sign = num > 0 ? '+' : '−';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(3);
  if (fixed === '0.000') {
    return `${sign}${abs}`;
  }
  return `${sign}${fixed}`;
}

export function formatMisclosure(misclosure: string | null | undefined): {
  val: string;
  subKey: 'tileMisclosureSub' | 'tileMisclosureAddBM';
} {
  if (misclosure === null || misclosure === undefined || misclosure.trim() === '') {
    return { val: '—', subKey: 'tileMisclosureAddBM' };
  }
  const m = Number(misclosure);
  if (Number.isNaN(m)) return { val: misclosure, subKey: 'tileMisclosureSub' };
  const mm = m * 1000;
  if (mm === 0) return { val: '0 mm', subKey: 'tileMisclosureSub' };
  const sign = mm > 0 ? '+' : '−';
  const absMm = Math.abs(mm);
  if (absMm < 0.5) {
    return { val: `${sign}${absMm.toFixed(2)} mm`, subKey: 'tileMisclosureSub' };
  }
  return { val: `${sign}${Math.round(absMm)} mm`, subKey: 'tileMisclosureSub' };
}

export function buildLevelingRequest(
  startRL: string,
  closingRL: string,
  rows: SurveyLevelingRow[],
  adjBy: 'none' | 'distance' | 'setup' = 'none',
  kConstant = '',
  method: 'rise-fall' | 'height-of-instrument' = 'rise-fall',
): { input: Record<string, unknown>; params: Record<string, unknown> } {
  const input: Record<string, unknown> = {
    startRL: startRL.trim(),
    observations: rows.map((r) => {
      const obs: Record<string, unknown> = {};
      if (r.station.trim()) obs.station = r.station.trim();
      if (r.remarks.trim()) obs.remarks = r.remarks.trim();
      if (r.bs.trim()) obs.bs = r.bs.trim();
      if (r.is.trim()) obs.is = r.is.trim();
      if (r.fs.trim()) obs.fs = r.fs.trim();
      if (r.dist.trim()) obs.dist = r.dist.trim();
      return obs;
    }),
  };
  if (closingRL.trim()) {
    input.closingRL = closingRL.trim();
  }
  const params: Record<string, unknown> = {
    method,
    adjBy,
  };
  if (kConstant.trim()) {
    params.kConstant = kConstant.trim();
  }
  return { input, params };
}

export interface ValidatedLineDistance {
  isValid: boolean;
  totalM: number | null;
  cumDists: number[];
}

export function computeValidatedDistance(
  rows: Array<{ dist?: string | null }>,
): ValidatedLineDistance {
  if (!rows || rows.length < 2) {
    return { isValid: false, totalM: null, cumDists: [] };
  }

  const d0Str = rows[0]?.dist;
  if (d0Str !== undefined && d0Str !== null && d0Str.trim() !== '') {
    const d0 = Number(d0Str.trim());
    if (Number.isNaN(d0) || d0 !== 0) {
      return { isValid: false, totalM: null, cumDists: [] };
    }
  }

  const cumDists: number[] = [0];
  let runningTotal = 0;

  for (let i = 1; i < rows.length; i++) {
    const dStr = rows[i]?.dist;
    if (dStr === undefined || dStr === null || dStr.trim() === '') {
      return { isValid: false, totalM: null, cumDists: [] };
    }
    const val = Number(dStr.trim());
    if (Number.isNaN(val) || !Number.isFinite(val) || val < 0) {
      return { isValid: false, totalM: null, cumDists: [] };
    }
    runningTotal = Number((runningTotal + val).toFixed(6));
    cumDists.push(runningTotal);
  }

  if (runningTotal <= 0) {
    return { isValid: false, totalM: null, cumDists: [] };
  }

  return {
    isValid: true,
    totalM: runningTotal,
    cumDists,
  };
}

export function formatMetres(metres: number): string {
  if (Number.isInteger(metres)) {
    return `${metres} m`;
  }
  const fixed = metres.toFixed(6);
  const trimmed = fixed.replace(/\.?0+$/, '');
  if (trimmed === '' || trimmed === '0') {
    return `${metres} m`;
  }
  return `${trimmed} m`;
}

export function formatMeasuredLineLength(
  totalM: number | null,
  totalDistanceKm?: string | null,
): string {
  if (totalM === null || totalM <= 0) {
    return '—';
  }
  const mStr = formatMetres(totalM);
  const km = totalM / 1000;
  if (Number(km.toFixed(3)) === 0) {
    return mStr;
  }
  const decPart = mStr.replace(/ m$/, '').split('.')[1] || '';
  const mDecimals = decPart.length;
  if (mDecimals > 0) {
    const kmDecimals = Math.max(3, Math.min(9, 3 + mDecimals));
    const kmFixed = km.toFixed(kmDecimals);
    const kmTrimmed = kmFixed.replace(/0+$/, '');
    const kmStr = (kmTrimmed.split('.')[1] || '').length < 3 ? km.toFixed(3) : kmTrimmed;
    return `${mStr} (${kmStr} km)`;
  }
  const kmStr =
    totalDistanceKm !== undefined && totalDistanceKm !== null && totalDistanceKm.trim() !== ''
      ? totalDistanceKm.trim()
      : km.toFixed(3);
  return `${mStr} (${kmStr} km)`;
}
