import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { scheduleGenerate } from '../../engines/food/src/operations/schedule-generate/operation.ts';
import type {
  ScheduleGenerateInput,
  ScheduleGenerateOutput,
  ScheduleGenerateParams,
} from '../../engines/food/src/operations/schedule-generate/schema.ts';

const SAMPLE_RECIPES = [
  {
    id: 'jeera-rice',
    version: '0.1.0',
    name: 'Jeera Rice',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    steps: ['Soak rice', 'Heat ghee and cumin', 'Cook rice until fluffy'],
  },
  {
    id: 'dal-tadka',
    version: '0.1.0',
    name: 'Dal Tadka',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    steps: ['Pressure cook dal', 'Prepare tempering', 'Pour tempering over dal'],
  },
  {
    id: 'aloo-gobi',
    version: '0.1.0',
    name: 'Aloo Gobi',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    steps: ['Chop vegetables', 'Saute aromatics', 'Cook covered'],
  },
];

const run = async (
  input: Partial<ScheduleGenerateInput>,
  params: Partial<ScheduleGenerateParams> = {},
) => {
  const fullInput: ScheduleGenerateInput = {
    recipes: input.recipes ?? SAMPLE_RECIPES,
    selection: input.selection ?? [
      { recipe: 'dal-tadka', recipeVersion: '0.1.0' },
      { recipe: 'aloo-gobi', recipeVersion: '0.1.0' },
      { recipe: 'jeera-rice', recipeVersion: '0.1.0' },
    ],
    guests: input.guests ?? 4,
    mealTime: input.mealTime ?? '13:00',
    burnersAvailable: input.burnersAvailable ?? 4,
    prepStations: input.prepStations ?? 2,
  };

  const fullParams: ScheduleGenerateParams = {
    restMinutes: params.restMinutes ?? 10,
    prepScaleFactor: params.prepScaleFactor ?? 'none',
  };

  const res = await executeOperation(scheduleGenerate, fullInput, fullParams, createTestContext());
  if (!res.ok) return res;
  return { ok: true as const, value: res.value as ScheduleGenerateOutput, warnings: res.warnings };
};

describe('food.schedule.generate@1 backward topological scheduling', () => {
  it('schedules a 3-dish menu ending 10 minutes before meal time', async () => {
    const res = await run({});
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.mealTime).toBe('13:00');
    expect(res.value.totalSpanMinutes).toBe(50);
    expect(res.value.earliestStartTime).toBe('12:10');
    expect(res.value.capacityBottlenecks).toBe(0);

    // Each cook task depends on its prep task
    for (const task of res.value.timeline.filter((t) => t.phase === 'active-cooking')) {
      const prepTask = res.value.timeline.find((t) => t.id === `${task.recipe}-prep`);
      expect(prepTask).toBeDefined();
      expect(task.dependsOn).toContain(`${task.recipe}-prep`);
      expect(task.startOffsetMinutes).toBeGreaterThanOrEqual(prepTask?.endOffsetMinutes ?? 0);
    }
  });

  it('handles single burner bottleneck by shifting earlier dishes', async () => {
    const res = await run({ burnersAvailable: 1 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.capacityBottlenecks).toBeGreaterThan(0);
    expect(res.warnings.map((w) => w.code)).toContain('FOOD_CAPACITY_BOTTLENECK');

    // With 1 burner, active cooking tasks must not overlap
    const cookTasks = res.value.timeline.filter((t) => t.phase === 'active-cooking');
    for (let i = 0; i < cookTasks.length - 1; i++) {
      expect(cookTasks[i].endOffsetMinutes).toBeLessThanOrEqual(
        cookTasks[i + 1].startOffsetMinutes,
      );
    }
  });

  it('scales prep duration when guest count is large', async () => {
    const base = await run({ guests: 4 }, { prepScaleFactor: 'none' });
    const scaled = await run({ guests: 100 }, { prepScaleFactor: 'logarithmic' });

    expect(base.ok && scaled.ok).toBe(true);
    if (!base.ok || !scaled.ok) return;

    const baseDalPrep = base.value.timeline.find((t) => t.id === 'dal-tadka-prep');
    const scaledDalPrep = scaled.value.timeline.find((t) => t.id === 'dal-tadka-prep');

    expect(scaledDalPrep?.durationMinutes).toBeGreaterThan(baseDalPrep?.durationMinutes ?? 0);
  });

  it('accepts ISO datetime format for meal time', async () => {
    const res = await run({ mealTime: '2026-11-04T19:30:00+05:30' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.mealTime).toBe('19:30');
  });

  it('rejects unknown recipe in selection', async () => {
    const res = await run({
      selection: [{ recipe: 'non-existent-dish', recipeVersion: '0.1.0' }],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('FOOD_UNKNOWN_RECIPE');
  });

  it('rejects duplicate selections', async () => {
    const res = await run({
      selection: [
        { recipe: 'jeera-rice', recipeVersion: '0.1.0' },
        { recipe: 'jeera-rice', recipeVersion: '0.1.0' },
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('FOOD_DUPLICATE_SELECTION');
  });

  it('rejects invalid meal time string', async () => {
    const res = await run({ mealTime: 'lunch-time' });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('FOOD_INVALID_MEAL_TIME');
  });
});
