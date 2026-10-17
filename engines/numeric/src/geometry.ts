/** Bounded Route A binary64 geometry; constants/order are pinned in geometry-analysis.md. */
const DEG_HI = 0.017453292519943295;
const DEG_LO = 2.9486522708701687e-19;
const SMALL_DEGREES = 1.4901161193847656e-8; // 2^-26
const SIN = [
  -0.16666666666666666, 0.008333333333333333, -0.0001984126984126984, 0.0000027557319223985893,
  -2.505210838544172e-8, 1.6059043836821613e-10, -7.647163731819816e-13, 2.8114572543455206e-15,
];
const COS = [
  -0.5, 0.041666666666666664, -0.001388888888888889, 0.0000248015873015873, -2.755731922398589e-7,
  2.08767569878681e-9, -1.1470745597729725e-11, 4.779477332387385e-14, -1.5619206968586225e-16,
];

export type GeometryResult =
  | { ok: true; value: number }
  | {
      ok: false;
      code: 'NUMERIC_GEOMETRY_INVALID_NUMBER' | 'NUMERIC_GEOMETRY_OUT_OF_RANGE';
      argument: 'degrees' | 'x' | 'y';
    };
type Failure = Extract<GeometryResult, { ok: false }>;

function success(value: number): GeometryResult {
  return { ok: true, value: value === 0 ? 0 : value };
}

function degreeError(degrees: number): Failure | undefined {
  if (!Number.isFinite(degrees)) {
    return { ok: false, code: 'NUMERIC_GEOMETRY_INVALID_NUMBER', argument: 'degrees' };
  }
  if (degrees < 0 || degrees >= 360) {
    return { ok: false, code: 'NUMERIC_GEOMETRY_OUT_OF_RANGE', argument: 'degrees' };
  }
}

/** Dekker split: no overflow/underflow on the non-tiny bounded conversion path. */
function product(a: number, b: number): [number, number] {
  const value = a * b;
  const ca = 134217729 * a;
  const cb = 134217729 * b;
  const ah = ca - (ca - a);
  const bh = cb - (cb - b);
  const al = a - ah;
  const bl = b - bh;
  const error1 = value - ah * bh;
  const error2 = error1 - al * bh;
  const error3 = error2 - ah * bl;
  return [value, al * bl - error3];
}

function polynomial(coefficients: readonly number[], square: number): number {
  let value = coefficients[coefficients.length - 1];
  for (let i = coefficients.length - 2; i >= 0; i--) value = coefficients[i] + square * value;
  return value;
}

function rotate(sine: number, cosine: number, quadrant: number): [number, number] {
  switch (quadrant & 3) {
    case 0:
      return [sine, cosine];
    case 1:
      return [cosine, -sine];
    case 2:
      return [-sine, -cosine];
    default:
      return [-cosine, sine];
  }
}

function sineCosine(degrees: number): [number, number] {
  if (degrees === 0) return [0, 1];
  if (degrees === 90) return [1, 0];
  if (degrees === 180) return [0, -1];
  if (degrees === 270) return [-1, 0];
  let quadrant = 0;
  for (const boundary of [45, 135, 225, 315]) if (degrees > boundary) quadrant++;
  const remainder = degrees - quadrant * 90;
  if (Math.abs(remainder) < SMALL_DEGREES) return rotate(remainder * DEG_HI, 1, quadrant);
  const [x, error] = product(remainder, DEG_HI);
  const tail = error + remainder * DEG_LO;
  const square = x * x;
  const sine = x + x * square * polynomial(SIN, square);
  const cosine = 1 + square * polynomial(COS, square);
  return rotate(sine + cosine * tail, cosine - sine * tail, quadrant);
}

/** Degrees in [0,360), tagged failures, no input coercion or modulo normalization. */
export function degreesToRadians(degrees: number): GeometryResult {
  const error = degreeError(degrees);
  if (error) return error;
  if (degrees < SMALL_DEGREES) return success(degrees * DEG_HI);
  const [hi, tail] = product(degrees, DEG_HI);
  return success(hi + (tail + degrees * DEG_LO));
}

export function sinDegrees(degrees: number): GeometryResult {
  const error = degreeError(degrees);
  return error ?? success(sineCosine(degrees)[0]);
}

export function cosDegrees(degrees: number): GeometryResult {
  const error = degreeError(degrees);
  return error ?? success(sineCosine(degrees)[1]);
}

/** Scaled norm; sqrt is private, bounded to [1,2], with eight fixed Newton steps. */
export function hypot2(x: number, y: number): GeometryResult {
  const argumentsInOrder = [
    [x, 'x'],
    [y, 'y'],
  ] as const;
  for (const [value, argument] of argumentsInOrder) {
    if (!Number.isFinite(value))
      return { ok: false, code: 'NUMERIC_GEOMETRY_INVALID_NUMBER', argument };
  }
  for (const [value, argument] of argumentsInOrder) {
    if (Math.abs(value) > 1e8)
      return { ok: false, code: 'NUMERIC_GEOMETRY_OUT_OF_RANGE', argument };
  }
  const maximum = Math.max(Math.abs(x), Math.abs(y));
  const minimum = Math.min(Math.abs(x), Math.abs(y));
  if (minimum === 0) return success(maximum);
  const ratio = minimum / maximum;
  const square = 1 + ratio * ratio;
  let root = 1.5;
  for (let i = 0; i < 8; i++) root = 0.5 * (root + square / root);
  return success(maximum * root);
}
