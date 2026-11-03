import { type OpWarning, warning } from '@mangotools/core';
import type {
  ScheduleGenerateInput,
  ScheduleGenerateOutput,
  ScheduleGenerateParams,
  ScheduleRecipeInput,
  ScheduleTaskItem,
} from './schema.ts';
import type { ValidatedScheduleInput } from './validate.ts';

interface DishTaskPlan {
  recipe: ScheduleRecipeInput;
  scaledPrepMins: number;
  cookMins: number;
}

function calculateScaledPrep(
  basePrep: number,
  servings: number,
  guests: number,
  factorMode: ScheduleGenerateParams['prepScaleFactor'],
): number {
  if (basePrep <= 0) return 5;
  if (factorMode === 'none') return basePrep;
  const scale = guests / Math.max(1, servings);
  if (scale <= 1) return basePrep;

  if (factorMode === 'linear-capped') {
    const scaled = Math.round(basePrep * Math.sqrt(scale));
    return Math.min(basePrep * 4, Math.max(basePrep, scaled));
  }
  // logarithmic
  const mult = 1 + Math.log2(scale) * 0.4;
  return Math.max(basePrep, Math.round(basePrep * mult));
}

function formatOffsetTime(mealMinutes: number, offsetMinutes: number): string {
  const total = (mealMinutes + offsetMinutes) % 1440;
  const pos = total < 0 ? total + 1440 : total;
  const hh = String(Math.floor(pos / 60)).padStart(2, '0');
  const mm = String(pos % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function scheduleCookingSlots(
  plans: DishTaskPlan[],
  burners: number,
  restMinutes: number,
): { cookEndOffsets: Map<string, number>; bottlenecks: number } {
  // Sort dishes by cooking duration descending (longest cook dishes stay closest to meal time)
  const sorted = [...plans].sort((a, b) => b.cookMins - a.cookMins);
  const burnerFreeAt = new Array(burners).fill(-restMinutes);
  const cookEndOffsets = new Map<string, number>();
  let bottlenecks = 0;

  for (const plan of sorted) {
    // Find burner that finishes closest to -restMinutes (latest available)
    let bestBurnerIdx = 0;
    let latestFree = burnerFreeAt[0];
    for (let i = 1; i < burners; i++) {
      if (burnerFreeAt[i] > latestFree) {
        latestFree = burnerFreeAt[i];
        bestBurnerIdx = i;
      }
    }

    const endOffset = burnerFreeAt[bestBurnerIdx];
    if (endOffset < -restMinutes) {
      bottlenecks++;
    }
    cookEndOffsets.set(plan.recipe.id, endOffset);
    burnerFreeAt[bestBurnerIdx] = endOffset - plan.cookMins;
  }

  return { cookEndOffsets, bottlenecks };
}

function buildDishTasks(
  plan: DishTaskPlan,
  cookEndOffset: number,
  mealMinutes: number,
  burnerIndex: number,
  prepIndex: number,
): { prepTask: ScheduleTaskItem; cookTask: ScheduleTaskItem } {
  const cookStartOffset = cookEndOffset - plan.cookMins;
  const prepEndOffset = cookStartOffset;
  const prepStartOffset = prepEndOffset - plan.scaledPrepMins;

  const prepId = `${plan.recipe.id}-prep`;
  const cookId = `${plan.recipe.id}-cook`;

  const prepTask: ScheduleTaskItem = {
    id: prepId,
    recipe: plan.recipe.id,
    recipeName: plan.recipe.name,
    phase: 'prep',
    description: `Clean, peel, chop and measure ingredients for ${plan.recipe.name}`,
    durationMinutes: plan.scaledPrepMins,
    startOffsetMinutes: prepStartOffset,
    endOffsetMinutes: prepEndOffset,
    startTime: formatOffsetTime(mealMinutes, prepStartOffset),
    endTime: formatOffsetTime(mealMinutes, prepEndOffset),
    station: `prep-${prepIndex + 1}`,
    dependsOn: [],
  };

  const cookTask: ScheduleTaskItem = {
    id: cookId,
    recipe: plan.recipe.id,
    recipeName: plan.recipe.name,
    phase: 'active-cooking',
    description: `Cook and temper ${plan.recipe.name} per recipe steps`,
    durationMinutes: plan.cookMins,
    startOffsetMinutes: cookStartOffset,
    endOffsetMinutes: cookEndOffset,
    startTime: formatOffsetTime(mealMinutes, cookStartOffset),
    endTime: formatOffsetTime(mealMinutes, cookEndOffset),
    station: `burner-${burnerIndex + 1}`,
    dependsOn: [prepId],
  };

  return { prepTask, cookTask };
}

export function buildSchedule(
  validated: ValidatedScheduleInput,
  input: ScheduleGenerateInput,
  params: ScheduleGenerateParams,
): { output: ScheduleGenerateOutput; warnings: OpWarning[] } {
  const plans: DishTaskPlan[] = validated.selectedRecipes.map((r) => ({
    recipe: r,
    scaledPrepMins: calculateScaledPrep(
      r.prepMinutes,
      r.servings,
      input.guests,
      params.prepScaleFactor,
    ),
    cookMins: Math.max(1, r.cookMinutes),
  }));

  const { cookEndOffsets, bottlenecks } = scheduleCookingSlots(
    plans,
    input.burnersAvailable,
    params.restMinutes,
  );

  const timeline: ScheduleTaskItem[] = [];
  let earliestStart = 0;
  let criticalDishId = plans[0]?.recipe.id ?? '';

  plans.forEach((plan, idx) => {
    const endOffset = cookEndOffsets.get(plan.recipe.id) ?? -params.restMinutes;
    const burnerIdx = idx % input.burnersAvailable;
    const prepIdx = idx % input.prepStations;
    const { prepTask, cookTask } = buildDishTasks(
      plan,
      endOffset,
      validated.mealMinutes,
      burnerIdx,
      prepIdx,
    );

    timeline.push(prepTask, cookTask);
    if (prepTask.startOffsetMinutes < earliestStart) {
      earliestStart = prepTask.startOffsetMinutes;
      criticalDishId = plan.recipe.id;
    }
  });

  timeline.sort((a, b) => a.startOffsetMinutes - b.startOffsetMinutes);
  const totalSpanMinutes = Math.abs(earliestStart);
  const warnings: OpWarning[] = [warning('FOOD_SCHEDULE_ESTIMATE')];

  if (bottlenecks > 0) {
    warnings.push(
      warning('FOOD_CAPACITY_BOTTLENECK', {
        details: { count: bottlenecks },
      }),
    );
  }

  return {
    output: {
      timeline,
      totalSpanMinutes,
      earliestStartTime: formatOffsetTime(validated.mealMinutes, earliestStart),
      mealTime: validated.mealTimeDisplay,
      criticalPath: [`${criticalDishId}-prep`, `${criticalDishId}-cook`],
      capacityBottlenecks: bottlenecks,
    },
    warnings,
  };
}
