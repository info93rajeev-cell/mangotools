import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { Carton3DPreview } from './Carton3DPreview.tsx';
import { useVolumetricShipment } from './useVolumetricShipment.ts';
import { VolumetricCostCard } from './VolumetricCostCard.tsx';
import { VolumetricWeightResults, VolumetricWeightSettings } from './VolumetricWeightPanels.tsx';
import styles from './volumetricWeight.module.css';
import {
  convertLengthFromCm,
  convertLengthToCm,
  SAMPLE_VOLUMETRIC_ITEMS,
  VOLUMETRIC_STANDARDS,
  type VolumetricItem,
  type VolumetricUnit,
} from './volumetricWeightModel.ts';

interface VolumetricWeightLayoutProps {
  preset?: ResolvedPreset;
  onLaunchTour?: () => void;
}

interface ItemRowProps {
  item: VolumetricItem;
  idx: number;
  canRemove: boolean;
  onUpdate: (id: string, patch: Partial<VolumetricItem>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Table row inputs
function VolumetricItemRow({ item, idx, canRemove, onUpdate, onRemove, onSelect }: ItemRowProps) {
  return (
    <tr>
      <td class={styles.rowNum}>{idx + 1}</td>
      <td>
        <input
          type="text"
          aria-label={`Package ${idx + 1} description`}
          class={styles.tableInput}
          value={item.description}
          placeholder="Description / SKU"
          onChange={(e) =>
            onUpdate(item.id, {
              description: (e.target as HTMLInputElement).value,
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <input
          type="number"
          aria-label={`Package ${idx + 1} length`}
          class={`${styles.tableInput} ${styles.numInput}`}
          value={item.length || ''}
          onChange={(e) =>
            onUpdate(item.id, {
              length: Math.max(0, Number((e.target as HTMLInputElement).value)),
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <input
          type="number"
          aria-label={`Package ${idx + 1} width`}
          class={`${styles.tableInput} ${styles.numInput}`}
          value={item.width || ''}
          onChange={(e) =>
            onUpdate(item.id, {
              width: Math.max(0, Number((e.target as HTMLInputElement).value)),
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <input
          type="number"
          aria-label={`Package ${idx + 1} height`}
          class={`${styles.tableInput} ${styles.numInput}`}
          value={item.height || ''}
          onChange={(e) =>
            onUpdate(item.id, {
              height: Math.max(0, Number((e.target as HTMLInputElement).value)),
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <input
          type="number"
          aria-label={`Package ${idx + 1} weight`}
          class={`${styles.tableInput} ${styles.numInput}`}
          value={item.weightKg || ''}
          onChange={(e) =>
            onUpdate(item.id, {
              weightKg: Math.max(0, Number((e.target as HTMLInputElement).value)),
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <input
          type="number"
          aria-label={`Package ${idx + 1} quantity`}
          class={`${styles.tableInput} ${styles.numInput}`}
          value={item.quantity}
          min="1"
          onChange={(e) =>
            onUpdate(item.id, {
              quantity: Math.max(1, Number((e.target as HTMLInputElement).value)),
            })
          }
          onFocus={() => onSelect(item.id)}
        />
      </td>
      <td>
        <button
          type="button"
          class={styles.trashBtn}
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          aria-label={`Remove row ${idx + 1}`}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio volumetric weight layout
export function VolumetricWeightLayout({ preset, onLaunchTour }: VolumetricWeightLayoutProps) {
  const [items, setItems] = useState<VolumetricItem[]>(SAMPLE_VOLUMETRIC_ITEMS);
  const [unit, setUnit] = useState<VolumetricUnit>('cm');
  const [standardId, setStandardId] = useState<string>('iata');
  const [divisor, setDivisor] = useState<number>(6000);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(
    SAMPLE_VOLUMETRIC_ITEMS[0]?.id || 'item-1',
  );
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const result = useVolumetricShipment(preset, items, unit, divisor);

  const handleUnitChange = (newUnit: VolumetricUnit) => {
    if (newUnit === unit) return;
    setItems((prev) =>
      prev.map((item) => {
        const lCm = convertLengthToCm(item.length, unit);
        const wCm = convertLengthToCm(item.width, unit);
        const hCm = convertLengthToCm(item.height, unit);
        return {
          ...item,
          length: convertLengthFromCm(lCm, newUnit),
          width: convertLengthFromCm(wCm, newUnit),
          height: convertLengthFromCm(hCm, newUnit),
        };
      }),
    );
    setUnit(newUnit);
  };

  const handleStandardChange = (stdId: string) => {
    setStandardId(stdId);
    const found = VOLUMETRIC_STANDARDS.find((s) => s.id === stdId);
    if (found && stdId !== 'custom') {
      setDivisor(found.divisor);
    }
  };

  const handleAddItem = () => {
    const nextNum = items.length + 1;
    const newItem: VolumetricItem = {
      id: `item-${Date.now()}`,
      description: `Carton ${String.fromCharCode(64 + nextNum)}`,
      length: 50,
      width: 40,
      height: 30,
      weightKg: 10,
      quantity: 1,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedPreviewId(newItem.id);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedPreviewId === id) {
      const remaining = items.filter((i) => i.id !== id);
      if (remaining[0]) setSelectedPreviewId(remaining[0].id);
    }
  };

  const handleUpdateItem = (id: string, patch: Partial<VolumetricItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleClearAll = () => {
    const single: VolumetricItem = {
      id: `item-${Date.now()}`,
      description: 'Carton A',
      length: 0,
      width: 0,
      height: 0,
      weightKg: 0,
      quantity: 1,
    };
    setItems([single]);
    setSelectedPreviewId(single.id);
  };

  const handleLoadSample = () => {
    setItems(SAMPLE_VOLUMETRIC_ITEMS);
    setSelectedPreviewId(SAMPLE_VOLUMETRIC_ITEMS[0]?.id || 'item-1');
    setUnit('cm');
    setDivisor(6000);
    setStandardId('iata');
  };

  const handleCopySummary = async () => {
    const lines = [
      'BeyondTheAI - Volumetric Weight Calculation Summary',
      '--------------------------------------------------',
      `Standard / Divisor: ${VOLUMETRIC_STANDARDS.find((s) => s.id === standardId)?.name || 'Custom'} (${divisor} cm³/kg)`,
      `Total Pieces: ${result.totalPieces}`,
      `Total Volume: ${result.totalVolumeM3} m³ (${result.totalVolumeCm3.toLocaleString()} cm³)`,
      `Total Actual Weight: ${result.totalActualWeightKg} kg`,
      `Total Volumetric Weight: ${result.totalVolumetricWeightKg} kg`,
      `CHARGEABLE WEIGHT: ${result.chargeableWeightKg} kg (${result.governingFactor === 'equal' ? 'BOTH EQUAL' : `${result.governingFactor.toUpperCase()} GOVERNS`})`,
      '--------------------------------------------------',
      'Items Breakdown:',
      ...result.itemCalculations.map(
        (r, idx) =>
          `#${idx + 1} ${r.description}: Vol ${r.volumeM3PerPiece} m³ | Vol Wt ${r.volumetricWeightKgPerPiece} kg/pc | Row Act ${r.totalActualWeightKg} kg | Row Vol ${r.totalVolumetricWeightKg} kg`,
      ),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div class={styles.root} data-volumetric-weight-workspace="">
      <div class={styles.workspace}>
        {/* LEFT COLUMN: Packages Worksheet & Settings */}
        <div class={styles.left}>
          <div class={styles.card}>
            <div class={styles.cardHead}>
              <span class={styles.cardTitle}>Shipment Packages ({items.length})</span>
              <div class={styles.unitRow}>
                <span>Unit:</span>
                <div class={styles.unitPillGroup}>
                  {(['mm', 'cm', 'inch'] as const).map((u) => (
                    <button
                      type="button"
                      key={u}
                      class={`${styles.unitPill} ${unit === u ? styles.unitPillActive : ''}`}
                      aria-pressed={unit === u}
                      onClick={() => handleUnitChange(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div class={styles.tableScrollWrap}>
              <table class={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '22px' }}>#</th>
                    <th style={{ minWidth: '90px' }}>Description</th>
                    <th style={{ width: '54px' }}>L ({unit})</th>
                    <th style={{ width: '54px' }}>W ({unit})</th>
                    <th style={{ width: '54px' }}>H ({unit})</th>
                    <th style={{ width: '58px' }}>Wt (kg)</th>
                    <th style={{ width: '46px' }}>Qty</th>
                    <th style={{ width: '28px' }} aria-label="Actions">
                      Act
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <VolumetricItemRow
                      key={item.id}
                      item={item}
                      idx={idx}
                      canRemove={items.length > 1}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                      onSelect={setSelectedPreviewId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div class={styles.tableActionsRow}>
              <button type="button" class={styles.outlineActionBtn} onClick={handleAddItem}>
                <span>+</span> Add item
              </button>
              <button type="button" class={styles.outlineActionBtn} onClick={handleClearAll}>
                <span>🗑️</span> Clear all
              </button>
              <button type="button" class={styles.outlineActionBtn} onClick={handleLoadSample}>
                <span>📥</span> Load sample data
              </button>
            </div>
          </div>

          <VolumetricWeightSettings
            standardId={standardId}
            divisor={divisor}
            onStandardChange={handleStandardChange}
            onDivisorChange={(d) => {
              setDivisor(d);
              setStandardId('custom');
            }}
          />
          <VolumetricCostCard
            chargeableKg={result.chargeableWeightKg}
            volumeM3={result.totalVolumeM3}
            preset={preset}
          />
        </div>

        {/* RIGHT COLUMN: 3D Visualization, Results Summary & Actions */}
        <div class={styles.right}>
          <Carton3DPreview
            items={items}
            selectedId={selectedPreviewId}
            onSelectId={setSelectedPreviewId}
            unit={unit}
          />

          <VolumetricWeightResults result={result} />

          <div class={styles.actions}>
            {onLaunchTour ? (
              <button
                type="button"
                class={styles.printBtn}
                onClick={onLaunchTour}
                title="Step-by-step tool guide"
                aria-label="Step-by-step tool guide"
              >
                <Icon name="info" /> Guide
              </button>
            ) : null}
            <button type="button" class={styles.printBtn} onClick={() => window.print()}>
              <Icon name="file-text" /> Print / Save PDF
            </button>
            <button type="button" class={styles.copyBtn} onClick={handleCopySummary}>
              <Icon name="copy" /> {copyFeedback ? 'Copied!' : 'Copy Summary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
