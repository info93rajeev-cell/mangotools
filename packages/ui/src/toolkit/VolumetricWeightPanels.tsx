import { Icon } from '../primitives/Icon.tsx';
import { packageColors } from './containerPlacementGeometry.ts';
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
          onChange={(e) =>
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
  result: VolumetricCalculationResult;
}

export function VolumetricWeightResults({ result }: VolumetricResultsProps) {
  return (
    <div class={styles.card}>
      <div class={styles.heading}>
        <h2 id="volumetric-results-title">Results Summary</h2>
        <span class={styles.loadCount}>
          Items: {result.itemCalculations.length} · Pieces: {result.totalPieces}
        </span>
        <span class={styles.status} data-status={result.governingFactor}>
          {result.governingFactor.toUpperCase()} GOVERNS
        </span>
      </div>

      <div class={styles.kpis}>
        <div class={styles.kpi} style={{ '--tone': '#0eb779' }}>
          <Icon name="box" />
          <span>Total Pieces</span>
          <strong>{result.totalPieces}</strong>
        </div>
        <div class={styles.kpi} style={{ '--tone': '#0065ff' }}>
          <Icon name="box" />
          <span>Total Volume</span>
          <strong>{result.totalVolumeM3} m³</strong>
        </div>
        <div class={styles.kpi} style={{ '--tone': '#df9c00' }}>
          <Icon name="weight" />
          <span>Actual Weight</span>
          <strong>{result.totalActualWeightKg} kg</strong>
        </div>
        <div class={styles.kpi} style={{ '--tone': '#6366f1' }}>
          <Icon name="weight" />
          <span>Volumetric Weight</span>
          <strong>{result.totalVolumetricWeightKg} kg</strong>
        </div>
      </div>

      <div class={styles.chargeableCallout}>
        <div class={styles.chargeableHead}>
          <span class={styles.chargeableLabel}>Chargeable Weight:</span>
          <span class={styles.chargeableValue}>{result.chargeableWeightKg} kg</span>
        </div>
        <span class={styles.chargeableSub}>
          {result.governingFactor === 'volumetric'
            ? 'Volumetric weight exceeds actual weight (Volumetric Governs)'
            : 'Actual weight exceeds volumetric weight (Actual Governs)'}
        </span>
      </div>

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
