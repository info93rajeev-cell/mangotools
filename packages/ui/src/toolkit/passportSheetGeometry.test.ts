import { describe, expect, it } from 'vitest';
import { computeSheetLayout, resolvePassportPhysicalSize } from './passportSheetGeometry.ts';

describe('passportSheetGeometry', () => {
  it('resolves correct physical dimensions for official presets', () => {
    expect(resolvePassportPhysicalSize('in', 413, 531)).toEqual({ widthMm: 35, heightMm: 45 });
    expect(resolvePassportPhysicalSize('us', 600, 600)).toEqual({ widthMm: 50.8, heightMm: 50.8 });
    expect(resolvePassportPhysicalSize('schengen', 413, 531)).toEqual({
      widthMm: 35,
      heightMm: 45,
    });
    expect(resolvePassportPhysicalSize('ssc_upsc', 350, 450)).toEqual({
      widthMm: 35,
      heightMm: 45,
    });
    expect(resolvePassportPhysicalSize('pan', 213, 213)).toEqual({ widthMm: 25, heightMm: 25 });
  });

  it('computes 5 photos in single row on A4 paper with high blank area for studio reuse', () => {
    const layout = computeSheetLayout('a4', 35, 45, 5);
    expect(layout.cols).toBe(5);
    expect(layout.slots.length).toBe(5);
    // All 5 photos should be in row 0
    for (const slot of layout.slots) {
      expect(slot.row).toBe(0);
      expect(slot.yMm).toBe(8);
      expect(slot.widthMm).toBe(35);
      expect(slot.heightMm).toBe(45);
    }
    // High blank reusable paper percentage (above 75%)
    expect(layout.blankPercent).toBeGreaterThan(75);
    expect(layout.cutoffYMm).toBeLessThan(70);
  });

  it('computes multi-row layout on 4x6 inch studio paper', () => {
    const layout = computeSheetLayout('4x6', 35, 45, 6);
    expect(layout.cols).toBeGreaterThanOrEqual(3);
    expect(layout.rowsCapacity).toBeGreaterThanOrEqual(2);
    expect(layout.slots.length).toBe(6);
    expect(layout.slots[0].row).toBe(0);
    expect(layout.slots[layout.slots.length - 1].row).toBe(1);
  });

  it('handles US 2x2 inch visa layout on A4 paper', () => {
    const layout = computeSheetLayout('a4', 50.8, 50.8, 6);
    expect(layout.cols).toBe(3); // (210 - 16) / (50.8 + 3) = 194 / 53.8 = 3
    expect(layout.slots.length).toBe(6);
    expect(layout.slots[0].row).toBe(0);
    expect(layout.slots[2].row).toBe(0);
    expect(layout.slots[3].row).toBe(1);
    expect(layout.slots[5].row).toBe(1);
  });
});
