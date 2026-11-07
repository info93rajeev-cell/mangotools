/**
 * Stage the background-remover model into the site build so it is served from our own domain.
 *
 * Cloudflare Pages (free plan) serves unlimited static traffic but rejects any single file over
 * 25 MiB. Each `.onnx` model is therefore split into 20 MiB parts next to a `<file>.parts.json`
 * list; packages/ui/src/toolkit/chunkedModelFetch.ts joins them again in the browser. Small files
 * (config.json, preprocessor_config.json) are copied as they are.
 *
 * Sources are downloaded once at build time and checked against the pinned sha256 in
 * background-remover-models.json; visitors never contact the upstream host.
 *
 * Usage: tsx scripts/models/stage-background-remover-models.ts apps/web/dist
 */
import { createHash, type Hash } from 'node:crypto';
import {
  closeSync,
  copyFileSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { ROOT } from '../lib/paths.ts';
import {
  ensureBackgroundRemoverModels,
  loadManifest,
  verifyPagesDistHasNoOversizedModels,
} from './fetch-background-remover-models.ts';

export const MODEL_PART_BYTES = 20 * 1024 * 1024; // 20 MiB, safely under the 25 MiB Pages limit
const READ_BUFFER_BYTES = 4 * 1024 * 1024;

export interface PartsList {
  byteSize: number;
  sha256: string;
  parts: { file: string; byteSize: number }[];
}

export interface StageOptions {
  manifestPath?: string;
  cacheDir?: string;
  partBytes?: number;
  download?: boolean;
}

/** Copy `length` bytes from `fd` at `position` into a new file, feeding the running hash. */
function copyRange(fd: number, position: number, length: number, out: string, hash: Hash): void {
  const buffer = Buffer.alloc(Math.min(READ_BUFFER_BYTES, length));
  const outFd = openSync(out, 'w');
  try {
    let done = 0;
    while (done < length) {
      const read = readSync(fd, buffer, 0, Math.min(buffer.length, length - done), position + done);
      if (read === 0) throw new Error(`Unexpected end of file while splitting into ${out}`);
      const chunk = buffer.subarray(0, read);
      hash.update(chunk);
      writeSync(outFd, chunk);
      done += read;
    }
  } finally {
    closeSync(outFd);
  }
}

/** Split `src` into `<dest>.part-NNN` files and return the parts list (sizes + whole-file hash). */
export function splitIntoParts(src: string, dest: string, partBytes = MODEL_PART_BYTES): PartsList {
  mkdirSync(dirname(dest), { recursive: true });
  const size = statSync(src).size;
  const hash = createHash('sha256');
  const parts: PartsList['parts'] = [];
  const fd = openSync(src, 'r');
  try {
    for (let offset = 0; offset < size; offset += partBytes) {
      const byteSize = Math.min(partBytes, size - offset);
      const file = `${basename(dest)}.part-${String(parts.length).padStart(3, '0')}`;
      copyRange(fd, offset, byteSize, join(dirname(dest), file), hash);
      parts.push({ file, byteSize });
    }
  } finally {
    closeSync(fd);
  }
  return { byteSize: size, sha256: hash.digest('hex'), parts };
}

/** Download (or reuse cached) model files and stage them into `<distDir>/models/...`. */
export async function stageBackgroundRemoverModels(
  distDir: string,
  options: StageOptions = {},
): Promise<string[]> {
  const manifest = loadManifest(options.manifestPath);
  const cacheDir = options.cacheDir ?? join(ROOT, 'scripts', 'models', '.cache');
  if (options.download !== false) {
    await ensureBackgroundRemoverModels({ manifestPath: options.manifestPath, cacheDir });
  }
  const base = join(distDir, 'models', manifest.name, manifest.revision);
  const written: string[] = [];
  for (const asset of manifest.models) {
    const src = join(cacheDir, asset.sourcePath);
    const dest = join(base, asset.sourcePath);
    mkdirSync(dirname(dest), { recursive: true });
    if (!asset.sourcePath.endsWith('.onnx')) {
      copyFileSync(src, dest);
      written.push(dest);
      continue;
    }
    const list = splitIntoParts(src, dest, options.partBytes);
    if (list.byteSize !== asset.byteSize || list.sha256 !== asset.sha256.toLowerCase()) {
      throw new Error(`Staged ${asset.sourcePath} does not match the pinned sha256/size`);
    }
    writeFileSync(`${dest}.parts.json`, `${JSON.stringify(list)}\n`);
    written.push(`${dest}.parts.json`, ...list.parts.map((p) => join(dirname(dest), p.file)));
  }
  return written;
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(ROOT, 'scripts/models/stage-background-remover-models.ts');

if (isMain) {
  const dist = resolve(process.argv[2] ?? join(ROOT, 'apps/web/dist'));
  const files = await stageBackgroundRemoverModels(dist);
  await verifyPagesDistHasNoOversizedModels(dist);
  const total = files.reduce((sum, f) => sum + statSync(f).size, 0);
  console.log(
    `models: staged ${files.length} files (${(total / 1048576).toFixed(1)} MiB) into ${dist}/models`,
  );
}
