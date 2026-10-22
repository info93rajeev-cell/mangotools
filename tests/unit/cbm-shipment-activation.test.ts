import { readFileSync } from 'node:fs';
import type { Registry } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';

const registry = JSON.parse(
  readFileSync(new URL('../../generated/registry.json', import.meta.url), 'utf8'),
) as Registry;
describe('CBM shipment activation #213', () => {
  it('pins the reviewed personal/local-only tool and exact workspace preset', () => {
    const tool = registry.tools.find((entry) => entry.id === 'cbm-calculator');
    expect(tool?.preset).toBe('logistics/cbm-shipment');
    expect(tool?.privacy).toEqual({ dataClass: 'personal', network: 'none' });
    expect(tool?.processing).toBe('device');
    expect(registry.presets['logistics/cbm-shipment']?.operation).toBe('logistics.cbm.shipment@1');
    expect(registry.presets['logistics/cbm']?.operation).toBe('logistics.cbm.compute@1');
  });
  it('resolves shipment and optional cost error messages without UI or schema changes', () => {
    const preset = registry.presets['logistics/cbm-shipment'];
    for (const key of [
      'LOGISTICS_MISSING_INPUT',
      'LOGISTICS_COST_USER_RATE',
      'LOGISTICS_COST_MINIMUM_APPLIED',
      'INTERNAL_ERROR',
    ])
      expect(preset?.messages[key]).toBeTruthy();
    expect(preset?.fields.packages?.rows?.maxRows).toBe(50);
    expect(preset?.fields.packages?.rows?.columns).not.toHaveProperty('description');
  });
});
