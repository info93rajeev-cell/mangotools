import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { utf8Length } from '../../lib/bytes.ts';
import { EXPECTED_TEXT } from './expected-text.ts';
import { isParseFailure, lineColumn, MAX_DEPTH, parseJson } from './parse.ts';
import { printJson } from './print.ts';
import { jsonFormatInput, jsonFormatOutput, jsonFormatParams } from './schema.ts';

const INDENT: Record<'2' | '4' | 'tab', string> = { '2': '  ', '4': '    ', tab: '\t' };

export const jsonFormat = defineOperation({
  id: 'data.json.format',
  major: 1,
  title: 'Format, minify or validate JSON',
  summary: 'Losslessly formats, minifies or validates JSON text (RFC 8259).',
  input: jsonFormatInput,
  params: jsonFormatParams,
  output: jsonFormatOutput,
  errors: [
    'DATA_JSON_EMPTY',
    'DATA_JSON_SYNTAX_ERROR',
    'DATA_JSON_TOO_DEEP',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    const warnings: OpWarning[] = [];
    let text = input.text;
    if (text.startsWith('﻿')) {
      text = text.slice(1);
      warnings.push(warning('DATA_JSON_BOM_REMOVED'));
    }
    if (text.trim() === '') return err('DATA_JSON_EMPTY', { path: 'text' });
    let parsed: ReturnType<typeof parseJson>;
    try {
      parsed = parseJson(text);
    } catch (e) {
      if (!isParseFailure(e)) throw e;
      if (e.tag === 'depth') return err('DATA_JSON_TOO_DEEP', { details: { maxDepth: MAX_DEPTH } });
      const { line, column } = lineColumn(text, e.offset);
      return err('DATA_JSON_SYNTAX_ERROR', {
        path: 'text',
        details: {
          line,
          column,
          offset: e.offset,
          expected: e.expected,
          expectedText: EXPECTED_TEXT[e.expected],
        },
      });
    }
    for (const offset of parsed.stats.duplicateKeyOffsets) {
      warnings.push(
        warning('DATA_JSON_DUPLICATE_KEY', { path: 'text', details: lineColumn(text, offset) }),
      );
    }
    const out =
      params.action === 'validate'
        ? ''
        : printJson(
            parsed.root,
            params.action === 'minify' ? null : INDENT[params.indent],
            params.sortKeys,
          );
    return ok(
      {
        text: out,
        valid: true as const,
        stats: {
          inputBytes: utf8Length(input.text),
          outputBytes: utf8Length(out),
          maxDepth: parsed.stats.maxDepth,
          objectCount: parsed.stats.objectCount,
          arrayCount: parsed.stats.arrayCount,
        },
      },
      warnings,
    );
  },
});
