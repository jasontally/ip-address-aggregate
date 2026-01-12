/**
 * Basic flow E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Basic Aggregation Flow", () => {
  test("should load the page successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("IP Address Aggregate");
  });

  test("should aggregate IPv4 addresses", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");

    await page.click("#aggregateBtn");

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();
    await expect(modal).toBeHidden({ timeout: 5000 });

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const beforeText = await beforeColumn.textContent();
    const afterText = await afterColumn.textContent();

    expect(beforeText).toContain("192.168.1.0/25");
    expect(beforeText).toContain("192.168.1.128/25");
    expect(afterText).toContain("192.168.1.0/24");
  });

  test("should aggregate IPv6 addresses", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/64\n2001:db8:0:0:1::/64");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const afterColumn = page.locator("#afterColumn");
    const afterText = await afterColumn.textContent();

    expect(afterText.length).toBeGreaterThan(0);
  });

  test("should aggregate mixed IPv4 and IPv6", async ({ page }) => {
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
    expect(beforeText).toContain("192.168.1.128/25");
    expect(beforeText).toContain("2001:db8::/64");
  });

  test("should show modal for at least 1.5 seconds", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    const startTime = Date.now();
    await page.click("#aggregateBtn");

    const modal = page.locator("#processingModal");
    await expect(modal).toBeVisible();

    await page.waitForSelector("#processingModal", { state: "hidden" });
    const endTime = Date.now();

    const elapsedTime = endTime - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(1500);
  });

  test("should enable copy button after aggregation", async ({ page }) => {
    await page.goto("/");

    const copyBtn = page.locator("#copyBtn");
    await expect(copyBtn).toBeDisabled();

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");
    await page.click("#aggregateBtn");

    await expect(copyBtn).toBeEnabled();
  });
});
