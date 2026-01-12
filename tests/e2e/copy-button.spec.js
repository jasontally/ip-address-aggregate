/**
 * Copy button E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Copy Button Functionality", () => {
  test("should show Copied! feedback after clicking copy button", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator("#copyBtn");
    await copyBtn.click();

    await expect(copyBtn).toHaveText("Copied!");

    await expect(copyBtn).toHaveText("Copy", { timeout: 3000 });
  });

  test("should copy results to clipboard", async ({ page, context }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");
    await page.click("#aggregateBtn");

    const textarea = page.locator("#addressInput");
    const expectedText = await textarea.inputValue();

    const copyBtn = page.locator("#copyBtn");
    await copyBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBe(expectedText);
  });

  test("should be disabled before aggregation", async ({ page }) => {
    await page.goto("/");

    const copyBtn = page.locator("#copyBtn");
    await expect(copyBtn).toBeDisabled();
  });

  test("should be enabled after aggregation", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator("#copyBtn");
    await expect(copyBtn).toBeEnabled();
  });

  test("should copy aggregated results (not original input)", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");

    await page.click("#aggregateBtn");

    await page.waitForTimeout(100);

    const copyBtn = page.locator("#copyBtn");
    await copyBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).not.toContain("192.168.1.0/25");
    expect(clipboardText).not.toContain("192.168.1.128/25");
  });

  test("should handle multiple copies correctly", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator("#copyBtn");

    for (let i = 0; i < 3; i++) {
      await copyBtn.click();
      await expect(copyBtn).toHaveText("Copied!");
      await expect(copyBtn).toHaveText("Copy", { timeout: 3000 });
    }
  });
});
