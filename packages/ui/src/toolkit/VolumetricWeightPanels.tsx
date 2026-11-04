import { Icon } from '../primitives/Icon.tsx';
import { packageColors } from './containerPlacementGeometry.ts';
import { type ResultKpi, ResultKpiCards } from './ResultKpiCards.tsx';
import styles from './volumetricWeight.module.css';
import { VOLUMETRIC_STANDARDS, type VolumetricCalculationResult } from './volumetricWeightModel.ts';

interface VolumetricSettingsProps {
  standardId: string;
  divisor: number;
  onStandardChange: (stdId: string) => void;
  onDivisorChange: (divisor: number) => void;
}

export function VolumetricWeightSettings({
  standardId,
  divisor,
  onStandardChange,
  onDivisorChange,
}: VolumetricSettingsProps) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>Calculation Settings</span>
      </div>

      <div class={styles.fieldRow}>
        <label for="calcStandardSelect" class={styles.fieldLabel}>
          Calculation standard
        </label>
        <select
          id="calcStandardSelect"
          class={styles.selectInput}
          value={standardId}
          onChange={(e) => onStandardChange((e.target as HTMLSelectElement).value)}
        >
          {VOLUMETRIC_STANDARDS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div class={styles.fieldRow}>
        <label for="divisorInput" class={styles.fieldLabel}>
          Divisor (cm³/kg)
        </label>
        <input
          id="divisorInput"
          type="number"
          class={styles.textInput}
          value={divisor}
          onInput={(e) =>
            onDivisorChange(Math.max(1, Number((e.target as HTMLInputElement).value)))
          }
        />
      </div>

      <div class={styles.divisorCallout}>
        <div class={styles.calloutTitle}>
          <span aria-hidden="true">💡</span> Common divisors:
        </div>
        <div>• Air freight (IATA): 6000 cm³/kg</div>
        <div>• Courier (e.g. DHL, FedEx): 5000 cm³/kg</div>
        <div>• Custom: Enter your value</div>
      </div>
    </div>
  );
}

interface VolumetricResultsProps {
  result: VolumetricCalculationResult & { error?: string | null };
}

const num = (v: string) => Number(String(v).replace(/,/g, '')) || 0;

function volumetricKpis(r: VolumetricResultsProps['result']): ResultKpi[] {
  const vol = num(r.totalVolumetricWeightKg);
  const act = num(r.totalActualWeightKg);
  const charge = num(r.chargeableWeightKg) || 1;
  const governs =
    r.governingFactor === 'equal'
      ? 'Both weights equal'
      : r.governingFactor === 'volumetric'
        ? 'Volumetric governs'
        : 'Actual governs';
  return [
    {
      tone: 'green',
      icon: 'box',
      label: 'Total Volume',
      value: `${r.totalVolumeM3} m³`,
      sub: `${r.totalPieces} pieces`,
      percent: 100,
      meter: `${r.itemCalculations.length} items`,
    },
    {
      tone: 'amber',
      icon: 'weight',
      label: 'Actual Weight',
      value: `${r.totalActualWeightKg} kg`,
      sub: 'Scale weight',
      percent: (act / charge) * 100,
      meter: `${Math.round((act / charge) * 100)}%`,
    },
    {
      tone: 'purple',
      icon: 'package',
      label: 'Volumetric Weight',
      value: `${r.totalVolumetricWeightKg} kg`,
      sub: 'From size ÷ divisor',
      percent: (vol / charge) * 100,
      meter: `${Math.round((vol / charge) * 100)}%`,
    },
    {
      tone: 'blue',
      icon: 'badge-check',
      label: 'Chargeable Weight',
      value: `${r.chargeableWeightKg} kg`,
      sub: governs,
      percent: 100,
      meter: 'Billed',
    },
  ];
}

export function VolumetricWeightResults({ result }: VolumetricResultsProps) {
  return (
    <div class={styles.card}>
      <div class={styles.heading}>
        <h2 id="volumetric-results-title">Weight Results</h2>
        <span class={styles.loadCount}>
          Items: {result.itemCalculations.length} · Pieces: {result.totalPieces}
        </span>
        {result.error || result.itemCalculations.length === 0 ? null : (
          <span class={styles.status} data-status={result.governingFactor}>
            {result.governingFactor === 'equal'
              ? 'BOTH EQUAL'
              : `${result.governingFactor.toUpperCase()} GOVERNS`}
          </span>
        )}
      </div>

      {result.error ? (
        <p role="alert" class={styles.skipped} data-engine-error="">
          {result.error}
        </p>
      ) : null}
      {result.skippedRowIds.length > 0 ? (
        <p role="alert" class={styles.skipped}>
          {result.skippedRowIds.length} row{result.skippedRowIds.length === 1 ? ' is' : 's are'} not
          counted: every size and the weight must be above zero, and quantity a whole number of at
          least 1.
        </p>
      ) : null}
      <ResultKpiCards items={volumetricKpis(result)} idPrefix="volumetric" />

      <details class={`${styles.allocation} ${styles.secondary}`} open>
        <summary>Package Allocation by Volume</summary>
        <div class={styles.bar} aria-hidden="true">
          {result.itemCalculations.map((item, idx) => {
            const share =
              result.totalVolumeCm3 > 0 ? (item.rowTotalVolCm3 / result.totalVolumeCm3) * 100 : 0;
            return (
              <span
                key={item.id}
                style={{
                  background: packageColors[idx % packageColors.length],
                  flexGrow: share,
                }}
                title={item.description}
              />
            );
          })}
        </div>
        <div class={styles.legend}>
          {result.itemCalculations.map((item, idx) => {
            const share =
              result.totalVolumeCm3 > 0
                ? ((item.rowTotalVolCm3 / result.totalVolumeCm3) * 100).toFixed(1)
                : '0.0';
            return (
              <div key={item.id}>
                <i style={{ background: packageColors[idx % packageColors.length] }} />
                <span>
                  {item.description}
                  <small>
                    {item.quantity} pcs · {item.rowTotalVolM3} m³ ({share}%)
                  </small>
                </span>
              </div>
            );
          })}
        </div>
      </details>

      <details class={`${styles.details} ${styles.secondary}`}>
        <summary>Detailed Breakdown · Package Totals</summary>
        <div class={styles.tableScroll}>
          <table class={styles.detailsTable}>
            <thead>
              <tr>
                <th>Package</th>
                <th>Dimensions</th>
                <th>Qty</th>
                <th>Actual Wt</th>
                <th>Vol Wt</th>
                <th>Chargeable</th>
              </tr>
            </thead>
            <tbody>
              {result.itemCalculations.map((row) => (
                <tr key={row.id}>
                  <th>{row.description}</th>
                  <td>
                    {row.length} × {row.width} × {row.height} {row.unit}
                  </td>
                  <td>{row.quantity}</td>
                  <td>{row.totalActualWeightKg} kg</td>
                  <td>{row.totalVolumetricWeightKg} kg</td>
                  <td>
                    <strong>{row.chargeableWeightKg} kg</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
