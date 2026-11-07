import { describe, expect, it } from 'vitest';
import {
  cleanDecimal,
  detectHeaderColumns,
  parseGrid,
  parseSpreadsheetPaste,
} from './surveyPasteModel.ts';

describe('surveyPasteModel', () => {
  describe('parseGrid', () => {
    it('parses tab-separated text with CRLF and quotes', () => {
      const tsv = 'Station\tBS\tIS\r\nBM-1\t"1.500"\t\r\nA\t\t1.200';
      const grid = parseGrid(tsv);
      expect(grid).toEqual([
        ['Station', 'BS', 'IS'],
        ['BM-1', '1.500', ''],
        ['A', '', '1.200'],
      ]);
    });

    it('parses comma-separated CSV with embedded quotes', () => {
      const csv = 'Station,BS,Remarks\nBM-1,1.500,"Start, benchmark"\nBM-2,,Closing';
      const grid = parseGrid(csv);
      expect(grid).toEqual([
        ['Station', 'BS', 'Remarks'],
        ['BM-1', '1.500', 'Start, benchmark'],
        ['BM-2', '', 'Closing'],
      ]);
    });

    it('strips UTF-8 BOM and ignores empty trailing lines', () => {
      const raw = '\uFEFFBM-1\t1.500\n\nBM-2\t\t\t2.200\n\n';
      const grid = parseGrid(raw);
      expect(grid).toHaveLength(2);
      expect(grid[0]?.[0]).toBe('BM-1');
    });
  });

  describe('detectHeaderColumns', () => {
    it('detects standard survey headers in standard order', () => {
      const headers = ['Station', 'BS', 'IS', 'FS', 'Dist. (m)', 'Remarks'];
      const res = detectHeaderColumns(headers);
      expect(res.isHeader).toBe(true);
      expect(res.mapping).toMatchObject({
        station: 0,
        bs: 1,
        is: 2,
        fs: 3,
        dist: 4,
        remarks: 5,
      });
    });

    it('detects alternative header names in shuffled order', () => {
      const headers = [
        'Point',
        'Distance',
        'Backsight',
        'Intermediate Sight',
        'Foresight',
        'Notes',
      ];
      const res = detectHeaderColumns(headers);
      expect(res.isHeader).toBe(true);
      expect(res.mapping.station).toBe(0);
      expect(res.mapping.dist).toBe(1);
      expect(res.mapping.bs).toBe(2);
      expect(res.mapping.is).toBe(3);
      expect(res.mapping.fs).toBe(4);
      expect(res.mapping.remarks).toBe(5);
    });

    it('treats numeric data rows as not headers', () => {
      const data = ['BM-1', '1.500', '', '', '0', 'Start BM'];
      const res = detectHeaderColumns(data);
      expect(res.isHeader).toBe(false);
      expect(res.mapping).toEqual({ station: 0, bs: 1, is: 2, fs: 3, dist: 4, remarks: 5 });
    });
  });

  describe('cleanDecimal', () => {
    it('preserves blank as empty string', () => {
      expect(cleanDecimal('')).toEqual({ clean: '', isValid: true, isNegative: false });
      expect(cleanDecimal('   ')).toEqual({ clean: '', isValid: true, isNegative: false });
    });

    it('preserves exact decimal string without rounding or conversion', () => {
      expect(cleanDecimal('1.500')).toEqual({ clean: '1.500', isValid: true, isNegative: false });
      expect(cleanDecimal('0.4')).toEqual({ clean: '0.4', isValid: true, isNegative: false });
      expect(cleanDecimal('0.0004')).toEqual({ clean: '0.0004', isValid: true, isNegative: false });
      expect(cleanDecimal('160.400000')).toEqual({
        clean: '160.400000',
        isValid: true,
        isNegative: false,
      });
    });

    it('rejects numbers with more than 6 decimal places', () => {
      expect(cleanDecimal('1.1234567')).toEqual({
        clean: '1.1234567',
        isValid: false,
        isNegative: false,
      });
    });

    it('identifies negative decimals', () => {
      expect(cleanDecimal('-1.500')).toEqual({ clean: '-1.500', isValid: true, isNegative: true });
    });

    it('removes standard grouping commas', () => {
      expect(cleanDecimal('1,250.50')).toEqual({
        clean: '1250.50',
        isValid: true,
        isNegative: false,
      });
    });
  });

  describe('parseSpreadsheetPaste', () => {
    const SAMPLE_TSV = `Station\tBS\tIS\tFS\tDist (m)\tRemarks
BM-1\t1.500\t\t\t0\tStart BM
A\t\t1.200\t\t30\t
CP1\t0.800\t\t2.000\t30\tChange point
B\t\t1.100\t\t25\t
CP2\t2.300\t\t0.600\t35\tChange point
BM-2\t\t\t2.200\t40\tClosing BM`;

    it('correctly parses the approved six-station sample with change points', () => {
      const outcome = parseSpreadsheetPaste(SAMPLE_TSV);
      expect(outcome.isValid).toBe(true);
      expect(outcome.hasHeader).toBe(true);
      expect(outcome.rows).toHaveLength(6);
      expect(outcome.summary).toEqual({
        total: 6,
        bmCount: 1,
        cpCount: 2,
        isCount: 2,
        fsCount: 1,
        errorCount: 0,
      });

      // Row 0: BM-1, BS=1.500, Dist=0
      expect(outcome.rows[0]?.station).toBe('BM-1');
      expect(outcome.rows[0]?.bs).toBe('1.500');
      expect(outcome.rows[0]?.is).toBe('');
      expect(outcome.rows[0]?.fs).toBe('');
      expect(outcome.rows[0]?.dist).toBe('0');
      expect(outcome.rowDetails[0]?.tag).toBe('BM');

      // Row 2: CP1 has both FS (2.000) and BS (0.800)
      expect(outcome.rows[2]?.station).toBe('CP1');
      expect(outcome.rows[2]?.bs).toBe('0.800');
      expect(outcome.rows[2]?.fs).toBe('2.000');
      expect(outcome.rowDetails[2]?.tag).toBe('CP');

      // Row 5: BM-2 closing FS=2.200
      expect(outcome.rows[5]?.station).toBe('BM-2');
      expect(outcome.rows[5]?.fs).toBe('2.200');
      expect(outcome.rowDetails[5]?.tag).toBe('FS');
    });

    it('parses valid data without header row', () => {
      const raw = `BM-1\t1.500\t\t\t0\tStart BM
A\t\t1.200\t\t30\t
BM-2\t\t\t2.200\t40\tClosing BM`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(true);
      expect(outcome.hasHeader).toBe(false);
      expect(outcome.rows).toHaveLength(3);
      expect(outcome.rows[1]?.station).toBe('A');
      expect(outcome.rows[1]?.is).toBe('1.200');
    });

    it('parses 4-column paste with blank distance and remarks', () => {
      const raw = `BM-1\t1.500\t\t
A\t\t1.200\t
BM-2\t\t\t2.200`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(true);
      expect(outcome.rows[0]?.dist).toBe('');
      expect(outcome.rows[0]?.remarks).toBe('');
    });

    it('preserves exact sub-metre and fine decimal text without corruption', () => {
      const raw = `BM-1\t0.000400\t\t
BM-2\t\t\t0.400000`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(true);
      expect(outcome.rows[0]?.bs).toBe('0.000400');
      expect(outcome.rows[1]?.fs).toBe('0.400000');
    });

    it('flags row-level error on negative staff readings', () => {
      const raw = `BM-1\t-1.500\t\t
BM-2\t\t\t2.200`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[0]?.errors).toContain('Staff reading cannot be negative');
    });

    it('flags error on invalid reading combination mixing IS with BS', () => {
      const raw = `BM-1\t1.500\t\t
A\t1.200\t1.300\t
BM-2\t\t\t2.200`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[1]?.errors).toContain(
        'Invalid reading combination: cannot mix IS with BS or FS',
      );
    });

    it('flags error when first station lacks Backsight', () => {
      const raw = `A\t\t1.200\t
BM-2\t\t\t2.200`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[0]?.errors).toContain('First station must have Backsight (BS)');
    });

    it('flags error when starting distance is non-zero', () => {
      const raw = `BM-1\t1.500\t\t\t15\tStart
BM-2\t\t\t2.200\t20\tEnd`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[0]?.errors).toContain(
        'First station distance must be 0 if provided',
      );
    });

    it('flags error when final station lacks Foresight', () => {
      const raw = `BM-1\t1.500\t\t
A\t\t1.200\t`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[1]?.errors).toContain('Final station must have Foresight (FS)');
    });

    it('flags error when intermediate station has BS without FS', () => {
      const raw = `BM-1\t1.500\t\t
CP1\t0.800\t\t
BM-2\t\t\t2.200`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.rowDetails[1]?.errors).toContain(
        'Intermediate change point requires both incoming FS and outgoing BS',
      );
    });

    it('flags global error when fewer than 2 rows provided', () => {
      const raw = `BM-1\t1.500\t\t`;
      const outcome = parseSpreadsheetPaste(raw);
      expect(outcome.isValid).toBe(false);
      expect(outcome.globalError).toBe('At least 2 stations are required for leveling reduction');
    });
  });
});
