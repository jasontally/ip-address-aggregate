/**
 * Error handling E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test("should show error for empty input", async ({ page }) => {
    await page.goto("/");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/at least one/);
  });

  test("should show error for whitespace-only input", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("   \n   ");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/at least one/);
  });

  test("should show error for invalid IPv4 CIDR", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("256.1.1.1/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should show error for invalid IPv6 CIDR", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("gggg::1/128");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should show error for CIDR without prefix", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should show error for invalid prefix format", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/abc");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should handle multiple invalid addresses in error message", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("256.1.1.1/24\nggg::1/128\n192.168.1.0/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/256.1.1.1\/24/);
  });

  test("should clear previous error on valid input", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("invalid");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();

    await input.fill("192.168.1.0/24");
    await aggregateBtn.click();

    await expect(errorDiv).not.toBeVisible();
  });

  test("should not show modal when error occurs", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("invalid cidr");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const modal = page.locator("#processingModal");
    await expect(modal).not.toBeVisible();
  });

  test("should show error for invalid IPv4 octets", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.256/24");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should show error for IPv4 prefix out of range", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/33");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should show error for IPv6 prefix out of range", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/129");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const errorDiv = page.locator("#error");
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toHaveText(/Invalid CIDR/);
  });

  test("should not enable copy button when error occurs", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("invalid");

    const aggregateBtn = page.locator("#aggregateBtn");
    await aggregateBtn.click();

    const copyBtn = page.locator("#copyBtn");
    await expect(copyBtn).toBeDisabled();
  });
});
