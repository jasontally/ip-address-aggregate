/**
 * Diff generation tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { generateDiff, renderDiff } from "../app.js";

describe("generateDiff", () => {
  it("should generate diff for identical arrays", () => {
    const before = ["192.168.1.0/24", "10.0.0.0/8"];
    const after = ["192.168.1.0/24", "10.0.0.0/8"];
    const diff = generateDiff(before, after);

    const hasAdded = diff.some((part) => part.added);
    const hasRemoved = diff.some((part) => part.removed);
    expect(hasAdded).toBe(false);
    expect(hasRemoved).toBe(false);
  });

  it("should detect removed lines", () => {
    const before = ["192.168.1.0/24", "192.168.2.0/24", "10.0.0.0/8"];
    const after = ["192.168.1.0/24", "10.0.0.0/8"];
    const diff = generateDiff(before, after);

    const removedParts = diff.filter((part) => part.removed);
    expect(removedParts.length).toBeGreaterThan(0);
    expect(removedParts.some((part) => part.value.includes("192.168.2.0/24"))).toBe(
      true,
    );
  });

  it("should detect added lines", () => {
    const before = ["192.168.1.0/24", "10.0.0.0/8"];
    const after = ["192.168.0.0/23", "10.0.0.0/8"];
    const diff = generateDiff(before, after);

    const addedParts = diff.filter((part) => part.added);
    expect(addedParts.length).toBeGreaterThan(0);
  });

  it("should detect both added and removed lines", () => {
    const before = ["192.168.1.0/25", "192.168.1.128/25", "10.0.0.0/8"];
    const after = ["192.168.1.0/24", "10.0.0.0/8"];
    const diff = generateDiff(before, after);

    const hasAdded = diff.some((part) => part.added);
    const hasRemoved = diff.some((part) => part.removed);
    expect(hasAdded).toBe(true);
    expect(hasRemoved).toBe(true);
  });

  it("should handle empty arrays", () => {
    const before = [];
    const after = [];
    const diff = generateDiff(before, after);
    expect(diff).toBeDefined();
  });

  it("should handle array becoming non-empty", () => {
    const before = [];
    const after = ["192.168.1.0/24"];
    const diff = generateDiff(before, after);

    const hasAdded = diff.some((part) => part.added);
    expect(hasAdded).toBe(true);
  });

  it("should handle array becoming empty", () => {
    const before = ["192.168.1.0/24"];
    const after = [];
    const diff = generateDiff(before, after);

    const hasRemoved = diff.some((part) => part.removed);
    expect(hasRemoved).toBe(true);
  });

  it("should handle IPv6 addresses", () => {
    const before = ["2001:db8::/64", "2001:db8:0:0:1::/64"];
    const after = ["2001:db8::/63"];
    const diff = generateDiff(before, after);

    const hasAdded = diff.some((part) => part.added);
    const hasRemoved = diff.some((part) => part.removed);
    expect(hasAdded).toBe(true);
    expect(hasRemoved).toBe(true);
  });

  it("should handle mixed IPv4 and IPv6", () => {
    const before = [
      "192.168.1.0/25",
      "192.168.1.128/25",
      "2001:db8::/64",
    ];
    const after = ["192.168.1.0/24", "2001:db8::/64"];
    const diff = generateDiff(before, after);

    const hasAdded = diff.some((part) => part.added);
    const hasRemoved = diff.some((part) => part.removed);
    expect(hasAdded).toBe(true);
    expect(hasRemoved).toBe(true);
  });
});

describe("renderDiff", () => {
  let dom;
  let beforeColumn;
  let afterColumn;
  let diffContainer;

  beforeEach(() => {
    dom = new JSDOM(`
      <html>
        <body>
          <div id="diffContainer" class="diff-container"></div>
          <div id="beforeColumn" class="diff-column"></div>
          <div id="afterColumn" class="diff-column"></div>
        </body>
      </html>
    `);
    global.document = dom.window.document;

    diffContainer = document.getElementById("diffContainer");
    beforeColumn = document.getElementById("beforeColumn");
    afterColumn = document.getElementById("afterColumn");
  });

  it("should render diff with removed lines in before column", () => {
    const diffParts = [
      { value: "192.168.1.0/25\n", removed: true, added: undefined },
      { value: "10.0.0.0/8\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    const removedLines = beforeColumn.querySelectorAll(".diff-line.removed");
    expect(removedLines.length).toBeGreaterThan(0);
    expect(removedLines[0].textContent).toContain("192.168.1.0/25");
  });

  it("should render diff with added lines in after column", () => {
    const diffParts = [
      { value: "192.168.1.0/24\n", added: true, removed: undefined },
      { value: "10.0.0.0/8\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    const addedLines = afterColumn.querySelectorAll(".diff-line.added");
    expect(addedLines.length).toBeGreaterThan(0);
    expect(addedLines[0].textContent).toContain("192.168.1.0/24");
  });

  it("should render unchanged lines in both columns", () => {
    const diffParts = [
      { value: "192.168.1.0/24\n", added: undefined, removed: undefined },
      { value: "10.0.0.0/8\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    const beforeLines = beforeColumn.querySelectorAll(".diff-line:not(.removed)");
    const afterLines = afterColumn.querySelectorAll(".diff-line:not(.added)");

    expect(beforeLines.length).toBe(2);
    expect(afterLines.length).toBe(2);
  });

  it("should show diff container after rendering", () => {
    const diffParts = [
      { value: "192.168.1.0/24\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    expect(diffContainer.classList.contains("show")).toBe(true);
  });

  it("should clear previous diff before rendering", () => {
    beforeColumn.innerHTML = "<div>old content</div>";
    afterColumn.innerHTML = "<div>old content</div>";

    const diffParts = [
      { value: "192.168.1.0/24\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    expect(beforeColumn.textContent).not.toContain("old content");
    expect(afterColumn.textContent).not.toContain("old content");
  });

  it("should handle complex diff with mixed changes", () => {
    const diffParts = [
      { value: "192.168.1.0/25\n", removed: true, added: undefined },
      { value: "192.168.1.128/25\n", removed: true, added: undefined },
      { value: "192.168.1.0/24\n", added: true, removed: undefined },
      { value: "10.0.0.0/8\n", added: undefined, removed: undefined },
    ];

    renderDiff(diffParts);

    const removedLines = beforeColumn.querySelectorAll(".diff-line.removed");
    const addedLines = afterColumn.querySelectorAll(".diff-line.added");
    const unchangedBefore = beforeColumn.querySelectorAll(
      ".diff-line:not(.removed)",
    );
    const unchangedAfter = afterColumn.querySelectorAll(
      ".diff-line:not(.added)",
    );

    expect(removedLines.length).toBe(2);
    expect(addedLines.length).toBe(1);
    expect(unchangedBefore.length).toBe(1);
    expect(unchangedAfter.length).toBe(1);
  });
});
