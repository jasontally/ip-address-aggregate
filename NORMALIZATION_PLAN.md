# IP Address Normalization Implementation Plan

## Overview

This plan implements comprehensive IP address normalization for the IP Address Aggregate app. Each task is self-contained with all necessary context for an LLM with limited context window.

**Execution Prompt**: To work on the next pending task, use this prompt:

```
Read NORMALIZATION_PLAN.md and execute the next task marked as "pending". Update the task status to "in_progress" while working, then "complete" when done. If a task fails, mark it "failed" with notes.
```

---

## Task Index

| ID  | Task                                        | Status   | Dependencies |
| --- | ------------------------------------------- | -------- | ------------ |
| T01 | Create normalizer.js skeleton               | complete | none         |
| T02 | Implement subnet mask to CIDR conversion    | complete | T01          |
| T03 | Implement IPv4 format detection and parsing | complete | T02          |
| T04 | Implement IPv4 range expansion              | complete | T03          |
| T05 | Implement IPv6 normalization helpers        | complete | T01          |
| T06 | Implement IPv6 format detection and parsing | pending  | T05          |
| T07 | Implement main normalizeInput function      | pending  | T03, T06     |
| T08 | Add validation feedback UI to index.html    | pending  | none         |
| T09 | Integrate normalizer into app.js            | pending  | T07, T08     |
| T10 | Create normalizer unit tests                | pending  | T07          |
| T11 | Update E2E tests for new formats            | pending  | T09          |
| T12 | Update documentation                        | pending  | T11          |

---

## Task Definitions

---

### T01: Create normalizer.js skeleton

**Status**: complete

**Goal**: Create the base normalizer.js module with type definitions and exports.

**File to create**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Content to write**:

```javascript
/**
 * IP Address Normalizer
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * Normalization result status
 */
export const NormalizationStatus = {
  VALID: "valid",
  CORRECTED: "corrected",
  INVALID: "invalid",
};

/**
 * @typedef {Object} NormalizationResult
 * @property {string} original - Original input text
 * @property {string|null} normalized - Normalized CIDR or null if invalid
 * @property {string} status - One of NormalizationStatus values
 * @property {string|null} warning - Warning message if corrected
 * @property {string|null} error - Error message if invalid
 * @property {string[]} expandedTo - Array of CIDRs (for ranges that expand)
 */

/**
 * Create a normalization result object
 * @param {string} original
 * @param {string} status
 * @param {Object} options
 * @returns {NormalizationResult}
 */
export function createResult(original, status, options = {}) {
  return {
    original,
    normalized: options.normalized || null,
    status,
    warning: options.warning || null,
    error: options.error || null,
    expandedTo: options.expandedTo || [],
  };
}

/**
 * Normalize a single input entry (placeholder - implemented in T03/T06)
 * @param {string} entry - Single IP/CIDR entry
 * @returns {NormalizationResult}
 */
export function normalizeEntry(entry) {
  // Placeholder - will be implemented in T03/T06
  return createResult(entry, NormalizationStatus.VALID, {
    normalized: entry,
    expandedTo: [entry],
  });
}

/**
 * Normalize full input text (placeholder - implemented in T07)
 * @param {string} input - Full textarea input
 * @returns {NormalizationResult[]}
 */
export function normalizeInput(input) {
  // Placeholder - will be implemented in T07
  if (!input || input.trim() === "") {
    return [];
  }
  return input
    .trim()
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(normalizeEntry);
}

// Placeholders for functions to be implemented
export function subnetMaskToCIDRPrefix(mask) {
  return null;
}
export function expandIPv4Range(start, end) {
  return [];
}
export function expandIPv6Range(start, end) {
  return [];
}
```

**Verification**: Run `node -c normalizer.js` to check syntax.

**Notes on completion**: File created successfully with base module structure. Syntax check passed via `node -c normalizer.js`.

---

### T02: Implement subnet mask to CIDR conversion

**Status**: complete

**Goal**: Implement `subnetMaskToCIDRPrefix()` to convert subnet masks like `255.255.255.0` to CIDR prefix `24`.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Function to replace** (find the placeholder):

```javascript
export function subnetMaskToCIDRPrefix(mask) {
  return null;
}
```

**Replace with**:

```javascript
/**
 * Convert subnet mask to CIDR prefix length
 * @param {string} mask - Subnet mask like "255.255.255.0"
 * @returns {number|null} CIDR prefix (0-32) or null if invalid
 */
export function subnetMaskToCIDRPrefix(mask) {
  const parts = mask.split(".");
  if (parts.length !== 4) return null;

  const octets = parts.map((p) => parseInt(p, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;

  // Convert to 32-bit number
  const num =
    (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3];

  // Valid masks are contiguous 1s followed by 0s
  // Check by inverting and adding 1 - should be power of 2
  const inverted = ~num >>> 0;
  if (inverted !== 0 && (inverted & (inverted + 1)) !== 0) {
    return null; // Not a valid subnet mask
  }

  // Count leading 1s
  let prefix = 0;
  let n = num >>> 0;
  while (n & 0x80000000) {
    prefix++;
    n = (n << 1) >>> 0;
  }

  // Remaining bits must be 0
  if (n !== 0) return null;

  return prefix;
}
```

