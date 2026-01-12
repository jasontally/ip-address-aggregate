/**
 * IP Address Aggregate
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { merge } from "https://esm.sh/cidr-tools@8.0.0";
import { diffLines } from "https://esm.sh/diff@5.1.0";

/** @type {string|null} Sorted input before aggregation (for diff) */
let sortedInput = null;

/** @type {string|null} Aggregated output */
let aggregatedOutput = null;

/**
 * Check if a string is a bare IPv4 address (no prefix)
 * @param {string} addr - Address string to check
 * @returns {boolean} True if it's a bare IPv4 address
 */
function isBareIPv4(addr) {
  if (addr.includes("/")) {
    return false;
  }

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = addr.match(ipv4Regex);
  if (!match) return false;

  const octets = match.slice(1, 5).map(Number);
  for (const octet of octets) {
    if (octet < 0 || octet > 255) return false;
  }
  return true;
}

/**
 * Check if a string is a bare IPv6 address (no prefix)
 * @param {string} addr - Address string to check
 * @returns {boolean} True if it's a bare IPv6 address
 */
function isBareIPv6(addr) {
  if (addr.includes("/")) {
    return false;
  }

  try {
    const bytes = parseIPv6(addr);
    return bytes !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Normalize an address to CIDR format if needed
 * @param {string} addr - Address string (may or may not have prefix)
 * @returns {string} CIDR notation string
 */
function normalizeToCIDR(addr) {
  if (addr.includes("/")) {
    return addr;
  }

  if (isBareIPv4(addr)) {
    return `${addr}/32`;
  }

  if (isBareIPv6(addr)) {
    return `${addr}/128`;
  }

  return addr;
}

/**
 * Parse input string into array of CIDR strings
 * @param {string} input - Input text from textarea
 * @returns {string[]} Array of CIDR strings
 */
function parseInput(input) {
  if (!input || input.trim() === "") {
    return [];
  }

  return input
    .trim()
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(normalizeToCIDR);
}

/**
 * Validate a CIDR string (both IPv4 and IPv6)
 * @param {string} cidr - CIDR notation string
 * @returns {boolean} True if valid CIDR, false otherwise
 */
function isValidCIDR(cidr) {
  if (!cidr || typeof cidr !== "string") {
    return false;
  }

  const parts = cidr.split("/");
  if (parts.length !== 2) {
    return false;
  }

  const [address, prefix] = parts;

  if (prefix === "" || isNaN(parseInt(prefix))) {
    return false;
  }

  const prefixNum = parseInt(prefix);

  return isValidIPv4(address, prefixNum) || isValidIPv6(address, prefixNum);
}

/**
 * Validate IPv4 address with prefix
 * @param {string} address - IPv4 address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if valid IPv4 CIDR
 */
function isValidIPv4(address, prefix) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = address.match(ipv4Regex);

  if (!match) {
    return false;
  }

  const octets = match.slice(1, 5).map(Number);

  for (const octet of octets) {
    if (octet < 0 || octet > 255) {
      return false;
    }
  }

  return prefix >= 0 && prefix <= 32;
}

/**
 * Validate IPv6 address with prefix
 * @param {string} address - IPv6 address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if valid IPv6 CIDR
 */
function isValidIPv6(address, prefix) {
  try {
    const bytes = parseIPv6(address);
    if (!bytes) {
      return false;
    }
    return prefix >= 0 && prefix <= 128;
  } catch (e) {
    return false;
  }
}

/**
 * Parse an IPv6 address string into a 16-byte array
 * @param {string} addr - IPv6 address string (may be compressed with ::)
 * @returns {Uint8Array|null} 16-byte array representing the address, or null if invalid
 */
function parseIPv6(addr) {
  addr = addr.trim().toLowerCase();

  if (addr.includes("::")) {
    const parts = addr.split("::");
    if (parts.length > 2) return null;

    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const missing = 8 - left.length - right.length;

    const groups = [...left];
    for (let i = 0; i < missing; i++) groups.push("0");
    groups.push(...right);

    const bytes = new Uint8Array(16);
    for (let i = 0; i < 8; i++) {
      const val = parseInt(groups[i] || "0", 16);
      if (isNaN(val) || val > 0xffff) return null;
      bytes[i * 2] = (val >> 8) & 0xff;
      bytes[i * 2 + 1] = val & 0xff;
    }
    return bytes;
  } else {
    const groups = addr.split(":");
    if (groups.length !== 8) return null;

    const bytes = new Uint8Array(16);
    for (let i = 0; i < 8; i++) {
      const val = parseInt(groups[i], 16);
      if (isNaN(val) || val > 0xffff) return null;
      bytes[i * 2] = (val >> 8) & 0xff;
      bytes[i * 2 + 1] = val & 0xff;
    }
    return bytes;
  }
}

/**
 * Convert IPv4 address to numeric value for comparison
 * @param {string} address - IPv4 address (without prefix)
 * @returns {number} Numeric representation
 */
function ipv4ToNumber(address) {
  const parts = address.split(".").map(Number);
  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    parts[3]
  );
}

