import { describe, expect, it } from 'vitest';
import {
  IS_1786_NOMINAL_WEIGHTS_KG_PER_M,
  rebarTotalTonnes,
  rebarTotalWeightKg,
  rebarUnitWeightKgPerM,
  STEEL_DENSITY_KG_PER_M3,
} from './rebar-weight.ts';

describe('rebar-weight', () => {
  it('has correct standard steel density per IS 1786 Cl. 6.2 and IS 875 (Part 1) Table 1 Item 38', () => {
    expect(STEEL_DENSITY_KG_PER_M3).toBe('7850');
  });

  it('exposes published nominal weights dictionary', () => {
    expect(IS_1786_NOMINAL_WEIGHTS_KG_PER_M['12']).toBe('0.888');
    expect(IS_1786_NOMINAL_WEIGHTS_KG_PER_M['16']).toBe('1.58');
  });

  it('matches published nominal masses from IS 1786:2008 Table 1', () => {
    expect(rebarUnitWeightKgPerM('6')).toBe('0.222');
    expect(rebarUnitWeightKgPerM('8')).toBe('0.395');
    expect(rebarUnitWeightKgPerM('10')).toBe('0.617');
    expect(rebarUnitWeightKgPerM('12')).toBe('0.888');
    expect(rebarUnitWeightKgPerM('16')).toBe('1.58');
    expect(rebarUnitWeightKgPerM('20')).toBe('2.47');
    expect(rebarUnitWeightKgPerM('25')).toBe('3.85');
    expect(rebarUnitWeightKgPerM('28')).toBe('4.83');
    expect(rebarUnitWeightKgPerM('32')).toBe('6.31');
    expect(rebarUnitWeightKgPerM('36')).toBe('7.99');
    expect(rebarUnitWeightKgPerM('40')).toBe('9.86');
  });

  it('computes theoretical weight from density when published table is bypassed', () => {
    // For 10 mm bar: Area = pi * 0.01^2 / 4 = 7.85398163397e-5 m2. Mass = area * 7850 ~= 0.616537... kg/m
    const calculated = rebarUnitWeightKgPerM('10', false);
    expect(calculated.startsWith('0.6165')).toBe(true);
  });

  it('calculates total weight in kg and metric tonnes accurately', () => {
    // 100 metres of 12 mm bar @ 0.888 kg/m = 88.8 kg
    const totalKg = rebarTotalWeightKg('0.888', '100');
    expect(totalKg).toBe('88.8');
    const totalTonnes = rebarTotalTonnes(totalKg);
    expect(totalTonnes).toBe('0.0888');
  });
});
