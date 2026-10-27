export interface ScenicSample {
  name: string;
  width: number;
  height: number;
  size: number;
  bytes: Uint8Array;
  blobUrl: string;
}

const TINY_JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x08,
  0x00, 0x08, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9,
]);

function drawMountainLake(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, '#1e3a8a');
  sky.addColorStop(1, '#93c5fd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  ctx.lineTo(w * 0.25, h * 0.2);
  ctx.lineTo(w * 0.5, h * 0.55);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.27);
  ctx.lineTo(w * 0.25, h * 0.2);
  ctx.lineTo(w * 0.3, h * 0.27);
  ctx.fill();

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
}

function drawBeach(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#0284c7');
  sky.addColorStop(1, '#67e8f9');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#0891b2';
  ctx.fillRect(0, h * 0.5, w, h * 0.25);

  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, h * 0.75, w, h * 0.25);

  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(w * 0.75, h * 0.3, 25, 0, Math.PI * 2);
  ctx.fill();
}

function drawCity(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, '#312e81');
  sky.addColorStop(1, '#f97316');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < 8; i++) {
    const bW = w / 8;
    const bH = 80 + ((i * 37) % 100);
    ctx.fillRect(i * bW, h * 0.7 - bH, bW - 4, bH + h * 0.3);
  }
}

function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#064e3b');
  bg.addColorStop(1, '#022c22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#022c22';
  for (let i = 0; i < 6; i++) {
    const tx = 30 + i * 50;
    ctx.beginPath();
    ctx.moveTo(tx, h * 0.25);
    ctx.lineTo(tx - 25, h);
    ctx.lineTo(tx + 25, h);
    ctx.fill();
  }
}

function drawSunset(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  sky.addColorStop(0, '#ea580c');
  sky.addColorStop(1, '#fde047');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.62, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
}

const SAMPLE_SPECS = [
  { name: 'mountain-lake.jpg', width: 4000, height: 2667, size: 2450000, draw: drawMountainLake },
  { name: 'beach.jpg', width: 3840, height: 2160, size: 1820000, draw: drawBeach },
  { name: 'city.jpg', width: 3840, height: 2160, size: 1540000, draw: drawCity },
  { name: 'forest.jpg', width: 4000, height: 2667, size: 2100000, draw: drawForest },
  { name: 'sunset.jpg', width: 3840, height: 2160, size: 1650000, draw: drawSunset },
];

async function renderCanvasSample(spec: (typeof SAMPLE_SPECS)[0]): Promise<ScenicSample | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) spec.draw(ctx, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob((b) => res(b), 'image/jpeg', 0.88),
  );
  if (!blob) return null;

  const arrayBuf = await blob.arrayBuffer();
  return {
    name: spec.name,
    width: spec.width,
    height: spec.height,
    size: spec.size,
    bytes: new Uint8Array(arrayBuf),
    blobUrl: URL.createObjectURL(blob),
  };
}

export async function createScenicSampleImages(): Promise<ScenicSample[]> {
  if (typeof document === 'undefined') {
    return SAMPLE_SPECS.map((s) => ({
      name: s.name,
      width: s.width,
      height: s.height,
      size: s.size,
      bytes: TINY_JPEG,
      blobUrl: '',
    }));
  }

  const results: ScenicSample[] = [];
  for (const spec of SAMPLE_SPECS) {
    try {
      const sample = await renderCanvasSample(spec);
      if (sample) {
        results.push(sample);
        continue;
      }
    } catch {
      // fallback below
    }

    results.push({
      name: spec.name,
      width: spec.width,
      height: spec.height,
      size: spec.size,
      bytes: TINY_JPEG,
      blobUrl: typeof URL !== 'undefined' ? URL.createObjectURL(new Blob([TINY_JPEG])) : '',
    });
  }

  return results;
}
