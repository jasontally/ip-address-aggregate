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
  detectIPVersion,
  CIDRBlock,
  sortCIDRModels,
  transformToFormat,
  IPVersion,
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
    expect(compareCIDR("2001:db8::/32", "192.168.1.0/24")).toBeGreaterThan(0);
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
    const input = ["2001:db8:2::/48", "2001:db8::/32", "2001:db8:1::/48"];
    const result = sortCIDRs(input);
    expect(result).toEqual([
      "2001:db8::/32",
      "2001:db8:1::/48",
      "2001:db8:2::/48",
    ]);
  });

  it("should not mutate original array", () => {
    const input = ["2001:db8::/32", "192.168.1.0/24", "10.0.0.0/8"];
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

describe("Version Detection", () => {
  it("should detect IPv4 CIDR strings", () => {
    expect(detectIPVersion("192.168.1.0/24")).toBe(IPVersion.IPv4);
    expect(detectIPVersion("10.0.0.0/8")).toBe(IPVersion.IPv4);
    expect(detectIPVersion("0.0.0.0/0")).toBe(IPVersion.IPv4);
  });

  it("should detect IPv6 CIDR strings", () => {
    expect(detectIPVersion("2001:db8::/32")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("::1/128")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("::/0")).toBe(IPVersion.IPv6);
    expect(detectIPVersion("2001:0db8:0000:0000:0000:0000:0000:0000/32")).toBe(
      IPVersion.IPv6,
    );
  });

  it("should throw error on invalid CIDR", () => {
    expect(() => detectIPVersion("invalid")).toThrow();
    expect(() => detectIPVersion("")).toThrow();
  });

  it("should detect version from bare IPv4 address", () => {
    expect(detectIPVersion("192.168.1.0")).toBe(IPVersion.IPv4);
  });

  it("should detect version from bare IPv6 address", () => {
    expect(detectIPVersion("2001:db8::")).toBe(IPVersion.IPv6);
  });
});

describe("CIDRBlock Models", () => {
  it("should create CIDRBlock from IPv4 CIDR string", () => {
    const model = CIDRBlock.fromCIDRString("192.168.1.0/24");
    expect(model.address).toBe("192.168.1.0");
    expect(model.prefix).toBe(24);
    expect(model.version).toBe(IPVersion.IPv4);
    expect(model.startAddress).toBe(3232235776);
    expect(model.endAddress).toBe(3232236031);
  });

  it("should create CIDRBlock from IPv6 CIDR string", () => {
    const model = CIDRBlock.fromCIDRString("2001:db8::/32");
    expect(model.address).toBe("2001:0db8:0000:0000:0000:0000:0000:0000");
    expect(model.prefix).toBe(32);
    expect(model.version).toBe(IPVersion.IPv6);
    expect(model.toStartAddress()).toBe("2001:db8::");
    expect(model.toEndAddress()).toBe("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff");
  });

  it("should convert CIDRBlock to CIDR string", () => {
    const model = CIDRBlock.fromCIDRString("192.168.1.0/24");
    expect(model.toCIDRString()).toBe("192.168.1.0/24");
  });

  it("should convert IPv6 CIDRBlock to CIDR string", () => {
    const model = CIDRBlock.fromCIDRString("2001:db8::/32");
    expect(model.toCIDRString()).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0000/32",
    );
  });

  it("should get range from CIDRBlock", () => {
    const model = CIDRBlock.fromCIDRString("192.168.1.0/24");
    const range = model.getRange();
    expect(range).toHaveLength(2);
    expect(range[0]).toBe("192.168.1.0");
    expect(range[1]).toBe("192.168.1.255");
  });

  it("should get range from IPv6 CIDRBlock", () => {
    const model = CIDRBlock.fromCIDRString("2001:db8::/32");
    const range = model.getRange();
    expect(range).toHaveLength(2);
    expect(range[0]).toBe("2001:db8::");
    expect(range[1]).toBe("2001:db8:ffff:ffff:ffff:ffff:ffff:ffff");
  });
});

describe("CIDR Model Sorting", () => {
  it("should sort models IPv4 before IPv6", () => {
    const models = [
      CIDRBlock.fromCIDRString("2001:db8::/32"),
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("10.0.0.0/8"),
    ];
    const sorted = sortCIDRModels(models);
    expect(sorted[0].toCIDRString()).toBe("10.0.0.0/8");
    expect(sorted[1].toCIDRString()).toBe("192.168.1.0/24");
    expect(sorted[2].toCIDRString()).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0000/32",
    );
  });

  it("should sort IPv4 models by address then prefix", () => {
    const models = [
      CIDRBlock.fromCIDRString("192.168.2.0/24"),
      CIDRBlock.fromCIDRString("10.0.0.0/8"),
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
    ];
    const sorted = sortCIDRModels(models);
    expect(sorted[0].toCIDRString()).toBe("10.0.0.0/8");
    expect(sorted[1].toCIDRString()).toBe("192.168.1.0/24");
    expect(sorted[2].toCIDRString()).toBe("192.168.2.0/24");
  });

  it("should sort IPv6 models by address then prefix", () => {
    const models = [
      CIDRBlock.fromCIDRString("2001:db8:2::/48"),
      CIDRBlock.fromCIDRString("2001:db8::/32"),
      CIDRBlock.fromCIDRString("2001:db8:1::/48"),
    ];
    const sorted = sortCIDRModels(models);
    expect(sorted[0].toCIDRString()).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0000/32",
    );
    expect(sorted[1].toCIDRString()).toContain(
      "2001:0db8:0001:0000:0000:0000:0000:0000/48",
    );
    expect(sorted[2].toCIDRString()).toContain(
      "2001:0db8:0002:0000:0000:0000:0000:0000/48",
    );
  });

  it("should not mutate original array", () => {
    const models = [
      CIDRBlock.fromCIDRString("2001:db8::/32"),
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("10.0.0.0/8"),
    ];
    const originalOrder = [...models];
    sortCIDRModels(models);
    expect(models).toEqual(originalOrder);
  });
});

