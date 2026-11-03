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

export function formatReading(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(3);
}

export function formatSigned(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  const sign = num > 0 ? '+' : num < 0 ? '−' : '';
  return `${sign}${Math.abs(num).toFixed(3)}`;
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
