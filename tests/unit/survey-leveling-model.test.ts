import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { levelingReduce } from '../../engines/survey/src/operations/leveling-reduce/operation.ts';
import { levelingReduceV2 } from '../../engines/survey/src/operations/leveling-reduce-v2/operation.ts';
import {
  buildLevelingRequest,
  computeValidatedDistance,
  createInitialRows,
  detectRowTag,
  formatMeasuredLineLength,
  formatMetres,
  formatReading,
  formatSigned,
  isChangePointRow,
  SAMPLE_ADJ_BY,
  SAMPLE_CLOSING_RL,
  SAMPLE_K_CONSTANT,
  SAMPLE_ROWS,
  SAMPLE_START_RL,
} from '../../packages/ui/src/toolkit/survey/surveyLevelingModel.ts';

describe('Survey Leveling Model', () => {
  it('identifies change points only when both BS and FS are present', () => {
    expect(
      isChangePointRow({
        id: '1',
        station: 'A',
        bs: '1.2',
        is: '',
        fs: '0.8',
        dist: '',
        remarks: '',
      }),
    ).toBe(true);
    expect(
      isChangePointRow({ id: '2', station: 'B', bs: '1.2', is: '', fs: '', dist: '', remarks: '' }),
    ).toBe(false);
    expect(
      isChangePointRow({ id: '3', station: 'C', bs: '', is: '1.2', fs: '', dist: '', remarks: '' }),
    ).toBe(false);
    expect(
      isChangePointRow({ id: '4', station: 'D', bs: '', is: '', fs: '1.2', dist: '', remarks: '' }),
    ).toBe(false);
  });

  it('detects row tags correctly based on position and readings', () => {
    const total = 6;
    expect(
      detectRowTag(
        { id: '1', station: 'BM-1', bs: '1.5', is: '', fs: '', dist: '', remarks: '' },
        0,
        total,
      ),
    ).toBe('BM');
    expect(
      detectRowTag(
        { id: '2', station: 'A', bs: '', is: '1.2', fs: '', dist: '', remarks: '' },
        1,
        total,
      ),
    ).toBe('IS');
    expect(
      detectRowTag(
        { id: '3', station: 'CP1', bs: '0.8', is: '', fs: '2.0', dist: '', remarks: '' },
        2,
        total,
      ),
    ).toBe('CP');
    expect(
      detectRowTag(
        { id: '6', station: 'BM-2', bs: '', is: '', fs: '2.2', dist: '', remarks: '' },
        5,
        total,
      ),
    ).toBe('FS');
  });

  it('formats readings and signs without fabricating zeroes', () => {
    expect(formatReading('')).toBe('—');
    expect(formatReading(null)).toBe('—');
    expect(formatReading('100')).toBe('100.000');
    expect(formatReading('0')).toBe('0.000');
    expect(formatReading('0.0001')).toBe('0.0001');
    expect(formatSigned('0.2')).toBe('+0.200');
    expect(formatSigned('-0.2')).toBe('−0.200');
    expect(formatSigned('0')).toBe('0.000');
    expect(formatSigned('0.0001')).toBe('+0.0001');
  });

  it('builds canonical engine request preserving blanks and exact decimals', () => {
    const rows = createInitialRows();
    rows[0].bs = ' 1.500 ';
    rows[1].fs = ' 2.000 ';
    const req = buildLevelingRequest(' 100.000 ', ' 99.805 ', rows);

    expect(req.input.startRL).toBe('100.000');
    expect(req.input.closingRL).toBe('99.805');
    const obs = req.input.observations as Record<string, unknown>[];
    expect(obs[0].bs).toBe('1.500');
    expect(obs[0].is).toBeUndefined();
    expect(obs[0].fs).toBeUndefined();
    expect(obs[1].fs).toBe('2.000');
    expect(obs[1].bs).toBeUndefined();
  });

  it('executes sample rows against survey.leveling.reduce@1 without dist preserving backward compatibility', async () => {
    const rowsV1 = SAMPLE_ROWS.map((r) => ({ ...r, dist: '' }));
    const req = buildLevelingRequest(SAMPLE_START_RL, SAMPLE_CLOSING_RL, rowsV1);
    const result = await executeOperation(
      levelingReduce,
      req.input,
      { method: 'rise-fall' },
      createTestContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const val = result.value as unknown as {
      bsFsDelta: string;
      riseFallDelta: string;
      rlDelta: string;
      checks: Array<{ id: string; status: string }>;
      startingRL: string;
      endingRL: string;
      closingRL: string | null;
      misclosure: string | null;
      rows: Array<{ isChangePoint: boolean }>;
    };
    // 3 agreeing deltas
    expect(val.bsFsDelta).toBe('-0.2');
    expect(val.riseFallDelta).toBe('-0.2');
    expect(val.rlDelta).toBe('-0.2');

    // 2 arithmetic checks
    expect(val.checks).toHaveLength(2);
    expect(val.checks[0].id).toBe('arithmetic-rise-fall');
    expect(val.checks[0].status).toBe('pass');
    expect(val.checks[1].id).toBe('arithmetic-first-last');
    expect(val.checks[1].status).toBe('pass');

    // RLs
    expect(val.startingRL).toBe('100');
    expect(val.endingRL).toBe('99.8');
    expect(val.closingRL).toBe('99.805');
    expect(val.misclosure).toBe('-0.005');

    // Change points detected
    expect(val.rows[0].isChangePoint).toBe(false);
    expect(val.rows[1].isChangePoint).toBe(false);
    expect(val.rows[2].isChangePoint).toBe(true); // CP1
    expect(val.rows[3].isChangePoint).toBe(false);
    expect(val.rows[4].isChangePoint).toBe(true); // CP2
    expect(val.rows[5].isChangePoint).toBe(false);
  });

  it('executes sample rows against survey.leveling.reduce@2 with validated distances, allowable error and distance adjustment', async () => {
    const req = buildLevelingRequest(
      SAMPLE_START_RL,
      SAMPLE_CLOSING_RL,
      SAMPLE_ROWS,
      SAMPLE_ADJ_BY,
      SAMPLE_K_CONSTANT,
    );
    const result = await executeOperation(
      levelingReduceV2,
      req.input,
      req.params,
      createTestContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const val = result.value as unknown as {
      totalDistanceKm: string | null;
      allowableError: string | null;
      closureStatus: string | null;
      setupsCount: number;
      misclosure: string | null;
      rows: Array<{ station?: string; corr: string | null; adjustedRL: string | null }>;
    };

    expect(val.totalDistanceKm).toBe('0.160');
    expect(val.allowableError).toBe('9.6');
    expect(val.closureStatus).toBe('pass');
    expect(val.setupsCount).toBe(3);
    expect(val.misclosure).toBe('-0.005');

    // Distance corrections
    expect(val.rows[0].corr).toBe('0.0');
    expect(val.rows[1].corr).toBe('+0.9');
    expect(val.rows[2].corr).toBe('+1.9');
    expect(val.rows[3].corr).toBe('+2.7');
    expect(val.rows[4].corr).toBe('+3.8');
    expect(val.rows[5].corr).toBe('+5.0');

    // Terminal adjusted RL matches closing BM
    expect(val.rows[5].adjustedRL).toBe('99.805');
  });

  it('validates precise line distances and handles sub-metre, non-integer, and missing distances', () => {
    // Standard 6-station rows
    const resStd = computeValidatedDistance(SAMPLE_ROWS);
    expect(resStd.isValid).toBe(true);
    expect(resStd.totalM).toBe(160);
    expect(resStd.cumDists).toEqual([0, 30, 60, 85, 120, 160]);

    // Sub-metre distance 0.4 m
    const resSub = computeValidatedDistance([{ dist: '0' }, { dist: '0.4' }]);
    expect(resSub.isValid).toBe(true);
    expect(resSub.totalM).toBe(0.4);
    expect(resSub.cumDists).toEqual([0, 0.4]);

    // Sub-metre distance 0.0004 m
    const resMicro = computeValidatedDistance([{ dist: '0' }, { dist: '0.0004' }]);
    expect(resMicro.isValid).toBe(true);
    expect(resMicro.totalM).toBe(0.0004);
    expect(resMicro.cumDists).toEqual([0, 0.0004]);

    // Non-integer distance 160.4 m
    const rows1604 = [
      { dist: '0' },
      { dist: '30' },
      { dist: '30' },
      { dist: '25' },
      { dist: '35' },
      { dist: '40.4' },
    ];
    const res1604 = computeValidatedDistance(rows1604);
    expect(res1604.isValid).toBe(true);
    expect(res1604.totalM).toBe(160.4);
    expect(res1604.cumDists).toEqual([0, 30, 60, 85, 120, 160.4]);

    // Missing distance on intermediate station -> invalid
    const rowsMissing = [{ dist: '0' }, { dist: '30' }, { dist: '' }, { dist: '25' }];
    expect(computeValidatedDistance(rowsMissing).isValid).toBe(false);
    expect(computeValidatedDistance(rowsMissing).totalM).toBeNull();

    // Null distance -> invalid
    const rowsNull = [{ dist: '0' }, { dist: null }];
    expect(computeValidatedDistance(rowsNull).isValid).toBe(false);

    // Total distance zero -> invalid
    const rowsZero = [{ dist: '0' }, { dist: '0' }];
    expect(computeValidatedDistance(rowsZero).isValid).toBe(false);

    // Negative distance -> invalid
    const rowsNeg = [{ dist: '0' }, { dist: '-5' }];
    expect(computeValidatedDistance(rowsNeg).isValid).toBe(false);

    // Non-zero start distance -> invalid
    const rowsBadStart = [{ dist: '5' }, { dist: '10' }];
    expect(computeValidatedDistance(rowsBadStart).isValid).toBe(false);

    // Fewer than 2 rows -> invalid
    expect(computeValidatedDistance([{ dist: '0' }]).isValid).toBe(false);
  });

  it('formats metres and measured line length with explicit display precision', () => {
    // Exact metre formatting up to 6 decimal places without collapsing nonzero values to zero
    expect(formatMetres(160)).toBe('160 m');
    expect(formatMetres(0.4)).toBe('0.4 m');
    expect(formatMetres(0.0004)).toBe('0.0004 m');
    expect(formatMetres(0.000001)).toBe('0.000001 m');
    expect(formatMetres(160.4)).toBe('160.4 m');
    expect(formatMetres(160.45)).toBe('160.45 m');

    expect(formatMetres(0.0004)).not.toBe('0 m');
    expect(formatMetres(0.4)).not.toBe('0 m');
    expect(formatMetres(0.000001)).not.toBe('0 m');

    // Measured line length: standard lines include km; sub-metre lines omit km when it would round to zero
    expect(formatMeasuredLineLength(160, '0.160')).toBe('160 m (0.160 km)');
    expect(formatMeasuredLineLength(160.4)).toBe('160.4 m (0.1604 km)');
    expect(formatMeasuredLineLength(0.4)).toBe('0.4 m');
    expect(formatMeasuredLineLength(0.0004)).toBe('0.0004 m');
    expect(formatMeasuredLineLength(null)).toBe('—');
    expect(formatMeasuredLineLength(0)).toBe('—');

    // Verify nonzero line is never labelled zero or with misleading 0.000 km
    expect(formatMeasuredLineLength(0.4)).not.toContain('0.000 km');
    expect(formatMeasuredLineLength(0.0004)).not.toContain('0.000 km');
    expect(formatMeasuredLineLength(0.0004)).not.toBe('0 m');
    expect(formatMeasuredLineLength(0.4)).not.toBe('0 m');
  });
});
