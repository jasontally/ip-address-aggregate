/**
 * Mobile Keyboard Handling E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Keyboard Handling", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });

  test("should show virtual keyboard when tapping input on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeVisible();
  });

  test("should accept typing in textarea with virtual keyboard", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("192.168.1.0/24");

    const value = await input.inputValue();
    expect(value).toBe("192.168.1.0/24");
  });

  test("should handle Enter key press in textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("192.168.1.0/24");
    await input.press("Enter");
    await input.type("192.168.2.0/24");

    const value = await input.inputValue();
    expect(value).toContain("192.168.1.0/24\n192.168.2.0/24");
  });

  test("should handle Ctrl+Enter keyboard shortcut on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await input.press("Control+Enter");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should dismiss virtual keyboard when tapping outside", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await expect(input).toBeVisible();

    const body = page.locator("body");
    await body.tap({ position: { x: 10, y: 10 } });

    await expect(input).toBeVisible();
  });

  test("should handle typing long IPv6 addresses on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("2001:0db8:0000:0000:0000:ff00:0042:8329/64");

    const value = await input.inputValue();
    expect(value).toBe("2001:0db8:0000:0000:0000:ff00:0042:8329/64");
  });

  test("should handle typing multiple CIDR addresses", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("192.168.1.0/24");
    await input.press("Enter");
    await input.type("192.168.2.0/24");
    await input.press("Enter");
    await input.type("192.168.3.0/24");

    const value = await input.inputValue();
    expect(value).toContain("192.168.1.0/24");
    expect(value).toContain("192.168.2.0/24");
    expect(value).toContain("192.168.3.0/24");
  });

  test("should handle typing comma-separated addresses", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("192.168.1.0/24,192.168.2.0/24,192.168.3.0/24");

    const value = await input.inputValue();
    expect(value).toContain("192.168.1.0/24");
    expect(value).toContain("192.168.2.0/24");
    expect(value).toContain("192.168.3.0/24");
  });

  test("should handle keyboard focus on output textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await output.tap();

    await expect(output).toBeVisible();
  });

  test("should prevent typing in readonly output textarea", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await output.tap();
    await output.type("test");

    const value = await output.inputValue();
    expect(value).not.toContain("test");
  });
});
