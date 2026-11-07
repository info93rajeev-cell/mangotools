/**
 * Glass matte on a range of studio and real-world set-ups, so tuning for one photo cannot
 * quietly break another. Each scene has glass, an opaque coloured part and a light opaque
 * part on a different kind of background.
 */
import { describe, expect, it } from 'vitest';
import { glassMatte, planGlass } from './glassMatte.ts';

const W = 200;
const H = 140;
type RGB = [number, number, number];
type Bg = (x: number, y: number) => RGB;

let seed = 1;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
/** Fixed pseudo-random texture so the tests are repeatable. */
function noiseField(amount: number) {
  seed = 7;
  const f = new Float32Array(W * H);
  for (let i = 0; i < f.length; i++) f[i] = (rand() - 0.5) * 2 * amount;
  return (x: number, y: number) => f[y * W + x] ?? 0;
}

const clamp = (v: number) => Math.max(0, Math.min(255, v));
const add = (c: RGB, d: number): RGB => [clamp(c[0] + d), clamp(c[1] + d), clamp(c[2] + d)];

interface Scene {
  name: string;
  bg: Bg;
  /** What clear glass looks like over this background. */
  glass: (behind: RGB) => RGB;
  colour: RGB;
  light: RGB;
}

const smoothNoise = noiseField(3);
const heavyNoise = noiseField(14);

const SCENES: Scene[] = [
  {
    name: 'lavender studio sweep (gradient)',
    bg: (x, y) => add([190, 188, 222], (40 * (x / W + y / H)) / 2 + smoothNoise(x, y)),
    glass: (b) => add(b, -9),
    colour: [235, 60, 60],
    light: [248, 248, 250],
  },
  {
    name: 'plain white product background',
    bg: (x, y) => add([248, 248, 248], smoothNoise(x, y)),
    glass: (b) => add(b, -10),
    colour: [30, 90, 200],
    light: [205, 200, 190],
  },
  {
    name: 'dark background',
    bg: (x, y) => add([28, 28, 34], smoothNoise(x, y)),
    glass: (b) => add(b, 10),
    colour: [220, 170, 40],
    light: [235, 235, 235],
  },
  {
    name: 'green backdrop',
    bg: (x, y) => add([70, 160, 80], smoothNoise(x, y)),
    glass: (b) => add(b, 9),
    colour: [200, 30, 120],
    light: [240, 240, 240],
  },
  {
    name: 'grainy textured wall',
    bg: (x, y) => add([150, 140, 130], heavyNoise(x, y)),
    glass: (b) => add(b, -8),
    colour: [40, 60, 200],
    light: [245, 245, 245],
  },
];

const GLASS = { x0: 20, x1: 70, y0: 30, y1: 110 };
const COLOUR = { x0: 85, x1: 125, y0: 30, y1: 110 };
const LIGHT = { x0: 140, x1: 180, y0: 30, y1: 110 };
const inside = (r: typeof GLASS, x: number, y: number) =>
  x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;

function pixel(s: Scene, x: number, y: number): { c: RGB; subject: boolean } {
  const b = s.bg(x, y);
  if (inside(GLASS, x, y)) return { c: s.glass(b), subject: true };
  if (inside(COLOUR, x, y)) return { c: s.colour, subject: true };
  if (inside(LIGHT, x, y)) return { c: s.light, subject: true };
  return { c: b, subject: false };
}

function render(s: Scene) {
  const rgba = new Uint8ClampedArray(W * H * 4);
  const cut = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { c, subject } = pixel(s, x, y);
      const o = (y * W + x) * 4;
      rgba.set([c[0], c[1], c[2], 255], o);
      cut[o + 3] = subject ? 255 : 0;
    }
  }
  return { rgba, cut };
}

function meanAlpha(out: Uint8ClampedArray, r: typeof GLASS) {
  let sum = 0;
  let n = 0;
  // Stay 4px inside the region so the edge blend does not count.
  for (let y = r.y0 + 4; y < r.y1 - 4; y++) {
    for (let x = r.x0 + 4; x < r.x1 - 4; x++) {
      sum += (out[(y * W + x) * 4 + 3] ?? 0) / 255;
      n++;
    }
  }
  return sum / n;
}

describe.each(SCENES)('glass matte: $name', (scene) => {
  const { rgba, cut } = render(scene);
  const out = glassMatte(rgba, cut, W, H);

  it('glass is see-through', () => {
    expect(meanAlpha(out, GLASS)).toBeLessThan(0.5);
    expect(meanAlpha(out, GLASS)).toBeGreaterThan(0.03);
  });

  it('coloured and light opaque parts stay solid', () => {
    expect(meanAlpha(out, COLOUR)).toBeGreaterThan(0.97);
    expect(meanAlpha(out, LIGHT)).toBeGreaterThan(0.95);
  });

  it('the background is removed', () => {
    expect((out[(5 * W + 5) * 4 + 3] ?? 0) / 255).toBe(0);
  });
});

describe('limits follow the photo', () => {
  it('a grainy background gets wider limits than a clean studio sweep', () => {
    const plan = (s: Scene) => {
      const { rgba, cut } = render(s);
      const rgb = new Float32Array(W * H * 3);
      const alpha = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) {
        for (let k = 0; k < 3; k++) rgb[i * 3 + k] = rgba[i * 4 + k] ?? 0;
        alpha[i] = (cut[i * 4 + 3] ?? 0) / 255;
      }
      return planGlass(rgb, alpha, W, H);
    };
    const clean = plan(SCENES[0] as Scene);
    const grainy = plan(SCENES[4] as Scene);
    expect(grainy.noise).toBeGreaterThan(clean.noise * 2);
    expect(grainy.limits.from).toBeGreaterThan(clean.limits.from);
  });
});
