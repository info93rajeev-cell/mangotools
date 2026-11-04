import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export const SAMPLE_START_RL = '100.000';
export const SAMPLE_CLOSING_RL = '99.805';

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
    // Nonzero value smaller than 0.0005 m — preserve decimal precision
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
      return obs;
    }),
  };
  if (closingRL.trim()) {
    input.closingRL = closingRL.trim();
  }
  return { input, params: { method: 'rise-fall' } };
}
