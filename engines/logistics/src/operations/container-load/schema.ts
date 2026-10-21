import { z } from 'zod';
import { containerTypes } from '../container-fit/containers.ts';
import { loadLengthUnits, weightUnits } from './units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

/** One package type: a rectangular unit (carton, crate, palletized unit, …) and how many there are. */
export const packageInput = z.strictObject({
  description: z.string().optional(),
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  unit: z.enum(loadLengthUnits).optional(),
  quantity: decimal.optional(),
  /** Weight of ONE piece; optional. */
  weight: decimal.optional(),
  weightUnit: z.enum(weightUnits).optional(),
});

export const containerLoadInput = z.strictObject({
  packages: z.array(packageInput).optional(),
  containerType: z.enum(containerTypes),
  containerUnit: z.enum(loadLengthUnits).optional(),
  containerLength: decimal.optional(),
  containerWidth: decimal.optional(),
  containerHeight: decimal.optional(),
  /** Maximum cargo weight per container; optional. */
  maxPayload: decimal.optional(),
  payloadUnit: z.enum(weightUnits).optional(),
  /** Highest point cargo may reach above the floor; optional (default: the container height). */
  maxStackHeight: decimal.optional(),
  stackHeightUnit: z.enum(loadLengthUnits).optional(),
});

export const containerLoadParams = z.strictObject({
  /** Places for volumes in m³. */
  decimals: z.int().min(0).max(6).default(3),
  percentDecimals: z.int().min(0).max(4).default(1),
  weightDecimals: z.int().min(0).max(4).default(2),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
  allowRotation: z.boolean().default(true),
  keepUpright: z.boolean().default(false),
  stackable: z.boolean().default(true),
});

export const orientationCode = z.enum(['lwh', 'lhw', 'wlh', 'whl', 'hlw', 'hwl']);

export const unloadedReasons = [
  'no-feasible-orientation',
  'weight-exceeds-payload',
  'container-limit',
  'plan-limit',
] as const;

const packageOutput = z.strictObject({
  index: z.int(),
  description: z.string(),
  length: z.string(),
  width: z.string(),
  height: z.string(),
  unit: z.enum(loadLengthUnits),
  requested: z.string(),
  loaded: z.string(),
  unloaded: z.string(),
  unitVolume: z.string(),
  requestedVolume: z.string(),
  loadedVolume: z.string(),
  unitWeight: z.string().nullable(),
  loadedWeight: z.string().nullable(),
  unloadedReason: z.enum(unloadedReasons).nullable(),
  /** Pieces of this package in each container, by container index. */
  byContainer: z.array(z.string()),
});

const containerOutput = z.strictObject({
  index: z.int(),
  pieces: z.string(),
  loadedVolume: z.string(),
  volumeUtilizationPercent: z.string(),
  loadedWeight: z.string().nullable(),
  weightUtilizationPercent: z.string().nullable(),
  /** Pieces were still waiting when this container closed, and at least one was too heavy for it. */
  weightLimitReached: z.boolean(),
  /** Pieces were still waiting when this container closed, and at least one did not fit the space. */
  spaceLimitReached: z.boolean(),
});

/** A cuboid of identical pieces: countX × countY × countZ pieces starting at (x, y, z), in cm. */
const blockOutput = z.strictObject({
  container: z.int(),
  package: z.int(),
  orientation: orientationCode,
  x: z.string(),
  y: z.string(),
  z: z.string(),
  pieceLength: z.string(),
  pieceWidth: z.string(),
  pieceHeight: z.string(),
  countX: z.int(),
  countY: z.int(),
  countZ: z.int(),
  count: z.int(),
});

export const containerLoadOutput = z.strictObject({
  status: z.enum(['complete', 'partial', 'none']),
  containerType: z.enum(containerTypes),
  containerLength: z.string(),
  containerWidth: z.string(),
  containerHeight: z.string(),
  usableHeight: z.string(),
  containerVolume: z.string(),
  containersRequired: z.string(),
  totalPieces: z.string(),
  loadedPieces: z.string(),
  unloadedPieces: z.string(),
  requestedVolume: z.string(),
  loadedVolume: z.string(),
  availableVolume: z.string(),
  volumeUtilizationPercent: z.string(),
  weightStatus: z.enum(['complete', 'partial', 'none']),
  loadedWeight: z.string().nullable(),
  maxPayload: z.string().nullable(),
  payloadCapacity: z.string().nullable(),
  weightUtilizationPercent: z.string().nullable(),
  packages: z.array(packageOutput),
  containers: z.array(containerOutput),
  blocks: z.array(blockOutput),
  working: z.array(workingStep),
});

export type ContainerLoadInput = z.infer<typeof containerLoadInput>;
export type ContainerLoadParams = z.infer<typeof containerLoadParams>;
export type PackageInput = z.infer<typeof packageInput>;
export type UnloadedReason = (typeof unloadedReasons)[number];
