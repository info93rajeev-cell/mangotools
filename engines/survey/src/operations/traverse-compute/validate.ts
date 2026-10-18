import { err, ok } from '@mangotools/core';
import type { TraverseInput } from './schema.ts';

export const failure = (reason: string, path: string) => err(`SURVEY_TRAVERSE_${reason}`, { path });

function topology(legs: TraverseInput['legs']) {
  for (const [i, leg] of legs.entries())
    if (leg.from === leg.to) return failure('SELF_LEG', `legs.${i}.to`);
  for (let i = 1; i < legs.length; i++)
    if (legs[i].from !== legs[i - 1].to) return failure('DISCONNECTED_SEQUENCE', `legs.${i}.from`);
  if (legs[legs.length - 1].to !== legs[0].from)
    return failure('NOT_CLOSED', `legs.${legs.length - 1}.to`);
  const seen = new Set<string>();
  for (const [i, leg] of legs.entries()) {
    if (seen.has(leg.from)) return failure('REPEATED_STATION', `legs.${i}.from`);
    seen.add(leg.from);
  }
  return ok(legs);
}

function validateLeg(leg: TraverseInput['legs'][number], index: number) {
  const path = `legs.${index}`;
  for (const key of ['from', 'to'] as const)
    if (leg[key].length > 60 || !/\S/.test(leg[key]))
      return failure('INVALID_STATION', `${path}.${key}`);
  if (leg.distanceM <= 0) return failure('NON_POSITIVE_DISTANCE', `${path}.distanceM`);
  if (leg.distanceM > 1e6) return failure('DISTANCE_OUT_OF_RANGE', `${path}.distanceM`);
  if (leg.azimuthDeg < 0 || leg.azimuthDeg >= 360)
    return failure('AZIMUTH_OUT_OF_RANGE', `${path}.azimuthDeg`);
  return ok(leg);
}

export function validate(input: TraverseInput) {
  if (input.legs.length < 3) return failure('TOO_FEW_LEGS', 'legs');
  if (input.legs.length > 50) return failure('TOO_MANY_LEGS', 'legs');
  for (const key of ['northingM', 'eastingM'] as const)
    if (Math.abs(input.start[key]) > 1e9) return failure('COORDINATE_OUT_OF_RANGE', `start.${key}`);
  for (const [i, leg] of input.legs.entries()) {
    const checked = validateLeg(leg, i);
    if (!checked.ok) return checked;
  }
  const checked = topology(input.legs);
  return checked.ok ? ok(input) : checked;
}
