import { add, div, mul, toFixedString } from '@mangotools/engine-numeric';
import { subToCm } from './measure.ts';
import type { PackResult, PlacedBlock } from './pack.ts';
import type { ReadContainer } from './read-container.ts';
import type { ReadPackage } from './read-packages.ts';
import type { ContainerLoadParams } from './schema.ts';

/** Rounds once, from an exact value, for each kind of output. */
export interface Shown {
  volume: (value: string) => string;
  percent: (value: string) => string;
  weight: (value: string) => string;
}

export function shownFor(params: ContainerLoadParams): Shown {
  const at = (places: number) => (value: string) => toFixedString(value, places, params.rounding);
  return {
    volume: at(params.decimals),
    percent: at(params.percentDecimals),
    weight: at(params.weightDecimals),
  };
}

const sum = (values: readonly string[]) => values.reduce((total, v) => add(total, v), '0');
const percentOf = (part: string, whole: string) => mul(div(part, whole, 20), '100');

/** Exact totals the outputs and working steps are derived from. */
export interface Totals {
  containers: number;
  totalPieces: number;
  loadedPieces: number;
  requestedVolume: string;
  loadedVolume: string;
  availableVolume: string;
  volumeUtilization: string;
  weighed: number;
  loadedWeight: string | null;
  payloadCapacity: string | null;
  weightUtilization: string | null;
}

const weightOf = (pkg: ReadPackage, pieces: number) =>
  pkg.unitWeightKg === null ? '0' : mul(pkg.unitWeightKg, String(pieces));

export function computeTotals(
  packages: readonly ReadPackage[],
  container: ReadContainer,
  packed: PackResult,
): Totals {
  const containers = packed.byContainer.length;
  const loadedOf = (i: number) => packed.loaded[i] ?? 0;
  const loadedVolume = sum(packages.map((p, i) => mul(p.unitVolumeM3, String(loadedOf(i)))));
  const availableVolume = mul(container.volumeM3, String(containers));
  const weighed = packages.filter((p) => p.unitWeightKg !== null).length;
  const loadedWeight = weighed === 0 ? null : sum(packages.map((p, i) => weightOf(p, loadedOf(i))));
  const payloadCapacity =
    container.payloadKg === null ? null : mul(container.payloadKg, String(containers));
  const canRate = containers > 0 && loadedWeight !== null && payloadCapacity !== null;
  return {
    containers,
    totalPieces: packages.reduce((n, p) => n + p.quantity, 0),
    loadedPieces: packages.reduce((n, _p, i) => n + loadedOf(i), 0),
    requestedVolume: sum(packages.map((p) => mul(p.unitVolumeM3, String(p.quantity)))),
    loadedVolume,
    availableVolume,
    volumeUtilization: containers === 0 ? '0' : percentOf(loadedVolume, availableVolume),
    weighed,
    loadedWeight,
    payloadCapacity,
    weightUtilization:
      canRate && loadedWeight && payloadCapacity ? percentOf(loadedWeight, payloadCapacity) : null,
  };
}

export function packageOutputs(packages: readonly ReadPackage[], packed: PackResult, shown: Shown) {
  return packages.map((p, i) => {
    const loaded = packed.loaded[i] ?? 0;
    return {
      index: p.index,
      description: p.description,
      length: p.length,
      width: p.width,
      height: p.height,
      unit: p.unit,
      requested: String(p.quantity),
      loaded: String(loaded),
      unloaded: String(p.quantity - loaded),
      unitVolume: shown.volume(p.unitVolumeM3),
      requestedVolume: shown.volume(mul(p.unitVolumeM3, String(p.quantity))),
      loadedVolume: shown.volume(mul(p.unitVolumeM3, String(loaded))),
      unitWeight: p.unitWeightKg === null ? null : shown.weight(p.unitWeightKg),
      loadedWeight: p.unitWeightKg === null ? null : shown.weight(weightOf(p, loaded)),
      unloadedReason: packed.unloadedReason[i] ?? null,
      byContainer: packed.byContainer.map((row) => String(row[i] ?? 0)),
    };
  });
}

export function containerOutputs(
  packages: readonly ReadPackage[],
  container: ReadContainer,
  packed: PackResult,
  shown: Shown,
) {
  const weighed = packages.some((p) => p.unitWeightKg !== null);
  return packed.byContainer.map((row, index) => {
    const volume = sum(packages.map((p, i) => mul(p.unitVolumeM3, String(row[i] ?? 0))));
    const weight = sum(packages.map((p, i) => weightOf(p, row[i] ?? 0)));
    const close = packed.closes[index];
    const ratesWeight = weighed && container.payloadKg !== null;
    return {
      index,
      pieces: String(row.reduce((n, v) => n + v, 0)),
      loadedVolume: shown.volume(volume),
      volumeUtilizationPercent: shown.percent(percentOf(volume, container.volumeM3)),
      loadedWeight: weighed ? shown.weight(weight) : null,
      weightUtilizationPercent:
        ratesWeight && container.payloadKg
          ? shown.percent(percentOf(weight, container.payloadKg))
          : null,
      weightLimitReached: close?.weightLimitReached ?? false,
      spaceLimitReached: close?.spaceLimitReached ?? false,
    };
  });
}

export function blockOutputs(blocks: readonly PlacedBlock[]) {
  return blocks.map((b) => ({
    container: b.container,
    package: b.pkg,
    orientation: b.orientation,
    x: subToCm(b.origin[0]),
    y: subToCm(b.origin[1]),
    z: subToCm(b.origin[2]),
    pieceLength: subToCm(b.piece[0]),
    pieceWidth: subToCm(b.piece[1]),
    pieceHeight: subToCm(b.piece[2]),
    countX: b.counts[0],
    countY: b.counts[1],
    countZ: b.counts[2],
    count: b.count,
  }));
}