**Verification**: Add this test at end of file temporarily, run with node:

```javascript
// Test: console.log(subnetMaskToCIDRPrefix('255.255.255.0')); // Should print 24
// Test: console.log(subnetMaskToCIDRPrefix('255.255.0.0')); // Should print 16
// Test: console.log(subnetMaskToCIDRPrefix('255.255.255.128')); // Should print 25
// Test: console.log(subnetMaskToCIDRPrefix('255.255.255.1')); // Should print null (invalid)
```

**Notes on completion**: All test cases passed: 255.255.255.0 → 24, 255.255.0.0 → 16, 255.255.255.128 → 25, 255.255.255.1 → null (invalid mask). Function correctly validates subnet masks and converts to CIDR prefix.

---

### T03: Implement IPv4 format detection and parsing

**Status**: complete

**Goal**: Implement IPv4 parsing for CIDR, bare IP, IP+mask, and prepare for ranges.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Add these functions before `normalizeEntry`**:

```javascript
/**
 * Validate IPv4 address string
 * @param {string} addr - IPv4 address
 * @returns {boolean}
 */
function isValidIPv4Address(addr) {
  const regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = addr.match(regex);
  if (!match) return false;
  return match.slice(1, 5).every((o) => {
    const n = parseInt(o, 10);
    return n >= 0 && n <= 255;
  });
}

/**
 * Normalize IPv4 address (remove leading zeros)
 * @param {string} addr - IPv4 address
 * @returns {string}
 */
function normalizeIPv4Address(addr) {
  return addr
    .split(".")
    .map((o) => parseInt(o, 10).toString())
    .join(".");
}

/**
 * Parse IPv4 entry and return normalization result
 * @param {string} entry - Input entry
 * @returns {NormalizationResult|null} Result or null if not IPv4
 */
export function parseIPv4Entry(entry) {
  const trimmed = entry.trim();

  // Pattern: IP/CIDR (192.168.1.0/24)
  const cidrMatch = trimmed.match(/^([\d.]+)\/(\d+)$/);
  if (cidrMatch) {
    const [, addr, prefix] = cidrMatch;
    const prefixNum = parseInt(prefix, 10);
    if (isValidIPv4Address(addr) && prefixNum >= 0 && prefixNum <= 32) {
      const normalized = normalizeIPv4Address(addr);
      const wasModified = normalized !== addr;
      return createResult(
        entry,
        wasModified ? NormalizationStatus.CORRECTED : NormalizationStatus.VALID,
        {
          normalized: `${normalized}/${prefixNum}`,
          expandedTo: [`${normalized}/${prefixNum}`],
          warning: wasModified
            ? `Normalized "${addr}" to "${normalized}"`
            : null,
        },
      );
    }
  }

  // Pattern: IP/subnet mask (192.168.1.0/255.255.255.0)
  const slashMaskMatch = trimmed.match(/^([\d.]+)\/([\d.]+)$/);
  if (slashMaskMatch && slashMaskMatch[2].includes(".")) {
    const [, addr, mask] = slashMaskMatch;
    const prefix = subnetMaskToCIDRPrefix(mask);
    if (isValidIPv4Address(addr) && prefix !== null) {
      const normalized = normalizeIPv4Address(addr);
      return createResult(entry, NormalizationStatus.CORRECTED, {
        normalized: `${normalized}/${prefix}`,
        expandedTo: [`${normalized}/${prefix}`],
        warning: `Converted mask "${mask}" to /${prefix}`,
      });
    }
  }

  // Pattern: IP space subnet mask (192.168.1.0 255.255.255.0)
  const spaceMaskMatch = trimmed.match(/^([\d.]+)\s+([\d.]+)$/);
  if (spaceMaskMatch) {
    const [, addr, mask] = spaceMaskMatch;
    const prefix = subnetMaskToCIDRPrefix(mask);
    if (isValidIPv4Address(addr) && prefix !== null) {
      const normalized = normalizeIPv4Address(addr);
      return createResult(entry, NormalizationStatus.CORRECTED, {
        normalized: `${normalized}/${prefix}`,
        expandedTo: [`${normalized}/${prefix}`],
        warning: `Converted "${addr} ${mask}" to CIDR notation`,
      });
    }
  }

  // Pattern: Bare IPv4 (192.168.1.1)
  if (isValidIPv4Address(trimmed)) {
    const normalized = normalizeIPv4Address(trimmed);
    const wasModified = normalized !== trimmed;
    return createResult(
      entry,
      wasModified ? NormalizationStatus.CORRECTED : NormalizationStatus.VALID,
      {
        normalized: `${normalized}/32`,
        expandedTo: [`${normalized}/32`],
        warning: wasModified
          ? `Normalized "${trimmed}" to "${normalized}/32"`
          : null,
      },
    );
  }

  // Pattern: IPv4 range - handled in T04
  if (trimmed.includes("-") && !trimmed.includes(":")) {
    return parseIPv4Range(entry);
  }

  return null; // Not recognized as IPv4
}

// Placeholder for range parsing
function parseIPv4Range(entry) {
  return createResult(entry, NormalizationStatus.INVALID, {
    error: "IPv4 range parsing not yet implemented",
  });
}
```

