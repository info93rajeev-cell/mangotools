import type { ResolvedPreset } from '@mangotools/schemas';
import { formatValue } from '../format/numbers.ts';
import { label } from './presentation.ts';
import { ScrollableItemTable } from './ScrollableItemTable.tsx';

/** Display rounding never replaces engine truth; tiny nonzero values cannot look like exact closure. */
export function surveyDisplay(value: unknown, numeric = false): string {
  if (value === null || value === undefined) return '—';
  const raw = String(value);
  if (!numeric) return raw;
  const displayed = formatValue('number', raw, { decimalPlaces: 3 });
  return /^[-−]?0[.,]0+$/.test(displayed) && /[1-9]/.test(raw) ? raw : displayed;
}

const quantities = new Set([
  'bs',
  'is',
  'fs',
  'rise',
  'fall',
  'rl',
  'distanceM',
  'azimuthDeg',
  'latitudeM',
  'departureM',
  'northingM',
  'eastingM',
  'expected',
  'actual',
  'result',
]);

function Table({
  preset,
  name,
  rows,
  columns,
}: {
  preset: ResolvedPreset;
  name: string;
  rows: Record<string, unknown>[];
  columns: string[];
}) {
  return (
    <ScrollableItemTable caption={label(preset, `survey.section.${name}`)}>
      <thead>
        <tr>
          {columns.map((key) => (
            <th key={key} scope="col">
              {label(preset, `survey.column.${key}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((key) => (
              <td key={key} title={row[key] === null ? undefined : String(row[key] ?? '')}>
                {key === 'labelKey'
                  ? label(preset, String(row[key]))
                  : surveyDisplay(row[key], quantities.has(key))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </ScrollableItemTable>
  );
}

/** Fixed views of approved engine output only; no reduction, correction or closure arithmetic. */
function sections(preset: ResolvedPreset, value: Record<string, unknown>) {
  if (preset.operation === 'survey.leveling.reduce@1')
    return [
      {
        name: 'summary',
        rows: Object.entries(value)
          .filter(([, result]) => !Array.isArray(result))
          .map(([quantity, result]) => ({
            quantity: label(preset, `survey.column.${quantity}`),
            result,
          })),
        columns: ['quantity', 'result'],
      },
      {
        name: 'rows',
        rows: value.rows as Record<string, unknown>[],
        columns: ['station', 'bs', 'is', 'fs', 'rise', 'fall', 'rl', 'isChangePoint', 'remarks'],
      },
      {
        name: 'checks',
        rows: value.checks as Record<string, unknown>[],
        columns: ['labelKey', 'status', 'expected', 'actual'],
      },
    ];
  if (preset.operation !== 'survey.traverse.compute@1') return [];
  const legs = value.legs as Record<string, unknown>[];
  const coordinates = (value.coordinates as Record<string, unknown>[]).map((point, index) => ({
    station: index === 0 ? legs[0]?.from : legs[index - 1]?.to,
    ...point,
  }));
  return [
    {
      name: 'closure',
      rows: Object.entries(value.closure as Record<string, unknown>).map(([quantity, result]) => ({
        quantity: label(preset, `survey.column.${quantity}`),
        result,
      })),
      columns: ['quantity', 'result'],
    },
    {
      name: 'legs',
      rows: legs,
      columns: ['from', 'to', 'distanceM', 'azimuthDeg', 'latitudeM', 'departureM'],
    },
    { name: 'coordinates', rows: coordinates, columns: ['station', 'northingM', 'eastingM'] },
  ];
}

export function SurveyResults({
  preset,
  value,
}: {
  preset: ResolvedPreset;
  value: Record<string, unknown>;
}) {
  return (
    <>
      {sections(preset, value).map((section) => (
        <Table key={section.name} preset={preset} {...section} />
      ))}
    </>
  );
}
