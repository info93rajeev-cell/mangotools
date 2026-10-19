/** #196 feasibility ONLY. Not imported by production, an engine, a route or a public package. */
const MAX_BYTES = 15 * 1024 ** 2;
const MAX_PIXELS = 20_000_000;
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const DEPTHS: Record<number, number[]> = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16],
};

function crc(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function header(bytes: Uint8Array) {
  if (bytes.length > MAX_BYTES || bytes.length < 33) throw new Error('FILE_BOUNDS');
  if (!SIGNATURE.every((byte, i) => bytes[i] === byte)) throw new Error('SIGNATURE');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452) throw new Error('IHDR');
  const width = view.getUint32(16),
    height = view.getUint32(20);
  const depth = bytes[24] ?? -1,
    colour = bytes[25] ?? -1;
  if (!width || !height || width * height > MAX_PIXELS || Math.max(width, height) > 14400)
    throw new Error('PIXELS');
  if (
    !DEPTHS[colour]?.includes(depth) ||
    bytes[26] !== 0 ||
    bytes[27] !== 0 ||
    (bytes[28] ?? 2) > 1
  )
    throw new Error('IHDR');
  return { view, width, height, depth, colour, interlace: bytes[28] };
}

function readChunk(bytes: Uint8Array, offset: number, view: DataView) {
  const size = view.getUint32(offset),
    end = offset + size + 12;
  const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
  if (end > bytes.length || !/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) throw new Error('CHUNK');
  if (crc(bytes.subarray(offset + 4, end - 4)) !== view.getUint32(end - 4)) throw new Error('CRC');
  if (['acTL', 'fcTL', 'fdAT'].includes(type)) throw new Error('APNG');
  return { size, end, type };
}

function checkOrder(chunk: { type: string; size: number }, seen: Set<string>, endedData: boolean) {
  const { type, size } = chunk;
  if (type !== 'IDAT' && seen.has(type) && ['IHDR', 'PLTE', 'tRNS', 'IEND'].includes(type))
    throw new Error('DUPLICATE');
  if (type === 'IDAT' && endedData) throw new Error('IDAT_ORDER');
  if (['PLTE', 'tRNS'].includes(type) && seen.has('IDAT')) throw new Error('PALETTE_ORDER');
  if (type === 'PLTE' && (!size || size % 3 || size > 768)) throw new Error('PALETTE');
}

function checkEnd(
  chunk: { size: number; end: number },
  length: number,
  state: { seen: Set<string>; colour: number },
) {
  if (chunk.size || chunk.end !== length || !state.seen.has('IDAT')) throw new Error('IEND');
  if (state.colour === 3 && !state.seen.has('PLTE')) throw new Error('PALETTE');
}

/** Parse every bounded chunk; reject animation before calling any native decoder. */
function inspect(bytes: Uint8Array) {
  const info = header(bytes);
  const chunks = [bytes.subarray(0, 8)],
    compressed: Uint8Array[] = [];
  const seen = new Set<string>();
  let offset = 8,
    count = 0,
    endedData = false;
  while (offset + 12 <= bytes.length) {
    if (++count > 4096) throw new Error('CHUNK_COUNT');
    const { size, end, type } = readChunk(bytes, offset, info.view);
    checkOrder({ type, size }, seen, endedData);
    if (seen.has('IDAT') && type !== 'IDAT') endedData = true;
    if (type === 'IDAT') compressed.push(bytes.subarray(offset + 8, end - 4));
    if (['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND'].includes(type))
      chunks.push(bytes.subarray(offset, end));
    else if (type[0] === type[0]?.toUpperCase()) throw new Error('CRITICAL_CHUNK');
    seen.add(type);
    if (type === 'IEND') {
      checkEnd({ size, end }, bytes.length, { seen, colour: info.colour });
      return { ...info, chunks, compressed };
    }
    offset = end;
  }
  throw new Error('TRUNCATED');
}

function scanlineStrides(info: ReturnType<typeof header>) {
  const passes = info.interlace
    ? [
        [0, 0, 8, 8],
        [4, 0, 8, 8],
        [0, 4, 4, 8],
        [2, 0, 4, 4],
        [0, 2, 2, 4],
        [1, 0, 2, 2],
        [0, 1, 1, 2],
      ]
    : [[0, 0, 1, 1]];
  return passes.flatMap((pass) => {
    const [x = 0, y = 0, dx = 1, dy = 1] = pass;
    const width = Math.max(0, Math.ceil((info.width - x) / dx));
    const height = Math.max(0, Math.ceil((info.height - y) / dy));
    const stride = Math.ceil((width * (CHANNELS[info.colour] ?? 0) * info.depth) / 8) + 1;
    return width ? Array<number>(height).fill(stride) : [];
  });
}

