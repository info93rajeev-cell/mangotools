import { expect, test } from '@playwright/test';

/** TASK-008E Task A: marketplace fee reference data is served only as listed static files. */
test.describe('marketplace fee reference data', () => {
  test('serves the index as same-origin JSON that is not cached as immutable', async ({
    request,
  }) => {
    const response = await request.get('/reference/marketplace-fees/index.json');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(response.headers()['cache-control'] ?? '').not.toContain('immutable');
    const index = await response.json();
    expect(index.marketplaceFeeIndexVersion).toBe(1);
    for (const entry of index.datasets) {
      const version = await request.get(entry.path);
      expect(version.status(), entry.path).toBe(200);
      expect(version.headers()['cache-control']).toContain('immutable');
      expect((await version.json()).version).toBe(entry.version);
    }
  });

  test('does not serve draft, unknown or traversal paths', async ({ request }) => {
    for (const path of [
      '/reference/marketplace-fees/meesho/0.0.0.json',
      '/reference/marketplace-fees/unknown-platform/1.0.0.json',
      '/reference/marketplace-fees/meesho/..%2F..%2Fregistry.json',
      '/reference/marketplace-fees/meesho/0.0.0.yaml',
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });
});
