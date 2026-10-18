import { readFileSync } from 'node:fs';
import type { ResolvedPreset } from '@mangotools/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runFileOperation } from './useFileTool.ts';

const host = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@mangotools/runtime', async (original) => ({
  ...(await original<typeof import('@mangotools/runtime')>()),
  getWorkerHost: () => host,
}));
const ordinary: ResolvedPreset = JSON.parse(
  readFileSync('generated/presets/image/resize.json', 'utf8'),
);
const preset: ResolvedPreset = {
  ...ordinary,
  fields: {
    limit: { labelKey: 'limit', kind: 'number', required: true, order: 1 },
    optional: { labelKey: 'optional', kind: 'number', order: 2 },
    flag: { labelKey: 'flag', kind: 'boolean', order: 3 },
    extra: {
      labelKey: 'extra',
      kind: 'number',
      required: true,
      order: 4,
      visibleWhen: { flag: ['true'] },
    },
  },
};
const files = [{ id: 'one', name: 'sample.png', bytes: new Uint8Array([137]), size: 1 }];
const run = (values: Record<string, string | boolean>) =>
  runFileOperation(preset, files, '', values);

describe('file-tool required fields before worker dispatch', () => {
  beforeEach(() => host.run.mockReset().mockResolvedValue({ ok: true, value: {}, warnings: [] }));

  it.each([{}, { limit: '' }, { limit: '  ' }])(
    'blocks missing required value %j',
    async (values) => {
      expect(await run(values)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_INPUT', path: 'limit' },
      });
      expect(host.run).not.toHaveBeenCalled();
    },
  );

  it('preserves zero, false and optional blanks without mutating values', async () => {
    const values = { limit: '0', optional: '', flag: false };
    await run(values);
    expect(host.run).toHaveBeenCalledWith(
      preset.operation,
      {
        limit: 0,
        flag: false,
        file: { name: 'sample.png', bytes: files[0].bytes },
      },
      preset.params,
    );
    expect(values).toEqual({ limit: '0', optional: '', flag: false });
  });

  it('uses existing conditional required rules and resumes after correction', async () => {
    expect(await run({ limit: '50', flag: true })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT', path: 'extra' },
    });
    expect(host.run).not.toHaveBeenCalled();
    await run({ limit: '50', flag: true, extra: '1.25' });
    expect(host.run).toHaveBeenCalledOnce();
    expect(host.run.mock.calls[0][1]).toMatchObject({ limit: 50, flag: true, extra: 1.25 });
  });

  it('leaves required text validation with the existing engine-specific error catalogue', async () => {
    const withText = {
      ...preset,
      fields: {
        ...preset.fields,
        text: { labelKey: 'text', kind: 'text' as const, required: true, order: 5 },
      },
    };
    await runFileOperation(withText, files, '', { limit: '50' });
    expect(host.run).toHaveBeenCalledOnce();
    expect(host.run.mock.calls[0][1]).not.toHaveProperty('text');
  });
});