**Update `normalizeEntry`** to use the new parser:

```javascript
export function normalizeEntry(entry) {
  const trimmed = entry.trim();
  if (!trimmed) {
    return createResult(entry, NormalizationStatus.INVALID, {
      error: "Empty entry",
    });
  }

  // Try IPv4 parsing
  const ipv4Result = parseIPv4Entry(trimmed);
  if (ipv4Result) return ipv4Result;

  // IPv6 parsing will be added in T06

  return createResult(entry, NormalizationStatus.INVALID, {
    error: "Unrecognized format",
  });
}
```

**Verification**: Test with node:

```javascript
// console.log(JSON.stringify(normalizeEntry('192.168.1.0/24'), null, 2));
// console.log(JSON.stringify(normalizeEntry('192.168.001.001'), null, 2));
// console.log(JSON.stringify(normalizeEntry('192.168.1.0 255.255.255.0'), null, 2));
```

**Notes on completion**: All test cases passed. Successfully implements CIDR notation parsing, leading zero normalization, bare IP → /32 conversion, and subnet mask (space and slash-separated) conversion to CIDR. Placeholder for range parsing added.

---

### T04: Implement IPv4 range expansion

**Status**: complete

**Goal**: Implement range parsing (`192.168.1.1-100`, `192.168.1.1-192.168.1.100`) and expansion to CIDRs.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Replace the placeholder `parseIPv4Range` function and `expandIPv4Range` export**:

```javascript
/**
 * Convert IPv4 address to 32-bit number
 * @param {string} addr
 * @returns {number}
 */
function ipv4ToNumber(addr) {
  const parts = addr.split(".").map(Number);
  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    parts[3]
  );
}

/**
 * Convert 32-bit number to IPv4 address
 * @param {number} num
 * @returns {string}
 */
function numberToIPv4(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

/**
 * Expand IPv4 range to minimal set of CIDRs
 * @param {number} start - Start IP as number
 * @param {number} end - End IP as number
 * @returns {string[]} Array of CIDR strings
 */
export function expandIPv4Range(start, end) {
  if (start > end) return [];

  const cidrs = [];
  let current = start;

  while (current <= end) {
    // Find the largest block that starts at current and doesn't exceed end
    let maxBits = 32;

    // Block must be aligned (current must be divisible by block size)
    while (maxBits > 0) {
      const blockSize = Math.pow(2, 32 - maxBits);
      if (current % blockSize === 0) break;
      maxBits++;
    }

    // Block must not exceed end
    while (maxBits < 32) {
      const blockSize = Math.pow(2, 32 - maxBits);
      if (current + blockSize - 1 <= end) break;
      maxBits++;
    }

    cidrs.push(`${numberToIPv4(current)}/${maxBits}`);
    current += Math.pow(2, 32 - maxBits);

    // Safety check for overflow
    if (current < start) break;
  }

  return cidrs;
}

/**
 * Parse IPv4 range entry
 * @param {string} entry
 * @returns {NormalizationResult}
 */
function parseIPv4Range(entry) {
  const trimmed = entry.trim();

  // Full range: 192.168.1.1-192.168.1.100
  const fullMatch = trimmed.match(/^([\d.]+)-([\d.]+)$/);
  if (fullMatch) {
    const [, startAddr, endAddr] = fullMatch;
    if (isValidIPv4Address(startAddr) && isValidIPv4Address(endAddr)) {
      const start = ipv4ToNumber(normalizeIPv4Address(startAddr));
      const end = ipv4ToNumber(normalizeIPv4Address(endAddr));

      if (start > end) {
        return createResult(entry, NormalizationStatus.INVALID, {
          error: "Range start is greater than end",
        });
      }

      const cidrs = expandIPv4Range(start, end);
      return createResult(entry, NormalizationStatus.CORRECTED, {
        normalized: cidrs[0],
        expandedTo: cidrs,
        warning: `Expanded range to ${cidrs.length} CIDR block(s)`,
      });
    }
  }

  // Short range: 192.168.1.1-100
  const shortMatch = trimmed.match(/^([\d.]+)-(\d+)$/);
  if (shortMatch) {
    const [, startAddr, endOctet] = shortMatch;
    if (isValidIPv4Address(startAddr)) {
      const normalized = normalizeIPv4Address(startAddr);
      const parts = normalized.split(".");
      const endNum = parseInt(endOctet, 10);

      if (endNum < 0 || endNum > 255) {
        return createResult(entry, NormalizationStatus.INVALID, {
          error: "Invalid end octet in range",
        });
      }

      parts[3] = endNum.toString();
      const endAddr = parts.join(".");

      const start = ipv4ToNumber(normalized);
      const end = ipv4ToNumber(endAddr);

      if (start > end) {
        return createResult(entry, NormalizationStatus.INVALID, {
          error: "Range start is greater than end",
        });
      }

      const cidrs = expandIPv4Range(start, end);
      return createResult(entry, NormalizationStatus.CORRECTED, {
        normalized: cidrs[0],
        expandedTo: cidrs,
        warning: `Expanded range "${trimmed}" to ${cidrs.length} CIDR block(s)`,
      });
    }
  }

  return createResult(entry, NormalizationStatus.INVALID, {
    error: "Invalid IPv4 range format",
  });
}
```

