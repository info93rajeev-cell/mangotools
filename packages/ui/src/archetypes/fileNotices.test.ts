import { readFileSync } from 'node:fs';
import type { ResolvedPreset } from '@mangotools/schemas';
import type { VNode } from 'preact';
import { describe, expect, it } from 'vitest';
import { InlineAlert } from '../primitives/feedback.tsx';
import { NoteList } from '../toolkit/ResultNotices.tsx';
import { FileToolOutcome } from './FileToolOutcome.tsx';

const preset: ResolvedPreset = JSON.parse(
  readFileSync('generated/presets/image/resize.json', 'utf8'),
);
const result = {
  bytes: new Uint8Array([1]),
  fileName: 'out.jpg',
  warnings: [{ code: 'IMAGE_VERIFY_OUTPUT', messageKey: 'IMAGE_VERIFY_OUTPUT' }],
};
function nodes(value: unknown): VNode<Record<string, unknown>>[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !('type' in value)) return [];
  const node = value as VNode<Record<string, unknown>>;
  return [node, ...nodes(node.props.children)];
}

describe('file-tool collapsed notes opt-in', () => {
  it.each([undefined, false, true])(
    'preserves notices for collapseNotices=%s',
    (collapseNotices) => {
      const configured = { ...preset, ui: { ...preset.ui, collapseNotices } };
      const tree = nodes(
        FileToolOutcome({ preset: configured, phase: 'result', result, error: null }),
      );
      const disclosure = tree.find((node) => node.type === NoteList);
      if (collapseNotices) {
        expect(disclosure?.props.notices).toBe(result.warnings);
        expect(tree.some((node) => node.type === InlineAlert)).toBe(false);
        const rendered = NoteList({ preset, notices: result.warnings });
        expect(rendered?.type).toBe('details');
        expect(rendered?.props.open).not.toBe(true);
        expect(NoteList({ preset, notices: [] })).toBeNull();
      } else expect(tree.some((node) => node.type === InlineAlert)).toBe(true);
    },
  );

  it('never hides errors inside supporting notes or renders a stale result', () => {
    const error = { code: 'INVALID_INPUT', messageKey: 'INVALID_INPUT' };
    const collapsed = { ...preset, ui: { ...preset.ui, collapseNotices: true } };
    const tree = nodes(FileToolOutcome({ preset: collapsed, phase: 'error', result, error }));
    expect(tree.find((node) => node.type === InlineAlert)?.props.role).toBe('alert');
    expect(tree.some((node) => node.type === NoteList)).toBe(false);
    expect(FileToolOutcome({ preset, phase: 'idle', result, error: null })).toBeNull();
  });
});
