/**
 * IPv6 utility tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  CIDRBlock,
  expandIPv6,
  compressIPv6,
  calculateIPv6ReverseDNS,
  detectIPVersion,
  IPVersion,
} from "../app.js";

describe("IPv6-Specific Functionality", () => {
  describe("IPv6 Compression", () => {
    it("should compress leading zeros", () => {
      expect(compressIPv6("2001:0db8:0000:0000:0000:0000:0000:0000")).toBe(
        "2001:db8::",
      );
      expect(compressIPv6("fe80:0000:0000:0000:0202:b3ff:fe1e:8329")).toBe(
        "fe80::202:b3ff:fe1e:8329",
      );
      expect(compressIPv6("2001:0db8:0001:0000:0000:0000:0000:0001")).toBe(
        "2001:db8:1::1",
      );
    });

    it("should handle double colon", () => {
      expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0000")).toBe(
        "::",
      );
      expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0001")).toBe(
        "::1",
      );
      expect(compressIPv6("2001:0000:0000:0000:0000:0000:0000:0001")).toBe(
        "2001::1",
      );
      expect(compressIPv6("2001:0000:0000:0001:0000:0000:0000:0001")).toBe(
        "2001:0:0:1::1",
      );
      expect(compressIPv6("2001:0db8:0000:0000:0001:0000:0000:0001")).toBe(
        "2001:db8::1:0:0:1",
      );
    });

    it("should handle multiple consecutive zero groups", () => {
      expect(compressIPv6("2001:0000:0000:0000:0000:0000:0001:0001")).toBe(
        "2001::1:1",
      );
      expect(compressIPv6("2001:0000:0001:0000:0000:0000:0000:0001")).toBe(
        "2001:0:1::1",
      );
    });

    it("should handle no compression needed", () => {
      expect(compressIPv6("2001:db8:1:2:3:4:5:6")).toBe("2001:db8:1:2:3:4:5:6");
      expect(compressIPv6("fe80:202:b3ff:fe1e:8329:1:2:3")).toBe(
        "fe80:202:b3ff:fe1e:8329:1:2:3",
      );
    });

    it("should handle edge cases", () => {
      expect(compressIPv6("::")).toBe("::");
      expect(compressIPv6("::1")).toBe("::1");
      expect(compressIPv6("2001::")).toBe("2001::");
      expect(compressIPv6("2001:db8::")).toBe("2001:db8::");
    });
  });

  describe("IPv6 Expansion", () => {
    it("should expand compressed notation", () => {
      expect(expandIPv6("2001:db8::")).toBe(
        "2001:0db8:0000:0000:0000:0000:0000:0000",
      );
      expect(expandIPv6("fe80::202:b3ff:fe1e:8329")).toBe(
        "fe80:0000:0000:0000:0202:b3ff:fe1e:8329",
      );
      expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
      expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
    });

    it("should handle single colon (no double colon)", () => {
      expect(expandIPv6("2001:db8:1::1")).toBe(
        "2001:0db8:0001:0000:0000:0000:0000:0001",
      );
      expect(expandIPv6("2001:db8:1:0:0:0:0:1")).toBe(
        "2001:0db8:0001:0000:0000:0000:0000:0001",
      );
    });

    it("should handle already expanded notation", () => {
      expect(expandIPv6("2001:0db8:0000:0000:0000:0000:0000:0000")).toBe(
        "2001:0db8:0000:0000:0000:0000:0000:0000",
      );
      expect(expandIPv6("fe80:0000:0000:0000:0202:b3ff:fe1e:8329")).toBe(
        "fe80:0000:0000:0000:0202:b3ff:fe1e:8329",
      );
    });

    it("should handle leading and trailing compression", () => {
      expect(expandIPv6("2001::")).toBe(
        "2001:0000:0000:0000:0000:0000:0000:0000",
      );
      expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
      expect(expandIPv6("2001:db8::")).toBe(
        "2001:0db8:0000:0000:0000:0000:0000:0000",
      );
    });

    it("should handle edge cases", () => {
      expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
      expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
      expect(expandIPv6("1::")).toBe("0001:0000:0000:0000:0000:0000:0000:0000");
    });
  });

  describe("IPv6 Reverse DNS", () => {
    it("should reverse nibbles correctly", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block)).toBe("0.0.0.0.0.0.0.0.ip6.arpa");

      const block2 = new CIDRBlock("fe80::1", 64, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block2)).toBe(
        "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
      );
    });

    it("should handle prefix boundaries", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block)).toBe("0.0.0.0.0.0.0.0.ip6.arpa");

      const block2 = new CIDRBlock("2001:db8::", 64, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block2)).toBe(
        "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
      );

      const block3 = new CIDRBlock("fe80::1", 64, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block3)).toBe(
        "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
      );
    });

    it("should generate .ip6.arpa domain", () => {
      const block = new CIDRBlock(
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        128,
        IPVersion.IPv6,
      );
      expect(calculateIPv6ReverseDNS(block)).toBe(
        "4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.3.a.5.8.8.b.d.0.1.0.0.2.ip6.arpa",
      );

      const block2 = new CIDRBlock("::1", 128, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block2)).toBe(
        "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
      );

      const block3 = new CIDRBlock("::", 0, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block3)).toBe("ip6.arpa");
    });

    it("should handle edge cases", () => {
      const block = new CIDRBlock("2001:db8::", 0, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block)).toBe("ip6.arpa");

      const block2 = new CIDRBlock("2001:db8::1", 128, IPVersion.IPv6);
      expect(calculateIPv6ReverseDNS(block2)).toBe(
        "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
      );
    });
  });

  describe("IPv6 Validation", () => {
    it("should validate compressed format", () => {
      expect(detectIPVersion("2001:db8::/32")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("fe80::1/128")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("::1/128")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("::/0")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("2001:db8:1::1/64")).toBe(IPVersion.IPv6);
    });

    it("should validate expanded format", () => {
      expect(
        detectIPVersion("2001:0db8:0000:0000:0000:0000:0000:0000/32"),
      ).toBe(IPVersion.IPv6);
      expect(
        detectIPVersion("fe80:0000:0000:0000:0202:b3ff:fe1e:8329/64"),
      ).toBe(IPVersion.IPv6);
      expect(
        detectIPVersion("0000:0000:0000:0000:0000:0000:0000:0001/128"),
      ).toBe(IPVersion.IPv6);
    });

    it("should validate prefix ranges", () => {
      expect(detectIPVersion("2001:db8::/0")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("2001:db8::/32")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("2001:db8::/64")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("2001:db8::/128")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("fe80::1/10")).toBe(IPVersion.IPv6);
    });

    it("should throw error for invalid input", () => {
      expect(() => detectIPVersion("")).toThrow("Invalid CIDR format");
      expect(() => detectIPVersion(null)).toThrow("Invalid CIDR format");
      expect(() => detectIPVersion(undefined)).toThrow("Invalid CIDR format");
      expect(() => detectIPVersion("invalid")).toThrow("Invalid CIDR format");
    });

    it("should distinguish IPv4 from IPv6", () => {
      expect(detectIPVersion("192.168.1.0/24")).toBe(IPVersion.IPv4);
      expect(detectIPVersion("10.0.0.0/8")).toBe(IPVersion.IPv4);
      expect(detectIPVersion("2001:db8::/32")).toBe(IPVersion.IPv6);
      expect(detectIPVersion("fe80::1/64")).toBe(IPVersion.IPv6);
    });
  });
});
