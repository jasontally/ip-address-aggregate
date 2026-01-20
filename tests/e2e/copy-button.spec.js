/**
 * Copy button E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Copy Button Functionality", () => {
  test("should show checkmark feedback after clicking input copy button", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    const copyBtn = page.locator(".copy-input-btn");
    await copyBtn.click();

    await expect(copyBtn).toHaveText("✓");
    await expect(copyBtn).toHaveClass(/checkmark/);

    const svgIcon = copyBtn.locator("svg");
    await expect(svgIcon).not.toBeVisible();
  });

  test("should copy input to clipboard", async ({ page, context }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8");

    const expectedText = "192.168.1.0/24\n10.0.0.0/8";

    const copyBtn = page.locator(".copy-input-btn");
    await copyBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBe(expectedText);
  });

  test("should copy output to clipboard after aggregation", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");
    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const expectedText = await output.inputValue();

    const copyBtn = page.locator(".copy-output-btn");
    await copyBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBe(expectedText);
  });

  test("input copy button works immediately (not disabled)", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const copyBtn = page.locator(".copy-input-btn");
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
    await expect(copyBtn).toHaveText("✓");
    await expect(copyBtn).toHaveClass(/checkmark/);

    const svgIcon = copyBtn.locator("svg");
    await expect(svgIcon).not.toBeVisible();
  });

  test("output copy button shows feedback after aggregation", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator(".copy-output-btn");
    await copyBtn.click();

    await expect(copyBtn).toHaveText("✓");
    await expect(copyBtn).toHaveClass(/checkmark/);

    const svgIcon = copyBtn.locator("svg");
    await expect(svgIcon).not.toBeVisible();
  });

  test("should handle multiple input copies correctly", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    const copyBtn = page.locator(".copy-input-btn");

    for (let i = 0; i < 3; i++) {
      await copyBtn.click();
      await expect(copyBtn).toHaveText("✓");
      await expect(copyBtn).toHaveClass(/checkmark/);

      const svgIcon = copyBtn.locator("svg");
      await expect(svgIcon).not.toBeVisible();
    }
  });

  test("should handle multiple output copies correctly", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");
    await page.click("#aggregateBtn");

    const copyBtn = page.locator(".copy-output-btn");

    for (let i = 0; i < 3; i++) {
      await copyBtn.click();
      await expect(copyBtn).toHaveText("✓");
      await expect(copyBtn).toHaveClass(/checkmark/);

      const svgIcon = copyBtn.locator("svg");
      await expect(svgIcon).not.toBeVisible();
    }
  });

  test("should preserve original input after aggregation", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    const originalInput = "192.168.1.0/25\n192.168.1.128/25\n10.0.0.0/8";
    await input.fill(originalInput);

    await page.click("#aggregateBtn");

    await page.waitForTimeout(100);

    const currentInput = await input.inputValue();
    expect(currentInput).toBe(originalInput);
  });

  test("should copy aggregated results (not original input)", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");

    await page.click("#aggregateBtn");

    await page.waitForTimeout(100);

    const outputCopyBtn = page.locator(".copy-output-btn");
    await outputCopyBtn.click();

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).not.toContain("192.168.1.0/25");
    expect(clipboardText).not.toContain("192.168.1.128/25");
  });
});