/** Native zlib validation, counted output, bounded input writes; no UPNG or internal imports. */
function checkFilters(
  bytes: Uint8Array,
  state: { offset: number; next: number; row: number; strides: number[] },
) {
  const end = state.offset + bytes.length;
  while (state.next < end && state.row < state.strides.length) {
    if ((bytes[state.next - state.offset] ?? 255) > 4) throw new Error('FILTER');
    state.next += state.strides[state.row++] ?? 0;
  }
  state.offset = end;
}

async function validateInflation(parts: Uint8Array[], strides: number[]) {
  const stream = new DecompressionStream('deflate');
  const reader = stream.readable.getReader(),
    writer = stream.writable.getWriter();
  let total = 0,
    maximumChunk = 0;
  const expected = strides.reduce((sum, stride) => sum + stride, 0);
  const filters = { offset: 0, next: 0, row: 0, strides };
  const read = async () => {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      checkFilters(result.value, filters);
      total = filters.offset;
      maximumChunk = Math.max(maximumChunk, result.value.length);
      if (total > expected) throw new Error('INFLATED_BOUNDS');
    }
    if (total !== expected) throw new Error('SCANLINE_LENGTH');
  };
  const write = async () => {
    for (const part of parts) {
      for (let offset = 0; offset < part.length; offset += 1024)
        await writer.write(part.slice(offset, offset + 1024));
    }
    await writer.close();
  };
  try {
    await Promise.all([read(), write()]);
  } catch (error) {
    await Promise.allSettled([reader.cancel(), writer.abort()]);
    throw error;
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
  return { total, maximumChunk };
}

function join(chunks: Uint8Array[]) {
  const result = new Uint8Array(chunks.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of chunks) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export async function inspectNativePng(bytes: Uint8Array) {
  const parsed = inspect(bytes);
  return {
    ...parsed,
    inflation: await validateInflation(parsed.compressed, scanlineStrides(parsed)),
  };
}

function encodeCanvas(canvas: OffscreenCanvas | HTMLCanvasElement, mode: 'window' | 'worker') {
  if (mode === 'worker') return (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' });
  return new Promise<Blob>((resolve, reject) =>
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('ENCODE'))),
      'image/png',
    ),
  );
}

async function outputPixels(encoded: Blob, canvas: OffscreenCanvas | HTMLCanvasElement) {
  const image = await createImageBitmap(encoded, {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  try {
    canvas.width = Math.min(image.width, 4);
    canvas.height = Math.min(image.height, 2);
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data);
  } finally {
    image.close();
  }
}

export async function normalizeNativePng(bytes: Uint8Array, mode: 'window' | 'worker') {
  const input = await inspectNativePng(bytes);
  if (typeof createImageBitmap !== 'function') throw new Error('BITMAP_UNAVAILABLE');
  if (mode === 'worker' && typeof OffscreenCanvas !== 'function')
    throw new Error('CANVAS_UNAVAILABLE');
  const bitmap = await createImageBitmap(new Blob([join(input.chunks)], { type: 'image/png' }), {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  try {
    if (bitmap.width !== input.width || bitmap.height !== input.height)
      throw new Error('DIMENSIONS');
    const canvas =
      mode === 'worker'
        ? new OffscreenCanvas(input.width, input.height)
        : document.createElement('canvas');
    canvas.width = input.width;
    canvas.height = input.height;
    try {
      const context = canvas.getContext('2d') as
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D
        | null;
      if (!context) throw new Error('CONTEXT');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = Array.from(
        context.getImageData(0, 0, Math.min(input.width, 4), Math.min(input.height, 2)).data,
      );
      const encoded = await encodeCanvas(canvas, mode);
      canvas.width = 1;
      canvas.height = 1;
      if (encoded.size > MAX_BYTES) throw new Error('ENCODED_BOUNDS');
      const checkedOutput = await inspectNativePng(new Uint8Array(await encoded.arrayBuffer()));
      const output = join(checkedOutput.chunks);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', output)))
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
      return {
        width: input.width,
        height: input.height,
        pixels,
        pixelsAfter: await outputPixels(new Blob([output], { type: 'image/png' }), canvas),
        encodedBytes: output.length,
        hash,
        ...input.inflation,
      };
    } finally {
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    bitmap.close();
  }
}
