/**
 * Shared exact constants for the civil `@2` operations. Every factor is an exact decimal string (the
 * international inch and foot of 1959 and the US liquid gallon are defined exactly), so metric and
 * imperial inputs describing the same object give the same result.
 */
export const lengthUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type LengthUnit = (typeof lengthUnits)[number];

/** One input unit in metres. */
export const METRES_PER_UNIT: Readonly<Record<LengthUnit, string>> = {
  mm: '0.001',
  cm: '0.01',
  m: '1',
  in: '0.0254',
  ft: '0.3048',
};

/** Units whose results are presented in imperial (ft², ft³, yd³, US gal) first. */
export const IMPERIAL_UNITS: ReadonlySet<LengthUnit> = new Set(['in', 'ft']);

/** Exact: 1 ft² = 0.09290304 m². */
export const SQUARE_METRES_PER_SQUARE_FOOT = '0.09290304';
/** Exact: 1 ft³ = 0.028316846592 m³. */
export const CUBIC_METRES_PER_CUBIC_FOOT = '0.028316846592';
/** Exact: 1 yd³ = 0.764554857984 m³. */
export const CUBIC_METRES_PER_CUBIC_YARD = '0.764554857984';
/** Exact: 1 US liquid gallon = 3.785411784 L. */
export const LITRES_PER_US_GALLON = '3.785411784';
/** π to 20 decimal places — far beyond any displayed precision. */
export const PI = '3.14159265358979323846';

/** Decimal places accepted in a measurement (allows exact-enough unit-converted values). */
export const MEASURE_DECIMALS = 12;
/** Decimal places accepted in a percentage. */
export const PERCENT_DECIMALS = 2;
/** Largest count of identical members, walls, rooms or pits. */
export const MAX_COUNT = '1000000';

/** Soft sanity ceiling for a member/wall/room dimension, in metres (unit-mistake warning only). */
export const MAX_REALISTIC_DIMENSION_M = '100';
