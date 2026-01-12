/**
 * Input formats E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Input Format Tests", () => {
  test("should handle newline-separated input", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle comma-separated input", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24,10.0.0.0/8,172.16.0.0/12");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle mixed newline and comma separators", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8,172.16.0.0/12");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle extra whitespace", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("  192.168.1.0/24  \n  10.0.0.0/8  ,  172.16.0.0/12  ");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle single address", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const textarea = page.locator("#addressInput");
    const value = await textarea.inputValue();
    expect(value).toContain("192.168.1.0/24");
  });

  test("should handle IPv4 addresses only", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12");

    await page.click("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("192.168.1.0/24");
    expect(beforeText).toContain("10.0.0.0/8");
    expect(beforeText).toContain("172.16.0.0/12");
  });

  test("should handle IPv6 addresses only", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/32\n2001:db8:1::/48\n2001:db8:2::/48");

    await page.click("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("2001:db8::/32");
    expect(beforeText).toContain("2001:db8:1::/48");
    expect(beforeText).toContain("2001:db8:2::/48");
  });

  test("should handle compressed IPv6 notation", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/32\n::1/128");

    await page.click("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should sort IPv4 before IPv6 in results", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "2001:db8::/32\n192.168.1.0/24\n10.0.0.0/8\n2001:db8:1::/48",
    );

    await page.click("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    const ipv4Index = beforeText.indexOf("192.168.1.0/24");
    const ipv6Index = beforeText.indexOf("2001:db8::/32");

    expect(ipv4Index).toBeLessThan(ipv6Index);
  });
});
