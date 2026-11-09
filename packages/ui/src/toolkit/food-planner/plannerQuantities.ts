import { CATALOG_INGREDIENTS } from './foodReferenceData.ts';

export function applyIngredientQuantities(
  value: unknown,
  quantities: Record<string, string>,
  stock: Record<string, string>,
) {
  const output = value as {
    lines: Array<{
      ingredient: string;
      total: string;
      buy: string;
      unit: string;
      usedIn: string[];
    }>;
  };
  const lines = output.lines.map((line) =>
    quantities[line.ingredient] === undefined
      ? line
      : {
          ...line,
          total: quantities[line.ingredient] ?? line.total,
          buy: quantities[line.ingredient] ?? line.buy,
        },
  );
  for (const [id, quantity] of Object.entries(quantities)) {
    const ingredient = CATALOG_INGREDIENTS.find((item) => item.id === id);
    if (!ingredient || lines.some((line) => line.ingredient === id)) continue;
    const unit =
      ingredient.dimension === 'mass' ? 'g' : ingredient.dimension === 'volume' ? 'ml' : 'piece';
    lines.push({ ingredient: id, total: quantity, buy: quantity, unit, usedIn: [] });
  }
  return {
    ...output,
    lines: lines
      .filter((line) => Number(line.total) > 0)
      .map((line) => ({
        ...line,
        buy: remainingQuantity(line.total, stock[line.ingredient] ?? '0'),
      })),
  };
}

export function remainingQuantity(total: string, stock: string): string {
  const [totalWhole = '0', totalFraction = ''] = total.split('.');
  const [stockWhole = '0', stockFraction = ''] = stock.split('.');
  const precision = Math.max(totalFraction.length, stockFraction.length);
  const totalUnits = BigInt(totalWhole + totalFraction.padEnd(precision, '0'));
  const stockUnits = BigInt(stockWhole + stockFraction.padEnd(precision, '0'));
  if (stockUnits >= totalUnits) return '0';
  const result = String(totalUnits - stockUnits).padStart(precision + 1, '0');
  if (!precision) return result;
  return `${result.slice(0, -precision)}.${result.slice(-precision)}`.replace(/\.?0+$/, '');
}