/**
 * Convert IPv6 address to numeric value for comparison
 * @param {string} address - IPv6 address (without prefix)
 * @returns {bigint} Numeric representation
 */
function ipv6ToNumber(address) {
  const bytes = parseIPv6(address);
  if (!bytes) {
    return BigInt(0);
  }

  let result = BigInt(0);
  for (let i = 0; i < 16; i++) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Compare two CIDR strings for sorting
 * @param {string} a - First CIDR string
 * @param {string} b - Second CIDR string
 * @returns {number} Negative if a < b, 0 if equal, positive if a > b
 */
function compareCIDR(a, b) {
  const isAIPv4 = a.includes(".");
  const isBIPv4 = b.includes(".");

  if (isAIPv4 && !isBIPv4) {
    return -1;
  }
  if (!isAIPv4 && isBIPv4) {
    return 1;
  }

  const [addrA, prefixA] = a.split("/");
  const [addrB, prefixB] = b.split("/");

  if (isAIPv4) {
    const numA = ipv4ToNumber(addrA);
    const numB = ipv4ToNumber(addrB);
    if (numA !== numB) {
      return numA - numB;
    }
    return parseInt(prefixA) - parseInt(prefixB);
  } else {
    const numA = ipv6ToNumber(addrA);
    const numB = ipv6ToNumber(addrB);
    if (numA !== numB) {
      return numA < numB ? -1 : 1;
    }
    return parseInt(prefixA) - parseInt(prefixB);
  }
}

/**
 * Sort CIDR strings (IPv4 first, then IPv6, each sorted numerically)
 * @param {string[]} cidrs - Array of CIDR strings
 * @returns {string[]} Sorted array of CIDR strings
 */
function sortCIDRs(cidrs) {
  return [...cidrs].sort(compareCIDR);
}

/**
 * Aggregate CIDR addresses using cidr-tools
 * @param {string[]} cidrs - Array of CIDR strings
 * @returns {string[]} Array of aggregated CIDR strings
 */
function aggregateCIDRs(cidrs) {
  if (cidrs.length === 0) {
    return [];
  }

  try {
    const merged = merge(cidrs);
    return merged;
  } catch (e) {
    console.error("Aggregation error:", e);
    return cidrs;
  }
}

/**
 * Generate diff between two text arrays
 * @param {string[]} before - Before array
 * @param {string[]} after - After array
 * @returns {Array} Diff parts from jsdiff
 */
function generateDiff(before, after) {
  const beforeText = before.join("\n");
  const afterText = after.join("\n");
  return diffLines(beforeText, afterText);
}

/**
 * Render diff visualization
 * @param {Array} diffParts - Diff parts from jsdiff
 * @returns {void}
 */
function renderDiff(diffParts) {
  const beforeColumn = document.getElementById("beforeColumn");
  const afterColumn = document.getElementById("afterColumn");

  beforeColumn.innerHTML = "";
  afterColumn.innerHTML = "";

  diffParts.forEach((part) => {
    const lines = part.value.split("\n");
    const filteredLines = lines.filter((line) => line.length > 0);

    if (part.added) {
      filteredLines.forEach((line) => {
        const div = document.createElement("div");
        div.className = "diff-line added";
        div.textContent = line;
        afterColumn.appendChild(div);
      });
    } else if (part.removed) {
      filteredLines.forEach((line) => {
        const div = document.createElement("div");
        div.className = "diff-line removed";
        div.textContent = line;
        beforeColumn.appendChild(div);
      });
    } else {
      filteredLines.forEach((line) => {
        const beforeDiv = document.createElement("div");
        beforeDiv.className = "diff-line";
        beforeDiv.textContent = line;
        beforeColumn.appendChild(beforeDiv);

        const afterDiv = document.createElement("div");
        afterDiv.className = "diff-line";
        afterDiv.textContent = line;
        afterColumn.appendChild(afterDiv);
      });
    }
  });

  const diffContainer = document.getElementById("diffContainer");
  diffContainer.classList.add("show");
}

/**
 * Show processing modal
 * @returns {void}
 */
function showModal() {
  const existingModal = document.querySelector(".modal-overlay");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "processingModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modalTitle");
  modal.setAttribute("aria-hidden", "false");

  modal.innerHTML = `
    <div class="modal">
      <div class="spinner" aria-hidden="true"></div>
      <h2 id="modalTitle" class="visually-hidden">Processing</h2>
      <div>Aggregating addresses...</div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
}

/**
 * Hide processing modal
 * @returns {void}
 */
function hideModal() {
  const modal = document.getElementById("processingModal");
  if (modal) {
    modal.setAttribute("aria-hidden", "true");
    modal.remove();
    document.body.style.overflow = "";
  }
}

/**
 * Main aggregation function
 * @returns {Promise<void>}
 */
async function aggregateAddresses() {
  const inputTextarea = document.getElementById("addressInput");
  const errorDiv = document.getElementById("error");
  const copyBtn = document.getElementById("copyBtn");

  errorDiv.textContent = "";

  const inputText = inputTextarea.value;
  const cidrs = parseInput(inputText);

  if (cidrs.length === 0) {
    errorDiv.textContent = "Please enter at least one IP address or CIDR";
    return;
  }

  const invalidCIDRs = cidrs.filter((cidr) => !isValidCIDR(cidr));
  if (invalidCIDRs.length > 0) {
    errorDiv.textContent = `Invalid CIDR format: ${invalidCIDRs.slice(0, 3).join(", ")}${invalidCIDRs.length > 3 ? "..." : ""}`;
    return;
  }

  const startTime = Date.now();
  showModal();

  try {
    const sorted = sortCIDRs(cidrs);
    sortedInput = sorted.join("\n");

    inputTextarea.value = sortedInput;

    const aggregated = aggregateCIDRs(sorted);
    aggregatedOutput = aggregated.join("\n");

    const diffParts = generateDiff(sorted, aggregated);
    renderDiff(diffParts);

    inputTextarea.value = aggregatedOutput;
    copyBtn.disabled = false;

    const elapsedTime = Date.now() - startTime;
    const minTime = 1500;
    const remainingTime = Math.max(0, minTime - elapsedTime);

    await new Promise((resolve) => setTimeout(resolve, remainingTime));
  } catch (e) {
    errorDiv.textContent = `Error during aggregation: ${e.message}`;
  } finally {
    hideModal();
  }
}

/**
 * Copy results to clipboard
 * @returns {Promise<void>}
 */
async function copyResults() {
  const textarea = document.getElementById("addressInput");
  const text = textarea.value;
  const copyBtn = document.getElementById("copyBtn");

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);

    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (err) {
    const textareaCopy = document.createElement("textarea");
    textareaCopy.value = text;
    textareaCopy.style.position = "fixed";
    textareaCopy.style.opacity = "0";
    document.body.appendChild(textareaCopy);
    textareaCopy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaCopy);

    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  }
}

/**
 * Initialize the application
 * @returns {void}
 */
function init() {
  const textarea = document.getElementById("addressInput");

  textarea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      aggregateAddresses();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

window.aggregateAddresses = aggregateAddresses;
window.copyResults = copyResults;

export {
  isBareIPv4,
  isBareIPv6,
  normalizeToCIDR,
  parseInput,
  isValidCIDR,
  isValidIPv4,
  isValidIPv6,
  parseIPv6,
  ipv4ToNumber,
  ipv6ToNumber,
  compareCIDR,
  sortCIDRs,
  aggregateCIDRs,
  generateDiff,
  renderDiff,
  showModal,
  hideModal,
  aggregateAddresses,
  copyResults,
  init,
};
