/**
 * Mobile Touch Interaction E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Touch Interactions", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });
  test("should handle tap on input textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();
  });

  test("should handle tap on aggregate button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle tap on copy input button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const copyBtn = page.locator(".copy-input-btn");
    await copyBtn.tap();

    await expect(copyBtn).toHaveText("✓");
  });

  test("should handle tap on copy output button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator(".copy-output-btn");
    await copyBtn.tap();

    await expect(copyBtn).toHaveText("✓");
  });

  test("should handle tap on copy before column button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n192.168.2.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator(".copy-before-btn");
    await copyBtn.tap();

    await expect(copyBtn).toHaveText("✓");
  });

  test("should handle tap on copy after column button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n192.168.2.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator(".copy-after-btn");
    await copyBtn.tap();

    await expect(copyBtn).toHaveText("✓");
  });

  test("should handle tap on operation select dropdown", async ({ page }) => {
    await page.goto("/");

    const select = page.locator("#operationSelect");
    await select.tap();

    await expect(select).toBeFocused();
  });

  test("should handle rapid multiple taps on copy button", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const copyBtn = page.locator(".copy-input-btn");

    for (let i = 0; i < 3; i++) {
      await copyBtn.tap();
      await expect(copyBtn).toHaveText("✓");
    }
  });

  test("should handle tap on textarea in diff container", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n192.168.2.0/24");
    await page.click("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    await beforeColumn.tap();

    await expect(beforeColumn).toBeVisible();
  });

  test("should handle tap on error message", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("invalid cidr");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
  });

  test.skip(true, "Skip link is initially off-screen and not mobile-specific");

  test("should handle tap on modal when visible", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();
  });

  test("should handle tap and hold on textarea to show context menu", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await input.tap({ position: { x: 50, y: 50 } });

    await expect(input).toBeFocused();
  });

  test("should handle tap on footer links", async ({ page }) => {
    await page.goto("/");

    const footerLink = page.locator('footer a[href^="https"]');
    const count = await footerLink.count();

    if (count > 0) {
      await footerLink.first().tap();
    }
  });
});

test.describe("Mobile Touch - Gesture Handling", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });
  test("should handle swipe gesture on textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    const addresses = Array.from({ length: 50 }, (_, i) => `10.${i}.0.0/24`).join(
      "\n",
    );
    await input.fill(addresses);

    const box = await input.boundingBox();
    if (box) {
      await page.touchstart({
        x: box.x + box.width / 2,
        y: box.y + box.height - 50,
      });
      await page.touchmove({
        x: box.x + box.width / 2,
        y: box.y + 50,
      });
      await page.touchend();
    }

    await expect(input).toBeVisible();
  });

  test("should handle pinch zoom on viewport", async ({ page }) => {
    await page.goto("/");

    const viewport = page.viewportSize();
    if (viewport) {
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      await page.touchstart({
        x: centerX - 50,
        y: centerY,
      });
      await page.touchstart({
        x: centerX + 50,
        y: centerY,
      });
      await page.touchmove({
        x: centerX - 25,
        y: centerY,
      });
      await page.touchmove({
        x: centerX + 25,
        y: centerY,
      });
      await page.touchend();
      await page.touchend();
    }

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });
});

test.describe("Mobile Touch - Focus Management", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });
  test("should handle focus when tapping between elements", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await expect(input).toBeFocused();

    const output = page.locator("#addressOutput");
    await output.tap();
    await expect(input).not.toBeFocused();
  });

  test("should handle focus on button after input interaction", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    await expect(aggregateBtn).toBeFocused();
  });
});
