import { ok, type WorkingStep } from '@mangotools/core';
import { cosDegrees, hypot2, sinDegrees } from '@mangotools/engine-numeric';
import type { TraverseInput, TraverseOutput } from './schema.ts';
import { failure } from './validate.ts';

const positiveZero = (value: number) => (value === 0 ? 0 : value);

function step(ref: string, formula: string, variables: Record<string, number>, result: number) {
  return {
    ref,
    formulaKey: `traverse.working.${formula}`,
    variables: Object.fromEntries(Object.entries(variables).map(([k, v]) => [k, String(v)])),
    result: String(result),
  } satisfies WorkingStep;
}

function closure(northing: number, easting: number, perimeterM: number) {
  const norm = hypot2(northing, easting);
  if (!norm.ok) return failure('NUMERIC_RANGE', 'closure.linearMisclosureM');
  const linearMisclosureM = norm.value;
  const result: TraverseOutput['closure'] = {
    northingMisclosureM: positiveZero(northing),
    eastingMisclosureM: positiveZero(easting),
    linearMisclosureM,
    perimeterM,
    relativePrecision: linearMisclosureM === 0 ? 0 : linearMisclosureM / perimeterM,
    closureRatioDenominator: linearMisclosureM === 0 ? null : perimeterM / linearMisclosureM,
    closureStatus: linearMisclosureM === 0 ? 'zero-misclosure' : 'finite',
  };
  for (const [key, value] of Object.entries(result))
    if (typeof value === 'number' && !Number.isFinite(value))
      return failure('NUMERIC_RANGE', `closure.${key}`);
  return ok(result);
}

export function compute(input: TraverseInput) {
  let northing = 0;
  let easting = 0;
  let perimeter = 0;
  const coordinates = [
    {
      northingM: positiveZero(input.start.northingM),
      eastingM: positiveZero(input.start.eastingM),
    },
  ];
  const legs: TraverseOutput['legs'] = [];
  const working: WorkingStep[] = [];
  for (const [i, leg] of input.legs.entries()) {
    const cosine = cosDegrees(leg.azimuthDeg);
    const sine = sinDegrees(leg.azimuthDeg);
    if (!cosine.ok || !sine.ok) return failure('NUMERIC_RANGE', `legs.${i}`);
    const latitudeM = positiveZero(leg.distanceM * cosine.value);
    const departureM = positiveZero(leg.distanceM * sine.value);
    const previous = coordinates[i];
    const northingM = positiveZero(previous.northingM + latitudeM);
    const eastingM = positiveZero(previous.eastingM + departureM);
    if (![latitudeM, departureM, northingM, eastingM].every(Number.isFinite))
      return failure('NUMERIC_RANGE', `legs.${i}`);
    legs.push({ ...leg, azimuthDeg: positiveZero(leg.azimuthDeg), latitudeM, departureM });
    coordinates.push({ northingM, eastingM });
    northing += latitudeM;
    easting += departureM;
    perimeter += leg.distanceM;
    const dimensions = { distanceM: leg.distanceM, azimuthDeg: leg.azimuthDeg };
    working.push(step(`legs.${i}.latitudeM`, 'latitude', dimensions, latitudeM));
    working.push(step(`legs.${i}.departureM`, 'departure', dimensions, departureM));
    working.push(
      step(
        `coordinates.${i + 1}.northingM`,
        'coordinate',
        { previous: previous.northingM, increment: latitudeM },
        northingM,
      ),
    );
    working.push(
      step(
        `coordinates.${i + 1}.eastingM`,
        'coordinate',
        { previous: previous.eastingM, increment: departureM },
        eastingM,
      ),
    );
  }
  const checked = closure(northing, easting, perimeter);
  if (!checked.ok) return checked;
  for (const [key, value] of Object.entries(checked.value))
    if (typeof value === 'number')
      working.push(step(`closure.${key}`, key, { northing, easting, perimeter }, value));
  return ok({ type: 'closed-loop' as const, legs, coordinates, closure: checked.value, working });
}