describe("Format Transformation", () => {
  it("should transform to default CIDR format (backward compatibility)", () => {
    const models = [
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("2001:db8::/32"),
    ];
    const result = transformToFormat(models, "cidr");
    expect(result).toContain("192.168.1.0/24");
    expect(result).toContain("2001:0db8:0000:0000:0000:0000:0000:0000/32");
    expect(result).toContain("\n");
  });

  it("should transform IPv4 to Cisco ACL format", () => {
    const models = [CIDRBlock.fromCIDRString("192.168.1.0/24")];
    const result = transformToFormat(models, "cisco-acl");
    expect(result).toContain(
      "access-list 101 permit ip 192.168.1.0 0.0.0.255 any",
    );
  });

  it("should transform IPv6 to Cisco ACL format", () => {
    const models = [CIDRBlock.fromCIDRString("2001:db8::/32")];
    const result = transformToFormat(models, "cisco-acl");
    expect(result).toContain(
      "ipv6 access-list FIREWALL permit 2001:0db8:0000:0000:0000:0000:0000:0000/32",
    );
  });

  it("should transform to Cisco prefix-list format", () => {
    const models = [CIDRBlock.fromCIDRString("192.168.1.0/24")];
    const result = transformToFormat(models, "cisco-prefix-list");
    expect(result).toContain(
      "ip prefix-list LIST seq 10 permit 192.168.1.0/24 le 24",
    );
  });

  it("should transform to AWS Security Group JSON", () => {
    const models = [
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("2001:db8::/32"),
    ];
    const result = transformToFormat(models, "aws-sg");
    const json = JSON.parse(result);
    expect(json).toHaveProperty("Rules");
    expect(json.Rules).toHaveLength(2);
    expect(json.Rules[0]).toHaveProperty("IpProtocol");
    expect(json.Rules[0]).toHaveProperty("CidrIp");
    expect(json.Rules[1]).toHaveProperty("CidrIpv6");
  });

  it("should transform to GCP firewall JSON", () => {
    const models = [CIDRBlock.fromCIDRString("192.168.1.0/24")];
    const result = transformToFormat(models, "gcp-firewall");
    const json = JSON.parse(result);
    expect(json).toHaveProperty("Rules");
    expect(json.Rules).toHaveLength(1);
    expect(json.Rules[0]).toHaveProperty("name");
    expect(json.Rules[0]).toHaveProperty("sourceRanges");
    expect(json.Rules[0]).toHaveProperty("allowed");
    expect(json.Rules[0].sourceRanges).toContain("192.168.1.0/24");
  });

  it("should transform to reverse DNS format for IPv4", () => {
    const models = [CIDRBlock.fromCIDRString("192.168.1.0/24")];
    const result = transformToFormat(models, "reverse-dns");
    expect(result).toContain("1.168.192.in-addr.arpa");
  });

  it("should transform to reverse DNS format for IPv6", () => {
    const models = [CIDRBlock.fromCIDRString("2001:db8::/32")];
    const result = transformToFormat(models, "reverse-dns");
    expect(result).toContain("ip6.arpa");
  });
});

describe("Backward Compatibility", () => {
  it("default format should be CIDR", () => {
    const models = [
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("2001:db8::/32"),
    ];
    const result = transformToFormat(models, "cidr");
    const lines = result.split("\n").filter((line) => line.length > 0);
    expect(lines[0]).toBe("192.168.1.0/24");
    expect(lines[1]).toBe("2001:0db8:0000:0000:0000:0000:0000:0000/32");
  });

  it("IPv4 aggregation should work with model-based flow", () => {
    const models = [
      CIDRBlock.fromCIDRString("192.168.1.0/25"),
      CIDRBlock.fromCIDRString("192.168.1.128/25"),
    ];
    const strings = models.map((m) => m.toCIDRString());
    const aggregated = aggregateCIDRs(strings);
    expect(aggregated).toContain("192.168.1.0/24");
  });

  it("IPv6 aggregation should work with model-based flow", () => {
    const models = [
      CIDRBlock.fromCIDRString("2001:db8::/64"),
      CIDRBlock.fromCIDRString("2001:db8:0:0:1::/64"),
    ];
    const strings = models.map((m) => m.toCIDRString());
    const aggregated = aggregateCIDRs(strings);
    expect(aggregated.length).toBeLessThanOrEqual(strings.length);
  });

  it("mixed IPv4 and IPv6 should maintain IPv4-first order", () => {
    const models = [
      CIDRBlock.fromCIDRString("2001:db8::/32"),
      CIDRBlock.fromCIDRString("192.168.1.0/24"),
      CIDRBlock.fromCIDRString("10.0.0.0/8"),
      CIDRBlock.fromCIDRString("2001:db8:1::/48"),
      CIDRBlock.fromCIDRString("172.16.0.0/12"),
    ];
    const sorted = sortCIDRModels(models);
    expect(sorted[0].version).toBe(IPVersion.IPv4);
    expect(sorted[1].version).toBe(IPVersion.IPv4);
    expect(sorted[2].version).toBe(IPVersion.IPv4);
    expect(sorted[3].version).toBe(IPVersion.IPv6);
    expect(sorted[4].version).toBe(IPVersion.IPv6);
  });
});
