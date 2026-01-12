/**
 * Bare IP address handling tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  isBareIPv4,
  isBareIPv6,
  normalizeToCIDR,
  parseInput,
} from "../app.js";

describe("Bare IPv4 Detection", () => {
  it("should detect bare IPv4 addresses", () => {
    expect(isBareIPv4("192.168.1.0")).toBe(true);
    expect(isBareIPv4("10.0.0.0")).toBe(true);
    expect(isBareIPv4("172.16.0.0")).toBe(true);
    expect(isBareIPv4("255.255.255.255")).toBe(true);
    expect(isBareIPv4("0.0.0.0")).toBe(true);
  });

  it("should reject IPv4 CIDR notation", () => {
    expect(isBareIPv4("192.168.1.0/24")).toBe(false);
    expect(isBareIPv4("10.0.0.0/8")).toBe(false);
    expect(isBareIPv4("172.16.0.0/12")).toBe(false);
  });

  it("should reject invalid IPv4 addresses", () => {
    expect(isBareIPv4("256.1.1.1")).toBe(false);
    expect(isBareIPv4("192.168.1")).toBe(false);
    expect(isBareIPv4("192.168.1.1.1")).toBe(false);
    expect(isBareIPv4("192.168.1.256")).toBe(false);
  });

  it("should reject IPv6 addresses", () => {
    expect(isBareIPv4("2001:db8::")).toBe(false);
    expect(isBareIPv4("::1")).toBe(false);
  });
});

describe("Bare IPv6 Detection", () => {
  it("should detect bare IPv6 addresses", () => {
    expect(isBareIPv6("2001:db8::")).toBe(true);
    expect(isBareIPv6("2001:db8::1")).toBe(true);
    expect(isBareIPv6("::1")).toBe(true);
    expect(isBareIPv6("::")).toBe(true);
  });

  it("should detect compressed IPv6", () => {
    expect(isBareIPv6("2001:db8::")).toBe(true);
    expect(isBareIPv6("::1")).toBe(true);
    expect(isBareIPv6("2001:db8:1::2")).toBe(true);
  });

  it("should reject IPv6 CIDR notation", () => {
    expect(isBareIPv6("2001:db8::/32")).toBe(false);
    expect(isBareIPv6("::1/128")).toBe(false);
  });

  it("should reject IPv4 addresses", () => {
    expect(isBareIPv6("192.168.1.0")).toBe(false);
    expect(isBareIPv6("10.0.0.0")).toBe(false);
  });
});

describe("CIDR Normalization", () => {
  it("should keep CIDR notation unchanged", () => {
    expect(normalizeToCIDR("192.168.1.0/24")).toBe("192.168.1.0/24");
    expect(normalizeToCIDR("10.0.0.0/8")).toBe("10.0.0.0/8");
    expect(normalizeToCIDR("2001:db8::/32")).toBe("2001:db8::/32");
    expect(normalizeToCIDR("::1/128")).toBe("::1/128");
  });

  it("should add /32 to bare IPv4 addresses", () => {
    expect(normalizeToCIDR("192.168.1.0")).toBe("192.168.1.0/32");
    expect(normalizeToCIDR("10.0.0.0")).toBe("10.0.0.0/32");
    expect(normalizeToCIDR("172.16.0.0")).toBe("172.16.0.0/32");
    expect(normalizeToCIDR("10.0.0.1")).toBe("10.0.0.1/32");
  });

  it("should add /128 to bare IPv6 addresses", () => {
    expect(normalizeToCIDR("2001:db8::")).toBe("2001:db8::/128");
    expect(normalizeToCIDR("2001:db8::1")).toBe("2001:db8::1/128");
    expect(normalizeToCIDR("::1")).toBe("::1/128");
    expect(normalizeToCIDR("::")).toBe("::/128");
  });
});

describe("Input Parsing with Bare IPs", () => {
  it("should convert bare IPv4 addresses to CIDR", () => {
    const input = "192.168.1.0\n10.0.0.0\n172.16.0.0";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/32",
      "10.0.0.0/32",
      "172.16.0.0/32",
    ]);
  });

  it("should convert bare IPv6 addresses to CIDR", () => {
    const input = "2001:db8::\n2001:db8::1\n::1";
    const result = parseInput(input);
    expect(result).toEqual([
      "2001:db8::/128",
      "2001:db8::1/128",
      "::1/128",
    ]);
  });

  it("should handle mixed bare IPs and CIDR notation", () => {
    const input = "192.168.1.0\n192.168.2.0/24\n10.0.0.0\n2001:db8::/32";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/32",
      "192.168.2.0/24",
      "10.0.0.0/32",
      "2001:db8::/32",
    ]);
  });

  it("should handle comma-separated bare IPs", () => {
    const input = "192.168.1.0,10.0.0.0,172.16.0.0";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/32",
      "10.0.0.0/32",
      "172.16.0.0/32",
    ]);
  });

  it("should handle example from user", () => {
    const input = "10.0.0.0\n10.0.0.1\n10.0.0.2\n10.0.0.3\n10.0.0.4";
    const result = parseInput(input);
    expect(result).toEqual([
      "10.0.0.0/32",
      "10.0.0.1/32",
      "10.0.0.2/32",
      "10.0.0.3/32",
      "10.0.0.4/32",
    ]);
  });

  it("should handle whitespace with bare IPs", () => {
    const input = "  192.168.1.0  \n  10.0.0.0  ";
    const result = parseInput(input);
    expect(result).toEqual(["192.168.1.0/32", "10.0.0.0/32"]);
  });
});
