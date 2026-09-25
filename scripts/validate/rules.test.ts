import { describe, expect, it } from 'vitest';
import {
  checkBigJs,
  checkEngineSource,
  checkLength,
  checkNoDirectEngineImport,
  checkRelativeEscape,
  importSpecifiers,
  stripCommentsAndStrings,
} from './rules.ts';

const rulesOf = (v: { rule: string; message: string }[]) => v.map((x) => x.message);

describe('architecture rules', () => {
  it('flags banned APIs in engine code', () => {
    const src = [
      "import { z } from 'zod';",
      'export const now = () => Date.now();',
      'export const r = Math.random();',
      "export const f = (x: number) => x.toLocaleString('en-IN');",
      'export class Parser {}',
      "export const g = () => fetch('/x');",
    ].join('\n');
    const messages = rulesOf(checkEngineSource('engines/data/src/a.ts', 'data', src));
    expect(messages).toEqual(
      expect.arrayContaining([
        'Engines must not use Date (use ctx.clock).',
        'Engines must not use Math.random (use ctx.random).',
        'Engines must not use locale formatting.',
        'Engines must not use class (use functions and data).',
        'Engines must not use network (fetch).',
      ]),
    );
  });

  it('ignores banned words inside comments and strings', () => {
    const src = "// Date.now is banned\nexport const msg = 'Use fetch() elsewhere';\n";
    expect(checkEngineSource('engines/data/src/a.ts', 'data', src)).toEqual([]);
    expect(stripCommentsAndStrings("a('x')//c")).toBe("a(' ')   ");
  });

  it('enforces the engine import whitelist', () => {
    const src = "import Big from 'big.js';\nimport { x } from '@mangotools/engine-numeric';\n";
    expect(rulesOf(checkEngineSource('engines/data/src/a.ts', 'data', src))).toEqual([
      'engines/data may not import "big.js".',
      'engines/data may not import "@mangotools/engine-numeric".',
    ]);
    expect(checkEngineSource('engines/estimate/src/a.ts', 'estimate', src).length).toBe(1);
  });

  it('keeps big.js inside engines/numeric', () => {
    const src = "import Big from 'big.js';";
    expect(checkBigJs('engines/numeric/src/decimal.ts', src)).toEqual([]);
    expect(checkBigJs('packages/ui/src/format.ts', src).length).toBe(1);
  });

  it('stops ui and web from importing engines directly', () => {
    const src =
      "import { engine } from '@mangotools/engine-data';\nimport x from '../../engines/data/src/index.ts';";
    expect(checkNoDirectEngineImport('apps/web/src/x.ts', src).length).toBe(2);
  });

  it('stops relative imports leaving an engine package', () => {
    const src =
      "import { a } from '../../../packages/ui/src/a.ts';\nimport { b } from '../lib/b.ts';";
    expect(checkRelativeEscape('engines/data/src/ops/x.ts', 'engines/data', src).length).toBe(1);
  });

  it('finds static, dynamic and re-export specifiers', () => {
    const src =
      "import a from 'a';\nexport * from './b.ts';\nconst c = await import('c');\nimport 'd';";
    expect(importSpecifiers(src).map((s) => s.specifier)).toEqual(['a', './b.ts', 'c', 'd']);
    expect(importSpecifiers(`const s = "import x from 'big.js'";`)).toEqual([]);
  });

  it('applies file length limits', () => {
    const long = 'x\n'.repeat(401);
    expect(checkLength('packages/ui/src/a.ts', long).violation).toBeDefined();
    expect(checkLength('packages/ui/src/a.test.ts', long).violation).toBeUndefined();
    expect(checkLength('packages/ui/src/a.ts', 'x\n'.repeat(320)).warning).toBeDefined();
    expect(checkLength('tools/x/manifest.yaml', 'x\n'.repeat(201)).violation).toBeDefined();
  });
});
