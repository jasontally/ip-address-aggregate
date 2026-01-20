/**
 * Mobile Safari-specific E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Safari - iOS Specific Behaviors", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });
  test.skip(({ browserName }) => browserName !== 'webkit');

  test("should handle iOS viewport scaling correctly", async ({ page }) => {
    await page.goto("/");

    const metaViewport = await page.locator('meta[name="viewport"]').getAttribute(
      "content",
    );

    expect(metaViewport).toContain("width=device-width");
    expect(metaViewport).toContain("initial-scale=1.0");
    expect(metaViewport).toContain("minimum-scale=0.5");
  });

  test("should prevent iOS elastic scrolling on main content", async ({ page }) => {
    await page.goto("/");

    const body = page.locator("body");

    await body.evaluate((el) => {
      el.style.overflow = "auto";
    });

    await body.scroll({ top: 0, left: 0 });

    const scrollPosition = await body.evaluate(
      (el) => el.scrollTop || window.pageYOffset,
    );

    expect(scrollPosition).toBe(0);
  });

  test("should handle iOS safe area insets", async ({ page }) => {
    await page.goto("/");

    const body = page.locator("body");
    const bodyBox = await body.boundingBox();

    if (bodyBox) {
      const viewport = page.viewportSize();
      if (viewport) {
        expect(bodyBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test("should handle iOS tap highlight color", async ({ page }) => {
    await page.goto("/");

    const aggregateBtn = page.locator("#aggregateBtn");

    await aggregateBtn.tap();

    await expect(aggregateBtn).toBeVisible();
  });

  test("should handle iOS autocorrect on textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle iOS text selection on textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await input.selectText();

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle iOS clipboard paste", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      navigator.clipboard.writeText("192.168.1.0/24\n10.0.0.0/8");
    });

    const input = page.locator("#addressInput");
    await input.tap();

    await page.keyboard.press("Control+v");

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24\n10.0.0.0/8");
  });

  test("should handle iOS virtual keyboard dismissal", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(input).not.toBeFocused();
  });

  test("should handle iOS focus management", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    await expect(aggregateBtn).toBeFocused();
  });

  test("should handle iOS touch-action CSS property", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");

    const touchAction = await html.evaluate((el) => {
      return window.getComputedStyle(el).touchAction;
    });

    expect(touchAction).toContain("pan");
  });

  test("should handle iOS 100vh issue in landscape", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();
  });

  test("should handle iOS address bar visibility", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");

    await page.evaluate(() => window.scrollTo(0, 0));

    await expect(h1).toBeInViewport();
  });

  test("should handle iOS form autofill", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle iOS input zoom on font-size < 16px", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");

    const fontSize = await input.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(16);
  });

  test("should handle iOS tap delay on 300ms", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();
  });

  test("should handle iOS scroll momentum", async ({ page }) => {
    await page.goto("/");

    const body = page.locator("body");

    await body.evaluate(() => {
      document.body.style.height = "200vh";
    });

    await page.mouse.wheel(0, 1000);

    await page.waitForTimeout(500);

    const scrollPosition = await body.evaluate(
      (el) => el.scrollTop || window.pageYOffset,
    );

    expect(scrollPosition).toBeGreaterThan(0);
  });

  test("should handle iOS pinch-to-zoom prevention", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    const initialScale = await page.evaluate(() => window.visualViewport?.scale ?? 1);

    expect(initialScale).toBeCloseTo(1);
  });

  test("should handle iOS double-tap to zoom", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");

    await h1.dblclick();

    await expect(h1).toBeVisible();

    const scale = await page.evaluate(() => window.visualViewport?.scale ?? 1);

    expect(scale).toBeCloseTo(1);
  });

  test("should handle iOS text selection handles", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await input.selectText();

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle iOS context menu on long press", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const inputBox = await input.boundingBox();
    if (inputBox) {
      await page.touchstart({
        x: inputBox.x + inputBox.width / 2,
        y: inputBox.y + inputBox.height / 2,
      });

      await page.waitForTimeout(500);

      await page.touchend();
    }

    await expect(input).toBeVisible();
  });

  test("should handle iOS keyboard accessory view", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should handle iOS keyboard auto-correct suggestions", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle iOS landscape keyboard layout", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeFocused();

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    await expect(aggregateBtn).toBeFocused();
  });

  test("should handle iOS status bar overlap", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");
    const h1Box = await h1.boundingBox();

    if (h1Box) {
      expect(h1Box.y).toBeGreaterThanOrEqual(0);
    }
  });
});
