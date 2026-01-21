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
          <textarea id="addressOutput"></textarea>
          <div id="error"></div>
          <div id="diffContainer" class="diff-container"></div>
          <div id="beforeColumn" class="diff-column"></div>
          <div id="afterColumn" class="diff-column"></div>
          <button id="copyBtn" disabled>Copy</button>
          <div id="inputValidation" class="validation-panel" style="display: none">
            <div id="correctedWarnings" class="corrected-warnings"></div>
            <div id="invalidErrors" class="invalid-errors"></div>
          </div>
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

    it("should show error for space-delimited invalid input", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid-cidr another-invalid bad-address";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 3 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain("invalid-cidr");
      expect(invalidErrorsDiv.textContent).toContain("another-invalid");
      expect(invalidErrorsDiv.textContent).toContain("bad-address");
    });

    it("should handle space-delimited valid entries", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24 10.0.0.0/8 172.16.0.0/12";

      const errorDiv = document.getElementById("error");
      const output = document.getElementById("addressOutput");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe("");
      expect(output.value).toContain("192.168.1.0/24");
      expect(output.value).toContain("10.0.0.0/8");
      expect(output.value).toContain("172.16.0.0/12");
    });

    it("should NOT split valid IP with subnet mask format", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0 255.255.255.0";

      const errorDiv = document.getElementById("error");
      const output = document.getElementById("addressOutput");

      await aggregateAddresses();

      expect(errorDiv.textContent).toBe("");
      expect(output.value).toBe("192.168.1.0/24");
    });
  });

  describe("Invalid CIDR Format Handling", () => {
    it("should show error for single invalid CIDR", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid-cidr";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain(
        "Invalid IPv4 range format",
      );
    });

    it("should show error for multiple invalid CIDRs", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 3 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain("invalid1");
      expect(invalidErrorsDiv.textContent).toContain("invalid2");
      expect(invalidErrorsDiv.textContent).toContain("invalid3");
    });

    it("should truncate error message to show only first 3 invalid CIDRs", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3\ninvalid4\ninvalid5";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 5 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain("invalid1");
      expect(invalidErrorsDiv.textContent).toContain("invalid2");
      expect(invalidErrorsDiv.textContent).toContain("invalid3");
      expect(invalidErrorsDiv.textContent).toContain("invalid4");
      expect(invalidErrorsDiv.textContent).toContain("invalid5");
    });

    it("should show error for CIDR with invalid prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/33";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).not.toBe("");
    });

    it("should show error for CIDR with negative prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/-1";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).not.toBe("");
    });

    it("should show error for CIDR with non-numeric prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/abc";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).not.toBe("");
    });

    it("should show error for IPv6 with invalid prefix", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "2001:db8::/129";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain("Invalid IPv6 prefix");
    });

    it("should show error for malformed IPv4 address", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "300.400.500.600/24";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).not.toBe("");
    });

    it("should show error for malformed IPv6 address", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "2001::db8::1/64";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(invalidErrorsDiv.textContent).toContain("Invalid IPv6");
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

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
      expect(errorDiv.textContent).not.toContain("Previous error message");
    });
  });

  describe("Error Message Format", () => {
    it("should include prefix in error message", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid-cidr";

      const errorDiv = document.getElementById("error");

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 1 entries are invalid. See details above.",
      );
    });

    it("should truncate with ellipsis for more than 3 errors", async () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "invalid1\ninvalid2\ninvalid3\ninvalid4";

      const errorDiv = document.getElementById("error");
      const invalidErrorsDiv = document.getElementById("invalidErrors");
      errorDiv.textContent = "Previous error message";

      await aggregateAddresses();

      expect(errorDiv.textContent).toContain(
        "All 4 entries are invalid. See details above.",
      );
      expect(errorDiv.textContent).not.toContain("Previous error message");
      expect(invalidErrorsDiv.textContent).toContain("invalid1");
      expect(invalidErrorsDiv.textContent).toContain("invalid2");
      expect(invalidErrorsDiv.textContent).toContain("invalid3");
      expect(invalidErrorsDiv.textContent).toContain("invalid4");
    });
  });
});