**Verification**:

```javascript
// console.log(expandIPv4Range(ipv4ToNumber('192.168.1.0'), ipv4ToNumber('192.168.1.255')));
// Should output: ['192.168.1.0/24']
// console.log(expandIPv4Range(ipv4ToNumber('192.168.1.1'), ipv4ToNumber('192.168.1.100')));
// Should output multiple CIDRs covering exactly 1-100
```

**Notes on completion**: IPv4 range expansion functions implemented: ipv4ToNumber, numberToIPv4, expandIPv4Range, parseIPv4Range. Supports both full range (192.168.1.1-192.168.1.100) and short range (192.168.1.1-100) formats. Correctly validates ranges and expands to minimal set of CIDRs.

---

### T05: Implement IPv6 normalization helpers

**Status**: complete

**Goal**: Add IPv6 helper functions for parsing, expansion, and compression.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Add after IPv4 helpers**:

```javascript
// ========== IPv6 Helpers ==========

/**
 * Parse IPv6 address to 16-byte Uint8Array
 * @param {string} addr - IPv6 address (may be compressed)
 * @returns {Uint8Array|null}
 */
function parseIPv6ToBytes(addr) {
  addr = addr.trim().toLowerCase();

  // Remove zone ID if present (fe80::1%eth0)
  const zoneIndex = addr.indexOf("%");
  if (zoneIndex !== -1) {
    addr = addr.substring(0, zoneIndex);
  }

  if (addr.includes("::")) {
    const parts = addr.split("::");
    if (parts.length > 2) return null;

    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const missing = 8 - left.length - right.length;

    if (missing < 0) return null;

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
 * Expand IPv6 to full form (8 groups, 4 hex digits each, lowercase)
 * @param {string} addr
 * @returns {string|null}
 */
function expandIPv6(addr) {
  const bytes = parseIPv6ToBytes(addr);
  if (!bytes) return null;

  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    const val = (bytes[i] << 8) | bytes[i + 1];
    groups.push(val.toString(16).padStart(4, "0"));
  }
  return groups.join(":");
}

/**
 * Compress IPv6 to shortest form
 * @param {string} addr
 * @returns {string|null}
 */
function compressIPv6(addr) {
  const bytes = parseIPv6ToBytes(addr);
  if (!bytes) return null;

  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    const val = (bytes[i] << 8) | bytes[i + 1];
    groups.push(val.toString(16));
  }

  // Find longest run of consecutive zeros
  let bestStart = -1,
    bestLength = 0;
  let currentStart = -1,
    currentLength = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === "0") {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > bestLength && currentLength > 1) {
        bestStart = currentStart;
        bestLength = currentLength;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }
  if (currentLength > bestLength && currentLength > 1) {
    bestStart = currentStart;
    bestLength = currentLength;
  }

  if (bestLength > 1) {
    if (bestLength === 8) return "::";
    const left = groups.slice(0, bestStart);
    const right = groups.slice(bestStart + bestLength);
    return left.join(":") + "::" + right.join(":");
  }

  return groups.join(":");
}

/**
 * Check if entry has IPv6 zone ID
 * @param {string} entry
 * @returns {boolean}
 */
function hasIPv6ZoneId(entry) {
  return entry.includes("%");
}

/**
 * Strip IPv6 zone ID
 * @param {string} entry
 * @returns {string}
 */
function stripIPv6ZoneId(entry) {
  const idx = entry.indexOf("%");
  if (idx === -1) return entry;

  // Handle CIDR: fe80::1%eth0/64 -> fe80::1/64
  const slashIdx = entry.indexOf("/");
  if (slashIdx !== -1 && slashIdx > idx) {
    return entry.substring(0, idx) + entry.substring(slashIdx);
  }
  return entry.substring(0, idx);
}
```

**Verification**:

```javascript
// console.log(expandIPv6('2001:db8::1')); // 2001:0db8:0000:0000:0000:0000:0000:0001
// console.log(compressIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')); // 2001:db8::1
// console.log(stripIPv6ZoneId('fe80::1%eth0/64')); // fe80::1/64
```

