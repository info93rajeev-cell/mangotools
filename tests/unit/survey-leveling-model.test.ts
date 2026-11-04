import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { levelingReduce } from '../../engines/survey/src/operations/leveling-reduce/operation.ts';
import {
  buildLevelingRequest,
  createInitialRows,
  detectRowTag,
  formatReading,
  formatSigned,
  isChangePointRow,
  SAMPLE_CLOSING_RL,
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

  it('executes sample rows against survey.leveling.reduce@1 with exact 3 agreeing deltas and 2 passing checks', async () => {
    const req = buildLevelingRequest(SAMPLE_START_RL, SAMPLE_CLOSING_RL, SAMPLE_ROWS);
    const result = await executeOperation(
      levelingReduce,
      req.input,
      req.params,
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
});
