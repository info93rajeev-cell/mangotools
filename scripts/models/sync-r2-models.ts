import { join, resolve } from 'node:path';
import { ROOT } from '../lib/paths.ts';
import {
  type BackgroundRemoverManifest,
  loadManifest,
  type ModelAsset,
  verifyFileChecksum,
} from './fetch-background-remover-models.ts';

export interface R2UploadCommand {
  key: string;
  localPath: string;
  byteSize: number;
  sha256: string;
  contentType: string;
  cacheControl: string;
  wranglerCommand: string;
  awsCliCommand: string;
}

export interface R2RemoteCheckResult {
  assetName: string;
  key: string;
  url: string;
  status: number;
  expectedSize: number;
  actualSize: number;
  sizeMatches: boolean;
  contentTypeMatches: boolean;
  cacheControlMatches: boolean;
  rangeRequestSupported: boolean;
  sha256Matches?: boolean;
  success: boolean;
}

const DEFAULT_CACHE_DIR = join(ROOT, 'scripts', 'models', '.cache');

export function generateR2UploadCommands(
  manifest?: BackgroundRemoverManifest,
  cacheDir = DEFAULT_CACHE_DIR,
): R2UploadCommand[] {
  const m = manifest ?? loadManifest();
  const bucket = m.r2?.bucket ?? 'beyandtheai-models';
  const cacheControl = m.r2?.cacheControl ?? 'public, max-age=31536000, immutable';

  return m.models.map((asset) => {
    const localPath = join(cacheDir, asset.sourcePath);
    const key = asset.r2Key ?? asset.sourcePath;
    const contentType = asset.contentType ?? 'application/octet-stream';

    const wranglerCommand = `wrangler r2 object put ${bucket}/${key} --file "${localPath}" --content-type "${contentType}" --cache-control "${cacheControl}"`;
    const awsCliCommand = `aws s3 cp "${localPath}" "s3://${bucket}/${key}" --content-type "${contentType}" --cache-control "${cacheControl}"`;

    return {
      key,
      localPath,
      byteSize: asset.byteSize,
      sha256: asset.sha256,
      contentType,
      cacheControl,
      wranglerCommand,
      awsCliCommand,
    };
  });
}

export async function verifyLocalCacheReadyForR2(
  manifest?: BackgroundRemoverManifest,
  cacheDir = DEFAULT_CACHE_DIR,
): Promise<{ ready: boolean; results: { asset: string; valid: boolean; path: string }[] }> {
  const m = manifest ?? loadManifest();
  const results: { asset: string; valid: boolean; path: string }[] = [];
  let ready = true;

  for (const asset of m.models) {
    const localPath = join(cacheDir, asset.sourcePath);
    const valid = await verifyFileChecksum(localPath, asset.sha256, asset.byteSize);
    results.push({ asset: asset.logicalName, valid, path: localPath });
    if (!valid) ready = false;
  }

  return { ready, results };
}

export async function verifyR2RemoteAsset(
  baseUrl: string,
  asset: ModelAsset,
): Promise<R2RemoteCheckResult> {
  const key = asset.r2Key ?? asset.sourcePath;
  const url = `${baseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;

  try {
    const headRes = await fetch(url, { method: 'HEAD' });
    const status = headRes.status;
    const contentLength = Number(headRes.headers.get('content-length') ?? '0');
    const contentType = headRes.headers.get('content-type') ?? '';
    const cacheControl = headRes.headers.get('cache-control') ?? '';

    const expectedContentType = asset.contentType ?? 'application/octet-stream';
    const sizeMatches = contentLength === asset.byteSize;
    const contentTypeMatches = contentType
      .toLowerCase()
      .includes(expectedContentType.toLowerCase());
    const cacheControlMatches = cacheControl.includes('immutable');

    // Test HTTP Range request
    let rangeRequestSupported = false;
    try {
      const rangeRes = await fetch(url, {
        headers: { Range: 'bytes=0-1023' },
      });
      if (rangeRes.status === 206) {
        const rangeBuf = await rangeRes.arrayBuffer();
        rangeRequestSupported = rangeBuf.byteLength === 1024;
      }
    } catch {
      rangeRequestSupported = false;
    }

    const success = status === 200 && sizeMatches && contentTypeMatches;

    return {
      assetName: asset.logicalName,
      key,
      url,
      status,
      expectedSize: asset.byteSize,
      actualSize: contentLength,
      sizeMatches,
      contentTypeMatches,
      cacheControlMatches,
      rangeRequestSupported,
      success,
    };
  } catch (_err) {
    return {
      assetName: asset.logicalName,
      key,
      url,
      status: 0,
      expectedSize: asset.byteSize,
      actualSize: 0,
      sizeMatches: false,
      contentTypeMatches: false,
      cacheControlMatches: false,
      rangeRequestSupported: false,
      success: false,
    };
  }
}

export async function verifyAllR2RemoteAssets(
  baseUrl?: string,
  manifest?: BackgroundRemoverManifest,
): Promise<{ allPassed: boolean; results: R2RemoteCheckResult[] }> {
  const m = manifest ?? loadManifest();
  const domain = baseUrl ?? m.r2?.customDomain ?? 'https://models.beyandtheai.com';
  const results: R2RemoteCheckResult[] = [];
  let allPassed = true;

  for (const asset of m.models) {
    const res = await verifyR2RemoteAsset(domain, asset);
    results.push(res);
    if (!res.success) allPassed = false;
  }

  return { allPassed, results };
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/models/sync-r2-models.ts');

if (isMain) {
  const verifyRemote = process.argv.includes('--verify');
  const manifest = loadManifest();

  if (verifyRemote) {
    const customUrl = process.argv[3]?.startsWith('http') ? process.argv[3] : undefined;
    console.log(`Verifying R2 remote assets on ${customUrl ?? manifest.r2?.customDomain}...`);
    verifyAllR2RemoteAssets(customUrl, manifest).then(({ allPassed, results }) => {
      for (const r of results) {
        console.log(
          `[${r.success ? 'PASS' : 'FAIL'}] ${r.assetName} (HTTP ${r.status}, size=${r.actualSize}/${r.expectedSize}, range=${r.rangeRequestSupported})`,
        );
      }
      process.exit(allPassed ? 0 : 1);
    });
  } else {
    console.log('--- R2 MODEL UPLOAD MANIFEST & COMMANDS ---');
    console.log(`Bucket: ${manifest.r2?.bucket}`);
    console.log(`Custom Domain: ${manifest.r2?.customDomain}`);
    console.log(`CORS Allowed Origin: ${manifest.r2?.corsAllowedOrigin}\n`);

    verifyLocalCacheReadyForR2(manifest).then(({ ready, results }) => {
      console.log('Local Model Cache Status:');
      for (const r of results) {
        console.log(`  [${r.valid ? 'VALID' : 'MISSING'}] ${r.asset}: ${r.path}`);
      }

      const commands = generateR2UploadCommands(manifest);
      console.log('\nWrangler CLI Upload Commands:');
      for (const c of commands) {
        console.log(`\n# ${c.key} (${(c.byteSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(c.wranglerCommand);
      }

      if (!ready) {
        console.log(
          '\n[NOTICE] Some models are missing from local cache. Run `pnpm models:fetch` first.',
        );
      }
    });
  }
}