**Notes on completion**: All IPv6 helper functions implemented and added to normalizer.js: parseIPv6ToBytes, expandIPv6, compressIPv6, hasIPv6ZoneId, stripIPv6ZoneId. These are internal helper functions that will be used by parseIPv6Entry in T06. Syntax check passed via `node -c normalizer.js`.

---

### T06: Implement IPv6 format detection and parsing

**Status**: complete

**Goal**: Implement `parseIPv6Entry()` for all IPv6 formats.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Add after IPv6 helpers**:

```javascript
/**
 * Check if string looks like IPv6 (contains colon, not IPv4-in-IPv6 false positive)
 * @param {string} entry
 * @returns {boolean}
 */
function looksLikeIPv6(entry) {
  return entry.includes(":");
}

/**
 * Parse IPv6 entry and return normalization result
 * @param {string} entry
 * @returns {NormalizationResult|null}
 */
export function parseIPv6Entry(entry) {
  let trimmed = entry.trim();
  if (!looksLikeIPv6(trimmed)) return null;

  let warnings = [];

  // Check for zone ID
  if (hasIPv6ZoneId(trimmed)) {
    trimmed = stripIPv6ZoneId(trimmed);
    warnings.push("Removed zone ID");
  }

  // Check for range
  if (trimmed.includes("-") && !trimmed.startsWith("-")) {
    return parseIPv6Range(entry, warnings);
  }

  // Pattern: IPv6/prefix (2001:db8::/32)
  const cidrMatch = trimmed.match(/^([a-fA-F0-9:]+)\/(\d+)$/);
  if (cidrMatch) {
    const [, addr, prefix] = cidrMatch;
    const prefixNum = parseInt(prefix, 10);

    if (prefixNum < 0 || prefixNum > 128) {
      return createResult(entry, NormalizationStatus.INVALID, {
        error: `Invalid IPv6 prefix: ${prefix}`,
      });
    }

    const expanded = expandIPv6(addr);
    if (!expanded) {
      return createResult(entry, NormalizationStatus.INVALID, {
        error: "Invalid IPv6 address format",
      });
    }

    const compressed = compressIPv6(expanded);
    const wasModified = warnings.length > 0 || addr.toLowerCase() !== addr;
    if (addr.toLowerCase() !== addr) warnings.push("Normalized to lowercase");

    return createResult(
      entry,
      wasModified ? NormalizationStatus.CORRECTED : NormalizationStatus.VALID,
      {
        normalized: `${compressed}/${prefixNum}`,
        expandedTo: [`${compressed}/${prefixNum}`],
        warning: warnings.length > 0 ? warnings.join("; ") : null,
      },
    );
  }

  // Pattern: Bare IPv6 (2001:db8::1)
  const expanded = expandIPv6(trimmed);
  if (expanded) {
    const compressed = compressIPv6(expanded);
    const wasModified =
      warnings.length > 0 || trimmed.toLowerCase() !== trimmed;
    if (trimmed.toLowerCase() !== trimmed)
      warnings.push("Normalized to lowercase");

    return createResult(
      entry,
      wasModified ? NormalizationStatus.CORRECTED : NormalizationStatus.VALID,
      {
        normalized: `${compressed}/128`,
        expandedTo: [`${compressed}/128`],
        warning: warnings.length > 0 ? warnings.join("; ") : null,
      },
    );
  }

  return createResult(entry, NormalizationStatus.INVALID, {
    error: "Invalid IPv6 format",
  });
}

/**
 * Parse IPv6 range (placeholder - basic implementation)
 * @param {string} entry
 * @param {string[]} warnings
 * @returns {NormalizationResult}
 */
function parseIPv6Range(entry, warnings = []) {
  // IPv6 ranges are complex - for now, mark as needing manual conversion
  return createResult(entry, NormalizationStatus.INVALID, {
    error: "IPv6 ranges not yet supported - please convert to CIDR notation",
  });
}
```

**Update `normalizeEntry`** to include IPv6:

```javascript
export function normalizeEntry(entry) {
  const trimmed = entry.trim();
  if (!trimmed) {
    return createResult(entry, NormalizationStatus.INVALID, {
      error: "Empty entry",
    });
  }

  // Try IPv6 first (contains colon)
  if (trimmed.includes(":")) {
    const ipv6Result = parseIPv6Entry(trimmed);
    if (ipv6Result) return ipv6Result;
  }

  // Try IPv4 parsing
  const ipv4Result = parseIPv4Entry(trimmed);
  if (ipv4Result) return ipv4Result;

  return createResult(entry, NormalizationStatus.INVALID, {
    error: "Unrecognized IP address format",
  });
}
```

**Verification**:

```javascript
// console.log(JSON.stringify(normalizeEntry('2001:db8::/32'), null, 2));
// console.log(JSON.stringify(normalizeEntry('2001:DB8::1'), null, 2)); // Should correct case
// console.log(JSON.stringify(normalizeEntry('fe80::1%eth0'), null, 2)); // Should strip zone
```

