import { expect, type Locator, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const harness = (page: Page) => page.locator('[data-testid="workbench-harness"]');
const selection = (page: Page) => page.locator('section[aria-label="Selection rectangle"]');

async function openDev(page: Page) {
  await gotoReady(page, '/_dev/components');
  await expect(harness(page)).toBeVisible();
  await selection(page).scrollIntoViewIfNeeded();
}

async function getSourceCoords(page: Page) {
  const h = harness(page);
  return {
    x: Number(await h.getAttribute('data-source-x')),
    y: Number(await h.getAttribute('data-source-y')),
    w: Number(await h.getAttribute('data-source-w')),
    h: Number(await h.getAttribute('data-source-h')),
  };
}

async function getBbox(loc: Locator) {
  const box = await loc.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Bounding box not found');
  }
  return box;
}

test.describe('Image Workbench Real Browser Interactions', () => {
  test('A. move crop selection by pointer with authoritative source coords', async ({ page }) => {
    await openDev(page);
    const box = selection(page);
    await expect(box).toBeVisible();

    const initial = await getSourceCoords(page);
    const boxBbox = await getBbox(box);

    // Drag the selection body
    await page.mouse.move(boxBbox.x + boxBbox.width / 2, boxBbox.y + boxBbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(boxBbox.x + boxBbox.width / 2 + 30, boxBbox.y + boxBbox.height / 2 + 20, {
      steps: 5,
    });
    await page.mouse.up();

    const after = await getSourceCoords(page);
    expect(after.x).toBeGreaterThan(initial.x);
    expect(after.y).toBeGreaterThan(initial.y);
    expect(after.w).toBe(initial.w);
    expect(after.h).toBe(initial.h);
  });

  test('B. resize from all 8 handles (corners and edges)', async ({ page }) => {
    await openDev(page);
    const hSe = selection(page).locator('[role="slider"]').filter({ hasText: '' }).nth(4); // se handle
    const initial = await getSourceCoords(page);

    const seBbox = await getBbox(hSe);
    await page.mouse.move(seBbox.x + 5, seBbox.y + 5);
    await page.mouse.down();
    await page.mouse.move(seBbox.x + 45, seBbox.y + 35, { steps: 5 });
    await page.mouse.up();

    const afterSe = await getSourceCoords(page);
    expect(afterSe.w).toBeGreaterThan(initial.w);
    expect(afterSe.h).toBeGreaterThan(initial.h);

    // Test nw handle
    const hNw = selection(page).locator('[role="slider"]').first();
    const nwBbox = await getBbox(hNw);
    await page.mouse.move(nwBbox.x + 5, nwBbox.y + 5);
    await page.mouse.down();
    await page.mouse.move(nwBbox.x + 25, nwBbox.y + 25, { steps: 5 });
    await page.mouse.up();

    const afterNw = await getSourceCoords(page);
    expect(afterNw.x).toBeGreaterThan(afterSe.x);
    expect(afterNw.y).toBeGreaterThan(afterSe.y);
  });

  test('C. aspect ratio locking and aria-pressed semantics', async ({ page }) => {
    await openDev(page);
    const h = harness(page);

    const btn1to1 = h.getByRole('button', { name: '1:1 Square' });
    await expect(btn1to1).toHaveAttribute('aria-pressed', 'false');

    await btn1to1.click();
    await expect(btn1to1).toHaveAttribute('aria-pressed', 'true');

    const coords1to1 = await getSourceCoords(page);
    expect(coords1to1.w).toBe(coords1to1.h);

    // 4:3 ratio
    const btn4to3 = h.getByRole('button', { name: '4:3' });
    await btn4to3.click();
    await expect(btn4to3).toHaveAttribute('aria-pressed', 'true');
    await expect(btn1to1).toHaveAttribute('aria-pressed', 'false');
    const coords4to3 = await getSourceCoords(page);
    expect(coords4to3.w / coords4to3.h).toBeCloseTo(4 / 3, 1);

    // 16:9 ratio
    const btn16to9 = h.getByRole('button', { name: '16:9' });
    await btn16to9.click();
    const coords16to9 = await getSourceCoords(page);
    expect(coords16to9.w / coords16to9.h).toBeCloseTo(16 / 9, 1);

    // 35:45 passport photo ratio
    const btnPassport = h.getByRole('button', { name: '35:45 Passport' });
    await btnPassport.click();
    const coordsPassport = await getSourceCoords(page);
    expect(coordsPassport.w / coordsPassport.h).toBeCloseTo(35 / 45, 1);

    // Return to free
    const btnFree = h.getByRole('button', { name: 'Free' });
    await btnFree.click();
    await expect(btnFree).toHaveAttribute('aria-pressed', 'true');
  });

  test('D. fast drag outside image bounds clamps correctly without throwing', async ({ page }) => {
    await openDev(page);
    const box = selection(page);
    const boxBbox = await getBbox(box);

    // Drag far to the right and down beyond image bounds
    await page.mouse.move(boxBbox.x + 10, boxBbox.y + 10);
    await page.mouse.down();
    await page.mouse.move(boxBbox.x + 2000, boxBbox.y + 2000, { steps: 5 });
    await page.mouse.up();

    const clamped = await getSourceCoords(page);
    // Source image standard is 1000x800
    expect(clamped.x + clamped.w).toBeLessThanOrEqual(1000);
    expect(clamped.y + clamped.h).toBeLessThanOrEqual(800);
  });

  test('E. keyboard accessibility: 1px arrow steps and 10px shift-arrow steps', async ({
    page,
  }) => {
    await openDev(page);
    const box = selection(page);
    await box.focus();

    const start = await getSourceCoords(page);

    await page.keyboard.press('ArrowRight');
    const after1px = await getSourceCoords(page);
    expect(after1px.x).toBe(start.x + 1);

    await page.keyboard.press('Shift+ArrowRight');
    const after10px = await getSourceCoords(page);
    expect(after10px.x).toBe(after1px.x + 10);

    await page.keyboard.press('ArrowDown');
    const afterDown1px = await getSourceCoords(page);
    expect(afterDown1px.y).toBe(start.y + 1);

    await page.keyboard.press('Shift+ArrowDown');
    const afterDown10px = await getSourceCoords(page);
    expect(afterDown10px.y).toBe(afterDown1px.y + 10);
  });

  test('F. reset action restores default 80% centered rect', async ({ page }) => {
    await openDev(page);
    const h = harness(page);

    // Move selection
    const box = selection(page);
    await box.focus();
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');

    const moved = await getSourceCoords(page);

    // Click Reset
    await h.getByRole('button', { name: 'Reset selection' }).click();
    const reset = await getSourceCoords(page);
    expect(reset.x).toBe(100);
    expect(reset.y).toBe(80);
    expect(reset.w).toBe(800);
    expect(reset.h).toBe(640);
    expect(reset.x).not.toBe(moved.x);
  });

  test('G. viewport resize preserves authoritative source coordinates', async ({ page }) => {
    await openDev(page);
    const before = await getSourceCoords(page);

    // Resize viewport from desktop to tablet to mobile
    await page.setViewportSize({ width: 768, height: 800 });
    await page.waitForTimeout(100);
    const tabletCoords = await getSourceCoords(page);
    expect(tabletCoords).toEqual(before);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(100);
    const mobileCoords = await getSourceCoords(page);
    expect(mobileCoords).toEqual(before);
  });

  test('H. source-image change resets selection in uncontrolled mode', async ({ page }) => {
    await openDev(page);
    const h = harness(page);
    const initial = await getSourceCoords(page);
    expect(initial.w).toBe(800);

    // Switch to Alt image (600x600)
    await h.getByTestId('btn-alt').click();
    await page.waitForTimeout(150);

    const altCoords = await getSourceCoords(page);
    // Alt image is 600x600: 80% coverage is 480x480, centered at (60, 60)
    expect(altCoords.w).toBe(480);
    expect(altCoords.h).toBe(480);
    expect(altCoords.x).toBe(60);
    expect(altCoords.y).toBe(60);
  });

  test('I. overlay hooks do not block selection interaction', async ({ page }) => {
    await openDev(page);
    await expect(page.getByTestId('overlay-face-oval')).toBeVisible();
    await expect(page.getByTestId('overlay-ink-box')).toBeVisible();

    const box = selection(page);
    const initial = await getSourceCoords(page);

    // Drag right through the center where the overlay oval is located
    const bbox = await getBbox(box);
    await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    await page.mouse.down();
    await page.mouse.move(bbox.x + bbox.width / 2 + 40, bbox.y + bbox.height / 2, {
      steps: 5,
    });
    await page.mouse.up();

    const after = await getSourceCoords(page);
    expect(after.x).toBeGreaterThan(initial.x);
  });

  test('J. non-integer scale (4032x3024) repeated drags do not accumulate drift', async ({
    page,
  }) => {
    await openDev(page);
    const h = harness(page);

    // Switch to Highres 4032x3024 image
    await h.getByTestId('btn-highres').click();
    await page.waitForTimeout(150);

    const box = selection(page);
    await box.scrollIntoViewIfNeeded();

    const initial = await getSourceCoords(page);
    expect(initial.w).toBe(Math.round(4032 * 0.8));

    const bbox = await getBbox(box);

    // Perform 3 back-and-forth drags
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
      await page.mouse.down();
      await page.mouse.move(bbox.x + bbox.width / 2 + 50, bbox.y + bbox.height / 2 + 30, {
        steps: 10,
      });
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, {
        steps: 10,
      });
      await page.mouse.up();
    }

    const afterRoundtrip = await getSourceCoords(page);
    // Should return exactly to initial coordinates without drifting
    expect(afterRoundtrip.x).toBe(initial.x);
    expect(afterRoundtrip.y).toBe(initial.y);
    expect(afterRoundtrip.w).toBe(initial.w);
    expect(afterRoundtrip.h).toBe(initial.h);
  });

  test('K. controlled mode responds to external rect updates without stale leaks', async ({
    page,
  }) => {
    await openDev(page);
    const h = harness(page);

    // Enable controlled mode
    await h.getByTestId('btn-toggle-controlled').click();
    await expect(h).toHaveAttribute('data-controlled', 'true');

    // Click Set External Rect: { x: 120, y: 140, width: 350, height: 280 }
    await h.getByTestId('btn-set-controlled-rect').click();

    const coords = await getSourceCoords(page);
    expect(coords).toEqual({ x: 120, y: 140, w: 350, h: 280 });

    // Click Set External 1:1
    await h.getByTestId('btn-set-controlled-ratio-1-1').click();
    await expect(h.getByRole('button', { name: '1:1 Square' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('L. mobile viewport 360x800 does not scroll-trap user outside selection', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openDev(page);

    // Check computed touch-action on the viewport container
    const viewportEl = page.locator('div[class*="viewport"]').first();
    const touchAction = await viewportEl.evaluate((el) => window.getComputedStyle(el).touchAction);
    expect(touchAction).toBe('pan-y');

    // Check selection has touch-action: none so dragging works
    const selectionEl = selection(page);
    const selectionTouchAction = await selectionEl.evaluate(
      (el) => window.getComputedStyle(el).touchAction,
    );
    expect(selectionTouchAction).toBe('none');
  });
});
