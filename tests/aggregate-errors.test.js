/**
 * Aggregation error handling tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { aggregateAddresses, isValidCIDR } from "../app.js";

describe("Aggregation Error Handling", () => {
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
          <button id="copyBtn" disabled>Copy</button>
        </body>
      </html>
    `);
    global.document = dom.window.document;
  });

  describe("Empty Input Handling", () => {
    it("should show error for completely empty input", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe(
        "Please enter at least one IP address or CIDR",
      );
    });

    it("should show error for whitespace-only input", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "   \n   \t   ";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe(
        "Please enter at least one IP address or CIDR",
      );
    });

    it("should show error for input with only newlines", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "\n\n\n";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe(
        "Please enter at least one IP address or CIDR",
      );
    });

    it("should show error for input with only commas", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = ",,,";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe(
        "Please enter at least one IP address or CIDR",
      );
    });
  });

  describe("Invalid CIDR Format Handling", () => {
    it("should show error for single invalid CIDR", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid-cidr";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
      expect(errorDiv.textContent).toContain("invalid-cidr");
    });

    it("should show error for multiple invalid CIDRs", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
      expect(errorDiv.textContent).toContain("invalid1");
      expect(errorDiv.textContent).toContain("invalid2");
      expect(errorDiv.textContent).toContain("invalid3");
    });

    it("should truncate error message to show only first 3 invalid CIDRs", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3\ninvalid4\ninvalid5";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
      expect(errorDiv.textContent).toContain("invalid1");
      expect(errorDiv.textContent).toContain("invalid2");
      expect(errorDiv.textContent).toContain("invalid3");
      expect(errorDiv.textContent).toContain("...");
      expect(errorDiv.textContent).not.toContain("invalid4");
    });

    it("should show error for CIDR with invalid prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/33";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });

    it("should show error for CIDR with negative prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/-1";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });

    it("should show error for CIDR with non-numeric prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/abc";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });

    it("should show error for IPv6 with invalid prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "2001:db8::/129";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });

    it("should show error for malformed IPv4 address", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "300.400.500.600/24";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });

    it("should show error for malformed IPv6 address", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "2001::db8::1/64";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
    });
  });

  describe("Copy Button State", () => {
    it("should keep copy button disabled on error", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid";

      const copyBtn = document.getElementById("copyBtn");

      await aggregateAddresses();

      expect(copyBtn.disabled).toBe(true);
    });
  });

  describe("Error Div Reset", () => {
    it("should clear error div before processing", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24";

      const errorDiv = document.getElementById("error");
      errorDiv.textContent = "Previous error message";

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe("");
    });

    it("should maintain error div on new error", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid";

      const errorDiv = document.getElementById("error");
      errorDiv.textContent = "Previous error message";

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format");
      expect(errorDiv.textContent).not.toContain("Previous error message");
    });
  });

  describe("Error Message Format", () => {
    it("should include prefix in error message", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid-cidr";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("Invalid CIDR format:");
    });

    it("should truncate with ellipsis for more than 3 errors", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3\ninvalid4";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain("...");
    });
  });
});
