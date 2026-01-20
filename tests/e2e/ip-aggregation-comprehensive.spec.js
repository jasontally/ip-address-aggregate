/**
 * IP Address Aggregation E2E Test
 * Tests adjacent, overlapping, non-overlapping, and non-adjacent IPv4 and IPv6 addresses
 * Tests various IPv6 compression methods and diff highlighting
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";

test.describe("IP Address Aggregation Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should aggregate adjacent IPv4 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/25\n192.168.1.128/25");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("192.168.1.0/24");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBeLessThan(2);

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBeGreaterThan(0);
    expect(await addedLines.count()).toBeGreaterThan(0);
  });

  test("should aggregate overlapping IPv4 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("10.0.0.0/24\n10.0.0.0/25\n10.0.0.128/25");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("10.0.0.0/24");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBeLessThan(3);

    const beforeColumn = page.locator("#beforeColumn");
    const removedLines = beforeColumn.locator(".diff-line.removed");
    const afterColumn = page.locator("#afterColumn");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBeGreaterThan(0);
    expect(await addedLines.count()).toBeGreaterThan(0);
  });

  test("should NOT merge non-overlapping IPv4 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("172.16.0.0/24\n172.16.2.0/24\n172.16.4.0/24");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("172.16.0.0/24");
    expect(outputValue).toContain("172.16.2.0/24");
    expect(outputValue).toContain("172.16.4.0/24");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBe(3);

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBe(0);
    expect(await addedLines.count()).toBe(0);
  });

  test("should NOT merge non-adjacent IPv4 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\n192.168.3.0/24\n192.168.5.0/24");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("192.168.1.0/24");
    expect(outputValue).toContain("192.168.3.0/24");
    expect(outputValue).toContain("192.168.5.0/24");

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBe(0);
    expect(await addedLines.count()).toBe(0);
  });

  test("should aggregate adjacent IPv6 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("2001:db8::/64\n2001:db8:1::/64");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001:db8::/64");
    expect(outputValue).toContain("2001:db8:1::/64");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBe(2);

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBe(0);
    expect(await addedLines.count()).toBe(0);
  });

  test("should aggregate overlapping IPv6 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("2001:db8:1::/48\n2001:db8:1::/64\n2001:db8:1:1::/64");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001:db8:1::/48");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBeLessThan(3);

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBeGreaterThan(0);
    expect(await addedLines.count()).toBeGreaterThan(0);
  });

  test("should NOT merge non-overlapping IPv6 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("2001:db8:10::/48\n2001:db8:20::/48\n2001:db8:30::/48");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001:db8:10::/48");
    expect(outputValue).toContain("2001:db8:20::/48");
    expect(outputValue).toContain("2001:db8:30::/48");

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBe(0);
    expect(await addedLines.count()).toBe(0);
  });

  test("should NOT merge non-adjacent IPv6 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("2001:db8:1::/48\n2001:db8:3::/48\n2001:db8:5::/48");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001:db8:1::/48");
    expect(outputValue).toContain("2001:db8:3::/48");
    expect(outputValue).toContain("2001:db8:5::/48");

    const beforeColumn = page.locator("#beforeColumn");
    const afterColumn = page.locator("#afterColumn");

    const removedLines = beforeColumn.locator(".diff-line.removed");
    const addedLines = afterColumn.locator(".diff-line.added");

    expect(await removedLines.count()).toBe(0);
    expect(await addedLines.count()).toBe(0);
  });

  test("should normalize and aggregate IPv6 with different compression methods", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "2001:0db8:0000:0000:0000:0000:0000:0000/32\n2001:db8::/32",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await expect(output).toHaveValue("2001:db8::/32");

    const afterColumn = page.locator("#afterColumn");
    const afterText = await afterColumn.textContent();
    expect(afterText).toContain("2001:db8::/32");
    expect(afterText).not.toMatch(/[A-F]/);
  });

  test("should aggregate mixed IPv4 and IPv6 addresses", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/25\n192.168.1.128/25\n2001:db8::/63\n2001:db8:2::/63\n10.0.0.0/24\n10.0.0.0/25",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("10.0.0.0/24");
    expect(outputValue).toContain("192.168.1.0/24");
    expect(outputValue).toContain("2001:db8::/63");
    expect(outputValue).toContain("2001:db8:2::/63");

    const beforeColumn = page.locator("#beforeColumn");
    const beforeText = await beforeColumn.textContent();

    const ipv4Index = beforeText.indexOf("192.168.1.0/25");
    const ipv6Index = beforeText.indexOf("2001:db8::/63");

    expect(ipv4Index).toBeLessThan(ipv6Index);
  });

  test("should handle mixed adjacent and non-adjacent IPv4 addresses", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.0.0/24\n192.168.1.0/24\n192.168.3.0/24\n192.168.4.0/24",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("192.168.0.0/23");
    expect(outputValue).toContain("192.168.3.0/24");
    expect(outputValue).toContain("192.168.4.0/24");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBe(3);

    const beforeColumn = page.locator("#beforeColumn");
    const removedLines = beforeColumn.locator(".diff-line.removed");
    expect(await removedLines.count()).toBe(2);

    const afterColumn = page.locator("#afterColumn");
    const addedLines = afterColumn.locator(".diff-line.added");
    expect(await addedLines.count()).toBe(1);

    const unchangedBefore = beforeColumn.locator(".diff-line:not(.removed)");
    expect(await unchangedBefore.count()).toBe(2);

    const unchangedAfter = afterColumn.locator(".diff-line:not(.added)");
    expect(await unchangedAfter.count()).toBe(2);
  });

  test("should normalize full spectrum of IPv6 compression", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "2001:0000:0000:0000:0000:0000:0000:0001/128\n2001::1/128",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001::1/128");

    const afterColumn = page.locator("#afterColumn");
    const afterText = await afterColumn.textContent();
    expect(afterText).not.toMatch(/[A-F]/);
  });

  test("should aggregate large IPv4 CIDR blocks", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("10.0.0.0/8\n10.0.0.0/9\n10.128.0.0/9");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await expect(output).toHaveValue("10.0.0.0/8");

    const beforeColumn = page.locator("#beforeColumn");
    const removedLines = beforeColumn.locator(".diff-line.removed");
    expect(await removedLines.count()).toBe(3);

    const afterColumn = page.locator("#afterColumn");
    const addedLines = afterColumn.locator(".diff-line.added");
    expect(await addedLines.count()).toBe(1);
  });

  test("should normalize IPv6 leading and trailing zero compression", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "2001:0db8:0000:0000:0000:0000:0000:0000/64\n2001:db8::/64",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await expect(output).toHaveValue("2001:db8::/64");

    const afterColumn = page.locator("#afterColumn");
    const afterText = await afterColumn.textContent();
    expect(afterText).not.toMatch(/[A-F]/);
  });

  test("should auto-convert and aggregate IPv4 bare IPs", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("10.0.0.0\n10.0.0.1\n10.0.0.2\n10.0.0.3");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    await expect(output).toHaveValue("10.0.0.0/30");

    const beforeColumn = page.locator("#beforeColumn");
    const removedLines = beforeColumn.locator(".diff-line.removed");
    expect(await removedLines.count()).toBe(4);

    const afterColumn = page.locator("#afterColumn");
    const addedLines = afterColumn.locator(".diff-line.added");
    expect(await addedLines.count()).toBe(1);
  });

  test("should auto-convert and aggregate IPv6 bare IPs", async ({ page }) => {
    const input = page.locator("#addressInput");
    await input.fill("2001:db8::1\n2001:db8::2\n2001:db8::3\n2001:db8::4");

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("2001:db8::2/127");
    expect(outputValue).toContain("2001:db8::1/128");
    expect(outputValue).toContain("2001:db8::4/128");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBeLessThan(4);
  });

  test("should highlight diff correctly with mixed aggregation", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "10.0.0.0/25\n10.0.0.128/25\n192.168.1.0/24\n192.168.2.0/24\n2001:db8::/64\n2001:db8:1::/64",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("10.0.0.0/24");
    expect(outputValue).toContain("192.168.1.0/24");
    expect(outputValue).toContain("192.168.2.0/24");
    expect(outputValue).toContain("2001:db8::/64");
    expect(outputValue).toContain("2001:db8:1::/64");

    const beforeColumn = page.locator("#beforeColumn");
    const removedLines = beforeColumn.locator(".diff-line.removed");
    expect(await removedLines.count()).toBe(2);

    const unchangedLinesBefore = beforeColumn.locator(
      ".diff-line:not(.removed)",
    );
    expect(await unchangedLinesBefore.count()).toBe(4);

    const afterColumn = page.locator("#afterColumn");
    const addedLines = afterColumn.locator(".diff-line.added");
    expect(await addedLines.count()).toBe(1);

    const unchangedLinesAfter = afterColumn.locator(".diff-line:not(.added)");
    expect(await unchangedLinesAfter.count()).toBe(4);
  });

  test("should handle comma-separated input with aggregation", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    await input.fill(
      "192.168.1.0/25,192.168.1.128/25,10.0.0.0/25,10.0.0.128/25",
    );

    await page.click("#aggregateBtn");

    const output = page.locator("#addressOutput");
    const outputValue = await output.inputValue();

    expect(outputValue).toContain("10.0.0.0/24");
    expect(outputValue).toContain("192.168.1.0/24");

    const outputLines = outputValue.split("\n").filter((line) => line.trim());
    expect(outputLines.length).toBe(2);
  });

  test("should preserve original input format in input box", async ({
    page,
  }) => {
    const input = page.locator("#addressInput");
    const originalInput = "192.168.1.0/25, 192.168.1.128/25";
    await input.fill(originalInput);

    await page.click("#aggregateBtn");

    await page.waitForTimeout(100);

    const currentInput = await input.inputValue();
    expect(currentInput).toBe(originalInput);

    const output = page.locator("#addressOutput");
    await expect(output).toHaveValue("192.168.1.0/24");
  });
});
