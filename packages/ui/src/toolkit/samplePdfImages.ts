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

function drawReceipt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('RECEIPT #8492', 30, 45);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px monospace';
  ctx.fillText('Store #104 • 2026-10-30', 30, 70);
  ctx.fillRect(30, 85, w - 60, 2);
  for (let i = 0; i < 5; i++) {
    ctx.fillText(`Item 0${i + 1} ......... $${(12.5 * (i + 1)).toFixed(2)}`, 30, 115 + i * 26);
  }
  ctx.fillRect(30, 255, w - 60, 2);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('TOTAL: $187.50', 30, 285);
}

function drawInvoice(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(30, 30, w - 60, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('COMMERCIAL INVOICE', 45, 56);
  ctx.fillStyle = '#334155';
  ctx.font = '12px sans-serif';
  ctx.fillText('Billed to: Global Tech Logistics Inc.', 30, 100);
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(30, 125 + i * 32, w - 60, 20);
  }
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('PAID IN FULL', 30, 280);
}

function drawIdScan(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e0f2fe';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(40, 40, w - 80, h - 80, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.fillRect(60, 65, 90, 110);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('IDENTIFICATION CARD', 170, 85);
  ctx.font = '12px sans-serif';
  ctx.fillText('Name: Alex Carter', 170, 115);
  ctx.fillText('ID: AGY-88319-X', 170, 140);
  ctx.fillText('Verified: YES', 170, 165);
}

function drawFormPage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('APPLICATION FORM', 30, 45);
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 6; i++) {
    ctx.strokeRect(30, 70 + i * 36, 18, 18);
    ctx.fillRect(60, 75 + i * 36, w - 100, 10);
  }
}

function drawWorksheet(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#059669';
  ctx.fillRect(30, 30, w - 60, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('MONTHLY AUDIT WORKSHEET', 40, 47);
  ctx.strokeStyle = '#e2e8f0';
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.strokeRect(30 + c * 105, 60 + r * 30, 105, 30);
    }
  }
}

const SAMPLE_SPECS = [
  { name: 'Receipt.jpg', width: 1240, height: 1754, size: 1200000, draw: drawReceipt },
  { name: 'Invoice.jpg', width: 1654, height: 2339, size: 2100000, draw: drawInvoice },
  { name: 'ID-Scan.jpg', width: 1920, height: 1080, size: 1600000, draw: drawIdScan },
  { name: 'Form-Page.jpg', width: 1275, height: 1650, size: 1800000, draw: drawFormPage },
  { name: 'Worksheet.jpg', width: 1440, height: 1920, size: 1700000, draw: drawWorksheet },
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
