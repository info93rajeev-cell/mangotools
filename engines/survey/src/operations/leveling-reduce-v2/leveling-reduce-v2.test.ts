import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { levelingReduce } from '../leveling-reduce/operation.ts';
import { levelingReduceV2 } from './operation.ts';
import { levelingOutputV2 } from './schema.ts';

const runV2 = (input: unknown, params: unknown = {}) =>
  executeOperation(levelingReduceV2, input, params, createTestContext());

const runV1 = (input: unknown, params: unknown = {}) =>
  executeOperation(levelingReduce, input, params, createTestContext());

describe('survey.leveling.reduce@2 engine', () => {
  it('guarantees backward compatibility: survey.leveling.reduce@1 remains published, operational and identical', async () => {
    const v1Input = {
      startRL: '100.000',
      closingRL: '99.805',
      observations: [
        { station: 'BM-1', bs: '1.500' },
        { station: 'A', is: '1.200' },
        { station: 'CP1', fs: '2.000', bs: '0.800' },
        { station: 'B', is: '1.100' },
        { station: 'CP2', fs: '0.600', bs: '2.300' },
        { station: 'BM-2', fs: '2.200' },
      ],
    };
    const resV1 = await runV1(v1Input);
    expect(resV1.ok).toBe(true);
    if (!resV1.ok) return;
    expect(resV1.value).toMatchObject({
      startingRL: '100',
      endingRL: '99.8',
      misclosure: '-0.005',
    });
    // @1 does not have corr, adjustedRL, allowableError, or totalDistanceKm
    expect(resV1.value).not.toHaveProperty('totalDistanceKm');
    expect(resV1.value).not.toHaveProperty('allowableError');
    expect(resV1.value).not.toHaveProperty('closureStatus');
  });

  it('runs the approved six-station example with distance-based adjustment and C=24 mm/sqrt(km)', async () => {
    const sampleInput = {
      startRL: '100.000',
      closingRL: '99.805',
      observations: [
        { station: 'BM-1', bs: '1.500', dist: '0', remarks: 'Start BM' },
        { station: 'A', is: '1.200', dist: '30' },
        { station: 'CP1', fs: '2.000', bs: '0.800', dist: '30', remarks: 'Change point' },
        { station: 'B', is: '1.100', dist: '25' },
        { station: 'CP2', fs: '0.600', bs: '2.300', dist: '35', remarks: 'Change point' },
        { station: 'BM-2', fs: '2.200', dist: '40', remarks: 'Closing BM' },
      ],
    };
    const res = await runV2(sampleInput, {
      method: 'rise-fall',
      adjBy: 'distance',
      kConstant: '24',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const out = levelingOutputV2.parse(res.value);

    expect(out.startingRL).toBe('100');
    expect(out.endingRL).toBe('99.8');
    expect(out.closingRL).toBe('99.805');
    expect(out.misclosure).toBe('-0.005');
    expect(out.totalDistanceKm).toBe('0.160');
    expect(out.allowableError).toBe('9.6');
    expect(out.closureStatus).toBe('pass');
    expect(out.setupsCount).toBe(3);

    // Verify distance corrections and adjusted RLs
    expect(out.rows.map((r) => [r.station, r.corr, r.adjustedRL])).toEqual([
      ['BM-1', '0.0', '100.000'],
      ['A', '+0.9', '100.301'],
      ['CP1', '+1.9', '99.502'],
      ['B', '+2.7', '99.203'],
      ['CP2', '+3.8', '99.704'],
      ['BM-2', '+5.0', '99.805'],
    ]);

    // Check terminal invariant
    expect(out.rows[5]?.adjustedRL).toBe('99.805');
  });

  it('runs the approved six-station example with setup-based adjustment', async () => {
    const sampleInput = {
      startRL: '100.000',
      closingRL: '99.805',
      observations: [
        { station: 'BM-1', bs: '1.500', dist: '0', remarks: 'Start BM' },
        { station: 'A', is: '1.200', dist: '30' },
        { station: 'CP1', fs: '2.000', bs: '0.800', dist: '30', remarks: 'Change point' },
        { station: 'B', is: '1.100', dist: '25' },
        { station: 'CP2', fs: '0.600', bs: '2.300', dist: '35', remarks: 'Change point' },
        { station: 'BM-2', fs: '2.200', dist: '40', remarks: 'Closing BM' },
      ],
    };
    const res = await runV2(sampleInput, {
      method: 'rise-fall',
      adjBy: 'setup',
      kConstant: '24',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const out = levelingOutputV2.parse(res.value);

    expect(out.setupsCount).toBe(3);
    expect(out.rows.map((r) => [r.station, r.corr, r.adjustedRL])).toEqual([
      ['BM-1', '0.0', '100.000'],
      ['A', '+1.7', '100.302'],
      ['CP1', '+1.7', '99.502'],
      ['B', '+3.3', '99.203'],
      ['CP2', '+3.3', '99.703'],
      ['BM-2', '+5.0', '99.805'],
    ]);
  });

  it('falls back to adjBy: none on open lines without failing', async () => {
    const openInput = {
      startRL: '100.000',
      observations: [
        { station: 'BM-1', bs: '1.500', dist: '0' },
        { station: 'BM-2', fs: '2.200', dist: '40' },
      ],
    };
    const res = await runV2(openInput, { adjBy: 'distance' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const out = levelingOutputV2.parse(res.value);
    expect(out.closingRL).toBeNull();
    expect(out.misclosure).toBeNull();
    expect(out.allowableError).toBeNull();
    expect(out.closureStatus).toBeNull();
    expect(out.rows.every((r) => r.corr === null && r.adjustedRL === null)).toBe(true);
  });

  it('reports criterion-not-provided when kConstant is omitted, while still calculating misclosure and adjustment', async () => {
    const input = {
      startRL: '100.000',
      closingRL: '99.805',
      observations: [
        { station: 'BM-1', bs: '1.500', dist: '0' },
        { station: 'BM-2', fs: '2.200', dist: '40' },
      ],
    };
    const res = await runV2(input, { adjBy: 'distance' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const out = levelingOutputV2.parse(res.value);
    expect(out.misclosure).toBe('-0.505');
    expect(out.allowableError).toBeNull();
    expect(out.closureStatus).toBe('criterion-not-provided');
    expect(out.rows[1]?.corr).toBe('+505.0');
    expect(out.rows[1]?.adjustedRL).toBe('99.805');
  });

  it('evaluates acceptance comparison using the unrounded threshold', async () => {
    // K = 160m = 0.16km -> sqrt(K) = 0.4. C = 23.975 -> limit = 9.59mm (displays 9.6)
    // Case A: e = 9.59mm -> pass
    const passInput = {
      startRL: '100.000',
      closingRL: '100.00959',
      observations: [
        { bs: '1.000', dist: '0' },
        { fs: '1.000', dist: '160' },
      ],
    };
    const passRes = await runV2(passInput, { kConstant: '23.975' });
    expect(passRes.ok).toBe(true);
    if (passRes.ok) {
      expect(passRes.value.allowableError).toBe('9.6');
      expect(passRes.value.closureStatus).toBe('pass');
    }

    // Case B: e = 9.60mm -> fail (despite display limit being 9.6)
    const failInput = {
      startRL: '100.000',
      closingRL: '100.00960',
      observations: [
        { bs: '1.000', dist: '0' },
        { fs: '1.000', dist: '160' },
      ],
    };
    const failRes = await runV2(failInput, { kConstant: '23.975' });
    expect(failRes.ok).toBe(true);
    if (failRes.ok) {
      expect(failRes.value.allowableError).toBe('9.6');
      expect(failRes.value.closureStatus).toBe('fail');
    }
  });

  it('executes height-of-instrument method correctly on the approved six-station example', async () => {
    const sampleInput = {
      startRL: '100.000',
      closingRL: '99.805',
      observations: [
        { station: 'BM-1', bs: '1.500', dist: '0', remarks: 'Start BM' },
        { station: 'A', is: '1.200', dist: '30' },
        { station: 'CP1', fs: '2.000', bs: '0.800', dist: '30', remarks: 'Change point' },
        { station: 'B', is: '1.100', dist: '25' },
        { station: 'CP2', fs: '0.600', bs: '2.300', dist: '35', remarks: 'Change point' },
        { station: 'BM-2', fs: '2.200', dist: '40', remarks: 'Closing BM' },
      ],
    };
    const res = await runV2(sampleInput, {
      method: 'height-of-instrument',
      adjBy: 'distance',
      kConstant: '24',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const val = res.value as unknown as LevelingOutputV2;
    expect(val.startingRL).toBe('100');
    expect(val.endingRL).toBe('99.8');
    expect(val.closingRL).toBe('99.805');
    expect(val.misclosure).toBe('-0.005');
    expect(val.totalDistanceKm).toBe('0.160');
    expect(val.allowableError).toBe('9.6');
    expect(val.closureStatus).toBe('pass');
    expect(val.setupsCount).toBe(3);

    // Truthful HI metrics: no fabricated Rise/Fall totals
    expect(val.sumRise).toBeNull();
    expect(val.sumFall).toBeNull();
    expect(val.riseFallDelta).toBeNull();

    // Truthful HI checks: only first/last check
    expect(val.checks).toHaveLength(1);
    expect(val.checks[0]).toEqual({
      id: 'arithmetic-first-last',
      labelKey: 'leveling.check.firstLast',
      status: 'pass',
      expected: '-0.2',
      actual: '-0.2',
    });

    // Per-row truthful HI and collimation heights
    expect(val.rows.map((r) => r.hi)).toEqual(['101.5', null, '100.3', null, '102', null]);
    expect(val.rows.every((r) => r.rise === null && r.fall === null)).toBe(true);
    expect(val.rows.map((r) => r.rl)).toEqual(['100', '100.3', '99.5', '99.2', '99.7', '99.8']);
    expect(val.rows.map((r) => r.corr)).toEqual(['0.0', '+0.9', '+1.9', '+2.7', '+3.8', '+5.0']);
    expect(val.rows.map((r) => r.adjustedRL)).toEqual([
      '100.000',
      '100.301',
      '99.502',
      '99.203',
      '99.704',
      '99.805',
    ]);
  });

  it('verifies exact mathematical equivalence of raw RLs between Rise & Fall and Height of Instrument', async () => {
    const complexBook = {
      startRL: '254.125',
      closingRL: '252.880',
      observations: [
        { station: 'BM-A', bs: '2.450', dist: '0' },
        { station: 'P1', is: '1.875', dist: '25.5' },
        { station: 'P2', is: '0.940', dist: '20' },
        { station: 'CP1', fs: '3.115', bs: '1.205', dist: '42' },
        { station: 'P3', is: '2.005', dist: '18' },
        { station: 'CP2', fs: '0.850', bs: '2.890', dist: '35.5' },
        { station: 'P4', is: '1.555', dist: '30' },
        { station: 'BM-B', fs: '1.925', dist: '28' },
      ],
    };
    const rfRes = await runV2(complexBook, { method: 'rise-fall' });
    const hiRes = await runV2(complexBook, { method: 'height-of-instrument' });

    expect(rfRes.ok).toBe(true);
    expect(hiRes.ok).toBe(true);
    if (!rfRes.ok || !hiRes.ok) return;

    expect(hiRes.value.rows.map((r) => r.rl)).toEqual(rfRes.value.rows.map((r) => r.rl));
    expect(hiRes.value.endingRL).toBe(rfRes.value.endingRL);
    expect(hiRes.value.misclosure).toBe(rfRes.value.misclosure);
    expect(hiRes.value.setupsCount).toBe(rfRes.value.setupsCount);
    expect(hiRes.value.bsFsDelta).toBe(rfRes.value.bsFsDelta);
  });

  it('handles consecutive change points under height-of-instrument without comparing FS and BS', async () => {
    const cpBook = {
      startRL: '100.000',
      observations: [
        { station: 'BM-1', bs: '2.000' },
        { station: 'CP1', fs: '1.000', bs: '3.000' },
        { station: 'CP2', fs: '2.000', bs: '1.500' },
        { station: 'BM-2', fs: '1.000' },
      ],
    };
    const res = await runV2(cpBook, { method: 'height-of-instrument' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.rows[0].hi).toBe('102');
    expect(res.value.rows[1].rl).toBe('101');
    expect(res.value.rows[1].hi).toBe('104');
    expect(res.value.rows[2].rl).toBe('102');
    expect(res.value.rows[2].hi).toBe('103.5');
    expect(res.value.rows[3].rl).toBe('102.5');
    expect(res.value.rows[3].hi).toBeNull();
  });

  it('returns SURVEY_LEVELING_ZERO_TOTAL_DISTANCE when adjBy: distance has sum=0', async () => {
    const res = await runV2(
      {
        startRL: '100.000',
        closingRL: '100.000',
        observations: [
          { bs: '1.000', dist: '0' },
          { fs: '1.000', dist: '0' },
        ],
      },
      { adjBy: 'distance' },
    );
    expect(res).toEqual({
      ok: false,
      error: {
        code: 'SURVEY_LEVELING_ZERO_TOTAL_DISTANCE',
        path: 'observations',
        messageKey: 'errors.SURVEY_LEVELING_ZERO_TOTAL_DISTANCE',
      },
    });
  });

  it('returns SURVEY_LEVELING_MISSING_DISTANCE when an intermediate row lacks distance under adjBy: distance', async () => {
    const res = await runV2(
      {
        startRL: '100.000',
        closingRL: '100.000',
        observations: [{ bs: '1.000', dist: '0' }, { is: '1.100' }, { fs: '1.000', dist: '50' }],
      },
      { adjBy: 'distance' },
    );
    expect(res).toEqual({
      ok: false,
      error: {
        code: 'SURVEY_LEVELING_MISSING_DISTANCE',
        path: 'observations.1.dist',
        messageKey: 'errors.SURVEY_LEVELING_MISSING_DISTANCE',
      },
    });
  });

  it('returns SURVEY_LEVELING_NEGATIVE_DISTANCE when distance is negative', async () => {
    const res = await runV2({
      startRL: '100.000',
      observations: [
        { bs: '1.000', dist: '0' },
        { fs: '1.000', dist: '-5' },
      ],
    });
    expect(res).toEqual({
      ok: false,
      error: {
        code: 'SURVEY_LEVELING_NEGATIVE_DISTANCE',
        path: 'observations.1.dist',
        messageKey: 'errors.SURVEY_LEVELING_NEGATIVE_DISTANCE',
      },
    });
  });

  it('rejects nonzero start station distance with SURVEY_LEVELING_START_DISTANCE_NONZERO', async () => {
    const res = await runV2({
      startRL: '100.000',
      observations: [
        { bs: '1.000', dist: '10' },
        { fs: '1.000', dist: '20' },
      ],
    });
    expect(res).toEqual({
      ok: false,
      error: {
        code: 'SURVEY_LEVELING_START_DISTANCE_NONZERO',
        path: 'observations.0.dist',
        messageKey: 'errors.SURVEY_LEVELING_START_DISTANCE_NONZERO',
      },
    });
  });

  it('reports closureStatus distance-not-provided when kConstant is supplied but distances are absent or partial', async () => {
    const entirelyAbsent = await runV2(
      {
        startRL: '100.000',
        closingRL: '100.005',
        observations: [{ bs: '1.000' }, { fs: '1.000' }],
      },
      { kConstant: '24' },
    );
    expect(entirelyAbsent.ok).toBe(true);
    if (entirelyAbsent.ok) {
      expect(entirelyAbsent.value.closureStatus).toBe('distance-not-provided');
      expect(entirelyAbsent.value.allowableError).toBeNull();
      expect(entirelyAbsent.value.totalDistanceKm).toBeNull();
    }

    const partial = await runV2(
      {
        startRL: '100.000',
        closingRL: '100.005',
        observations: [{ bs: '1.000', dist: '0' }, { is: '1.100', dist: '40' }, { fs: '1.000' }],
      },
      { kConstant: '24', adjBy: 'setup' },
    );
    expect(partial.ok).toBe(true);
    if (partial.ok) {
      expect(partial.value.closureStatus).toBe('distance-not-provided');
      expect(partial.value.allowableError).toBeNull();
      expect(partial.value.totalDistanceKm).toBeNull();
    }
  });
});
