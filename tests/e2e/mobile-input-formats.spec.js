/**
 * Mobile Input Format E2E tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("Mobile Input Format Tests", () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport.width).toBeLessThanOrEqual(768);
  });

  test("should handle newline-separated input on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle comma-separated input on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24,10.0.0.0/8,172.16.0.0/12");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle mixed newline and comma separators on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8,172.16.0.0/12");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle extra whitespace on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("  192.168.1.0/24  \n  10.0.0.0/8  ,  172.16.0.0/12  ");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle single address on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const textarea = page.locator("#addressInput");
    const value = await textarea.inputValue();
    expect(value).toContain("192.168.1.0/24");
  });

  test("should handle IPv4 addresses only on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12");

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("192.168.1.0/24");
    expect(beforeText).toContain("10.0.0.0/8");
    expect(beforeText).toContain("172.16.0.0/12");
  });

  test("should handle IPv6 addresses only on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/32\n2001:db8:1::/48\n2001:db8:2::/48");

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("2001:db8::/32");
    expect(beforeText).toContain("2001:db8:1::/48");
    expect(beforeText).toContain("2001:db8:2::/48");
  });

  test("should handle compressed IPv6 notation on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/32\n::1/128");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should sort IPv4 before IPv6 in results on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "2001:db8::/32\n192.168.1.0/24\n10.0.0.0/8\n2001:db8:1::/48",
    );

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    const ipv4Index = beforeText.indexOf("192.168.1.0/24");
    const ipv6Index = beforeText.indexOf("2001:db8::/32");

    expect(ipv4Index).toBeLessThan(ipv6Index);
  });

  test("should handle touch-typing addresses on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();
    await input.type("192.168.1.0/24");
    await input.press("Enter");
    await input.type("10.0.0.0/8");

    const value = await input.inputValue();
    expect(value).toContain("192.168.1.0/24");
    expect(value).toContain("10.0.0.0/8");
  });

  test("should handle paste on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.tap();

    await page.evaluate(() => {
      navigator.clipboard.writeText("192.168.1.0/24\n10.0.0.0/8");
    });

    await page.keyboard.press("Control+v");

    const value = await input.inputValue();
    expect(value).toContain("192.168.1.0/24");
    expect(value).toContain("10.0.0.0/8");
  });

  test("should handle many addresses on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    const addresses = Array.from({ length: 50 }, (_, i) => `10.${i}.0.0/24`).join(
      "\n",
    );
    await input.fill(addresses);

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle very long IPv6 addresses on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "2001:0db8:0000:0000:0000:ff00:0042:8329/64\n2001:0db8:0000:0000:0000:ff00:0042:8330/64",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle mixed IPv4 and IPv6 on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/25\n192.168.1.128/25\n2001:db8::/64\n2001:db8:0:0:1::/64",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    expect(beforeText).toContain("192.168.1.0/25");
    expect(beforeText).toContain("2001:db8::/64");
  });

  test("should handle tab-separated input on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\t10.0.0.0/8\t172.16.0.0/12");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle empty lines in input on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/24\n\n\n10.0.0.0/8\n\n172.16.0.0/12",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input with comments on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "# Network 1\n192.168.1.0/24\n# Network 2\n10.0.0.0/8",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle trailing commas on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24,10.0.0.0/8,172.16.0.0/12,");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle leading/trailing spaces around addresses on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      " 192.168.1.0/24 , 10.0.0.0/8 , 172.16.0.0/12 ",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input with duplicate addresses on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n192.168.1.0/24\n10.0.0.0/8");

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input in different formats on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/24\n10.0.0.0/8,172.16.0.0/12\n192.168.2.0/24",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input with CIDR prefix variations on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/24\n192.168.2.0/16\n192.168.3.0/8\n192.168.4.0/32",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input with IPv6 compression variations on mobile", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "2001:db8::/32\n2001:0db8:0000:0000:0000:ff00:0042:8329/64\n::1/128",
    );

    await page.tap("#aggregateBtn");

    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should handle input sorting on mobile", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill(
      "10.0.0.0/8\n192.168.1.0/24\n172.16.0.0/12\n192.168.2.0/24",
    );

    await page.tap("#aggregateBtn");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    const firstIndex = beforeText.indexOf("10.0.0.0/8");
    const secondIndex = beforeText.indexOf("172.16.0.0/12");
    const thirdIndex = beforeText.indexOf("192.168.1.0/24");

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });
});
