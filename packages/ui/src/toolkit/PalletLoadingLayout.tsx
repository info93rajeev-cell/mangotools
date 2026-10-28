import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { Pallet3DCanvas } from './Pallet3DCanvas.tsx';
import styles from './palletLoading.module.css';
import {
  computePalletLoading,
  convertFromCm,
  convertToCm,
  DEFAULT_PALLET_INPUT,
  PALLET_PRESETS,
  type PalletLoadingInput,
  type PalletUnit,
} from './palletLoadingModel.ts';

interface PalletLoadingLayoutProps {
  preset?: ResolvedPreset;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio pallet loading layout
export function PalletLoadingLayout({ preset: _preset }: PalletLoadingLayoutProps) {
  const [input, setInput] = useState<PalletLoadingInput>(DEFAULT_PALLET_INPUT);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const result = computePalletLoading(input);

  const handleUnitChange = (newUnit: PalletUnit) => {
    if (newUnit === input.unit) return;
    setInput((prev) => {
      const pLCm = convertToCm(prev.palletLength, prev.unit);
      const pWCm = convertToCm(prev.palletWidth, prev.unit);
      const pHLimitCm = convertToCm(prev.palletHeightLimit, prev.unit);
      const bLCm = convertToCm(prev.boxLength, prev.unit);
      const bWCm = convertToCm(prev.boxWidth, prev.unit);
      const bHCm = convertToCm(prev.boxHeight, prev.unit);

      return {
        ...prev,
        unit: newUnit,
        palletLength: convertFromCm(pLCm, newUnit),
        palletWidth: convertFromCm(pWCm, newUnit),
        palletHeightLimit: convertFromCm(pHLimitCm, newUnit),
        boxLength: convertFromCm(bLCm, newUnit),
        boxWidth: convertFromCm(bWCm, newUnit),
        boxHeight: convertFromCm(bHCm, newUnit),
      };
    });
  };

  const handlePalletTypeChange = (typeId: string) => {
    const found = PALLET_PRESETS.find((p) => p.id === typeId);
    if (!found) return;

    setInput((prev) => {
      if (typeId === 'custom') {
        return { ...prev, palletTypeId: 'custom' };
      }
      return {
        ...prev,
        palletTypeId: typeId,
        palletLength: convertFromCm(found.length, prev.unit),
        palletWidth: convertFromCm(found.width, prev.unit),
        palletHeightLimit: convertFromCm(found.standardHeightLimit, prev.unit),
      };
    });
  };

  const handleCopySummary = async () => {
    const summaryText = [
      'BeyondTheAI - Pallet Loading Summary',
      '------------------------------------',
      `Pallet Type: ${PALLET_PRESETS.find((p) => p.id === input.palletTypeId)?.name || 'Custom'}`,
      `Pallet Dims: ${input.palletLength} × ${input.palletWidth} × ${input.palletHeightLimit} ${input.unit}`,
      `Box Dims: ${input.boxLength} × ${input.boxWidth} × ${input.boxHeight} ${input.unit}`,
      `Boxes per Layer: ${result.boxesPerLayer} (${result.alongLength} × ${result.alongWidth})`,
      `Total Layers: ${result.totalLayers}`,
      `Total Boxes: ${result.totalBoxes}`,
      `Space Utilization: ${result.spaceUtilizationPercent}%`,
      `Loaded Dimensions: ${result.loadedDimensions.length} × ${result.loadedDimensions.width} × ${result.loadedDimensions.height} cm`,
      `Total Gross Weight: ${result.weightBreakdown.totalGrossWeightKg} kg (Box: ${input.boxWeight} kg, Pallet: 25 kg)`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handleReset = () => {
    setInput(DEFAULT_PALLET_INPUT);
  };

  return (
    <div class={styles.root} data-pallet-loading-workspace="">
      <div class={styles.topMetaRow}>
        <span class={styles.privacyBadge}>
          <span aria-hidden="true">🔒</span> Runs on your device · 100% private
        </span>
      </div>

      <div class={styles.workspaceGrid}>
        {/* 1. Pallet & Box Settings */}
        <div class={styles.card}>
          <div class={styles.cardHead}>
            <span class={styles.cardTitle}>1. Pallet & Box Settings</span>
            <div class={styles.unitRow}>
              <span>Unit:</span>
              <div class={styles.unitPillGroup}>
                {(['mm', 'cm', 'inch'] as const).map((u) => (
                  <button
                    type="button"
                    key={u}
                    class={`${styles.unitPill} ${input.unit === u ? styles.unitPillActive : ''}`}
                    aria-pressed={input.unit === u}
                    onClick={() => handleUnitChange(u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div class={styles.fieldRow}>
            <label for="palletTypeSelect" class={styles.fieldLabel}>
              Pallet type
            </label>
            <select
              id="palletTypeSelect"
              class={styles.selectInput}
              value={input.palletTypeId}
              onChange={(e) => handlePalletTypeChange((e.target as HTMLSelectElement).value)}
            >
              {PALLET_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div class={styles.multiInputRow}>
            <div class={styles.fieldRow}>
              <label for="palletLengthInput" class={styles.fieldLabel}>
                Length ({input.unit})
              </label>
              <input
                id="palletLengthInput"
                type="number"
                class={styles.textInput}
                value={input.palletLength}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    palletLength: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
            <div class={styles.fieldRow}>
              <label for="palletWidthInput" class={styles.fieldLabel}>
                Width ({input.unit})
              </label>
              <input
                id="palletWidthInput"
                type="number"
                class={styles.textInput}
                value={input.palletWidth}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    palletWidth: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
            <div class={styles.fieldRow}>
              <label
                for="palletHeightLimitInput"
                class={styles.fieldLabel}
                title={`Max Pallet Height Limit (${input.unit})`}
              >
                Max H ({input.unit})
              </label>
              <input
                id="palletHeightLimitInput"
                type="number"
                class={styles.textInput}
                value={input.palletHeightLimit}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    palletHeightLimit: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
          </div>

          <div class={styles.fieldLabel} style={{ marginTop: '4px', fontWeight: 700 }}>
            Box / Carton size
          </div>
          <div class={styles.multiInputRow}>
            <div class={styles.fieldRow}>
              <label for="boxLengthInput" class={styles.fieldLabel}>
                Length ({input.unit})
              </label>
              <input
                id="boxLengthInput"
                type="number"
                class={styles.textInput}
                value={input.boxLength}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    boxLength: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
            <div class={styles.fieldRow}>
              <label for="boxWidthInput" class={styles.fieldLabel}>
                Width ({input.unit})
              </label>
              <input
                id="boxWidthInput"
                type="number"
                class={styles.textInput}
                value={input.boxWidth}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    boxWidth: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
            <div class={styles.fieldRow}>
              <label for="boxHeightInput" class={styles.fieldLabel}>
                Height ({input.unit})
              </label>
              <input
                id="boxHeightInput"
                type="number"
                class={styles.textInput}
                value={input.boxHeight}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    boxHeight: Math.max(1, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
          </div>

          <div class={styles.fieldLabel} style={{ marginTop: '4px', fontWeight: 700 }}>
            Quantity & Options
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '6px',
            }}
          >
            <div class={styles.fieldRow}>
              <label for="maxStackLayersSelect" class={styles.fieldLabel}>
                Max stack layers
              </label>
              <select
                id="maxStackLayersSelect"
                class={styles.selectInput}
                value={String(input.maxStackLayers)}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  setInput((prev) => ({
                    ...prev,
                    maxStackLayers: val === 'auto' ? 'auto' : Number(val),
                  }));
                }}
              >
                <option value="auto">Auto</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} layers
                  </option>
                ))}
              </select>
            </div>
            <div class={styles.fieldRow}>
              <label for="boxWeightInput" class={styles.fieldLabel}>
                Box weight (kg)
              </label>
              <input
                id="boxWeightInput"
                type="number"
                class={styles.textInput}
                value={input.boxWeight}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    boxWeight: Math.max(0, Number((e.target as HTMLInputElement).value)),
                  }))
                }
              />
            </div>
          </div>

          <div class={styles.fieldRow}>
            <label for="stackingTypeSelect" class={styles.fieldLabel}>
              Stacking type
            </label>
            <select
              id="stackingTypeSelect"
              class={styles.selectInput}
              value={input.stackingType}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  stackingType: (e.target as HTMLSelectElement)
                    .value as PalletLoadingInput['stackingType'],
                }))
              }
            >
              <option value="standard">Standard (no overhang)</option>
              <option value="interlocking">Interlocking (brick pattern)</option>
              <option value="column">Column stack</option>
            </select>
          </div>

          <label class={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={input.showWeightInResults}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  showWeightInResults: (e.target as HTMLInputElement).checked,
                }))
              }
            />
            <span>Show weight in results</span>
          </label>
        </div>

        {/* Mobile-only Calculate button */}
        <div class={styles.mobileOnlyCta}>
          <button type="button" class={styles.primaryCalculateBtn}>
            <span aria-hidden="true">🧮</span> Calculate Pallet Loading
          </button>
        </div>

        {/* 2. 3D Pallet View */}
        <Pallet3DCanvas
          result={result}
          palletLength={convertToCm(input.palletLength, input.unit)}
          palletWidth={convertToCm(input.palletWidth, input.unit)}
          boxLength={convertToCm(input.boxLength, input.unit)}
          boxWidth={convertToCm(input.boxWidth, input.unit)}
          boxHeight={convertToCm(input.boxHeight, input.unit)}
        />

        {/* 3. Results Summary */}
        <div class={styles.card}>
          <div class={styles.cardHead}>
            <span class={styles.cardTitle}>3. Results Summary</span>
          </div>

          <div class={styles.resultsContainer}>
            <div class={styles.kpiCard}>
              <span class={styles.kpiIcon} aria-hidden="true">
                📦
              </span>
              <div class={styles.kpiBody}>
                <span class={styles.kpiLabel}>Boxes per layer</span>
                <span class={styles.kpiValue}>{result.boxesPerLayer}</span>
                <span class={styles.kpiSub}>
                  ({result.alongLength} × {result.alongWidth})
                </span>
              </div>
            </div>

            <div class={styles.kpiCard}>
              <span class={styles.kpiIcon} aria-hidden="true">
                🥞
              </span>
              <div class={styles.kpiBody}>
                <span class={styles.kpiLabel}>Total layers</span>
                <span class={styles.kpiValue}>{result.totalLayers}</span>
              </div>
            </div>

            <div class={styles.kpiCard}>
              <span class={styles.kpiIcon} aria-hidden="true">
                🧱
              </span>
              <div class={styles.kpiBody}>
                <span class={styles.kpiLabel}>Total boxes</span>
                <span class={styles.kpiValue}>{result.totalBoxes}</span>
              </div>
            </div>

            <div class={styles.kpiCard}>
              <span class={styles.kpiIcon} aria-hidden="true">
                📊
              </span>
              <div class={styles.kpiBody}>
                <span class={styles.kpiLabel}>Space utilization</span>
                <span class={styles.kpiValue}>{result.spaceUtilizationPercent}%</span>
                <div class={styles.progressBarWrap}>
                  <div
                    class={styles.progressBarFill}
                    style={{ width: `${Math.min(100, result.spaceUtilizationPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            <div class={styles.kpiCard}>
              <span class={styles.kpiIcon} aria-hidden="true">
                📐
              </span>
              <div class={styles.kpiBody}>
                <span class={styles.kpiLabel}>Pallet dimensions (loaded)</span>
                <span class={styles.kpiSub}>
                  L: {result.loadedDimensions.length} cm · W: {result.loadedDimensions.width} cm ·
                  H: {result.loadedDimensions.height} cm
                </span>
              </div>
            </div>

            {input.showWeightInResults && (
              <div class={styles.kpiCard}>
                <span class={styles.kpiIcon} aria-hidden="true">
                  ⚖️
                </span>
                <div class={styles.kpiBody}>
                  <span class={styles.kpiLabel}>Total gross weight</span>
                  <span class={styles.kpiValue}>
                    {result.weightBreakdown.totalGrossWeightKg} kg
                  </span>
                  <span class={styles.kpiSub}>
                    Boxes: {result.weightBreakdown.totalBoxesWeightKg} kg · Pallet: 25 kg
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Guide & Accordions */}
        <div class={styles.card}>
          <div class={styles.cardHead}>
            <span class={styles.cardTitle}>Quick Guide</span>
          </div>

          <ol class={styles.quickGuideList}>
            <li class={styles.guideStep}>
              <span class={styles.stepNum}>1</span>
              <span>Select pallet type and dimensions.</span>
            </li>
            <li class={styles.guideStep}>
              <span class={styles.stepNum}>2</span>
              <span>Enter box/carton size.</span>
            </li>
            <li class={styles.guideStep}>
              <span class={styles.stepNum}>3</span>
              <span>Set stacking options and limits.</span>
            </li>
            <li class={styles.guideStep}>
              <span class={styles.stepNum}>4</span>
              <span>Results and 3D stack render automatically!</span>
            </li>
          </ol>

          <details class={styles.accordionItem}>
            <summary class={styles.accordionSummary}>
              <span aria-hidden="true">📋</span> Typical pallet sizes
            </summary>
            <div class={styles.accordionContent}>
              • Standard / ISO: 120 × 100 cm
              <br />• Euro (EUR 1): 120 × 80 cm
              <br />• US GMA: 48 × 40 in (121.9 × 101.6 cm)
              <br />• Asian: 110 × 110 cm
              <br />• Australian: 116.5 × 116.5 cm
            </div>
          </details>

          <details class={styles.accordionItem}>
            <summary class={styles.accordionSummary}>
              <span aria-hidden="true">📐</span> Calculation method
            </summary>
            <div class={styles.accordionContent}>
              Tests both box orientations (lengthwise and widthwise) to find the maximum boxes per
              layer without overhang, then multiplies by permitted layer height.
            </div>
          </details>

          <details class={styles.accordionItem}>
            <summary class={styles.accordionSummary}>
              <span aria-hidden="true">⚠️</span> Important notes
            </summary>
            <div class={styles.accordionContent}>
              Wooden pallets typically weigh 20–25 kg. Max dynamic payload is usually 1,500 kg. Use
              corner boards and stretch wrap for stable transit.
            </div>
          </details>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div class={styles.actionBar}>
        <button type="button" class={styles.primaryCalculateBtn}>
          <span aria-hidden="true">🧮</span> Calculate Pallet Loading
        </button>
        <button type="button" class={styles.secondaryBtn} onClick={() => window.print()}>
          <span aria-hidden="true">🖨️</span> Print / Save PDF
        </button>
        <button type="button" class={styles.secondaryBtn} onClick={handleCopySummary}>
          <span aria-hidden="true">📋</span> {copyFeedback ? 'Copied!' : 'Copy Summary'}
        </button>
        <button type="button" class={styles.secondaryBtn} onClick={handleReset}>
          <span aria-hidden="true">↺</span> Reset
        </button>
      </div>
    </div>
  );
}
