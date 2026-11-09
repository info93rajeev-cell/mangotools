import { FOOD_UNITS } from '@mangotools/schemas';
import type { ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import type { RecipeCostItem } from './CostOtherExpensesCard.tsx';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export function minorUnits(value: string | number): bigint {
  const text = String(value);
  if (!/^\d+(\.\d+)?$/.test(text)) return 0n;
  const [whole = '0', fraction = ''] = text.split('.');
  return (
    BigInt(whole) * 100n +
    BigInt(`${fraction}00`.slice(0, 2)) +
    (Number(fraction[2] ?? '0') >= 5 ? 1n : 0n)
  );
}

export function majorUnits(value: bigint): number {
  return Number(value) / 100;
}
export function sumMoney(values: Array<string | number>): number {
  return majorUnits(values.reduce<bigint>((sum, value) => sum + minorUnits(value), 0n));
}
export function money(value: string | number): string {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type CostRecipe = Pick<ExtendedFoodRecipe, 'id' | 'name' | 'servings' | 'ingredients'>;
type CostOutput = { items?: Array<{ ingredient: string; costInr: string }>; totalCostInr?: string };

function ingredientWeight(recipe: CostRecipe, ingredient: string, factor: number): bigint {
  const amount = recipe.ingredients
    .filter((i) => i.ingredient === ingredient)
    .reduce((sum, i) => sum + Number(i.quantity) * Number(FOOD_UNITS[i.unit].toBase), 0);
  return BigInt(Math.round(((amount * factor) / recipe.servings) * 1_000_000));
}

function allocate(total: bigint, weights: bigint[]): bigint[] {
  const sum = weights.reduce((a, b) => a + b, 0n);
  if (!sum) return weights.map(() => 0n);
  const eligible = weights.map((w, i) => (w > 0n ? i : -1)).filter((i) => i >= 0);
  let remainder = total;
  return weights.map((weight, index) => {
    if (!weight) return 0n;
    const share = index === eligible.at(-1) ? remainder : (total * weight) / sum;
    remainder -= share;
    return share;
  });
}

export function allocateRecipeCosts(
  recipes: CostRecipe[],
  guests: number,
  otherCost: number,
  engineCost: unknown,
  factors: Record<string, number>,
): RecipeCostItem[] {
  const output = engineCost as CostOutput | null;
  const totals = recipes.map(() => 0n);
  for (const item of output?.items ?? []) {
    let weights = recipes.map((r) => ingredientWeight(r, item.ingredient, factors[r.id] ?? 1));
    if (!weights.some((weight) => weight > 0n)) weights = recipes.map(() => 1n);
    const shares = allocate(minorUnits(item.costInr), weights);
    shares.forEach((share, i) => {
      totals[i] = (totals[i] ?? 0n) + share;
    });
  }
  if (totals.length && output?.totalCostInr) {
    totals[totals.length - 1] +=
      minorUnits(output.totalCostInr) - totals.reduce((a, b) => a + b, 0n);
  }
  const extras = allocate(
    minorUnits(otherCost),
    recipes.map(() => 1n),
  );
  return recipes.map((r, index) => ({
    id: r.id,
    num: index + 1,
    name: r.name,
    servings: guests * (factors[r.id] ?? 1),
    totalQty: `${guests * (factors[r.id] ?? 1)} ${t.servings}`,
    ingCost: majorUnits(totals[index] ?? 0n),
    otherCost: majorUnits(extras[index] ?? 0n),
    totalDish: majorUnits((totals[index] ?? 0n) + (extras[index] ?? 0n)),
  }));
}

export function scheduleTasks(
  output: unknown,
  completed: Record<string, boolean>,
): ScheduleTaskItem[] {
  const raw = output as {
    timeline?: Array<{
      id: string;
      description: string;
      phase: string;
      startTime: string;
      durationMinutes: number;
      recipeName: string;
    }>;
  } | null;
  return (raw?.timeline ?? []).map((task) => ({
    id: task.id,
    name: task.description,
    phase:
      task.phase === 'prep' ? 'early-prep' : task.phase === 'simmer-rest' ? 'assembly' : 'cooking',
    startTime: task.startTime,
    durationMinutes: task.durationMinutes,
    recipeName: task.recipeName,
    priority: task.durationMinutes >= 30 ? 'High' : 'Medium',
    isCompleted: !!completed[task.id],
  }));
}

export function ingredientTotal(output: unknown): number {
  return Number((output as { totalCostInr?: string } | null)?.totalCostInr ?? '0');
}
