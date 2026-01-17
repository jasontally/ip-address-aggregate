/**
 * Address calculation tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  calculateStartAddress,
  calculateEndAddress,
  CIDRBlock,
  IPVersion,
  ipv4ToNumber,
  ipv6ToNumber,
} from "../app.js";

describe("calculateStartAddress()", () => {
  describe("IPv4 Calculations", () => {
    it("should calculate start address for /24 network", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("192.168.1.0"));
    });

    it("should calculate start address for /32 network", () => {
      const block = new CIDRBlock("192.168.1.1", 32, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("192.168.1.1"));
    });

    it("should calculate start address for /0 network", () => {
      const block = new CIDRBlock("0.0.0.0", 0, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("0.0.0.0"));
    });

    it("should calculate start address for /8 network", () => {
      const block = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("10.0.0.0"));
    });

    it("should calculate start address for /16 network", () => {
      const block = new CIDRBlock("172.16.0.0", 16, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("172.16.0.0"));
    });

    it("should calculate start address for class C network", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("192.168.1.0"));
    });

    it("should calculate start address for class B network", () => {
      const block = new CIDRBlock("172.16.0.0", 16, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("172.16.0.0"));
    });

    it("should calculate start address for class A network", () => {
      const block = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv4ToNumber("10.0.0.0"));
    });
  });

  describe("IPv6 Calculations", () => {
    it("should calculate start address for /64 network", () => {
      const block = new CIDRBlock("2001:db8::", 64, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("2001:db8::"));
    });

    it("should calculate start address for /128 network", () => {
      const block = new CIDRBlock("2001:db8::1", 128, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("2001:db8::1"));
    });

    it("should calculate start address for /0 network", () => {
      const block = new CIDRBlock("::", 0, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("::"));
    });

    it("should calculate start address for /32 network", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("2001:db8::"));
    });

    it("should calculate start address for /48 network", () => {
      const block = new CIDRBlock("2001:db8:1234::", 48, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("2001:db8:1234::"));
    });

    it("should calculate start address for link-local", () => {
      const block = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("fe80::"));
    });

    it("should calculate start address for unique-local", () => {
      const block = new CIDRBlock("fc00::", 7, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      expect(start).toBe(ipv6ToNumber("fc00::"));
    });
  });

  describe("Version Detection", () => {
    it("should use ipv4ToNumber for IPv4 addresses", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const expected = ipv4ToNumber("192.168.1.0");
      expect(start).toBe(expected);
    });

    it("should use ipv6ToNumber for IPv6 addresses", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      const expected = ipv6ToNumber("2001:db8::");
      expect(start).toBe(expected);
    });
  });
});

describe("calculateEndAddress()", () => {
  describe("IPv4 Calculations", () => {
    it("should calculate end address for /24 network", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("192.168.1.255"));
    });

    it("should calculate end address for /32 network (single host)", () => {
      const block = new CIDRBlock("192.168.1.1", 32, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("192.168.1.1"));
    });

    it("should calculate end address for /0 network (entire space)", () => {
      const block = new CIDRBlock("0.0.0.0", 0, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("255.255.255.255"));
    });

    it("should calculate end address for /8 network", () => {
      const block = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("10.255.255.255"));
    });

    it("should calculate end address for /16 network", () => {
      const block = new CIDRBlock("172.16.0.0", 16, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("172.16.255.255"));
    });

    it("should calculate end address for /30 network", () => {
      const block = new CIDRBlock("192.168.1.0", 30, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("192.168.1.3"));
    });

    it("should calculate end address for /31 network (point-to-point)", () => {
      const block = new CIDRBlock("192.168.1.0", 31, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("192.168.1.1"));
    });

    it("should calculate end address for /1 network", () => {
      const block = new CIDRBlock("128.0.0.0", 1, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("255.255.255.255"));
    });

    it("should calculate end address for class C network", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("192.168.1.255"));
    });

    it("should calculate end address for class B network", () => {
      const block = new CIDRBlock("172.16.0.0", 16, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("172.16.255.255"));
    });

    it("should calculate end address for class A network", () => {
      const block = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv4ToNumber("10.255.255.255"));
    });
  });

  describe("IPv6 Calculations", () => {
    it("should calculate end address for /64 network", () => {
      const block = new CIDRBlock("2001:db8::", 64, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("2001:db8::ffff:ffff:ffff:ffff"));
    });

    it("should calculate end address for /128 network (single host)", () => {
      const block = new CIDRBlock("2001:db8::1", 128, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("2001:db8::1"));
    });

    it("should calculate end address for /0 network (entire space)", () => {
      const block = new CIDRBlock("::", 0, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(BigInt("340282366920938463463374607431768211455"));
    });

    it("should calculate end address for /32 network", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff"));
    });

    it("should calculate end address for /48 network", () => {
      const block = new CIDRBlock("2001:db8:1234::", 48, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("2001:db8:1234:ffff:ffff:ffff:ffff:ffff"));
    });

    it("should calculate end address for /127 network (point-to-point)", () => {
      const block = new CIDRBlock("2001:db8::", 127, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("2001:db8::1"));
    });

    it("should calculate end address for link-local", () => {
      const block = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("fe80::ffff:ffff:ffff:ffff"));
    });

    it("should calculate end address for unique-local", () => {
      const block = new CIDRBlock("fc00::", 7, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      expect(end).toBe(ipv6ToNumber("fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"));
    });
  });

  describe("Version Detection", () => {
    it("should use Math.pow for IPv4 host calculation", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const end = calculateEndAddress(block);
      const start = calculateStartAddress(block);
      const numHosts = Math.pow(2, 32 - block.prefix) - 1;
      expect(end).toBe(start + numHosts);
    });

    it("should use BigInt for IPv6 host calculation", () => {
      const block = new CIDRBlock("2001:db8::", 64, IPVersion.IPv6);
      const end = calculateEndAddress(block);
      const start = calculateStartAddress(block);
      const numHosts = BigInt(2) ** BigInt(128 - block.prefix) - BigInt(1);
      expect(end).toBe(start + numHosts);
    });
  });
});

describe("Address Calculation Integration", () => {
  describe("Range Validation", () => {
    it("should ensure end address is always >= start address for IPv4", () => {
      const prefixes = [0, 8, 16, 24, 32];

      for (const prefix of prefixes) {
        const block = new CIDRBlock("192.168.1.0", prefix, IPVersion.IPv4);
        const start = calculateStartAddress(block);
        const end = calculateEndAddress(block);
        expect(end).toBeGreaterThanOrEqual(start);
      }
    });

    it("should ensure end address is always >= start address for IPv6", () => {
      const prefixes = [0, 32, 64, 96, 128];

      for (const prefix of prefixes) {
        const block = new CIDRBlock("2001:db8::", prefix, IPVersion.IPv6);
        const start = calculateStartAddress(block);
        const end = calculateEndAddress(block);
        expect(end).toBeGreaterThanOrEqual(start);
      }
    });

    it("should ensure end address equals start address for /32 IPv4", () => {
      const block = new CIDRBlock("192.168.1.1", 32, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(end).toBe(start);
    });

    it("should ensure end address equals start address for /128 IPv6", () => {
      const block = new CIDRBlock("2001:db8::1", 128, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(end).toBe(start);
    });
  });

  describe("Host Count Calculation", () => {
    it("should calculate correct host count for /24 IPv4", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      const hostCount = end - start + 1;
      expect(hostCount).toBe(256);
    });

    it("should calculate correct host count for /30 IPv4", () => {
      const block = new CIDRBlock("192.168.1.0", 30, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      const hostCount = end - start + 1;
      expect(hostCount).toBe(4);
    });

    it("should calculate correct host count for /64 IPv6", () => {
      const block = new CIDRBlock("2001:db8::", 64, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      const hostCount = end - start + BigInt(1);
      expect(hostCount).toBe(BigInt(2) ** BigInt(64));
    });

    it("should calculate correct host count for /0 IPv6", () => {
      const block = new CIDRBlock("::", 0, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      const hostCount = end - start + BigInt(1);
      expect(hostCount).toBe(BigInt(2) ** BigInt(128));
    });
  });

  describe("CIDRBlock Method Integration", () => {
    it("should match CIDRBlock.toStartAddress() result", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const calculatedStart = calculateStartAddress(block);
      const methodStart = ipv4ToNumber(block.toStartAddress());
      expect(calculatedStart).toBe(methodStart);
    });

    it("should match CIDRBlock.toEndAddress() result for IPv4", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const calculatedEnd = calculateEndAddress(block);
      const methodEnd = ipv4ToNumber(block.toEndAddress());
      expect(calculatedEnd).toBe(methodEnd);
    });

    it("should match CIDRBlock.toEndAddress() result for IPv6", () => {
      const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
      const calculatedEnd = calculateEndAddress(block);
      const methodEnd = ipv6ToNumber(block.toEndAddress());
      expect(calculatedEnd).toBe(methodEnd);
    });
  });

  describe("Boundary Cases", () => {
    it("should handle IPv4 boundary at /0", () => {
      const block = new CIDRBlock("0.0.0.0", 0, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(start).toBe(0);
      expect(end).toBe(4294967295);
    });

    it("should handle IPv4 boundary at /32", () => {
      const block = new CIDRBlock("255.255.255.255", 32, IPVersion.IPv4);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(start).toBe(4294967295);
      expect(end).toBe(4294967295);
    });

    it("should handle IPv6 boundary at /0", () => {
      const block = new CIDRBlock("::", 0, IPVersion.IPv6);
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(start).toBe(BigInt(0));
      expect(end).toBe(BigInt("340282366920938463463374607431768211455"));
    });

    it("should handle IPv6 boundary at /128", () => {
      const block = new CIDRBlock(
        "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
        128,
        IPVersion.IPv6,
      );
      const start = calculateStartAddress(block);
      const end = calculateEndAddress(block);
      expect(start).toBe(BigInt("340282366920938463463374607431768211455"));
      expect(end).toBe(BigInt("340282366920938463463374607431768211455"));
    });
  });
});
