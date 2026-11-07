import type { WorkingStep } from '@mangotools/core';

export interface BaseRow {
  station?: string;
  remarks?: string;
  bs: string | null;
  is: string | null;
  fs: string | null;
  hi?: string | null;
  rise: string | null;
  fall: string | null;
  rl: string;
  isChangePoint: boolean;
  dist: string | null;
}

export interface RawReductionResult {
  baseRows: BaseRow[];
  working: WorkingStep[];
  endingRL: string;
  setupIndices: number[];
  setupsCount: number;
  sumRise: string | null;
  sumFall: string | null;
  riseFallDelta: string | null;
}
