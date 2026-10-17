import Big from 'big.js';
import { describe, expect, it } from 'vitest';
import reference from '../reference/geometry.json';
import { cosDegrees, degreesToRadians, hypot2, sinDegrees } from './index.ts';

const functions = { degreesToRadians, sinDegrees, cosDegrees, hypot2 };
const Decimal = Big();
Decimal.DP = 1200; // Test-only isolated constructor: exact binary64, including 2^-1074.
const epsilon = new Decimal(2).pow(-52);
const quantum = new Decimal(2).pow(-1074);

function bits(value: number): bigint {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false);
}

function exact(value: number): Big {
  const raw = bits(value);
  const exponent = Number((raw >> 52n) & 2047n);
  const significand = (raw & ((1n << 52n) - 1n)) + (exponent ? 1n << 52n : 0n);
  return new Decimal(significand.toString())
    .times(new Decimal(2).pow(exponent ? exponent - 1075 : -1074))
    .times(raw >> 63n ? -1 : 1);
}

describe('bounded deterministic geometry', () => {
  it.each(reference.vectors)('$id $name matches independent MPFR bounds', (vector) => {
    expect(vector.args.map((arg) => bits(arg).toString(16).padStart(16, '0'))).toEqual(
      vector.inputBits,
    );
    const result = functions[vector.name as keyof typeof functions](vector.args[0], vector.args[1]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number.isFinite(result.value)).toBe(true);
    expect(Object.is(result.value, -0)).toBe(false);
    expect(bits(result.value).toString(16).padStart(16, '0')).toBe(vector.algorithmBits);
    const truth = new Decimal(vector.reference);
    const multiplier = vector.name === 'hypot2' ? 4 : 2;
    const limit = epsilon
      .times(multiplier)
      .times(vector.name.endsWith('Degrees') ? 1 : truth.abs())
      .plus(vector.name.endsWith('Degrees') ? 0 : quantum);
    expect(exact(result.value).minus(truth).abs().lte(limit)).toBe(true);
    const distance = bits(result.value) - BigInt(`0x${vector.nearestBits}`);
    expect(distance >= -4n && distance <= 4n).toBe(true);
    if (!truth.eq(0) && BigInt(`0x${vector.nearestBits}`) !== 0n) expect(result.value).not.toBe(0);
  });

  it.each([
    [0, 0, 1],
    [90, 1, 0],
    [180, 0, -1],
    [270, -1, 0],
  ])('exact cardinal %s', (d, s, c) => {
    expect(sinDegrees(d)).toEqual({ ok: true, value: s });
    expect(cosDegrees(d)).toEqual({ ok: true, value: c });
  });

  it('preserves axes, 3-4-5 and normalizes negative zero', () => {
    for (const [x, y] of [
      [3, 4],
      [4, 3],
      [-3, 4],
      [3, -4],
      [-4, -3],
    ]) {
      expect(hypot2(x, y)).toEqual({ ok: true, value: 5 });
    }
    expect(hypot2(-0, -0)).toEqual({ ok: true, value: 0 });
    expect(degreesToRadians(-0)).toEqual({ ok: true, value: 0 });
  });

  it('bounds kernel-attributable error in 50-term weighted geometry', () => {
    const rows = reference.vectors.filter((row) => row.name === 'cosDegrees');
    const components = ['cosDegrees', 'sinDegrees'] as const;
    const measured = components.map((name) => {
      let actual = new Decimal(0);
      let truth = new Decimal(0);
      let baseline = new Decimal(0);
      for (let i = 0; i < 50; i++) {
        const row = reference.vectors.find(
          (v) => v.name === name && v.args[0] === rows[i % rows.length].args[0],
        );
        if (!row) throw new Error('Missing paired independent reference');
        const result = functions[name](row.args[0]);
        if (!result.ok) throw new Error('Unexpected geometry error');
        actual = actual.plus(exact(result.value * 1e6));
        truth = truth.plus(new Decimal(row.reference).times(1e6));
        baseline = baseline.plus(exact(Number(row.reference) * 1e6));
      }
      expect(actual.minus(truth).abs().lte(epsilon.times(2.5).times(5e7))).toBe(true);
      expect(actual.minus(baseline).abs().lte(epsilon.times(4).times(5e7))).toBe(true);
      return { actual, truth };
    });
    const norm = hypot2(Number(measured[0].actual), Number(measured[1].actual));
    if (!norm.ok) throw new Error('Unexpected norm error');
    const truth = measured[0].truth.pow(2).plus(measured[1].truth.pow(2)).sqrt();
    expect(exact(norm.value).minus(truth).abs().lte(epsilon.times(8).times(5e7))).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity, '1', null, undefined, new Number(1)])(
    'rejects invalid %s',
    (value) => {
      for (const fn of [degreesToRadians, sinDegrees, cosDegrees]) {
        expect(fn(value as number)).toEqual({
          ok: false,
          code: 'NUMERIC_GEOMETRY_INVALID_NUMBER',
          argument: 'degrees',
        });
      }
      expect(hypot2(value as number, 0)).toEqual({
        ok: false,
        code: 'NUMERIC_GEOMETRY_INVALID_NUMBER',
        argument: 'x',
      });
      expect(hypot2(0, value as number)).toEqual({
        ok: false,
        code: 'NUMERIC_GEOMETRY_INVALID_NUMBER',
        argument: 'y',
      });
    },
  );

  it.each([-Number.MIN_VALUE, -1, 360, 1e8])('rejects degree range %s', (value) => {
    for (const fn of [degreesToRadians, sinDegrees, cosDegrees]) {
      expect(fn(value)).toEqual({
        ok: false,
        code: 'NUMERIC_GEOMETRY_OUT_OF_RANGE',
        argument: 'degrees',
      });
    }
  });

  it('validates all finite types before ranges in signature order', () => {
    const invalid = 'NUMERIC_GEOMETRY_INVALID_NUMBER';
    const range = 'NUMERIC_GEOMETRY_OUT_OF_RANGE';
    for (const [x, y, code, argument] of [
      [NaN, NaN, invalid, 'x'],
      [1e8 + 1, NaN, invalid, 'y'],
      [1e8 + 1, -1e8 - 1, range, 'x'],
      [0, -1e8 - 1, range, 'y'],
    ] as const) {
      expect(hypot2(x, y)).toEqual({ ok: false, code, argument });
    }
  });
});
