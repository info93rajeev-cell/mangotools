export type PaperSizeId = '4x6' | 'a4' | 'a5';

export interface PaperSizeDefinition {
  id: PaperSizeId;
  name: string;
  widthMm: number;
  heightMm: number;
  shortLabel: string;
  description: string;
  isLandscapeDefault?: boolean;
}

export const PAPER_SIZES: PaperSizeDefinition[] = [
  {
    id: '4x6',
    name: '4×6 inch (Quarter A4)',
    widthMm: 152.4, // standard 6" x 4" landscape
    heightMm: 101.6,
    shortLabel: '4×6" (Studio Photo Paper)',
    description: 'Quarter A4 / Standard Photo Lab Paper (10×15 cm)',
    isLandscapeDefault: true,
  },
  {
    id: 'a4',
    name: 'A4 Page',
    widthMm: 210,
    heightMm: 297,
    shortLabel: 'A4 Page (210×297 mm)',
    description: 'Standard Document & Studio Sheet',
  },
  {
    id: 'a5',
    name: 'Half A4 / A5',
    widthMm: 148,
    heightMm: 210,
    shortLabel: 'Half A4 / A5',
    description: 'Half of an A4 Sheet',
  },
];

export interface SheetPhotoSlot {
  index: number;
  row: number;
  col: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface SheetLayoutResult {
  paper: PaperSizeDefinition;
  paperWidthMm: number;
  paperHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  marginMm: number;
  gapMm: number;
  cols: number;
  rowsCapacity: number;
  maxCapacity: number;
  photoCount: number;
  slots: SheetPhotoSlot[];
  cutoffYMm: number;
  blankHeightMm: number;
  blankPercent: number;
}

/**
 * Resolves standard physical dimensions in mm based on preset id or aspect ratio.
 */
export function resolvePassportPhysicalSize(
  activePresetId: string | null,
  targetWidth: number,
  targetHeight: number,
): { widthMm: number; heightMm: number } {
  if (activePresetId === 'us') {
    return { widthMm: 50.8, heightMm: 50.8 }; // 2x2 inch
  }
  if (activePresetId === 'in' || activePresetId === 'schengen' || activePresetId === 'ssc_upsc') {
    return { widthMm: 35, heightMm: 45 };
  }
  if (activePresetId === 'pan') {
    return { widthMm: 25, heightMm: 25 };
  }

  // Custom dimensions: calculate from ratio with standard 35mm base width
  if (targetWidth > 0 && targetHeight > 0) {
    const ratio = targetWidth / targetHeight;
    if (Math.abs(ratio - 1) < 0.05) {
      return { widthMm: 50.8, heightMm: 50.8 };
    }
    const heightMm = Math.round((35 / ratio) * 10) / 10;
    return { widthMm: 35, heightMm: Math.min(60, Math.max(25, heightMm)) };
  }

  return { widthMm: 35, heightMm: 45 };
}

/**
 * Calculates row-by-row placement of photos on the selected paper sheet.
 * Studio workflow: fills from top-left, leaving remaining bottom paper blank.
 */
export function computeSheetLayout(
  paperId: PaperSizeId,
  photoWidthMm: number,
  photoHeightMm: number,
  desiredCount: number,
): SheetLayoutResult {
  const paper = PAPER_SIZES.find((p) => p.id === paperId) ?? PAPER_SIZES[0];
  const pWidth = paper.widthMm;
  const pHeight = paper.heightMm;

  // Studio margins: 3mm for 4x6 borderless/photo margin, 8mm for A4/A5
  const marginMm = paperId === '4x6' ? 3 : 8;
  const gapMm = paperId === '4x6' ? 2.5 : 3;

  const usableWidth = pWidth - marginMm * 2;
  const usableHeight = pHeight - marginMm * 2;

  const cols = Math.max(1, Math.floor((usableWidth + gapMm) / (photoWidthMm + gapMm)));
  const rowsCapacity = Math.max(1, Math.floor((usableHeight + gapMm) / (photoHeightMm + gapMm)));
  const maxCapacity = cols * rowsCapacity;

  const photoCount = Math.max(1, Math.min(maxCapacity, desiredCount));

  // Center horizontally within usable width
  const totalRowWidth = cols * photoWidthMm + (cols - 1) * gapMm;
  const startX = marginMm + Math.max(0, (usableWidth - totalRowWidth) / 2);
  const startY = marginMm;

  const slots: SheetPhotoSlot[] = [];
  let maxRowUsed = 0;

  for (let i = 0; i < photoCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (row > maxRowUsed) maxRowUsed = row;

    slots.push({
      index: i,
      row,
      col,
      xMm: Math.round((startX + col * (photoWidthMm + gapMm)) * 10) / 10,
      yMm: Math.round((startY + row * (photoHeightMm + gapMm)) * 10) / 10,
      widthMm: photoWidthMm,
      heightMm: photoHeightMm,
    });
  }

  const occupiedHeightMm = startY + (maxRowUsed + 1) * photoHeightMm + maxRowUsed * gapMm;
  const cutoffYMm = Math.min(pHeight, occupiedHeightMm + 4);
  const blankHeightMm = Math.max(0, Math.round((pHeight - cutoffYMm) * 10) / 10);
  const blankPercent = Math.max(0, Math.round((blankHeightMm / pHeight) * 100));

  return {
    paper,
    paperWidthMm: pWidth,
    paperHeightMm: pHeight,
    photoWidthMm,
    photoHeightMm,
    marginMm,
    gapMm,
    cols,
    rowsCapacity,
    maxCapacity,
    photoCount,
    slots,
    cutoffYMm,
    blankHeightMm,
    blankPercent,
  };
}

/**
 * 300 DPI canvas rendering of the passport print sheet.
 */
export async function renderPrintSheetToCanvas(
  photoImage: CanvasImageSource,
  layout: SheetLayoutResult,
  showCutGuides = true,
): Promise<HTMLCanvasElement> {
  const dpmm = 300 / 25.4; // 11.811 pixels per mm
  const canvasWidth = Math.round(layout.paperWidthMm * dpmm);
  const canvasHeight = Math.round(layout.paperHeightMm * dpmm);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Pure white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Render each photo slot
  for (const slot of layout.slots) {
    const x = Math.round(slot.xMm * dpmm);
    const y = Math.round(slot.yMm * dpmm);
    const w = Math.round(slot.widthMm * dpmm);
    const h = Math.round(slot.heightMm * dpmm);

    ctx.drawImage(photoImage, x, y, w, h);

    if (showCutGuides) {
      // 0.5px subtle cutting border
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }

  // Draw cutoff guidance if there is substantial blank paper remaining
  if (layout.blankPercent >= 15 && showCutGuides) {
    const cutY = Math.round(layout.cutoffYMm * dpmm);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(Math.round(layout.marginMm * dpmm), cutY);
    ctx.lineTo(canvasWidth - Math.round(layout.marginMm * dpmm), cutY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return canvas;
}

/**
 * Direct print trigger via isolated hidden iframe.
 */
export function printSheetViaIframe(
  dataUrl: string,
  paperWidthMm: number,
  paperHeightMm: number,
): void {
  if (typeof document === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Passport Photo Print Sheet</title>
        <style>
          @page {
            size: ${paperWidthMm}mm ${paperHeightMm}mm;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: ${paperWidthMm}mm;
            height: ${paperHeightMm}mm;
            background: #ffffff;
          }
          img {
            width: ${paperWidthMm}mm;
            height: ${paperHeightMm}mm;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print();" />
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // ignore
    }
  }, 60000);
}
