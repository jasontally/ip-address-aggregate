/**
 * Mobile Error Handling E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !test.info().project.name.includes("Mobile"),
      "Mobile tests only run on mobile devices",
    );
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });

  test("should show error message for empty input on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/at least one/);
  });

  test("should show error for invalid IPv4 CIDR on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("256.1.1.1/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/All.*entries are invalid/);

    const invalidErrors = page.locator("#invalidErrors");
    await expect(invalidErrors).toBeVisible();
    await expect(invalidErrors).toContainText("256.1.1.1/24");
  });

  test("should show error for invalid IPv6 CIDR on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("gggg::1/128");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.tap();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/All.*entries are invalid/);

    const invalidErrors = page.locator("#invalidErrors");
    await expect(invalidErrors).toBeVisible();
    await expect(invalidErrors).toContainText("gggg::1/128");
  });
});
