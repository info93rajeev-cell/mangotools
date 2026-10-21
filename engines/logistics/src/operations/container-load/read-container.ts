import { err, ok, type Result } from '@mangotools/core';
import { compare, mul } from '@mangotools/engine-numeric';
import { readPositive } from '../../lib/read-input.ts';
import { type ContainerType, STANDARD_CONTAINERS } from '../container-fit/containers.ts';
import { payloadNg, subToCm, toSub } from './measure.ts';
import type { ContainerLoadInput } from './schema.ts';
import { INPUT_DECIMALS, KG_PER_WEIGHT_UNIT, M_PER_UNIT, MAX_PAYLOAD_KG } from './units.ts';

/** The selected container: internal dimensions, usable height and optional payload. */
export interface ReadContainer {
  type: ContainerType;
  /** Internal length, width and height in exact centimetres. */
  dimsCm: readonly [string, string, string];
  /** Length, width and USABLE height (after any stack-height limit) in 0.1 µm sub-units. */
  dims: readonly [bigint, bigint, bigint];
  usableHeightCm: string;
  stackHeightAboveContainer: boolean;
  volumeM3: string;
  payloadKg: string | null;
  payloadNg: bigint | null;
}

const toCm = (value: string, unit: keyof typeof M_PER_UNIT) =>
  mul(mul(value, M_PER_UNIT[unit]), '100');

function readCustomCm(input: ContainerLoadInput): Result<readonly [string, string, string]> {
  const unit = input.containerUnit;
  if (unit === undefined) return err('LOGISTICS_MISSING_INPUT', { path: 'containerUnit' });
  const length = readPositive(input.containerLength, 'containerLength', INPUT_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.containerWidth, 'containerWidth', INPUT_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(input.containerHeight, 'containerHeight', INPUT_DECIMALS);
  if (!height.ok) return height;
  return ok([toCm(length.value, unit), toCm(width.value, unit), toCm(height.value, unit)]);
}

/** Internal dimensions in cm: the standard table, or a validated custom container. */
function readDimsCm(input: ContainerLoadInput): Result<readonly [string, string, string]> {
  if (input.containerType === 'custom') return readCustomCm(input);
  const preset = STANDARD_CONTAINERS[input.containerType];
  return ok([preset.length, preset.width, preset.height]);
}

/** Optional stack-height limit in sub-units; null when not given. */
function readStackHeight(input: ContainerLoadInput): Result<bigint | null> {
  if (input.maxStackHeight === undefined || String(input.maxStackHeight).trim() === '') {
    return ok(null);
  }
  const height = readPositive(input.maxStackHeight, 'maxStackHeight', INPUT_DECIMALS);
  if (!height.ok) return height;
  const unit = input.stackHeightUnit;
  if (unit === undefined) return err('LOGISTICS_MISSING_INPUT', { path: 'stackHeightUnit' });
  return ok(toSub(height.value, unit));
}

/** Optional maximum payload per container, in exact kilograms. */
function readPayloadKg(input: ContainerLoadInput): Result<string | null> {
  if (input.maxPayload === undefined || String(input.maxPayload).trim() === '') return ok(null);
  const payload = readPositive(input.maxPayload, 'maxPayload', INPUT_DECIMALS);
  if (!payload.ok) return payload;
  const kg = mul(payload.value, KG_PER_WEIGHT_UNIT[input.payloadUnit ?? 'kg']);
  if (compare(kg, MAX_PAYLOAD_KG) > 0) {
    return err('LOGISTICS_PAYLOAD_TOO_LARGE', {
      path: 'maxPayload',
      details: { max: '1,000,000' },
    });
  }
  return ok(kg);
}

export function readContainer(input: ContainerLoadInput): Result<ReadContainer> {
  const dimsCm = readDimsCm(input);
  if (!dimsCm.ok) return dimsCm;
  const stack = readStackHeight(input);
  if (!stack.ok) return stack;
  const payloadKg = readPayloadKg(input);
  if (!payloadKg.ok) return payloadKg;
  const [lengthCm, widthCm, heightCm] = dimsCm.value;
  const height = toSub(heightCm, 'cm');
  const above = stack.value !== null && stack.value > height;
  const usable = stack.value === null || above ? height : stack.value;
  return ok({
    type: input.containerType,
    dimsCm: dimsCm.value,
    dims: [toSub(lengthCm, 'cm'), toSub(widthCm, 'cm'), usable],
    usableHeightCm: subToCm(usable),
    stackHeightAboveContainer: above,
    volumeM3: mul(mul(mul(lengthCm, widthCm), heightCm), '0.000001'),
    payloadKg: payloadKg.value,
    payloadNg: payloadKg.value === null ? null : payloadNg(payloadKg.value),
  });
}
