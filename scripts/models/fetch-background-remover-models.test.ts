import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { walkFiles } from '../lib/files.ts';
import { ROOT } from '../lib/paths.ts';
import {
  computeFileChecksum,
  downloadModelAsset,
  loadManifest,
  type ModelAsset,
  verifyFileChecksum,
  verifyPagesDistHasNoOversizedModels,
} from './fetch-background-remover-models.ts';
import { generateR2UploadCommands } from './sync-r2-models.ts';

const TEST_TMP_DIR = join(ROOT, 'tests', 'artifacts', 'test-model-fetch');

function checkFileForForbiddenUrls(file: string): string[] {
  const violations: string[] = [];
  if (file.endsWith('.test.ts')) return violations;
  const content = readFileSync(file, 'utf8');
  if (content.includes('huggingface.co')) {
    violations.push(`${file} contains reference to huggingface.co`);
  }
  if (content.includes('cdn.jsdelivr.net')) {
    violations.push(`${file} contains reference to cdn.jsdelivr.net`);
  }
  return violations;
}

describe('Universal Background Remover Model Delivery', () => {
  beforeEach(() => {
    rmSync(TEST_TMP_DIR, { recursive: true, force: true });
    mkdirSync(TEST_TMP_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_TMP_DIR, { recursive: true, force: true });
  });

  it('1. pinned revision exists and matches approved commit', () => {
    const manifest = loadManifest();
    expect(manifest.name).toBe('birefnet-lite-512');
    expect(manifest.repository).toBe('studioludens/birefnet-lite-512');
    expect(manifest.revision).toBe('4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7');
    expect(manifest.r2?.bucket).toBe('beyandtheai-models');
    expect(manifest.r2?.customDomain).toBe('https://models.beyandtheai.com');
  });

  it('2. SHA manifest validity and R2 configuration', () => {
    const manifest = loadManifest();
    expect(manifest.models.length).toBeGreaterThanOrEqual(4);

    for (const asset of manifest.models) {
      expect(asset.logicalName.length).toBeGreaterThan(0);
      expect(['webgpu', 'wasm', 'config']).toContain(asset.usage);
      expect(asset.sourcePath.length).toBeGreaterThan(0);
      expect(asset.r2Key?.length).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.byteSize).toBeGreaterThan(0);
      expect(asset.license).toBe('MIT');
    }

    const fp16 = manifest.models.find((m) => m.usage === 'webgpu');
    expect(fp16).toBeDefined();
    expect(fp16?.r2Key).toBe(
      'birefnet-lite-512/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7/onnx/model_fp16.onnx',
    );
    expect(fp16?.byteSize).toBe(98484532);
    expect(fp16?.sha256).toBe('eff9216bb2f9d3f023d9c2b7196845a7485739ab1f231593633e4d2344ffc516');

    const fp32 = manifest.models.find((m) => m.usage === 'wasm');
    expect(fp32).toBeDefined();
    expect(fp32?.r2Key).toBe(
      'birefnet-lite-512/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7/onnx/model.onnx',
    );
    expect(fp32?.byteSize).toBe(191877254);
    expect(fp32?.sha256).toBe('1cb0fb360dadd15af77c639085d77a9df67db0c64315560c3de005f676345ac2');
  });

  it('3. corrupted file is rejected and fails closed', async () => {
    const fakeDest = join(TEST_TMP_DIR, 'corrupted_model.onnx');
    writeFileSync(fakeDest, 'corrupted content here');

    const expectedSha = '1111111111111111111111111111111111111111111111111111111111111111';
    const isValid = await verifyFileChecksum(fakeDest, expectedSha, 100);
    expect(isValid).toBe(false);

    const asset: ModelAsset = {
      logicalName: 'Test Bad Asset',
      usage: 'config',
      sourcePath: 'config.json',
      destinationPath: 'test/bad.json',
      sha256: expectedSha,
      byteSize: 81,
      license: 'MIT',
    };

    const targetPath = join(TEST_TMP_DIR, 'bad.json');
    await expect(
      downloadModelAsset(
        asset,
        targetPath,
        'https://huggingface.co/studioludens/birefnet-lite-512/resolve/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7',
        true,
      ),
    ).rejects.toThrow(/SHA-256 mismatch/);

    expect(existsSync(targetPath)).toBe(false);
  });

  it('4. missing model triggers deterministic acquisition', async () => {
    const configAsset: ModelAsset = {
      logicalName: 'BiRefNet Config Test',
      usage: 'config',
      sourcePath: 'config.json',
      destinationPath: 'models/test/config.json',
      sha256: '561965f7aa366c48b95ab1c24220d59a718df4025c2ecb359dd5736ceb49e912',
      byteSize: 81,
      license: 'MIT',
    };

    const destPath = join(TEST_TMP_DIR, configAsset.destinationPath ?? '');
    expect(existsSync(destPath)).toBe(false);

    const res = await downloadModelAsset(
      configAsset,
      destPath,
      'https://huggingface.co/studioludens/birefnet-lite-512/resolve/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7',
    );

    expect(res.status).toBe('downloaded');
    expect(existsSync(destPath)).toBe(true);
    expect(statSync(destPath).size).toBe(81);
    const { sha256 } = await computeFileChecksum(destPath);
    expect(sha256).toBe(configAsset.sha256);
  });

  it('5. valid cached model skips unnecessary download', async () => {
    const configAsset: ModelAsset = {
      logicalName: 'BiRefNet Config Test',
      usage: 'config',
      sourcePath: 'config.json',
      destinationPath: 'models/test/config.json',
      sha256: '561965f7aa366c48b95ab1c24220d59a718df4025c2ecb359dd5736ceb49e912',
      byteSize: 81,
      license: 'MIT',
    };

    const destPath = join(TEST_TMP_DIR, configAsset.destinationPath ?? '');
    mkdirSync(join(TEST_TMP_DIR, 'models/test'), { recursive: true });
    writeFileSync(
      destPath,
      JSON.stringify({ model_type: 'swin', 'transformers.js_config': { dtype: 'fp16' } }, null, 2),
    );

    const hash = createHash('sha256').update(readFileSync(destPath)).digest('hex');
    const cachedAsset: ModelAsset = {
      ...configAsset,
      sha256: hash,
      byteSize: statSync(destPath).size,
    };

    const res = await downloadModelAsset(
      cachedAsset,
      destPath,
      'https://invalid.example.com/does-not-exist',
    );
    expect(res.status).toBe('cached');
  });

  it('6. Cloudflare Pages dist is verified to have 0 ONNX files and 0 files exceeding 25 MiB', async () => {
    const mockDist = join(TEST_TMP_DIR, 'mock-dist');
    mkdirSync(join(mockDist, 'wasm'), { recursive: true });
    writeFileSync(join(mockDist, 'wasm', 'test.wasm'), 'wasm binary');

    // Compliant dist passes
    await expect(verifyPagesDistHasNoOversizedModels(mockDist)).resolves.not.toThrow();

    // Rejects forbidden ONNX model binaries (must be on R2)
    const onnxFile = join(mockDist, 'model.onnx');
    writeFileSync(onnxFile, 'fake onnx model');
    await expect(verifyPagesDistHasNoOversizedModels(mockDist)).rejects.toThrow(
      /Cloudflare Pages static artifact contains forbidden ONNX model/,
    );
    rmSync(onnxFile);

    // Rejects any single file exceeding 25 MiB Cloudflare Pages limit
    const bigFile = join(mockDist, 'oversized.bin');
    writeFileSync(bigFile, '');
    // Using sparse-like truncate or stat check mock
    const fs = await import('node:fs');
    fs.truncateSync(bigFile, 26 * 1024 * 1024); // 26 MiB
    await expect(verifyPagesDistHasNoOversizedModels(mockDist)).rejects.toThrow(
      /Cloudflare Pages static artifact exceeds 25 MiB single-file limit/,
    );
    rmSync(bigFile);
  });

  it('7. Universal mode configures Cloudflare R2 custom domain and remote model loading', () => {
    const src = readFileSync(
      join(ROOT, 'packages/ui/src/toolkit/universalSegmentation.ts'),
      'utf8',
    );
    expect(src).toContain('env.allowLocalModels = false');
    expect(src).toContain('env.allowRemoteModels = true');
    expect(src).toContain("env.remoteHost = customHost || 'https://models.beyandtheai.com/'");
    expect(src).toContain("env.remotePathTemplate = 'birefnet-lite-512/{revision}/'");

    const bg0Src = readFileSync(
      join(ROOT, 'packages/ui/node_modules/@bg0/browser/dist/index.js'),
      'utf8',
    );
    expect(bg0Src).toContain('device: provider,');
    expect(bg0Src).toContain("dtype: provider === 'webgpu' ? 'fp16' : 'fp32'");
  });

  it('8. Person Fast does not fetch BiRefNet', () => {
    const useBgSrc = readFileSync(
      join(ROOT, 'packages/ui/src/toolkit/useImageBackgroundRemover.ts'),
      'utf8',
    );
    expect(useBgSrc).toContain("s.removalMode === 'portrait'");
    expect(useBgSrc).toContain('executePersonCutout');

    const personSrc = readFileSync(
      join(ROOT, 'packages/ui/src/toolkit/personSegmentation.ts'),
      'utf8',
    );
    expect(personSrc).toContain('/models/selfie_segmenter.tflite');
    expect(personSrc).not.toContain('birefnet');
    expect(personSrc).not.toContain('model_fp16.onnx');
    expect(personSrc).not.toContain('model.onnx');
  });

  it('9. Solid Chroma fetches no AI model', () => {
    const workerSrc = readFileSync(
      join(ROOT, 'packages/ui/src/toolkit/backgroundRemoverWorker.ts'),
      'utf8',
    );
    expect(workerSrc).not.toContain('transformers');
    expect(workerSrc).not.toContain('onnx');
    expect(workerSrc).not.toContain('selfie_segmenter');
    expect(workerSrc).not.toContain('@bg0');
  });

  it('10. no third-party runtime model URL remains in production code', () => {
    const extensions = ['.ts', '.tsx', '.astro'];
    const files = [
      ...extensions.flatMap((ext) => walkFiles(join(ROOT, 'packages', 'ui', 'src'), ext)),
      ...extensions.flatMap((ext) => walkFiles(join(ROOT, 'apps', 'web', 'src'), ext)),
    ];

    const violations = files.flatMap(checkFileForForbiddenUrls);
    expect(violations).toEqual([]);
  });

  it('11. R2 upload commands and sync manifest are deterministic', () => {
    const commands = generateR2UploadCommands();
    expect(commands.length).toBe(4);

    for (const cmd of commands) {
      expect(cmd.wranglerCommand).toContain('wrangler r2 object put beyandtheai-models/');
      expect(cmd.cacheControl).toBe('public, max-age=31536000, immutable');
      expect(cmd.byteSize).toBeGreaterThan(0);
      expect(cmd.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(cmd.key).toMatch(/^birefnet-lite-512\/4a3c40c36c94093cc1e724d9ea428b8fa4b57dc7\//);
    }
  });
});
