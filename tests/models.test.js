/**
 * CIDRBlock model tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  CIDRBlock,
  IPVersion,
  expandIPv6,
  compressIPv6,
  calculateIPv6ReverseDNS,
  detectIPVersion,
} from "../app.js";

describe("Version Detection", () => {
  it("should detect IPv4 addresses", () => {
    expect(detectIPVersion("192.168.1.0/24")).toBe(IPVersion.IPv4);
    expect(detectIPVersion("10.0.0.0/8")).toBe(IPVersion.IPv4);
    expect(detectIPVersion("172.16.0.0/12")).toBe(IPVersion.IPv4);
    expect(detectIPVersion("0.0.0.0/0")).toBe(IPVersion.IPv4);
  });

  it("should detect IPv6 addresses", () => {
    expect(detectIPVersion("2001:db8::/32")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("::1/128")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("::/0")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("fe80::1/64")).toBe(IPVersion.IPv6);
  });

  it("should throw error for invalid input", () => {
    expect(() => detectIPVersion("")).toThrow("Invalid CIDR format");
    expect(() => detectIPVersion(null)).toThrow("Invalid CIDR format");
    expect(() => detectIPVersion(undefined)).toThrow("Invalid CIDR format");
    expect(() => detectIPVersion("invalid")).toThrow("Invalid CIDR format");
  });
});

describe("CIDRBlock Construction", () => {
  it("should create IPv4 CIDRBlock instances", () => {
    const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(block.address).toBe("192.168.1.0");
    expect(block.prefix).toBe(24);
    expect(block.version).toBe(IPVersion.IPv4);
  });

  it("should create IPv6 CIDRBlock instances", () => {
    const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(block.address).toBe("2001:0db8:0000:0000:0000:0000:0000:0000");
    expect(block.prefix).toBe(32);
    expect(block.version).toBe(IPVersion.IPv6);
  });

  it("should create from CIDR string", () => {
    const ipv4Block = CIDRBlock.fromCIDRString("192.168.1.0/24");
    expect(ipv4Block.address).toBe("192.168.1.0");
    expect(ipv4Block.prefix).toBe(24);
    expect(ipv4Block.version).toBe(IPVersion.IPv4);

    const ipv6Block = CIDRBlock.fromCIDRString("2001:db8::/32");
    expect(ipv6Block.version).toBe(IPVersion.IPv6);
    expect(ipv6Block.prefix).toBe(32);
  });

  it("should create from bytes", () => {
    const ipv4Bytes = [192, 168, 1, 0];
    const ipv4Block = CIDRBlock.fromBytes(ipv4Bytes, 24, IPVersion.IPv4);
    expect(ipv4Block.address).toBe("192.168.1.0");
    expect(ipv4Block.prefix).toBe(24);
    expect(ipv4Block.version).toBe(IPVersion.IPv4);

    const ipv6Bytes = new Uint8Array([
      0x20, 0x01, 0x0d, 0xb8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const ipv6Block = CIDRBlock.fromBytes(ipv6Bytes, 32, IPVersion.IPv6);
    expect(ipv6Block.prefix).toBe(32);
    expect(ipv6Block.version).toBe(IPVersion.IPv6);
  });
});

describe("Core Methods", () => {
  it("should convert to CIDR string", () => {
    const ipv4Block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(ipv4Block.toCIDRString()).toBe("192.168.1.0/24");

    const ipv6Block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(ipv6Block.toCIDRString()).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0000/32",
    );
  });

  it("should calculate start address", () => {
    const ipv4Block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(ipv4Block.toStartAddress()).toBe("192.168.1.0");

    const ipv6Block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(ipv6Block.toStartAddress()).toBe("2001:db8::");
  });

  it("should calculate end address", () => {
    const ipv4Block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(ipv4Block.toEndAddress()).toBe("192.168.1.255");

    const ipv6Block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(ipv6Block.toEndAddress()).toBe(
      "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff",
    );
  });

  it("should get address range", () => {
    const ipv4Block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    const range = ipv4Block.getRange();
    expect(range[0]).toBe("192.168.1.0");
    expect(range[1]).toBe("192.168.1.255");

    const ipv6Block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    const ipv6Range = ipv6Block.getRange();
    expect(ipv6Range[0]).toBe("2001:db8::");
    expect(ipv6Range[1]).toBe("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff");
  });
});

describe("IPv4 Methods", () => {
  it("should convert to netmask", () => {
    const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(block.toNetmask()).toBe("255.255.255.0");

    const block2 = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
    expect(block2.toNetmask()).toBe("255.0.0.0");

    const block3 = new CIDRBlock("172.16.0.0", 12, IPVersion.IPv4);
    expect(block3.toNetmask()).toBe("255.240.0.0");
  });

  it("should convert to wildcard", () => {
    const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
    expect(block.toWildcard()).toBe("0.0.0.255");

    const block2 = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
    expect(block2.toWildcard()).toBe("0.255.255.255");

    const block3 = new CIDRBlock("172.16.0.0", 12, IPVersion.IPv4);
    expect(block3.toWildcard()).toBe("0.15.255.255");
  });

  it("should throw error for IPv6 netmask call", () => {
    const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(() => block.toNetmask()).toThrow(
      "Netmask format is only available for IPv4 addresses",
    );
  });

  it("should throw error for IPv6 wildcard call", () => {
    const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(() => block.toWildcard()).toThrow(
      "Wildcard mask format is only available for IPv4 addresses",
    );
  });
});

describe("IPv6 Methods", () => {
  it("should compress IPv6 notation", () => {
    expect(compressIPv6("2001:0db8:0000:0000:0000:0000:0000:0000")).toBe(
      "2001:db8::",
    );
    expect(compressIPv6("fe80:0000:0000:0000:0202:b3ff:fe1e:8329")).toBe(
      "fe80::202:b3ff:fe1e:8329",
    );
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("::1");
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("::");
  });

  it("should expand IPv6 notation", () => {
    expect(expandIPv6("2001:db8::")).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0000",
    );
    expect(expandIPv6("fe80::202:b3ff:fe1e:8329")).toBe(
      "fe80:0000:0000:0000:0202:b3ff:fe1e:8329",
    );
    expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
    expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
  });

  it("should generate IPv6 reverse DNS", () => {
    const block = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block)).toBe("0.0.0.0.0.0.0.0.ip6.arpa");

    const block2 = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block2)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const block3 = new CIDRBlock(
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      128,
      IPVersion.IPv6,
    );
    expect(calculateIPv6ReverseDNS(block3)).toBe(
      "4.3.3.7.0.7.3.0.e.2.a.8.0.0.0.0.0.0.0.0.3.a.5.8.8.b.d.0.1.0.0.2.ip6.arpa",
    );
  });

  it("should handle edge cases for IPv6 reverse DNS", () => {
    const block = new CIDRBlock("::1", 128, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block)).toBe(
      "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const block2 = new CIDRBlock("::", 0, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block2)).toBe("ip6.arpa");
  });

  it("should generate IPv6 reverse DNS for various prefix lengths", () => {
    const block8 = new CIDRBlock("2001:db8::", 8, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block8)).toBe("0.0.ip6.arpa");

    const block16 = new CIDRBlock("2001:db8::", 16, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block16)).toBe("0.0.0.0.ip6.arpa");

    const block24 = new CIDRBlock("2001:db8::", 24, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block24)).toBe("0.0.0.0.0.0.ip6.arpa");

    const block32 = new CIDRBlock("2001:db8::", 32, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block32)).toBe("0.0.0.0.0.0.0.0.ip6.arpa");

    const block40 = new CIDRBlock("2001:db8:1234::", 40, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block40)).toBe(
      "0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const block48 = new CIDRBlock("2001:db8:1234:5678::", 48, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block48)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const block56 = new CIDRBlock(
      "2001:db8:1234:5678:abcd::",
      56,
      IPVersion.IPv6,
    );
    expect(calculateIPv6ReverseDNS(block56)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.d.c.ip6.arpa",
    );

    const block64 = new CIDRBlock(
      "2001:db8:1234:5678:abcd:ef12::",
      64,
      IPVersion.IPv6,
    );
    expect(calculateIPv6ReverseDNS(block64)).toBe(
      "0.0.0.0.0.0.0.0.2.1.f.e.d.c.b.a.ip6.arpa",
    );

    const block72 = new CIDRBlock(
      "2001:db8:1234:5678:abcd:ef12:3456::",
      72,
      IPVersion.IPv6,
    );
    expect(calculateIPv6ReverseDNS(block72)).toBe(
      "0.0.0.0.6.5.4.3.2.1.f.e.d.c.b.a.8.7.ip6.arpa",
    );

    const block80 = new CIDRBlock(
      "2001:db8:1234:5678:abcd:ef12:3456:7890::",
      80,
      IPVersion.IPv6,
    );
    expect(calculateIPv6ReverseDNS(block80)).toBe(
      "0.9.8.7.6.5.4.3.2.1.f.e.d.c.b.a.8.7.6.5.ip6.arpa",
    );
  });

  it("should use network address for IPv6 reverse DNS, not specific address", () => {
    const block1 = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block1)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const block2 = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(block2)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );
  });

  it("should handle different IPv6 address types", () => {
    const linkLocal = new CIDRBlock("fe80::", 64, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(linkLocal)).toBe(
      "0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa",
    );

    const uniqueLocal = new CIDRBlock("fc00::", 7, IPVersion.IPv6);
    expect(calculateIPv6ReverseDNS(uniqueLocal)).toBe("0.0.ip6.arpa");
  });
});

describe("CIDRBlock Static Factory Methods", () => {
  it("should parse CIDR strings correctly", () => {
    const ipv4Block = CIDRBlock.fromCIDRString("192.168.1.0/24");
    expect(ipv4Block.address).toBe("192.168.1.0");
    expect(ipv4Block.prefix).toBe(24);
    expect(ipv4Block.version).toBe(IPVersion.IPv4);
  });
});
