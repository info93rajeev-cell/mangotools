import { describe, expect, it } from 'vitest';
import {
  averagePerPiece,
  compositionItems,
  formatAmount,
  freightView,
  groupFigure,
  trimZeros,
  weightView,
} from './cbmResultFormat.ts';
import {
  type CbmCostResult,
  type CbmResult,
  type CbmSnapshot,
  newPackage,
} from './cbmShipmentModel.ts';

const result = (patch: Partial<CbmResult> = {}): CbmResult => ({
  rows: [],
  totalCbmExact: '6',
  totalCbm: '6.000',
  totalCft: '211.888',
  totalPieces: '100',
  knownPackedWeightKg: null,
  weightCoverage: 'none',
  weightedPieces: '0',
  ...patch,
});

const cost = (patch: Partial<CbmCostResult> = {}): CbmCostResult => ({
  currency: 'INR',
  quantity: '46.8',
  rate: '4500.00',
  baseCharge: '210600.00',
  minimumCharge: null,
  minimumApplied: false,
  freightCharge: '210600.00',
  otherCharges: '2000.00',
  estimatedTotal: '212600.00',
  ...patch,
});

describe('CBM result figures', () => {
  it('groups engine figures without re-rounding them', () => {
    expect(groupFigure('1652.726')).toBe('1,652.726');
    expect(groupFigure('0.000')).toBe('0.000');
    expect(groupFigure('1234567')).toBe('1,234,567');
  });

  it('formats INR with the rupee sign and Indian grouping, other currencies with their code', () => {
    // The approved reference prints whole amounts without paise: "₹ 2,12,600".
    expect(formatAmount('212600', 'INR')).toBe('₹\u00a02,12,600');
    expect(formatAmount('600.00', 'INR')).toBe('₹\u00a0600');
    expect(formatAmount('0.5', 'INR')).toBe('₹\u00a00.50');
    expect(formatAmount('12345678.9', 'INR')).toBe('₹\u00a01,23,45,678.90');
    expect(formatAmount('1234567.5', 'USD')).toBe('USD\u00a01,234,567.50');
    for (const currency of ['EUR', 'GBP', 'AED'])
      expect(formatAmount('2000.00', currency)).toBe(`${currency}\u00a02,000`);
  });

  it('drops only zeros that carry no value from a weight figure', () => {
    expect(trimZeros('8,340.000')).toBe('8,340');
    expect(trimZeros('4.50')).toBe('4.5');
    expect(trimZeros('1200')).toBe('1200');
    expect(trimZeros('0.125')).toBe('0.125');
  });

  it('derives the average CBM per piece exactly, rounding half-up at the selected places', () => {
    expect(averagePerPiece('46.8', '200', 3)).toBe('0.234');
    expect(averagePerPiece('1', '3', 3)).toBe('0.333');
    expect(averagePerPiece('2', '3', 2)).toBe('0.67');
    expect(averagePerPiece('0.0005', '1', 3)).toBe('0.001');
    expect(averagePerPiece('0.00049', '1', 3)).toBe('0.000');
    expect(averagePerPiece('6', '100', 4)).toBe('0.0600');
    expect(averagePerPiece('7', '2', 0)).toBe('4');
  });

  it('refuses an average it cannot derive safely', () => {
    expect(averagePerPiece('6', '0', 3)).toBeNull();
    expect(averagePerPiece('6', '1.5', 3)).toBeNull();
    expect(averagePerPiece('abc', '2', 3)).toBeNull();
    expect(averagePerPiece('6', '2', Number.NaN)).toBeNull();
  });
});

describe('CBM packed weight coverage', () => {
  it('shows no figure when no weight was entered', () => {
    expect(weightView(result())).toEqual({ label: 'Total Weight', value: null, note: null });
  });

  it('labels a partial figure as known weight and explains its coverage', () => {
    const view = weightView(
      result({
        weightCoverage: 'partial',
        knownPackedWeightKg: '4340.000',
        weightedPieces: '190',
        totalPieces: '200',
      }),
    );
    expect(view.label).toBe('Known Weight');
    expect(view.value).toBe('4,340');
    expect(view.note).toBe(
      'Known packed weight (partial): 190 of 200 pieces weighed. Pieces without a weight are not counted.',
    );
  });

  it('shows the full packed weight only when every piece is weighed', () => {
    const view = weightView(result({ weightCoverage: 'complete', knownPackedWeightKg: '300.000' }));
    expect(view).toEqual({ label: 'Total Weight', value: '300', note: null });
  });
});

describe('CBM load composition', () => {
  const state = (packages: CbmSnapshot['packages'], shipment: CbmResult | null) =>
    ({ packages, shipment }) as CbmSnapshot;
  const row = (index: number, exact: string, shown: string) => ({
    index,
    quantity: '1',
    cbmPerPieceExact: exact,
    cbmPerPiece: shown,
    totalCbmExact: exact,
    totalCbm: shown,
    totalWeightKgExact: null,
    totalWeightKg: null,
  });

  it('takes shares from exact values, not from rounded display values', () => {
    const packages = [
      { ...newPackage(7), description: '  Carton\nA ' },
      newPackage(8),
      newPackage(9),
    ];
    const shipment = result({
      totalCbmExact: '0.001125',
      totalCbm: '0.001',
      rows: [row(0, '0.001', '0.001'), row(1, '0.0001', '0.000'), row(2, '0.000025', '0.000')],
    });
    expect(compositionItems(state(packages, shipment))).toEqual([
      { key: 7, number: 1, name: 'Carton A', cbm: '0.001', share: '88.9' },
      { key: 8, number: 2, name: 'Carton 2', cbm: '0.000', share: '8.9' },
      { key: 9, number: 3, name: 'Carton 3', cbm: '0.000', share: '2.2' },
    ]);
  });

  it('is empty without a current shipment result', () => {
    expect(compositionItems(state([newPackage(1)], null))).toEqual([]);
  });
});

describe('CBM freight line', () => {
  it('shows the rate basis when the minimum does not apply', () => {
    expect(freightView(cost())).toEqual({
      label: 'Freight (46.8 m³ × ₹\u00a04,500)',
      value: '₹\u00a02,10,600',
      note: null,
    });
  });

  it('shows the total CBM as the results summary shows it', () => {
    expect(freightView(cost(), '46.800').label).toBe('Freight (46.800 m³ × ₹\u00a04,500)');
  });

  it('keeps the engine minimum-charge semantics when the minimum applies', () => {
    const view = freightView(
      cost({
        quantity: '3.5',
        rate: '2500.00',
        baseCharge: '8750.00',
        minimumCharge: '10000.00',
        minimumApplied: true,
        freightCharge: '10000.00',
      }),
    );
    expect(view).toEqual({
      label: 'Freight (minimum charge applied)',
      value: '₹\u00a010,000',
      note: 'Rate × CBM = ₹\u00a08,750, below your minimum of ₹\u00a010,000.',
    });
  });
});
