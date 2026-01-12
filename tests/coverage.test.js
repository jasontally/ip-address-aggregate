/**
 * Additional tests to improve coverage
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
  init,
  aggregateAddresses,
  isValidIPv4,
  isValidIPv6,
  parseIPv6,
  ipv4ToNumber,
  ipv6ToNumber,
  showModal,
  hideModal,
} from "../app.js";

describe("Coverage Improvements", () => {
  describe("IPv6 Edge Cases", () => {
    it("should handle IPv6 with leading zeros", () => {
      expect(isValidIPv6("2001:0db8:0000:0000:0000:0000:0000:0000", 64)).toBe(
        true,
      );
    });

    it("should handle IPv6 with multiple :: (invalid)", () => {
      expect(isValidIPv6("2001::db8::1", 64)).toBe(false);
    });

    it("should handle IPv6 prefix at boundary (0)", () => {
      expect(isValidIPv6("::", 0)).toBe(true);
    });

    it("should handle IPv6 prefix at boundary (128)", () => {
      expect(isValidIPv6("2001:db8::1", 128)).toBe(true);
    });

    it("should handle compressed IPv6 with :: at end", () => {
      expect(isValidIPv6("2001:db8::", 32)).toBe(true);
    });

    it("should handle compressed IPv6 with :: at start", () => {
      expect(isValidIPv6("::1", 128)).toBe(true);
    });

    it("should handle IPv6 with all zeros", () => {
      expect(parseIPv6("::")).toBeTruthy();
    });

    it("should handle IPv6 with mixed case", () => {
      expect(isValidIPv6("2001:DB8::1", 64)).toBe(true);
    });
  });

  describe("IPv4 Edge Cases", () => {
    it("should handle IPv4 at boundary (0.0.0.0)", () => {
      expect(ipv4ToNumber("0.0.0.0")).toBe(0);
    });

    it("should handle IPv4 at boundary (255.255.255.255)", () => {
      expect(ipv4ToNumber("255.255.255.255")).toBe(4294967295);
    });

    it("should handle IPv4 class A network (10.x.x.x)", () => {
      expect(ipv4ToNumber("10.0.0.0")).toBe(167772160);
    });

    it("should handle IPv4 class B network (172.16.x.x)", () => {
      expect(ipv4ToNumber("172.16.0.0")).toBe(2886729728);
    });

    it("should handle IPv4 class C network (192.168.x.x)", () => {
      expect(ipv4ToNumber("192.168.1.0")).toBe(3232235776);
    });

    it("should handle IPv4 prefix at boundary (0)", () => {
      expect(isValidIPv4("192.168.1.0", 0)).toBe(true);
    });

    it("should handle IPv4 prefix at boundary (32)", () => {
      expect(isValidIPv4("192.168.1.1", 32)).toBe(true);
    });
  });

  describe("IPv6 Numeric Conversion", () => {
    it("should convert :: to 0", () => {
      expect(ipv6ToNumber("::")).toBe(BigInt(0));
    });

    it("should convert ::1 to 1", () => {
      expect(ipv6ToNumber("::1")).toBe(BigInt(1));
    });

    it("should convert 2001:db8:: to large number", () => {
      const num = ipv6ToNumber("2001:db8::");
      expect(num).toBeGreaterThan(BigInt(0));
    });

    it("should convert ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff to max", () => {
      const num = ipv6ToNumber("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
      expect(num).toBe(
        BigInt("340282366920938463463374607431768211455"),
      );
    });
  });

  describe("Modal Functions", () => {
    let dom;

    beforeEach(() => {
      dom = new JSDOM(`
        <html>
          <body></body>
        </html>
      `);
      global.document = dom.window.document;
    });

    it("should create and show modal", () => {
      showModal();

      const modal = document.getElementById("processingModal");
      expect(modal).toBeTruthy();
      expect(modal.classList.contains("modal-overlay")).toBe(true);

      const modalContent = modal.querySelector(".modal");
      expect(modalContent).toBeTruthy();

      const spinner = modalContent.querySelector(".spinner");
      expect(spinner).toBeTruthy();

      const text = modalContent.textContent;
      expect(text).toContain("Aggregating addresses...");
    });

    it("should remove existing modal before showing new one", () => {
      showModal();

      const modal1 = document.getElementById("processingModal");
      expect(modal1).toBeTruthy();

      showModal();

      const modal2 = document.getElementById("processingModal");
      expect(modal2).toBeTruthy();
      expect(modal2).not.toBe(modal1);
    });

    it("should hide modal", () => {
      showModal();

      expect(document.getElementById("processingModal")).toBeTruthy();

      hideModal();

      expect(document.getElementById("processingModal")).toBeNull();
    });

    it("should handle hiding when no modal exists", () => {
      expect(() => hideModal()).not.toThrow();
    });
  });

  describe("Init Function", () => {
    let dom;

    beforeEach(() => {
      dom = new JSDOM(`
        <html>
          <body>
            <textarea id="addressInput"></textarea>
          </body>
        </html>
      `);
      global.document = dom.window.document;
    });

    it("should add keyboard shortcut listener", () => {
      const textarea = document.getElementById("addressInput");
      const addEventListenerSpy = vi.spyOn(textarea, "addEventListener");

      init();

      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      addEventListenerSpy.mockRestore();
    });
  });

  describe("Aggregate Error Handling", () => {
    let dom;

    beforeEach(() => {
      dom = new JSDOM(`
        <html>
          <body>
            <textarea id="addressInput"></textarea>
            <div id="error"></div>
            <div id="diffContainer" class="diff-container"></div>
            <div id="beforeColumn" class="diff-column"></div>
            <div id="afterColumn" class="diff-column"></div>
            <button id="copyBtn"></button>
          </body>
        </html>
      `);
      global.document = dom.window.document;
    });

    it("should handle aggregation errors gracefully", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe("");
    });

    it("should show error for invalid aggregation", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR");
    });
  });
});