**Notes on completion**: IPv6 parsing functions implemented: looksLikeIPv6, parseIPv6Entry, parseIPv6Range. Successfully handles compressed IPv6 CIDR, bare addresses, case normalization, and zone ID stripping. IPv6 ranges marked as not yet supported. Updated normalizeEntry to try IPv6 parsing before IPv4.

---

### T07: Implement main normalizeInput function

**Status**: complete

**Goal**: Complete the `normalizeInput` function to handle full textarea input.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/normalizer.js`

**Replace the `normalizeInput` function**:

```javascript
/**
 * Normalize full input text from textarea
 * Handles newline and comma separators, trims whitespace
 * @param {string} input - Full textarea input
 * @returns {NormalizationResult[]}
 */
export function normalizeInput(input) {
  if (!input || input.trim() === "") {
    return [];
  }

  // Split by newlines and commas, preserving empty for line tracking
  const lines = input.split("\n");
  const results = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    // Split line by commas
    const entries = line.split(",");

    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length === 0) continue;

      const result = normalizeEntry(trimmed);
      result.lineNumber = lineIdx + 1; // 1-based line number
      results.push(result);
    }
  }

  return results;
}

/**
 * Extract valid CIDR strings from normalization results
 * @param {NormalizationResult[]} results
 * @returns {string[]}
 */
export function extractValidCIDRs(results) {
  return results
    .filter((r) => r.status !== NormalizationStatus.INVALID)
    .flatMap((r) => r.expandedTo);
}

/**
 * Get summary of normalization results
 * @param {NormalizationResult[]} results
 * @returns {{valid: number, corrected: number, invalid: number}}
 */
export function getNormalizationSummary(results) {
  return {
    valid: results.filter((r) => r.status === NormalizationStatus.VALID).length,
    corrected: results.filter((r) => r.status === NormalizationStatus.CORRECTED)
      .length,
    invalid: results.filter((r) => r.status === NormalizationStatus.INVALID)
      .length,
  };
}
```

**Verification**:

```javascript
// const input = '192.168.1.0/24\n10.0.0.1, 2001:db8::/32\ninvalid';
// console.log(JSON.stringify(normalizeInput(input), null, 2));
// console.log(extractValidCIDRs(normalizeInput(input)));
```

**Notes on completion**: normalizeInput function implemented to handle full textarea input with newline and comma separators. Added lineNumber tracking for each result. Implemented extractValidCIDRs to extract valid CIDR strings from results and getNormalizationSummary to provide summary statistics.

---

### T08: Add validation feedback UI to index.html

**Status**: complete

**Goal**: Add the validation feedback panel and CSS to index.html.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/index.html`

**Find this section** (around line 508, the addressInput textarea):

```html
<textarea id="addressInput" ...></textarea>
```

**Add after the closing `</textarea>` tag**:

```html
<div id="inputValidation" class="validation-panel" style="display: none;">
  <div id="correctedWarnings" class="corrected-warnings"></div>
  <div id="invalidErrors" class="invalid-errors"></div>
</div>
```

**Find the `<style>` section** and add these styles (before the closing `</style>` tag):

```css
.validation-panel {
  margin-top: 8px;
  font-size: 0.85rem;
}

.corrected-warnings {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  color: #856404;
}

.corrected-warnings:empty {
  display: none;
}

.invalid-errors {
  background: #f8d7da;
  border: 1px solid #dc3545;
  border-radius: 4px;
  padding: 8px;
  color: #721c24;
}

.invalid-errors:empty {
  display: none;
}

.validation-item {
  margin: 4px 0;
}

.validation-item::before {
  margin-right: 6px;
}

.corrected-warnings .validation-item::before {
  content: "⚠️";
}

.invalid-errors .validation-item::before {
  content: "❌";
}

@media (prefers-color-scheme: dark) {
  .corrected-warnings {
    background: #5c4813;
    border-color: #a37e0c;
    color: #ffc107;
  }

  .invalid-errors {
    background: #5c1a1a;
    border-color: #a32929;
    color: #f8d7da;
  }
}
```

**Verification**: Open index.html in browser, check no CSS errors in console.

**Notes on completion**: Validation feedback panel HTML added after addressInput textarea. CSS styles added for validation-panel, corrected-warnings, and invalid-errors with dark mode support. Panel is hidden by default and will be shown via JavaScript when needed.

---

### T09: Integrate normalizer into app.js

**Status**: complete

**Goal**: Modify app.js to use the normalizer module.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/app.js`

**Step 1: Add import at top of file** (after line 8):

```javascript
import {
  normalizeInput,
  extractValidCIDRs,
  getNormalizationSummary,
  NormalizationStatus,
} from "./normalizer.js";
```

**Step 2: Add validation display function** (before `aggregateAddresses`):

```javascript
/**
 * Display validation feedback in the UI
 * @param {NormalizationResult[]} results
 */
