import type { RecipeCostItem } from './CostOtherExpensesCard.tsx';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';

export function exportCostRows(rows: RecipeCostItem[]) {
  const cells = [
    [t.recipes, t.servings, t.ingredientCost, t.otherCost, t.totalCost],
    ...rows.map((row) => [
      row.name,
      String(row.servings),
      row.ingCost.toFixed(2),
      row.otherCost.toFixed(2),
      row.totalDish.toFixed(2),
    ]),
  ];
  const csv = cells
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'food-planner-costs.csv';
  link.click();
  URL.revokeObjectURL(url);
}
