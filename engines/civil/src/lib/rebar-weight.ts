/**
 * Shared theoretical reinforcement steel unit weight and total weight calculations.
 * Referenced standards:
 * - IS 1786:2008 Clause 6.2, Page 2 & Table 1 (Density 7850 kg/m3)
 * - IS 875 (Part 1):1987 Table 1, Item 38, Page 14 (Steel density 7850 kg/m3)
 */
import { div, mul } from '@mangotools/engine-numeric';
import { PI } from './units-v2.ts';

/** Steel density per IS 1786:2008 Cl. 6.2 and IS 875 (Part 1):1987 Table 1 Item 38 */
export const STEEL_DENSITY_KG_PER_M3 = '7850';

/**
 * Standard metric nominal bar diameters and published mass per metre
 * from IS 1786:2008 Table 1.
 */
export const IS_1786_NOMINAL_WEIGHTS_KG_PER_M: Readonly<Record<string, string>> = {
  '4': '0.099',
  '5': '0.154',
  '6': '0.222',
  '8': '0.395',
  '10': '0.617',
  '12': '0.888',
  '16': '1.58',
  '20': '2.47',
  '25': '3.85',
  '28': '4.83',
  '32': '6.31',
  '36': '7.99',
  '40': '9.86',
};

/**
 * Computes theoretical rebar unit weight in kg/m from diameter in mm.
 * If usePublishedTable is true and the diameter is in IS 1786 Table 1, returns the exact published nominal weight.
 * Otherwise, calculates exact theoretical mass = (PI * d^2 / (4 * 10^6)) * 7850 kg/m3.
 */
export function rebarUnitWeightKgPerM(diameterMm: string, usePublishedTable = true): string {
  if (usePublishedTable && IS_1786_NOMINAL_WEIGHTS_KG_PER_M[diameterMm]) {
    return IS_1786_NOMINAL_WEIGHTS_KG_PER_M[diameterMm];
  }
  const diameterM = div(diameterMm, '1000', 10);
  const areaM2 = mul(mul(diameterM, diameterM), div(PI, '4', 12));
  return mul(areaM2, STEEL_DENSITY_KG_PER_M3);
}

/**
 * Computes total weight in kg from unit weight (kg/m) and total length (m).
 */
export function rebarTotalWeightKg(unitWeightKgPerM: string, totalLengthM: string): string {
  return mul(unitWeightKgPerM, totalLengthM);
}

/**
 * Computes total weight in metric tonnes from total weight in kg.
 */
export function rebarTotalTonnes(totalWeightKg: string): string {
  return div(totalWeightKg, '1000', 6);
}