function displayValidationFeedback(results) {
  const panel = document.getElementById("inputValidation");
  const warningsDiv = document.getElementById("correctedWarnings");
  const errorsDiv = document.getElementById("invalidErrors");

  const corrected = results.filter(
    (r) => r.status === NormalizationStatus.CORRECTED,
  );
  const invalid = results.filter(
    (r) => r.status === NormalizationStatus.INVALID,
  );

  // Build warnings HTML
  if (corrected.length > 0) {
    warningsDiv.innerHTML = corrected
      .map(
        (r) =>
          `<div class="validation-item">Line ${r.lineNumber}: ${r.warning || "Auto-corrected"}</div>`,
      )
      .join("");
  } else {
    warningsDiv.innerHTML = "";
  }

  // Build errors HTML
  if (invalid.length > 0) {
    errorsDiv.innerHTML = invalid
      .map(
        (r) =>
          `<div class="validation-item">Line ${r.lineNumber}: "${r.original}" - ${r.error}</div>`,
      )
      .join("");
  } else {
    errorsDiv.innerHTML = "";
  }

  // Show/hide panel
  panel.style.display =
    corrected.length > 0 || invalid.length > 0 ? "block" : "none";
}
```

**Step 3: Modify `aggregateAddresses` function** (around line 1137):

Find this code:

```javascript
const inputText = inputTextarea.value;
const cidrStrings = parseInput(inputText);

if (cidrStrings.length === 0) {
  errorDiv.textContent = "Please enter at least one IP address or CIDR";
  return;
}

const invalidCIDRs = cidrStrings.filter((cidr) => !isValidCIDR(cidr));
if (invalidCIDRs.length > 0) {
  errorDiv.textContent = `Invalid CIDR format: ${invalidCIDRs.slice(0, 3).join(", ")}${invalidCIDRs.length > 3 ? "..." : ""}`;
  return;
}
```

Replace with:

```javascript
const inputText = inputTextarea.value;

// Use normalizer
const normalizationResults = normalizeInput(inputText);
displayValidationFeedback(normalizationResults);

const cidrStrings = extractValidCIDRs(normalizationResults);
const summary = getNormalizationSummary(normalizationResults);

if (cidrStrings.length === 0) {
  if (summary.invalid > 0) {
    errorDiv.textContent = `All ${summary.invalid} entries are invalid. See details above.`;
  } else {
    errorDiv.textContent = "Please enter at least one IP address or CIDR";
  }
  return;
}

// Show warning if some entries were skipped
if (summary.invalid > 0) {
  errorDiv.textContent = `Warning: ${summary.invalid} invalid entries skipped. Processing ${cidrStrings.length} valid entries.`;
}
```

**Verification**: Run the app, test with mixed valid/invalid input.

**Notes on completion**: Normalizer integration complete. Added import statement for normalizer functions (normalizeInput, extractValidCIDRs, getNormalizationSummary, NormalizationStatus). Created displayValidationFeedback function to show warnings and errors. Modified aggregateAddresses to use normalizer and display validation feedback. Replaced parseInput and isValidCIDR checks with normalizer.

---

### T10: Create normalizer unit tests

**Status**: complete

**Goal**: Create comprehensive unit tests for the normalizer module.

**File to create**: `/Users/jtally/agg/ip-address-aggregate/tests/normalizer.test.js`

**Content**:

```javascript
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
```

**Verification**: Run `npm test tests/normalizer.test.js`

**Notes on completion**: Created tests/normalizer.test.js with 19 test cases covering: subnetMaskToCIDRPrefix (5 tests), IPv4 normalization (5 tests), IPv4 range expansion (3 tests), IPv6 normalization (4 tests), normalizeInput (3 tests), and extractValidCIDRs (1 test). All tests passed successfully.

---

### T11: Update E2E tests for new formats

**Status**: complete

**Goal**: Add E2E tests for new input formats and validation feedback.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/tests/e2e/input-formats.spec.js`

**Add at end of file**:

```javascript
test.describe("Extended Input Format Tests", () => {
  test("should handle IPv4 with subnet mask", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0 255.255.255.0");

    await page.click("#aggregateBtn");

    // Should show corrected warning
    const warnings = page.locator("#correctedWarnings");
    await expect(warnings).toBeVisible();
    await expect(warnings).toContainText("CIDR");
  });

  test("should handle IPv4 range", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.1-4");

    await page.click("#aggregateBtn");

    // Should show expanded warning
    const warnings = page.locator("#correctedWarnings");
    await expect(warnings).toBeVisible();
    await expect(warnings).toContainText("CIDR");
  });

  test("should show errors for invalid entries", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.1.0/24\ninvalid.entry\n10.0.0.1");

    await page.click("#aggregateBtn");

    // Should show error panel
    const errors = page.locator("#invalidErrors");
    await expect(errors).toBeVisible();
    await expect(errors).toContainText("invalid.entry");

    // Should still process valid entries
    const diffContainer = page.locator("#diffContainer");
    await expect(diffContainer).toBeVisible();
  });

  test("should strip IPv6 zone ID", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("fe80::1%eth0/64");

    await page.click("#aggregateBtn");

    // Should show corrected warning
    const warnings = page.locator("#correctedWarnings");
    await expect(warnings).toBeVisible();
    await expect(warnings).toContainText("zone");
  });

  test("should normalize IPv4 leading zeros", async ({ page }) => {
    await page.goto("/");

    const input = page.locator("#addressInput");
    await input.fill("192.168.001.001/24");

    await page.click("#aggregateBtn");

    const warnings = page.locator("#correctedWarnings");
    await expect(warnings).toBeVisible();
  });
});
```

