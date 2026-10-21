import { defineOperation, ok } from '@mangotools/core';
import { loadNotices } from './notices.ts';
import { type PackResult, packContainers } from './pack.ts';
import { type ReadContainer, readContainer } from './read-container.ts';
import { type ReadPackage, readPackages } from './read-packages.ts';
import {
  type ContainerLoadParams,
  containerLoadInput,
  containerLoadOutput,
  containerLoadParams,
} from './schema.ts';
import {
  blockOutputs,
  computeTotals,
  containerOutputs,
  packageOutputs,
  type Shown,
  shownFor,
  type Totals,
} from './summarize.ts';
import { MAX_BLOCKS, MAX_CONTAINERS } from './units.ts';
import { loadWorkingSteps } from './working.ts';

type Status = 'complete' | 'partial' | 'none';

const statusOf = (t: Totals): Status =>
  t.loadedPieces === t.totalPieces ? 'complete' : t.loadedPieces === 0 ? 'none' : 'partial';

const weightStatusOf = (weighed: number, count: number): Status =>
  weighed === count ? 'complete' : weighed === 0 ? 'none' : 'partial';

function settingsFor(params: ContainerLoadParams, container: ReadContainer) {
  return {
    container: container.dims,
    payloadNg: container.payloadNg,
    allowRotation: params.allowRotation,
    keepUpright: params.keepUpright,
    stackable: params.stackable,
    maxContainers: MAX_CONTAINERS,
    maxBlocks: MAX_BLOCKS,
  };
}

/** Container, piece, volume and weight figures, each rounded once from its exact value. */
function summaryFields(container: ReadContainer, totals: Totals, shown: Shown) {
  const maybe = (value: string | null, format: (v: string) => string) =>
    value === null ? null : format(value);
  return {
    containerType: container.type,
    containerLength: container.dimsCm[0],
    containerWidth: container.dimsCm[1],
    containerHeight: container.dimsCm[2],
    usableHeight: container.usableHeightCm,
    containerVolume: shown.volume(container.volumeM3),
    containersRequired: String(totals.containers),
    totalPieces: String(totals.totalPieces),
    loadedPieces: String(totals.loadedPieces),
    unloadedPieces: String(totals.totalPieces - totals.loadedPieces),
    requestedVolume: shown.volume(totals.requestedVolume),
    loadedVolume: shown.volume(totals.loadedVolume),
    availableVolume: shown.volume(totals.availableVolume),
    volumeUtilizationPercent: shown.percent(totals.volumeUtilization),
    loadedWeight: maybe(totals.loadedWeight, shown.weight),
    maxPayload: maybe(container.payloadKg, shown.weight),
    payloadCapacity: maybe(totals.payloadCapacity, shown.weight),
    weightUtilizationPercent: maybe(totals.weightUtilization, shown.percent),
  };
}

function buildResult(
  params: ContainerLoadParams,
  packages: readonly ReadPackage[],
  container: ReadContainer,
  packed: PackResult,
) {
  const shown = shownFor(params);
  const totals = computeTotals(packages, container, packed);
  const status = statusOf(totals);
  const weightStatus = weightStatusOf(totals.weighed, packages.length);
  const value = {
    status,
    ...summaryFields(container, totals, shown),
    weightStatus,
    packages: packageOutputs(packages, packed, shown),
    containers: containerOutputs(packages, container, packed, shown),
    blocks: blockOutputs(packed.blocks),
    working: loadWorkingSteps(container, totals),
  };
  const notices = loadNotices({
    container,
    status,
    unloadedPieces: totals.totalPieces - totals.loadedPieces,
    containers: totals.containers,
    weightStatus,
    weightLimitReached: packed.closes.some((c) => c.weightLimitReached),
  });
  return [value, notices] as const;
}

export const containerLoad = defineOperation({
  id: 'logistics.container.load',
  major: 1,
  title: 'Container loading plan',
  summary:
    'Places rectangular packages of one or more types into identical containers and reports what loads, what does not, the containers required and their utilization.',
  input: containerLoadInput,
  params: containerLoadParams,
  output: containerLoadOutput,
  errors: [
    'LOGISTICS_NO_PACKAGES',
    'LOGISTICS_TOO_MANY_PACKAGES',
    'LOGISTICS_TOTAL_PIECES_TOO_LARGE',
    'LOGISTICS_DESCRIPTION_TOO_LONG',
    'LOGISTICS_MISSING_INPUT',
    'LOGISTICS_INVALID_NUMBER',
    'LOGISTICS_TOO_MANY_DECIMALS',
    'LOGISTICS_NOT_POSITIVE',
    'LOGISTICS_PIECES_NOT_POSITIVE',
    'LOGISTICS_PIECES_NOT_WHOLE',
    'LOGISTICS_PIECES_TOO_LARGE',
    'LOGISTICS_WEIGHT_TOO_LARGE',
    'LOGISTICS_PAYLOAD_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'personal',
  run(input, params) {
    const packages = readPackages(input.packages);
    if (!packages.ok) return packages;
    const container = readContainer(input);
    if (!container.ok) return container;
    const pieces = packages.value.map((p) => ({
      dims: p.dims,
      quantity: p.quantity,
      weightNg: p.unitWeightNg,
    }));
    const packed = packContainers(pieces, settingsFor(params, container.value));
    return ok(...buildResult(params, packages.value, container.value, packed));
  },
});
