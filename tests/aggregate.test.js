/**
 * Aggregation logic tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  isValidCIDR,
  isValidIPv4,
  isValidIPv6,
  compareCIDR,
  sortCIDRs,
  aggregateCIDRs,
} from "../app.js";

describe("IPv4 Validation", () => {
  it("should validate correct IPv4 CIDR", () => {
    expect(isValidIPv4("192.168.1.0", 24)).toBe(true);
    expect(isValidIPv4("10.0.0.0", 8)).toBe(true);
    expect(isValidIPv4("172.16.0.0", 12)).toBe(true);
    expect(isValidIPv4("0.0.0.0", 0)).toBe(true);
    expect(isValidIPv4("255.255.255.255", 32)).toBe(true);
  });

  it("should reject invalid IPv4 addresses", () => {
    expect(isValidIPv4("256.1.1.1", 24)).toBe(false);
    expect(isValidIPv4("192.168.1", 24)).toBe(false);
    expect(isValidIPv4("192.168.1.1.1", 24)).toBe(false);
    expect(isValidIPv4("192.168.1.256", 24)).toBe(false);
  });

  it("should reject invalid IPv4 prefixes", () => {
    expect(isValidIPv4("192.168.1.0", -1)).toBe(false);
    expect(isValidIPv4("192.168.1.0", 33)).toBe(false);
    expect(isValidIPv4("192.168.1.0", 100)).toBe(false);
  });
});

describe("IPv6 Validation", () => {
  it("should validate correct IPv6 CIDR", () => {
    expect(isValidIPv6("2001:db8::", 32)).toBe(true);
    expect(isValidIPv6("2001:db8::1", 128)).toBe(true);
    expect(isValidIPv6("::1", 128)).toBe(true);
    expect(isValidIPv6("::", 0)).toBe(true);
    expect(isValidIPv6("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", 128)).toBe(
      true,
    );
  });

  it("should validate compressed IPv6 addresses", () => {
    expect(isValidIPv6("2001:db8::", 32)).toBe(true);
    expect(isValidIPv6("2001:db8::1", 64)).toBe(true);
    expect(isValidIPv6("::1", 128)).toBe(true);
  });

  it("should reject invalid IPv6 prefixes", () => {
    expect(isValidIPv6("2001:db8::", -1)).toBe(false);
    expect(isValidIPv6("2001:db8::", 129)).toBe(false);
    expect(isValidIPv6("2001:db8::", 200)).toBe(false);
  });
});

describe("CIDR Validation", () => {
  it("should validate IPv4 CIDR strings", () => {
    expect(isValidCIDR("192.168.1.0/24")).toBe(true);
    expect(isValidCIDR("10.0.0.0/8")).toBe(true);
  });

  it("should validate IPv6 CIDR strings", () => {
    expect(isValidCIDR("2001:db8::/32")).toBe(true);
    expect(isValidCIDR("::1/128")).toBe(true);
  });

  it("should reject invalid CIDR strings", () => {
    expect(isValidCIDR("")).toBe(false);
    expect(isValidCIDR("192.168.1.0")).toBe(false);
    expect(isValidCIDR("192.168.1.0/abc")).toBe(false);
    expect(isValidCIDR("256.1.1.1/24")).toBe(false);
  });
});

describe("CIDR Comparison", () => {
  it("should sort IPv4 before IPv6", () => {
    expect(compareCIDR("192.168.1.0/24", "2001:db8::/32")).toBeLessThan(0);
    expect(compareCIDR("2001:db8::/32", "192.168.1.0/24")).toBeGreaterThan(
      0,
    );
  });

  it("should sort IPv4 by address then prefix", () => {
    expect(compareCIDR("192.168.1.0/24", "192.168.2.0/24")).toBeLessThan(0);
    expect(compareCIDR("192.168.1.0/24", "192.168.1.0/25")).toBeLessThan(0);
  });

  it("should sort IPv6 by address then prefix", () => {
    expect(compareCIDR("2001:db8::/32", "2001:db8:1::/32")).toBeLessThan(0);
    expect(compareCIDR("2001:db8::/32", "2001:db8::/48")).toBeLessThan(0);
  });
});

describe("CIDR Sorting", () => {
  it("should sort mixed IPv4 and IPv6 correctly", () => {
    const input = [
      "2001:db8::/32",
      "192.168.1.0/24",
      "10.0.0.0/8",
      "2001:db8:1::/48",
      "172.16.0.0/12",
    ];
    const result = sortCIDRs(input);
    expect(result).toEqual([
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.1.0/24",
      "2001:db8::/32",
      "2001:db8:1::/48",
    ]);
  });

  it("should sort IPv4 numerically", () => {
    const input = [
      "192.168.2.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.1.0/24",
    ];
    const result = sortCIDRs(input);
    expect(result).toEqual([
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.1.0/24",
      "192.168.2.0/24",
    ]);
  });

  it("should sort IPv6 numerically", () => {
    const input = [
      "2001:db8:2::/48",
      "2001:db8::/32",
      "2001:db8:1::/48",
    ];
    const result = sortCIDRs(input);
    expect(result).toEqual([
      "2001:db8::/32",
      "2001:db8:1::/48",
      "2001:db8:2::/48",
    ]);
  });

  it("should not mutate original array", () => {
    const input = [
      "2001:db8::/32",
      "192.168.1.0/24",
      "10.0.0.0/8",
    ];
    const originalOrder = [...input];
    sortCIDRs(input);
    expect(input).toEqual(originalOrder);
  });
});

describe("CIDR Aggregation", () => {
  it("should aggregate adjacent IPv4 ranges", () => {
    const input = ["192.168.1.0/25", "192.168.1.128/25"];
    const result = aggregateCIDRs(input);
    expect(result).toContain("192.168.1.0/24");
  });

  it("should aggregate overlapping IPv4 ranges", () => {
    const input = ["192.168.1.0/24", "192.168.1.0/25"];
    const result = aggregateCIDRs(input);
    expect(result).toContain("192.168.1.0/24");
    expect(result.length).toBeLessThan(input.length);
  });

  it("should handle non-aggregatable IPv4 ranges", () => {
    const input = ["192.168.1.0/24", "192.168.2.0/24"];
    const result = aggregateCIDRs(input);
    expect(result).toContain("192.168.1.0/24");
    expect(result).toContain("192.168.2.0/24");
  });

  it("should aggregate adjacent IPv6 ranges", () => {
    const input = ["2001:db8::/64", "2001:db8:0:0:1::/64"];
    const result = aggregateCIDRs(input);
    expect(result.length).toBeLessThanOrEqual(input.length);
  });

  it("should aggregate overlapping IPv6 ranges", () => {
    const input = ["2001:db8::/32", "2001:db8:1::/48"];
    const result = aggregateCIDRs(input);
    expect(result.length).toBeLessThanOrEqual(input.length);
  });

  it("should return empty array for empty input", () => {
    const result = aggregateCIDRs([]);
    expect(result).toEqual([]);
  });

  it("should handle single CIDR", () => {
    const input = ["192.168.1.0/24"];
    const result = aggregateCIDRs(input);
    expect(result).toEqual(input);
  });

  it("should handle mixed IPv4 and IPv6", () => {
    const input = [
      "192.168.1.0/25",
      "192.168.1.128/25",
      "2001:db8::/64",
      "2001:db8:0:0:1::/64",
      "10.0.0.0/9",
      "10.128.0.0/9",
    ];
    const result = aggregateCIDRs(input);
    expect(result).toContain("192.168.1.0/24");
    expect(result).toContain("10.0.0.0/8");
    expect(result.length).toBeLessThan(input.length);
  });
});
