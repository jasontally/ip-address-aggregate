/**
 * Mobile Portrait E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Portrait - Basic Flow", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(viewport.height);
  });
  test("should load page and show title in portrait", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("IP Address Tools");
  });

  test("should aggregate addresses in portrait mode", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const afterColumn = page.locator("#afterColumn");
    await expect(afterColumn).toContainText("192.168.1.0/24");
  });

  test("should show modal with minimum 1.5s duration in portrait", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    const startTime = Date.now();
    await page.click("#aggregateBtn");

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();
    await expect(modal).toBeHidden({ timeout: 5000 });

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(1500);
  });

  test("should handle error display in portrait mode", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("invalid cidr");

    await page.click("#aggregateBtn");

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should handle copy button functionality in portrait", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const copyBtn = page.locator(".copy-input-btn");
    await copyBtn.click();

    await expect(copyBtn).toHaveText("✓");
  });

  test("should handle mixed IPv4 and IPv6 in portrait", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/25\n192.168.1.128/25\n2001:db8::/64\n2001:db8:0:0:1::/64",
    );

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("192.168.1.0/25");
    expect(beforeText).toContain("2001:db8::/64");
  });
});

test.describe("Mobile Portrait - Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(viewport.height);
  });
  test("should stack columns vertically in portrait", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    await expect(beforeColumn).toBeVisible();
    await expect(afterColumn).toBeVisible();

    const beforeBox = await beforeColumn.boundingBox();
    const afterBox = await afterColumn.boundingBox();

    expect(beforeBox.y).toBeLessThanOrEqual(afterBox.y);
  });

  test("should handle scrollable content in portrait", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    const addresses = Array.from({ length: 20 }, (_, i) => `10.${i}.0.0/24`).join(
      "\n",
    );
    await input.fill(addresses);

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    await beforeColumn.scrollIntoViewIfNeeded();
    await expect(beforeColumn).toBeVisible();
  });
});
