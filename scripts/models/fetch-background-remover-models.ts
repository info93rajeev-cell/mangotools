import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { ROOT } from '../lib/paths.ts';

export interface ModelAsset {
  logicalName: string;
  usage: 'webgpu' | 'wasm' | 'config';
  sourcePath: string;
  destinationPath?: string;
  r2Key?: string;
  contentType?: string;
  sha256: string;
  byteSize: number;
  license: string;
}

export interface R2Config {
  bucket: string;
  customDomain: string;
  basePath: string;
  cacheControl: string;
  corsAllowedOrigin: string;
}

export interface BackgroundRemoverManifest {
  name: string;
  repository: string;
  revision: string;
  license: string;
  upstreamBaseUrl?: string;
  baseUrl?: string;
  r2?: R2Config;
  models: ModelAsset[];
}

export interface DownloadResult {
  status: 'cached' | 'downloaded';
  file: string;
  sha256: string;
  byteSize: number;
}

export interface EnsureOptions {
  manifestPath?: string;
  cacheDir?: string;
  force?: boolean;
}

const DEFAULT_CACHE_DIR = join(ROOT, 'scripts', 'models', '.cache');
export const CLOUDFLARE_PAGES_MAX_ASSET_BYTES = 25 * 1024 * 1024; // 25 MiB

export function loadManifest(manifestPath?: string): BackgroundRemoverManifest {
  const p = manifestPath ?? join(ROOT, 'scripts', 'models', 'background-remover-models.json');
  if (!existsSync(p)) {
    throw new Error(`Manifest file not found: ${p}`);
  }
  const raw = readFileSync(p, 'utf8');
  return JSON.parse(raw) as BackgroundRemoverManifest;
}

export function computeFileChecksum(
  filePath: string,
): Promise<{ sha256: string; byteSize: number }> {
  return new Promise((resolveResult, reject) => {
    if (!existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }
    const hash = createHash('sha256');
    let byteSize = 0;
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      hash.update(buf);
      byteSize += buf.length;
    });
    stream.on('end', () => {
      resolveResult({ sha256: hash.digest('hex'), byteSize });
    });
    stream.on('error', reject);
  });
}

export async function verifyFileChecksum(
  filePath: string,
  expectedSha256: string,
  expectedByteSize?: number,
): Promise<boolean> {
  if (!existsSync(filePath)) return false;
  try {
    const stat = statSync(filePath);
    if (expectedByteSize !== undefined && stat.size !== expectedByteSize) {
      return false;
    }
    const { sha256 } = await computeFileChecksum(filePath);
    return sha256.toLowerCase() === expectedSha256.toLowerCase();
  } catch {
    return false;
  }
}

async function streamResponseToFile(
  body: NodeReadableStream,
  tempPath: string,
): Promise<{ sha256: string; byteSize: number }> {
  const hash = createHash('sha256');
  let byteSize = 0;
  const writeStream = createWriteStream(tempPath);
  const nodeStream = Readable.fromWeb(body);

  for await (const chunk of nodeStream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    hash.update(buf);
    byteSize += buf.length;
    writeStream.write(buf);
  }

  await new Promise<void>((resolvePromise, rejectPromise) => {
    writeStream.end((err: Error | null) => (err ? rejectPromise(err) : resolvePromise()));
  });

  return { sha256: hash.digest('hex'), byteSize };
}

export async function downloadModelAsset(
  asset: ModelAsset,
  destPath: string,
  baseUrl: string,
  force = false,
): Promise<DownloadResult> {
  const dir = dirname(destPath);
  mkdirSync(dir, { recursive: true });

  if (!force) {
    const isCached = await verifyFileChecksum(destPath, asset.sha256, asset.byteSize);
    if (isCached) {
      return { status: 'cached', file: destPath, sha256: asset.sha256, byteSize: asset.byteSize };
    }
  }

  const sourceUrl = `${baseUrl}/${asset.sourcePath}`;
  const rand = Math.random().toString(36).slice(2, 8);
  const tempPath = `${destPath}.tmp.${Date.now()}.${rand}`;

  try {
    const res = await fetch(sourceUrl);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to fetch ${sourceUrl}: HTTP ${res.status} ${res.statusText}`);
    }

    const { sha256: computedSha256, byteSize } = await streamResponseToFile(
      res.body as NodeReadableStream,
      tempPath,
    );

    if (byteSize !== asset.byteSize) {
      throw new Error(
        `Byte size mismatch for ${asset.logicalName}: expected ${asset.byteSize}, got ${byteSize}`,
      );
    }
    if (computedSha256.toLowerCase() !== asset.sha256.toLowerCase()) {
      throw new Error(
        `SHA-256 mismatch for ${asset.logicalName}: expected ${asset.sha256}, got ${computedSha256}`,
      );
    }

    if (existsSync(destPath)) {
      unlinkSync(destPath);
    }
    renameSync(tempPath, destPath);

    return { status: 'downloaded', file: destPath, sha256: computedSha256, byteSize };
  } catch (err) {
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {
        // ignore cleanup error
      }
    }
    throw err;
  }
}

export async function ensureBackgroundRemoverModels(
  options: EnsureOptions = {},
): Promise<DownloadResult[]> {
  const manifest = loadManifest(options.manifestPath);
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const baseUrl = manifest.upstreamBaseUrl ?? manifest.baseUrl;
  if (!baseUrl) {
    throw new Error('Manifest missing upstreamBaseUrl/baseUrl');
  }

  const results: DownloadResult[] = [];

  for (const asset of manifest.models) {
    const destPath = join(cacheDir, asset.sourcePath);
    const result = await downloadModelAsset(asset, destPath, baseUrl, options.force ?? false);
    results.push(result);
  }

  return results;
}

function walkAllFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walkAllFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function verifyPagesDistHasNoOversizedModels(distDir: string): Promise<void> {
  if (!existsSync(distDir)) return;
  const files = walkAllFiles(distDir);
  for (const f of files) {
    const rel = relative(distDir, f).split('\\').join('/');
    const stat = statSync(f);
    if (f.endsWith('.onnx')) {
      throw new Error(
        `Cloudflare Pages static artifact contains forbidden ONNX model: ${rel} (${stat.size} bytes). Models must be hosted on Cloudflare R2.`,
      );
    }
    if (stat.size > CLOUDFLARE_PAGES_MAX_ASSET_BYTES) {
      throw new Error(
        `Cloudflare Pages static artifact exceeds 25 MiB single-file limit: ${rel} is ${stat.size} bytes`,
      );
    }
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(ROOT, 'scripts/models/fetch-background-remover-models.ts');

if (isMain) {
  const force = process.argv.includes('--force');
  const checkOnly = process.argv.includes('--check');

  if (checkOnly) {
    const manifest = loadManifest();
    let hasFailures = false;
    for (const asset of manifest.models) {
      const cachePath = join(DEFAULT_CACHE_DIR, asset.sourcePath);
      const valid = await verifyFileChecksum(cachePath, asset.sha256, asset.byteSize);
      console.log(`[${valid ? 'PASS' : 'FAIL'}] ${asset.logicalName}: ${asset.sourcePath}`);
      if (!valid) hasFailures = true;
    }
    process.exit(hasFailures ? 1 : 0);
  }

  try {
    const results = await ensureBackgroundRemoverModels({ force });
    for (const r of results) {
      console.log(`model asset [${r.status}]: ${r.file} (${r.byteSize} B, sha256: ${r.sha256})`);
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
