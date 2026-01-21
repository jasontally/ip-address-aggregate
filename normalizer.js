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

  // Pattern: IP/subnet mask (192.168.1.0/255.255.255.0) - must be checked before CIDR
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

  // Pattern: IP/CIDR (192.168.1.0/24) - checked after subnet mask
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

  // Pattern: IPv4 range
  const rangeResult = parseIPv4Range(trimmed, entry);
  if (rangeResult) return rangeResult;

  return null; // Not recognized as IPv4
}

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

    // Find the largest aligned block (start with smallest maxBits for largest block)
    while (maxBits > 0) {
      const blockSize = Math.pow(2, 32 - maxBits);
      if (current % blockSize !== 0) {
        maxBits++;
        break;
      }
      maxBits--;
    }
    if (maxBits < 1) maxBits = 1;

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

  // Check for valid IPv4 addresses before attempting to parse as range
  const hasHyphen = trimmed.includes("-");
  const hasColons = trimmed.includes(":");

  if (hasHyphen && !hasColons) {
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
  }

  return null;
}

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

  return null; // Not recognized as IPv6
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

/**
 * Normalize a single input entry
 * @param {string} entry - Single IP/CIDR entry
 * @returns {NormalizationResult}
 */
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

  const lines = input.split("\n");
  const results = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const entries = line.split(",");

    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length === 0) continue;

      const normalized = parseEntry(trimmed);
      if (normalized) {
        normalized.lineNumber = lineIdx + 1;
        results.push(normalized);
      } else {
        const spaceDelimited = parseSpaceDelimited(trimmed, lineIdx + 1);
        results.push(...spaceDelimited);
      }
    }
  }

  return results;
}

function parseEntry(entry) {
  const result = normalizeEntry(entry);
  return result.status !== NormalizationStatus.INVALID ? result : null;
}

function parseSpaceDelimited(entry, lineNumber) {
  const tokens = entry.split(/\s+/).filter((t) => t.trim().length > 0);

  if (tokens.length === 1) {
    const result = normalizeEntry(tokens[0]);
    result.lineNumber = lineNumber;
    return [result];
  }

  const results = [];

  for (const token of tokens) {
    const result = normalizeEntry(token);
    result.lineNumber = lineNumber;
    results.push(result);
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
export function expandIPv6Range(start, end) {
  return [];
}
