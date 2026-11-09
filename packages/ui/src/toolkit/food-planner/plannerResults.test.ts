import { describe, expect, it } from 'vitest';
import { calculateCostData } from './CostEstimationPanels.tsx';
import { allocateRecipeCosts, scheduleTasks, sumMoney } from './plannerResults.ts';

// Synthetic UI regressions against the existing cost/schedule operation contracts.
describe('Food Planner shared result presentation', () => {
  it('never substitutes a screenshot cost when the engine is unavailable', () => {
    expect(calculateCostData(null, 20, 0).totalIngredientCost).toBe(0);
  });
  it('preserves paise in menu and per-guest totals', () => {
    expect(calculateCostData({ totalCostInr: '100.01' }, 2, 0.01)).toEqual({
      totalIngredientCost: 100.01,
      totalMenuCost: 100.02,
      costPerServing: '50.01',
    });
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
  });
  it('allocates actual shared ingredient cost and reconciles rounding exactly', () => {
    const recipes = [
      {
        id: 'one',
        name: 'One',
        servings: 1,
        ingredients: [{ ingredient: 'sugar', quantity: '100', unit: 'g' as const }],
      },
      {
        id: 'two',
        name: 'Two',
        servings: 1,
        ingredients: [{ ingredient: 'sugar', quantity: '0.3', unit: 'kg' as const }],
      },
    ];
    const costs = allocateRecipeCosts(
      recipes,
      1,
      0.01,
      {
        items: [{ ingredient: 'sugar', costInr: '100.01' }],
        totalCostInr: '100.01',
      },
      {},
    );
    expect(costs.map((r) => r.ingCost)).toEqual([25, 75.01]);
    expect(sumMoney(costs.map((r) => r.totalDish))).toBe(100.02);
    expect(costs[0]?.totalQty).toBe('1 servings');
  });
  it('maps the real engine timeline with stable IDs and completion state', () => {
    const timeline = [
      {
        id: 'rice-prep',
        recipe: 'rice',
        recipeName: 'Rice',
        phase: 'prep',
        description: 'Wash rice',
        startTime: '12:20',
        durationMinutes: 10,
      },
    ];
    expect(scheduleTasks({ timeline }, { 'rice-prep': true })).toEqual([
      {
        id: 'rice-prep',
        name: 'Wash rice',
        phase: 'early-prep',
        startTime: '12:20',
        durationMinutes: 10,
        recipeName: 'Rice',
        priority: 'Medium',
        isCompleted: true,
      },
    ]);
    expect(scheduleTasks(null, {})).toEqual([]);
  });
});
