import { presetSchema, type ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { checkSampleUiState } from './preset-sample-ui-state.ts';

const fields: ResolvedPreset['fields'] = {
  amount: { labelKey: 'field.amount', kind: 'money', order: 10 },
  showAdvanced: {
    labelKey: 'field.showAdvanced',
    kind: 'boolean',
    order: 20,
    default: 'false',
    uiOnly: true,
  },
  layout: {
    labelKey: 'field.layout',
    kind: 'enum',
    order: 30,
    uiOnly: true,
    options: [{ value: 'compact' }, { value: 'expanded' }],
  },
};

const resolved = (uiState: Record<string, string | number | boolean>): ResolvedPreset => ({
  id: 'demo/ui-state',
  version: '0.1.0',
  operation: 'estimate.tax.gst@1',
  engineId: 'estimate',
  params: {},
  locked: [],
  userOptions: {},
  fields,
  outputs: {},
  samples: { example: { titleKey: 'sample.example', input: { amount: '100' }, uiState } },
  ui: { archetypes: ['B'] },
  strings: {},
  messages: {},
});

describe('preset sample UI state', () => {
  it('accepts optional scalar UI state in the preset schema', () => {
    const parsed = presetSchema.safeParse({
      presetVersion: 1,
      id: 'demo/ui-state',
      version: '0.1.0',
      fields,
      samples: {
        legacy: { titleKey: 'sample.legacy', input: { amount: '100' } },
        advanced: {
          titleKey: 'sample.advanced',
          input: { amount: '100' },
          uiState: { showAdvanced: true, layout: 'expanded' },
        },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects non-scalar UI state in the preset schema', () => {
    const parsed = presetSchema.safeParse({
      presetVersion: 1,
      id: 'demo/ui-state',
      version: '0.1.0',
      samples: {
        example: { titleKey: 'sample.example', input: {}, uiState: { layout: ['compact'] } },
      },
    });
    expect(parsed.success).toBe(false);
    expect(!parsed.success && parsed.error.issues[0]?.path.join('.')).toBe(
      'samples.example.uiState.layout',
    );
  });

  it('accepts valid values for UI-only fields', () => {
    expect(
      checkSampleUiState('preset.yaml', resolved({ showAdvanced: true, layout: 'compact' })),
    ).toEqual([]);
  });

  it('rejects unknown and non-UI-only fields with their sample paths', () => {
    const issues = checkSampleUiState('preset.yaml', resolved({ ghost: 'x', amount: '100' }));
    expect(issues.map((entry) => entry.path)).toEqual([
      'samples.example.uiState.ghost',
      'samples.example.uiState.amount',
    ]);
  });

  it('rejects invalid field types and unsupported enum options', () => {
    const issues = checkSampleUiState(
      'preset.yaml',
      resolved({ showAdvanced: 'true', layout: 'wide' }),
    );
    expect(issues.map((entry) => entry.message)).toEqual([
      'UI state value for "showAdvanced" must be a boolean.',
      'UI state value for "layout" has unsupported option "wide".',
    ]);
  });
});
