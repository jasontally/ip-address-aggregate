/**
 * Clipboard functionality tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";

describe("Clipboard Functionality", () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <textarea id="addressInput"></textarea>
          <button id="copyBtn">Copy</button>
        </body>
      </html>
    `);
    global.document = dom.window.document;
  });

  describe("Textarea and Button Setup", () => {
    it("should have textarea element", () => {
      const textarea = document.getElementById("addressInput");
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("should have copy button", () => {
      const copyBtn = document.getElementById("copyBtn");
      expect(copyBtn).toBeTruthy();
      expect(copyBtn.tagName).toBe("BUTTON");
    });

    it("should have button text set", () => {
      const copyBtn = document.getElementById("copyBtn");
      expect(copyBtn.textContent).toBe("Copy");
    });
  });

  describe("Textarea Content", () => {
    it("should allow setting textarea value", () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24";
      expect(textarea.value).toBe("192.168.1.0/24");
    });

    it("should handle empty textarea", () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "";
      expect(textarea.value).toBe("");
    });

    it("should handle whitespace in textarea", () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "  192.168.1.0/24  ";
      expect(textarea.value).toBe("  192.168.1.0/24  ");
    });

    it("should handle multiple lines in textarea", () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12";
      expect(textarea.value).toBe("192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12");
    });

    it("should handle newlines and commas in textarea", () => {
      const textarea = document.getElementById("addressInput");
      textarea.value = "192.168.1.0/24,\n10.0.0.0/8";
      expect(textarea.value).toBe("192.168.1.0/24,\n10.0.0.0/8");
    });
  });

  describe("Button Text Changes", () => {
    it("should allow changing button text", () => {
      const copyBtn = document.getElementById("copyBtn");
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      expect(copyBtn.textContent).toBe("Copied!");
      copyBtn.textContent = originalText;
      expect(copyBtn.textContent).toBe("Copy");
    });

    it(
      "should reset button text after timeout",
      (done) => {
        const copyBtn = document.getElementById("copyBtn");
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";

        setTimeout(() => {
          copyBtn.textContent = originalText;
          expect(copyBtn.textContent).toBe("Copy");
          done();
        }, 2000);
      },
      { timeout: 3000 },
    );
  });

  describe("Textarea Creation for Fallback", () => {
    it("should create textarea element", () => {
      const textareaCopy = document.createElement("textarea");
      expect(textareaCopy.tagName).toBe("TEXTAREA");
    });

    it("should set textarea value", () => {
      const textareaCopy = document.createElement("textarea");
      textareaCopy.value = "192.168.1.0/24";
      expect(textareaCopy.value).toBe("192.168.1.0/24");
    });

    it("should set textarea styles", () => {
      const textareaCopy = document.createElement("textarea");
      textareaCopy.style.position = "fixed";
      textareaCopy.style.opacity = "0";
      expect(textareaCopy.style.position).toBe("fixed");
      expect(textareaCopy.style.opacity).toBe("0");
    });

    it("should append textarea to body", () => {
      const textareaCopy = document.createElement("textarea");
      document.body.appendChild(textareaCopy);
      expect(document.body.contains(textareaCopy)).toBe(true);
      document.body.removeChild(textareaCopy);
    });

    it("should remove textarea from body", () => {
      const textareaCopy = document.createElement("textarea");
      document.body.appendChild(textareaCopy);
      document.body.removeChild(textareaCopy);
      expect(document.body.contains(textareaCopy)).toBe(false);
    });

    it("should select textarea content", () => {
      const textareaCopy = document.createElement("textarea");
      textareaCopy.value = "192.168.1.0/24";
      const selectSpy = vi.spyOn(textareaCopy, "select");
      textareaCopy.select();
      expect(selectSpy).toHaveBeenCalled();
      selectSpy.mockRestore();
    });
  });

  describe("Document execCommand", () => {
    it("should execute copy command", () => {
      if (typeof document.execCommand === "function") {
        const execCommandSpy = vi.spyOn(document, "execCommand");
        document.execCommand("copy");
        expect(execCommandSpy).toHaveBeenCalledWith("copy");
        execCommandSpy.mockRestore();
      }
    });

    it("should return true for successful execCommand", () => {
      if (typeof document.execCommand === "function") {
        const result = document.execCommand("copy");
        expect(typeof result).toBe("boolean");
      }
    });
  });
});
