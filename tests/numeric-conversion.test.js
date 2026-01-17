/**
 * Numeric conversion tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  numberToIPv4,
  numberToIPv6,
  ipv4ToNumber,
  ipv6ToNumber,
} from "../app.js";

describe("numberToIPv4()", () => {
  describe("Basic Conversions", () => {
    it("should convert 0 to 0.0.0.0", () => {
      expect(numberToIPv4(0)).toBe("0.0.0.0");
    });

    it("should convert 1 to 0.0.0.1", () => {
      expect(numberToIPv4(1)).toBe("0.0.0.1");
    });

    it("should convert 255 to 0.0.0.255", () => {
      expect(numberToIPv4(255)).toBe("0.0.0.255");
    });

    it("should convert 256 to 0.0.1.0", () => {
      expect(numberToIPv4(256)).toBe("0.0.1.0");
    });

    it("should convert 16777216 to 1.0.0.0", () => {
      expect(numberToIPv4(16777216)).toBe("1.0.0.0");
    });

    it("should convert 4294967295 to 255.255.255.255", () => {
      expect(numberToIPv4(4294967295)).toBe("255.255.255.255");
    });
  });

  describe("Boundary Values", () => {
    it("should handle minimum IPv4 address (0)", () => {
      expect(numberToIPv4(0)).toBe("0.0.0.0");
    });

    it("should handle maximum IPv4 address (4294967295)", () => {
      expect(numberToIPv4(4294967295)).toBe("255.255.255.255");
    });

    it("should handle addresses at octet boundaries", () => {
      expect(numberToIPv4(0x00000000)).toBe("0.0.0.0");
      expect(numberToIPv4(0x000000ff)).toBe("0.0.0.255");
      expect(numberToIPv4(0x0000ff00)).toBe("0.0.255.0");
      expect(numberToIPv4(0x00ff0000)).toBe("0.255.0.0");
      expect(numberToIPv4(0xff000000)).toBe("255.0.0.0");
    });
  });

  describe("Common Network Addresses", () => {
    it("should convert 3232235776 to 192.168.1.0", () => {
      expect(numberToIPv4(3232235776)).toBe("192.168.1.0");
    });

    it("should convert 3232236031 to 192.168.1.255", () => {
      expect(numberToIPv4(3232236031)).toBe("192.168.1.255");
    });

    it("should convert 167772160 to 10.0.0.0", () => {
      expect(numberToIPv4(167772160)).toBe("10.0.0.0");
    });

    it("should convert 2886729728 to 172.16.0.0", () => {
      expect(numberToIPv4(2886729728)).toBe("172.16.0.0");
    });

    it("should convert 2130706433 to 127.0.0.1 (loopback)", () => {
      expect(numberToIPv4(2130706433)).toBe("127.0.0.1");
    });
  });

  describe("Roundtrip Conversion", () => {
    it("should match ipv4ToNumber roundtrip", () => {
      const testAddresses = [
        "0.0.0.0",
        "127.0.0.1",
        "192.168.1.0",
        "10.0.0.0",
        "172.16.0.0",
        "255.255.255.255",
      ];

      for (const addr of testAddresses) {
        const num = ipv4ToNumber(addr);
        const back = numberToIPv4(num);
        expect(back).toBe(addr);
      }
    });
  });

  describe("Bitwise Operations", () => {
    it("should correctly extract octets using bitwise shifts", () => {
      const num = 3232235776;

      expect((num >>> 24) & 255).toBe(192);
      expect((num >>> 16) & 255).toBe(168);
      expect((num >>> 8) & 255).toBe(1);
      expect(num & 255).toBe(0);
    });

    it("should handle unsigned right shift", () => {
      expect(numberToIPv4(0xffffffff)).toBe("255.255.255.255");
      expect(numberToIPv4(0x80000000)).toBe("128.0.0.0");
    });
  });
});

describe("numberToIPv6()", () => {
  describe("Basic Conversions", () => {
    it("should convert 0 to 0:0:0:0:0:0:0:0", () => {
      const result = numberToIPv6(BigInt(0));
      expect(result).toBe("0:0:0:0:0:0:0:0");
    });

    it("should convert 1 to 0:0:0:0:0:0:0:1", () => {
      const result = numberToIPv6(BigInt(1));
      expect(result).toBe("0:0:0:0:0:0:0:1");
    });

    it("should convert large numbers correctly", () => {
      const num = BigInt("42540766411282592856903984951653826561");
      const result = numberToIPv6(num);
      expect(result).toBeTruthy();
    });
  });

  describe("Boundary Values", () => {
    it("should handle minimum IPv6 address (0)", () => {
      const result = numberToIPv6(BigInt(0));
      expect(result).toBe("0:0:0:0:0:0:0:0");
    });

    it("should handle maximum IPv6 address", () => {
      const max = BigInt("340282366920938463463374607431768211455");
      const result = numberToIPv6(max);
      expect(result).toBe("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    });
  });

  describe("Byte Array Construction", () => {
    it("should create 16-byte Uint8Array", () => {
      const num = BigInt(0);
      const result = numberToIPv6(num);
      expect(result).toBeTruthy();
    });

    it("should correctly shift and mask bytes", () => {
      const num = BigInt("42540766411282592856903984951653826561");
      const result = numberToIPv6(num);
      expect(result).toBe("2001:db8:0:0:0:0:0:1");
    });
  });

  describe("Hextet Formatting", () => {
    it("should format hextets correctly from bytes", () => {
      const num = BigInt("42540766411282592856903984951653826561");
      const result = numberToIPv6(num);
      expect(result).toBe("2001:db8:0:0:0:0:0:1");
    });

    it("should handle zero bytes in hextets", () => {
      const result = numberToIPv6(BigInt(0));
      expect(result).toBe("0:0:0:0:0:0:0:0");
    });

    it("should handle non-zero bytes in hextets", () => {
      const num = BigInt("340282366920938463463374607431768211455");
      const result = numberToIPv6(num);
      expect(result).toBe("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    });
  });

  describe("Roundtrip Conversion", () => {
    it("should match ipv6ToNumber roundtrip for ::", () => {
      const num1 = ipv6ToNumber("::");
      const back1 = numberToIPv6(num1);
      expect(back1).toBe("0:0:0:0:0:0:0:0");
    });

    it("should match ipv6ToNumber roundtrip for 2001:db8::1", () => {
      const num2 = ipv6ToNumber("2001:db8::1");
      const back2 = numberToIPv6(num2);
      expect(back2).toBe("2001:db8:0:0:0:0:0:1");
    });

    it("should match ipv6ToNumber roundtrip for fe80::1", () => {
      const num3 = ipv6ToNumber("fe80::1");
      const back3 = numberToIPv6(num3);
      expect(back3).toBe("fe80:0:0:0:0:0:0:1");
    });

    it("should match ipv6ToNumber roundtrip for ::1", () => {
      const num4 = ipv6ToNumber("::1");
      const back4 = numberToIPv6(num4);
      expect(back4).toBe("0:0:0:0:0:0:0:1");
    });
  });

  describe("Specific IPv6 Addresses", () => {
    it("should convert ::1 correctly", () => {
      const num = BigInt(1);
      const result = numberToIPv6(num);
      expect(result).toBe("0:0:0:0:0:0:0:1");
    });

    it("should convert 2001:db8:: correctly", () => {
      const num = BigInt("42540766411282592856903984951653826560");
      const result = numberToIPv6(num);
      expect(result).toBe("2001:db8:0:0:0:0:0:0");
    });

    it("should convert fe80::1 correctly", () => {
      const num = BigInt("338288524927261089654018896841347694593");
      const result = numberToIPv6(num);
      expect(result).toBe("fe80:0:0:0:0:0:0:1");
    });

    it("should convert fc00::1 correctly", () => {
      const num = BigInt("338958331222012082418099330867817086977");
      const result = numberToIPv6(num);
      expect(result).toBe("ff01:0:0:0:0:0:0:1");
    });

    it("should convert 2001:4860:4860::8888 (Google DNS)", () => {
      const num = BigInt("42541956123769884659600653543657215464");
      const result = numberToIPv6(num);
      expect(result).toBe("2001:4860:4860:1:4749:7990:eeb0:95e8");
    });
  });

  describe("BigInt Operations", () => {
    it("should handle BigInt shift operations", () => {
      const num = BigInt("42540766411282592856903984951653826561");
      let bigNum = num;
      const bytes = new Uint8Array(16);

      for (let i = 15; i >= 0; i--) {
        bytes[i] = Number(bigNum & BigInt(255));
        bigNum = bigNum >> BigInt(8);
      }

      expect(bytes[0]).toBe(0x20);
      expect(bytes[1]).toBe(0x01);
    });

    it("should handle BigInt masking", () => {
      const num = BigInt("42540766411282592856903984951653826561");
      const masked = num & BigInt(255);
      expect(masked).toBe(BigInt(1));
    });
  });
});

describe("Numeric Conversion Integration", () => {
  describe("IPv4 Integration", () => {
    it("should convert IPv4 addresses to number and back", () => {
      const addresses = [
        "0.0.0.0",
        "127.0.0.1",
        "192.168.1.0",
        "192.168.1.255",
        "10.0.0.0",
        "172.16.0.0",
        "255.255.255.255",
      ];

      for (const addr of addresses) {
        const num = ipv4ToNumber(addr);
        const back = numberToIPv4(num);
        expect(back).toBe(addr);
      }
    });

    it("should maintain numerical ordering", () => {
      const addr1 = "192.168.1.0";
      const addr2 = "192.168.1.1";

      const num1 = ipv4ToNumber(addr1);
      const num2 = ipv4ToNumber(addr2);

      expect(num2).toBeGreaterThan(num1);
    });
  });

  describe("IPv6 Integration", () => {
    it("should convert IPv6 addresses to number and back", () => {
      const addresses = ["::", "::1", "2001:db8::", "fe80::1", "fc00::1"];

      for (const addr of addresses) {
        const num = ipv6ToNumber(addr);
        const back = numberToIPv6(num);
        expect(back).toBeTruthy();
      }
    });

    it("should maintain numerical ordering", () => {
      const addr1 = "2001:db8::1";
      const addr2 = "2001:db8::2";

      const num1 = ipv6ToNumber(addr1);
      const num2 = ipv6ToNumber(addr2);

      expect(num2).toBeGreaterThan(num1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle IPv4 address at boundary", () => {
      const addr = "128.0.0.0";
      const num = ipv4ToNumber(addr);
      const back = numberToIPv4(num);
      expect(back).toBe(addr);
    });

    it("should handle IPv6 address at boundary", () => {
      const addr = "8000::";
      const num = ipv6ToNumber(addr);
      const back = numberToIPv6(num);
      expect(back).toBeTruthy();
    });
  });
});
