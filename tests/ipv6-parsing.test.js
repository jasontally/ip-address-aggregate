/**
 * IPv6 parsing edge case tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { parseIPv6, ipv6ToNumber } from "../app.js";

describe("IPv6 Parsing Edge Cases", () => {
  describe("Valid Compressed Formats", () => {
    it("should parse :: (all zeros)", () => {
      const bytes = parseIPv6("::");
      expect(bytes).not.toBeNull();
      expect(bytes).toHaveLength(16);
      expect(Array.from(bytes).every((b) => b === 0)).toBe(true);
    });

    it("should parse ::1 (loopback)", () => {
      const bytes = parseIPv6("::1");
      expect(bytes).not.toBeNull();
      expect(bytes[15]).toBe(1);
    });

    it("should parse 2001:db8:: (documentation prefix)", () => {
      const bytes = parseIPv6("2001:db8::");
      expect(bytes).not.toBeNull();
      expect(bytes[0]).toBe(0x20);
      expect(bytes[1]).toBe(0x01);
      expect(bytes[2]).toBe(0x0d);
      expect(bytes[3]).toBe(0xb8);
    });

    it("should parse fe80::1 (link-local)", () => {
      const bytes = parseIPv6("fe80::1");
      expect(bytes).not.toBeNull();
      expect(bytes[0]).toBe(0xfe);
      expect(bytes[1]).toBe(0x80);
    });

    it("should parse fc00::1 (unique-local)", () => {
      const bytes = parseIPv6("fc00::1");
      expect(bytes).not.toBeNull();
      expect(bytes[0]).toBe(0xfc);
    });
  });

  describe("Uncompressed Formats", () => {
    it("should parse exactly 8 groups without ::", () => {
      const bytes = parseIPv6("2001:0db8:0000:0000:0000:0000:0000:0000");
      expect(bytes).not.toBeNull();
      expect(bytes).toHaveLength(16);
    });

    it("should parse with mixed case", () => {
      const bytes1 = parseIPv6("2001:0DB8::1");
      const bytes2 = parseIPv6("2001:0db8::1");
      expect(bytes1).toEqual(bytes2);
    });

    it("should parse with leading zeros in hextets", () => {
      const bytes = parseIPv6("2001:0db8:0000:0000:0000:0000:0000:0001");
      expect(bytes).not.toBeNull();
    });
  });

  describe("Boundary Values", () => {
    it("should parse minimum address (::)", () => {
      const bytes = parseIPv6("::");
      expect(bytes).not.toBeNull();
      expect(ipv6ToNumber("::")).toBe(BigInt(0));
    });

    it("should parse maximum address (ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff)", () => {
      const bytes = parseIPv6("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
      expect(bytes).not.toBeNull();
      expect(ipv6ToNumber("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")).toBe(
        BigInt("340282366920938463463374607431768211455"),
      );
    });

    it("should parse address with all ffff hextets", () => {
      const bytes = parseIPv6("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
      expect(bytes).not.toBeNull();
      expect(Array.from(bytes).every((b) => b === 0xff)).toBe(true);
    });

    it("should parse address with 0000 hextets", () => {
      const bytes = parseIPv6("0000:0000:0000:0000:0000:0000:0000:0000");
      expect(bytes).not.toBeNull();
      expect(Array.from(bytes).every((b) => b === 0)).toBe(true);
    });
  });

  describe("Compression at Different Positions", () => {
    it("should parse :: at start", () => {
      const bytes = parseIPv6("::1");
      expect(bytes).not.toBeNull();
      expect(bytes[15]).toBe(1);
    });

    it("should parse :: at end", () => {
      const bytes = parseIPv6("2001:db8::");
      expect(bytes).not.toBeNull();
      expect(bytes[0]).toBe(0x20);
      expect(bytes[1]).toBe(0x01);
    });

    it("should parse :: in middle", () => {
      const bytes = parseIPv6("2001::1");
      expect(bytes).not.toBeNull();
      expect(bytes[0]).toBe(0x20);
      expect(bytes[1]).toBe(0x01);
      expect(bytes[15]).toBe(1);
    });
  });

  describe("Byte Array Validation", () => {
    it("should return Uint8Array of length 16", () => {
      const bytes = parseIPv6("2001:db8::1");
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes).toHaveLength(16);
    });

    it("should have correct byte order for hextets", () => {
      const bytes = parseIPv6("2001:db8::1");
      expect(bytes[0]).toBe(0x20);
      expect(bytes[1]).toBe(0x01);
      expect(bytes[2]).toBe(0x0d);
      expect(bytes[3]).toBe(0xb8);
    });

    it("should have correct byte values for last hextet", () => {
      const bytes = parseIPv6("::1");
      expect(bytes[14]).toBe(0);
      expect(bytes[15]).toBe(1);
    });

    it("should handle big-endian hextet to byte conversion", () => {
      const bytes = parseIPv6("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
      expect(bytes[0]).toBe(0xff);
      expect(bytes[1]).toBe(0xff);
      expect(bytes[2]).toBe(0xff);
      expect(bytes[3]).toBe(0xff);
    });
  });
});
