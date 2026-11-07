import { describe, expect, it } from 'vitest';
import {
  type BrushStroke,
  composeGlassMask,
  hasNoEdits,
  isEmptySelection,
} from './selectionMask.ts';

const noPath = { points: [], isClosed: false };
const stroke = (mode: BrushStroke['mode']): BrushStroke => ({
  mode,
  radius: 10,
  points: [{ x: 1, y: 1 }],
});

describe('selection state', () => {
  it('a freshly loaded photo has no edits, so the stage shows the photo', () => {
    expect(hasNoEdits({ path: noPath, strokes: [], aiMask: null })).toBe(true);
  });

  it('an open pen path is not a selection until it is closed', () => {
    const point = { id: 'p1', x: 0, y: 0, cp1x: 0, cp1y: 0, cp2x: 0, cp2y: 0, isSmooth: false };
    const pts = [point, { ...point, id: 'p2', x: 5 }, { ...point, id: 'p3', y: 5 }];
    expect(hasNoEdits({ path: { points: pts, isClosed: false }, strokes: [], aiMask: null })).toBe(
      true,
    );
    expect(hasNoEdits({ path: { points: pts, isClosed: true }, strokes: [], aiMask: null })).toBe(
      false,
    );
  });

  it('a pen path with fewer than three points is not a selection yet', () => {
    const point = { id: 'p1', x: 0, y: 0, cp1x: 0, cp1y: 0, cp2x: 0, cp2y: 0, isSmooth: false };
    const path = { points: [point, { ...point, id: 'p2', x: 5 }], isClosed: false };
    expect(hasNoEdits({ path, strokes: [], aiMask: null })).toBe(true);
  });

  it('Brush Remove on an empty selection counts as an edit (erases from the whole photo)', () => {
    const src = { path: noPath, strokes: [stroke('remove')], aiMask: null };
    expect(isEmptySelection(src)).toBe(true);
    expect(hasNoEdits(src)).toBe(false);
  });

  it('Brush Add makes a selection', () => {
    const src = { path: noPath, strokes: [stroke('add')], aiMask: null };
    expect(isEmptySelection(src)).toBe(false);
    expect(hasNoEdits(src)).toBe(false);
  });

  it('Glass stroke adds to selection and composeGlassMask returns a mask', () => {
    const src = { path: noPath, strokes: [stroke('glass')], aiMask: null };
    expect(isEmptySelection(src)).toBe(false);
    expect(hasNoEdits(src)).toBe(false);
    const mask = composeGlassMask(100, 100, src.strokes);
    expect(mask).not.toBeNull();
  });

  it('unglass stroke does not change selection and composeGlassMask is null without glass strokes', () => {
    const src = { path: noPath, strokes: [stroke('unglass')], aiMask: null };
    expect(isEmptySelection(src)).toBe(true);
    expect(hasNoEdits(src)).toBe(false);
    const mask = composeGlassMask(100, 100, src.strokes);
    expect(mask).toBeNull();
  });
});
