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
        <span class={styles.cardTitle}>2. Calculation Settings</span>
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
      <div class={styles.cardHead}>
        <span class={styles.cardTitle}>3. Results Summary</span>
      </div>

      <div class={styles.resultsContainer}>
        <div class={styles.kpiCard}>
          <span class={styles.kpiIcon} aria-hidden="true">
            ⚖️
          </span>
          <div class={styles.kpiBody}>
            <span class={styles.kpiLabel}>Total Actual Weight</span>
            <span class={styles.kpiValue}>{result.totalActualWeightKg} kg</span>
          </div>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiIcon} aria-hidden="true">
            📦
          </span>
          <div class={styles.kpiBody}>
            <span class={styles.kpiLabel}>Total Volumetric Weight</span>
            <span class={styles.kpiValue}>{result.totalVolumetricWeightKg} kg</span>
          </div>
        </div>

        <div class={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
          <span class={styles.kpiIcon} aria-hidden="true">
            🏷️
          </span>
          <div class={styles.kpiBody}>
            <span class={styles.kpiLabel}>Chargeable Weight</span>
            <span class={`${styles.kpiValue} ${styles.kpiValueHighlight}`}>
              {result.chargeableWeightKg} kg
            </span>
            <span class={styles.kpiSub}>(Higher of actual or volumetric)</span>
          </div>
        </div>

        <div class={styles.kpiCard}>
          <span class={styles.kpiIcon} aria-hidden="true">
            📐
          </span>
          <div class={styles.kpiBody}>
            <span class={styles.kpiLabel}>Total Volume</span>
            <span class={styles.kpiValue}>{result.totalVolumeM3} m³</span>
            <span class={styles.kpiSub}>({result.totalVolumeCm3.toLocaleString()} cm³)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
