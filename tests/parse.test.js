/**
 * Input parsing tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { parseInput } from "../app.js";

describe("parseInput", () => {
  it("should parse newline-separated addresses", () => {
    const input = "192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
    ]);
  });

  it("should parse comma-separated addresses", () => {
    const input = "192.168.1.0/24,10.0.0.0/8,172.16.0.0/12";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
    ]);
  });

  it("should parse mixed newline and comma separators", () => {
    const input = "192.168.1.0/24\n10.0.0.0/8,172.16.0.0/12\n2001:db8::/32";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "2001:db8::/32",
    ]);
  });

  it("should handle extra whitespace", () => {
    const input = "  192.168.1.0/24  \n  10.0.0.0/8  ,  172.16.0.0/12  ";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
    ]);
  });

  it("should filter empty entries", () => {
    const input = "192.168.1.0/24\n\n10.0.0.0/8\n,\n172.16.0.0/12";
    const result = parseInput(input);
    expect(result).toEqual([
      "192.168.1.0/24",
      "10.0.0.0/8",
      "172.16.0.0/12",
    ]);
  });

  it("should handle single address", () => {
    const input = "192.168.1.0/24";
    const result = parseInput(input);
    expect(result).toEqual(["192.168.1.0/24"]);
  });

  it("should return empty array for empty input", () => {
    const result = parseInput("");
    expect(result).toEqual([]);
  });

  it("should return empty array for whitespace-only input", () => {
    const result = parseInput("   \n   ");
    expect(result).toEqual([]);
  });

  it("should handle IPv6 addresses", () => {
    const input = "2001:db8::/32\n2001:db8:1::/48\n2001:db8:2::/48";
    const result = parseInput(input);
    expect(result).toEqual([
      "2001:db8::/32",
      "2001:db8:1::/48",
      "2001:db8:2::/48",
    ]);
  });

  it("should handle trailing newline", () => {
    const input = "192.168.1.0/24\n10.0.0.0/8\n";
    const result = parseInput(input);
    expect(result).toEqual(["192.168.1.0/24", "10.0.0.0/8"]);
  });

  it("should handle leading newline", () => {
    const input = "\n192.168.1.0/24\n10.0.0.0/8";
    const result = parseInput(input);
    expect(result).toEqual(["192.168.1.0/24", "10.0.0.0/8"]);
  });
});