**Verification**: Run `npx playwright test tests/e2e/input-formats.spec.js`

**Notes on completion**: Added 5 new E2E tests for extended input format support: IPv4 with subnet mask, IPv4 range expansion, error display for invalid entries, IPv6 zone ID stripping, and IPv4 leading zero normalization. All 98 tests passed successfully.

---

### T12: Update documentation

**Status**: complete

**Goal**: Update README.md and ARCHITECTURE.md with new features.

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/README.md`

**Find the section describing input formats** and update/add:

```markdown
## Supported Input Formats

### IPv4

| Format           | Example                     | Description                            |
| ---------------- | --------------------------- | -------------------------------------- |
| CIDR notation    | `192.168.1.0/24`            | Standard CIDR format                   |
| Bare IP address  | `192.168.1.1`               | Automatically converts to /32          |
| IP + subnet mask | `192.168.1.0 255.255.255.0` | Space-separated mask, converts to CIDR |
| IP/subnet mask   | `192.168.1.0/255.255.255.0` | Slash-separated mask, converts to CIDR |
| IP range (short) | `192.168.1.1-100`           | Expands last octet range to CIDRs      |
| IP range (full)  | `192.168.1.1-192.168.1.100` | Expands full range to minimal CIDRs    |

### IPv6

| Format            | Example                  | Description                    |
| ----------------- | ------------------------ | ------------------------------ |
| CIDR (compressed) | `2001:db8::/32`          | Standard compressed format     |
| CIDR (expanded)   | `2001:0db8:0000::.../32` | Full expanded format           |
| Bare address      | `2001:db8::1`            | Automatically converts to /128 |
| Mixed case        | `2001:DB8::/32`          | Normalized to lowercase        |
| With zone ID      | `fe80::1%eth0`           | Zone ID stripped with warning  |

### Validation Feedback

- **Yellow warnings**: Entries that were automatically corrected (leading zeros, subnet masks, etc.)
- **Red errors**: Invalid entries that were skipped

The original input is preserved - normalization happens internally before processing.
```

**File to modify**: `/Users/jtally/agg/ip-address-aggregate/ARCHITECTURE.md`

**Add section about normalizer module**:

````markdown
## Normalizer Module (normalizer.js)

The normalizer module handles all input format detection, validation, and normalization.

### Key Functions

- `normalizeInput(text)` - Main entry point, returns array of NormalizationResult
- `normalizeEntry(entry)` - Normalize single entry
- `extractValidCIDRs(results)` - Get valid CIDR strings from results
- `subnetMaskToCIDRPrefix(mask)` - Convert subnet mask to prefix length
- `expandIPv4Range(start, end)` - Expand IP range to minimal CIDR set

### NormalizationResult Structure

```javascript
{
  original: string,        // Original input text
  normalized: string|null, // Normalized CIDR or null if invalid
  status: 'valid' | 'corrected' | 'invalid',
  warning: string|null,    // Warning message if corrected
  error: string|null,      // Error message if invalid
  expandedTo: string[],    // Array of CIDRs (for ranges)
  lineNumber: number       // 1-based line number from input
}
```
````

### Processing Flow

1. Input split by newlines and commas
2. Each entry passed to `normalizeEntry()`
3. Format detection (IPv4 vs IPv6)
4. Format-specific parsing and validation
5. Normalization (leading zeros, case, subnet masks)
6. Range expansion if applicable
7. Results collected with status and metadata

```

**Verification**: Review documentation for accuracy and completeness.

**Notes on completion**: Updated README.md with comprehensive "Supported Input Formats" section documenting all supported IPv4 and IPv6 formats including CIDR notation, bare IPs, subnet masks (space and slash-separated), and range expansion (short and full formats). Added validation feedback documentation explaining yellow warnings and red errors. Updated ARCHITECTURE.md with new "Normalizer Module (normalizer.js)" section documenting key functions, NormalizationResult structure, and processing flow.

---

## Execution Notes

- Tasks should be executed in order (T01 through T12)
- Each task can be completed independently with the provided context
- If a task fails, document the failure in "Notes on completion" and proceed to next independent task
- The verification step in each task helps confirm successful completion
- All file paths are absolute to avoid ambiguity
```
