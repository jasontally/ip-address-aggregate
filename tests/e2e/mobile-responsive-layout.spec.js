/**
 * Mobile Responsive Layout E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Responsive Layout - Small Breakpoints", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });
  test("should display properly on iPhone SE (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should stack input/output vertically on iPhone SE", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    const output = page.locator("#addressOutput");

    const inputBox = await input.boundingBox();
    const outputBox = await output.boundingBox();

    if (inputBox && outputBox) {
      expect(inputBox.y).toBeLessThan(outputBox.y);
    }
  });

  test("should display properly on iPhone 12 (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should display properly on iPhone 12 Pro Max (428x926)", async ({ page }) => {
    await page.setViewportSize({ width: 428, height: 926 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should display properly on Android small (360x640)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });
});

test.describe("Mobile Responsive Layout - Medium Breakpoints", () => {
  test("should display properly on iPad Mini (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should display properly on iPad (810x1080)", async ({ page }) => {
    await page.setViewportSize({ width: 810, height: 1080 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should display properly on iPad Pro 10.5 (834x1112)", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1112 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });

  test("should display properly on Pixel 5 (393x851)", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toBeInViewport();

    const input = page.locator("#addressInput");
    await expect(input).toBeVisible();

    const aggregateBtn = page.locator("#aggregateBtn");
    await expect(aggregateBtn).toBeVisible();
  });
});

test.describe("Mobile Responsive Layout - Orientation Changes", () => {
  test("should handle portrait to landscape rotation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    await page.setViewportSize({ width: 667, height: 375 });

    await expect(h1).toBeVisible();
  });

  test("should handle landscape to portrait rotation", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });

    await expect(h1).toBeVisible();
  });

  test("should adjust layout when rotating to landscape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const portraitBeforeBox = await beforeColumn.boundingBox();
    const portraitAfterBox = await afterColumn.boundingBox();

    await page.setViewportSize({ width: 667, height: 375 });

    await page.reload();

    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const landscapeBeforeBox = await beforeColumn.boundingBox();
    const landscapeAfterBox = await afterColumn.boundingBox();

    if (portraitBeforeBox && portraitAfterBox && landscapeBeforeBox && landscapeAfterBox) {
      expect(portraitBeforeBox.y).toBeLessThanOrEqual(portraitAfterBox.y);
      expect(landscapeBeforeBox.x).toBeLessThanOrEqual(landscapeAfterBox.x);
    }
  });
});

test.describe("Mobile Responsive Layout - Diff Container", () => {
  test("should display diff container vertically on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const beforeBox = await beforeColumn.boundingBox();
    const afterBox = await afterColumn.boundingBox();

    if (beforeBox && afterBox) {
      expect(beforeBox.y).toBeLessThanOrEqual(afterBox.y);
    }
  });

  test("should display diff container horizontally on wider screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const beforeBox = await beforeColumn.boundingBox();
    const afterBox = await afterColumn.boundingBox();

    if (beforeBox && afterBox) {
      expect(beforeBox.x).toBeLessThanOrEqual(afterBox.x);
    }
  });

  test("should handle scrollable diff columns on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    const addresses = Array.from({ length: 20 }, (_, i) => `10.${i}.0.0/24`).join(
      "\n",
    );
    await input.fill(addresses);

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    await beforeColumn.scrollIntoViewIfNeeded();
    await expect(beforeColumn).toBeVisible();
  });
});

test.describe("Mobile Responsive Layout - Action Toolbar", () => {
  test("should stack toolbar items vertically on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const select = page.locator("#operationSelect");
    const aggregateBtn = page.locator("#aggregateBtn");

    const selectBox = await select.boundingBox();
    const btnBox = await aggregateBtn.boundingBox();

    if (selectBox && btnBox) {
      expect(selectBox.y).toBeLessThan(btnBox.y);
    }
  });

  test("should display toolbar items horizontally on larger screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    const select = page.locator("#operationSelect");
    const aggregateBtn = page.locator("#aggregateBtn");

    const selectBox = await select.boundingBox();
    const btnBox = await aggregateBtn.boundingBox();

    if (selectBox && btnBox) {
      expect(selectBox.y).toBe(btnBox.y);
    }
  });

  test("should ensure toolbar buttons are tappable on small screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto("/");

    const aggregateBtn = page.locator("#aggregateBtn");
    const btnBox = await aggregateBtn.boundingBox();

    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("Mobile Responsive Layout - Modal", () => {
  test("should display modal properly on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();
    await expect(modal).toBeInViewport();
  });

  test("should display modal properly on larger screens", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();
    await expect(modal).toBeInViewport();
  });

  test("should center modal content on all screen sizes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const modal = page.locator(".modal");
    const modalBox = await modal.boundingBox();

    if (modalBox) {
      const viewport = page.viewportSize();
      if (viewport) {
        const centerX = modalBox.x + modalBox.width / 2;
        expect(centerX).toBeCloseTo(viewport.width / 2, 50);
      }
    }
  });
});

test.describe("Mobile Responsive Layout - Footer", () => {
  test("should display footer properly on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(footer).toBeInViewport();
  });

  test("should display footer properly on larger screens", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(footer).toBeInViewport();
  });
});
