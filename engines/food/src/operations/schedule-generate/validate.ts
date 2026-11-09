import type { DetailValue } from '@mangotools/core';
import type { ScheduleGenerateInput, ScheduleRecipeInput } from './schema.ts';

export interface ScheduleFailure {
  code: string;
  path?: string;
  details?: Record<string, DetailValue>;
}

export interface ValidatedScheduleInput {
  selectedRecipes: ScheduleRecipeInput[];
  mealMinutes: number;
  mealTimeDisplay: string;
  isIso: boolean;
  baseIsoDate?: string;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ISO_REGEX =
  /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function fail(code: string, details?: Record<string, DetailValue>, path?: string): ScheduleFailure {
  const f: ScheduleFailure = { code };
  if (details) f.details = details;
  if (path) f.path = path;
  return f;
}

function parseMealTime(
  raw: string,
):
  | { mealMinutes: number; display: string; isIso: boolean; baseIsoDate?: string }
  | ScheduleFailure {
  const timeMatch = raw.match(TIME_REGEX);
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const mins = Number.parseInt(timeMatch[2], 10);
    return { mealMinutes: hours * 60 + mins, display: raw, isIso: false };
  }

  const isoMatch = raw.match(ISO_REGEX);
  if (isoMatch) {
    const hours = Number.parseInt(isoMatch[2], 10);
    const mins = Number.parseInt(isoMatch[3], 10);
    return {
      mealMinutes: hours * 60 + mins,
      display: `${isoMatch[2]}:${isoMatch[3]}`,
      isIso: true,
      baseIsoDate: isoMatch[1],
    };
  }

  return fail('FOOD_INVALID_MEAL_TIME', { value: raw }, 'mealTime');
}

function indexRecipes(
  recipes: ScheduleRecipeInput[],
): Map<string, ScheduleRecipeInput> | ScheduleFailure {
  const map = new Map<string, ScheduleRecipeInput>();
  for (const r of recipes) {
    const key = `${r.id}@${r.version}`;
    if (map.has(key)) {
      return fail('FOOD_DUPLICATE_RECIPE', { recipe: r.id, version: r.version }, 'recipes');
    }
    map.set(key, r);
  }
  return map;
}

function resolveSelection(
  selection: ScheduleGenerateInput['selection'],
  recipeMap: Map<string, ScheduleRecipeInput>,
): ScheduleRecipeInput[] | ScheduleFailure {
  const seen = new Set<string>();
  const resolved: ScheduleRecipeInput[] = [];

  for (const item of selection) {
    if (seen.has(item.recipe)) {
      return fail('FOOD_DUPLICATE_SELECTION', { recipe: item.recipe }, 'selection');
    }
    seen.add(item.recipe);

    const recipe = recipeMap.get(`${item.recipe}@${item.recipeVersion}`);
    if (!recipe) {
      return fail(
        'FOOD_UNKNOWN_RECIPE',
        { recipe: item.recipe, version: item.recipeVersion },
        'selection',
      );
    }
    resolved.push(recipe);
  }
  return resolved;
}

export function validateScheduleInput(
  input: ScheduleGenerateInput,
): { ok: true; value: ValidatedScheduleInput } | { ok: false; error: ScheduleFailure } {
  const timeRes = parseMealTime(input.mealTime);
  if ('code' in timeRes) return { ok: false, error: timeRes };

  const mapRes = indexRecipes(input.recipes);
  if ('code' in mapRes) return { ok: false, error: mapRes };

  const selRes = resolveSelection(input.selection, mapRes);
  if ('code' in selRes) return { ok: false, error: selRes };

  return {
    ok: true,
    value: {
      selectedRecipes: selRes,
      mealMinutes: timeRes.mealMinutes,
      mealTimeDisplay: timeRes.display,
      isIso: timeRes.isIso,
      baseIsoDate: timeRes.baseIsoDate,
    },
  };
}
