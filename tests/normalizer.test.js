/**
 * Normalizer unit tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  normalizeInput,
  normalizeEntry,
  extractValidCIDRs,
  subnetMaskToCIDRPrefix,
  expandIPv4Range,
  NormalizationStatus,
} from "../normalizer.js";

describe("subnetMaskToCIDRPrefix", () => {
  it("should convert standard subnet masks", () => {
    expect(subnetMaskToCIDRPrefix("255.255.255.0")).toBe(24);
    expect(subnetMaskToCIDRPrefix("255.255.0.0")).toBe(16);
    expect(subnetMaskToCIDRPrefix("255.0.0.0")).toBe(8);
    expect(subnetMaskToCIDRPrefix("255.255.255.255")).toBe(32);
    expect(subnetMaskToCIDRPrefix("0.0.0.0")).toBe(0);
  });

  it("should convert non-octet-aligned masks", () => {
    expect(subnetMaskToCIDRPrefix("255.255.255.128")).toBe(25);
    expect(subnetMaskToCIDRPrefix("255.255.255.192")).toBe(26);
    expect(subnetMaskToCIDRPrefix("255.255.254.0")).toBe(23);
  });

  it("should reject invalid masks", () => {
    expect(subnetMaskToCIDRPrefix("255.255.255.1")).toBe(null);
    expect(subnetMaskToCIDRPrefix("255.0.255.0")).toBe(null);
    expect(subnetMaskToCIDRPrefix("invalid")).toBe(null);
  });
});

describe("IPv4 normalization", () => {
  it("should handle CIDR notation", () => {
    const result = normalizeEntry("192.168.1.0/24");
    expect(result.status).toBe(NormalizationStatus.VALID);
    expect(result.normalized).toBe("192.168.1.0/24");
  });

  it("should normalize leading zeros", () => {
    const result = normalizeEntry("192.168.001.001/24");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.normalized).toBe("192.168.1.1/24");
  });

  it("should handle bare IPv4", () => {
    const result = normalizeEntry("192.168.1.1");
    expect(result.normalized).toBe("192.168.1.1/32");
  });

  it("should handle IP with subnet mask", () => {
    const result = normalizeEntry("192.168.1.0 255.255.255.0");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.normalized).toBe("192.168.1.0/24");
  });

  it("should handle IP/subnet mask", () => {
    const result = normalizeEntry("192.168.1.0/255.255.255.0");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.normalized).toBe("192.168.1.0/24");
  });
});

describe("IPv4 range expansion", () => {
  it("should expand full range", () => {
    const result = normalizeEntry("192.168.1.1-192.168.1.4");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.expandedTo.length).toBeGreaterThan(0);
  });

  it("should expand short range", () => {
    const result = normalizeEntry("192.168.1.1-4");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.expandedTo.length).toBeGreaterThan(0);
  });

  it("should reject invalid ranges", () => {
    const result = normalizeEntry("192.168.1.100-1");
    expect(result.status).toBe(NormalizationStatus.INVALID);
  });
});

describe("IPv6 normalization", () => {
  it("should handle compressed IPv6 CIDR", () => {
    const result = normalizeEntry("2001:db8::/32");
    expect(result.status).toBe(NormalizationStatus.VALID);
    expect(result.normalized).toBe("2001:db8::/32");
  });

  it("should normalize case", () => {
    const result = normalizeEntry("2001:DB8::/32");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.normalized).toBe("2001:db8::/32");
  });

  it("should handle bare IPv6", () => {
    const result = normalizeEntry("2001:db8::1");
    expect(result.normalized).toBe("2001:db8::1/128");
  });

  it("should strip zone ID with warning", () => {
    const result = normalizeEntry("fe80::1%eth0");
    expect(result.status).toBe(NormalizationStatus.CORRECTED);
    expect(result.warning).toContain("zone");
  });
});

describe("normalizeInput", () => {
  it("should handle mixed input", () => {
    const input = "192.168.1.0/24\n2001:db8::/32,10.0.0.1";
    const results = normalizeInput(input);
    expect(results.length).toBe(3);
  });

  it("should track line numbers", () => {
    const input = "192.168.1.0/24\n10.0.0.1";
    const results = normalizeInput(input);
    expect(results[0].lineNumber).toBe(1);
    expect(results[1].lineNumber).toBe(2);
  });

  it("should handle invalid entries", () => {
    const input = "192.168.1.0/24\ninvalid\n10.0.0.1";
    const results = normalizeInput(input);
    const invalid = results.filter(
      (r) => r.status === NormalizationStatus.INVALID,
    );
    expect(invalid.length).toBe(1);
  });
});

describe("extractValidCIDRs", () => {
  it("should extract only valid and corrected entries", () => {
    const input = "192.168.1.0/24\ninvalid\n10.0.0.1";
    const results = normalizeInput(input);
    const cidrs = extractValidCIDRs(results);
    expect(cidrs).toContain("192.168.1.0/24");
    expect(cidrs).toContain("10.0.0.1/32");
    expect(cidrs.length).toBe(2);
  });
});
