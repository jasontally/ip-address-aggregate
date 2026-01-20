/**
 * IP Address Aggregate
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { merge } from "https://esm.sh/fast-cidr-tools@0.3.4";
import { diffLines } from "https://esm.sh/diff@5.1.0";
import {
  normalizeInput,
  extractValidCIDRs,
  getNormalizationSummary,
  NormalizationStatus,
} from "./normalizer.js";

const IPVersion = {
  IPv4: "ipv4",
  IPv6: "ipv6",
};

function expandIPv6(address) {
  const bytes = parseIPv6(address);
  if (!bytes) return address;

  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    const val = (bytes[i] << 8) | bytes[i + 1];
    groups.push(val.toString(16).padStart(4, "0"));
  }
  return groups.join(":");
}

function compressIPv6(address) {
  const bytes = parseIPv6(address);
  if (!bytes) return address;

  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    const val = (bytes[i] << 8) | bytes[i + 1];
    groups.push(val.toString(16));
  }

  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

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
    // Special case: all zeros
    if (bestLength === groups.length) {
      return "::";
    }

    const compressed = [
      ...groups.slice(0, bestStart),
      "",
      ...groups.slice(bestStart + bestLength),
    ];
    let result = compressed.join(":");
    // Handle leading compression (::)
    if (result.startsWith(":") && !result.startsWith("::")) {
      result = "::" + result.slice(1);
    }
    // Handle trailing compression (::)
    if (result.endsWith(":") && !result.endsWith("::")) {
      result = result.slice(0, -1) + "::";
    }
    // Fix triple colons that might appear
    result = result.replace(/:::/g, "::");
    return result;
  }

  return groups.join(":");
}

function calculateIPv6ReverseDNS(cidrBlock) {
  const address = cidrBlock.toStartAddress();
  const expanded = expandIPv6(address);
  const hexString = expanded.replace(/:/g, "").padStart(32, "0");
  const reversedHex = hexString.split("").reverse().join("");
  const numHexDigits = Math.ceil(cidrBlock.prefix / 4);
  const reversedPrefix = reversedHex.substring(0, numHexDigits);
  const dotted = reversedPrefix.split("").join(".");
  if (dotted === "") {
    return "ip6.arpa";
  }
  return `${dotted}.ip6.arpa`;
}

function detectIPVersion(cidrString) {
  if (!cidrString || typeof cidrString !== "string") {
    throw new Error("Invalid CIDR format");
  }

  if (cidrString.startsWith("::") && cidrString.includes(".")) {
    return IPVersion.IPv6;
  }

  if (cidrString.includes(".") && !cidrString.includes(":")) {
    return IPVersion.IPv4;
  }

  if (cidrString.includes(":")) {
    return IPVersion.IPv6;
  }

  throw new Error("Invalid CIDR format: cannot detect IP version");
}

function normalizeAddress(address, version) {
  if (version === IPVersion.IPv6) {
    return expandIPv6(address);
  }
  return address;
}

function calculateStartAddress(cidrBlock) {
  if (cidrBlock.version === IPVersion.IPv4) {
    return ipv4ToNumber(cidrBlock.address);
  } else {
    return ipv6ToNumber(cidrBlock.address);
  }
}

function calculateEndAddress(cidrBlock) {
  if (cidrBlock.version === IPVersion.IPv4) {
    const numHosts = Math.pow(2, 32 - cidrBlock.prefix) - 1;
    return cidrBlock.startAddress + numHosts;
  } else {
    const numHosts = BigInt(2) ** BigInt(128 - cidrBlock.prefix) - BigInt(1);
    return cidrBlock.startAddress + numHosts;
  }
}

function numberToIPv4(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

function numberToIPv6(bigNum) {
  const bytes = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(bigNum & BigInt(255));
    bigNum = bigNum >> BigInt(8);
  }

  const groups = [];
  for (let i = 0; i < 16; i += 2) {
    const val = (bytes[i] << 8) | bytes[i + 1];
    groups.push(val.toString(16));
  }

  return groups.join(":");
}

class CIDRBlock {
  constructor(address, prefix, version) {
    this.address = normalizeAddress(address, version);
    this.prefix = prefix;
    this.version = version;
    this._expandedAddress =
      version === IPVersion.IPv6 ? expandIPv6(address) : address;
    this.startAddress = calculateStartAddress(this);
    this.endAddress = calculateEndAddress(this);
  }

  get expandedAddress() {
    return this._expandedAddress || this.address;
  }

  toCIDRString() {
    return this.version === IPVersion.IPv6
      ? compressIPv6(this.expandedAddress) + "/" + this.prefix
      : this.address + "/" + this.prefix;
  }

  static compressIPv6(address) {
    const bytes = [];
    for (let i = 0; i < 8; i++) {
      bytes[i] = Number((BigInt(address) >> BigInt(8 * i)) & BigInt(255));
    }
    return bytes.map((b, i) => b.toString(16).padStart(2, "0")).join(":");
  }

  toStartAddress() {
    if (this.version === IPVersion.IPv4) {
      return numberToIPv4(this.startAddress);
    } else {
      return compressIPv6(numberToIPv6(this.startAddress));
    }
  }

  toEndAddress() {
    if (this.version === IPVersion.IPv4) {
      return numberToIPv4(this.endAddress);
    } else {
      return compressIPv6(numberToIPv6(this.endAddress));
    }
  }

  getRange() {
    return [this.toStartAddress(), this.toEndAddress()];
  }

  toNetmask() {
    if (this.version === IPVersion.IPv6) {
      throw new Error("Netmask format is only available for IPv4 addresses");
    }

    const netmask = (~0 << (32 - this.prefix)) >>> 0;
    return numberToIPv4(netmask);
  }

  toWildcard() {
    if (this.version === IPVersion.IPv6) {
      throw new Error(
        "Wildcard mask format is only available for IPv4 addresses",
      );
    }

    const netmask = (~0 << (32 - this.prefix)) >>> 0;
    const wildcard = ~netmask >>> 0;
    return numberToIPv4(wildcard);
  }

  static fromCIDRString(cidrString) {
    const [address, prefix] = cidrString.split("/");
    const version = address.includes(".") ? IPVersion.IPv4 : IPVersion.IPv6;
    return new CIDRBlock(address, parseInt(prefix), version);
  }

  static fromBytes(bytes, prefix, version) {
    if (version === IPVersion.IPv4) {
      const num =
        (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
      const address = numberToIPv4(num);
      return new CIDRBlock(address, prefix, version);
    } else {
      let bigNum = BigInt(0);
      for (let i = 0; i < 16; i++) {
        bigNum = (bigNum << BigInt(8)) | BigInt(bytes[i]);
      }
      const address = numberToIPv6(bigNum);
      return new CIDRBlock(address, prefix, version);
    }
  }
}

class FormatTransformer {
  format(cidrBlocks) {
    throw new Error("Must implement format() method");
  }

  getName() {
    throw new Error("Must implement getName() method");
  }

  supportsIPv6() {
    return false;
  }
}

class CIDRFormatTransformer extends FormatTransformer {
  format(cidrBlocks) {
    return cidrBlocks.map((block) => block.toCIDRString()).join("\n");
  }

  getName() {
    return "cidr";
  }

  supportsIPv6() {
    return true;
  }
}

class CiscoACLTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];
    const ipv4Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv4);
    const ipv6Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv6);

    for (const block of ipv4Blocks) {
      const wildcard = block.toWildcard();
      lines.push(`access-list 101 permit ip ${block.address} ${wildcard} any`);
    }

    for (const block of ipv6Blocks) {
      lines.push(`ipv6 access-list FIREWALL permit ${block.toCIDRString()}`);
    }

    return lines.join("\n");
  }

  getName() {
    return "cisco-acl";
  }

  supportsIPv6() {
    return true;
  }
}

class CiscoPrefixListTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];
    const ipv4Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv4);
    const ipv6Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv6);

    let seqNum = 10;
    for (const block of ipv4Blocks) {
      lines.push(
        `ip prefix-list LIST seq ${seqNum} permit ${block.toCIDRString()} le ${block.prefix}`,
      );
      seqNum += 10;
    }

    seqNum = 10;
    for (const block of ipv6Blocks) {
      lines.push(
        `ipv6 prefix-list LIST6 seq ${seqNum} permit ${block.toCIDRString()} le ${block.prefix}`,
      );
      seqNum += 10;
    }

    return lines.join("\n");
  }

  getName() {
    return "cisco-prefix-list";
  }

  supportsIPv6() {
    return true;
  }
}

class CiscoWildcardTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    const ipv4Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv4);

    const ipv6Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv6);
    if (ipv6Blocks.length > 0) {
      console.warn(
        `CiscoWildcardTransformer skipped ${ipv6Blocks.length} IPv6 blocks`,
      );
    }

    for (const block of ipv4Blocks) {
      const wildcard = block.toWildcard();
      lines.push(`${block.address} ${wildcard}`);
    }

    return lines.join("\n");
  }

  getName() {
    return "cisco-wildcard";
  }

  supportsIPv6() {
    return false;
  }
}

class IPMaskTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    for (const block of cidrBlocks) {
      if (block.version === IPVersion.IPv4) {
        const netmask = block.toNetmask();
        lines.push(`${block.address} ${netmask}`);
      } else {
        lines.push(block.toCIDRString());
      }
    }

    return lines.join("\n");
  }

  getName() {
    return "ip-mask";
  }

  supportsIPv6() {
    return true;
  }
}

class FortigateTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];
    lines.push("config firewall addrgrp");
    lines.push('  edit "address_group"');

    for (const block of cidrBlocks) {
      lines.push(`    set member "${block.toCIDRString()}"`);
    }

    lines.push("  next");
    lines.push("end");

    return lines.join("\n");
  }

  getName() {
    return "fortigate";
  }

  supportsIPv6() {
    return true;
  }
}

class CiscoIPv6ACLTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    for (const block of cidrBlocks) {
      lines.push(`ipv6 access-list FIREWALL permit ${block.toCIDRString()}`);
    }

    return lines.join("\n");
  }

  getName() {
    return "cisco-ipv6-acl";
  }

  supportsIPv6() {
    return true;
  }
}

class JuniperIPv6Transformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];
    const ipv6Blocks = cidrBlocks.filter((b) => b.version === IPVersion.IPv6);

    lines.push("set security address-book global");

    for (let i = 0; i < ipv6Blocks.length; i++) {
      const block = ipv6Blocks[i];
      const [address, prefix] = block.toCIDRString().split("/");
      lines.push(`set address ADDR-${i} ${address} ${prefix}`);
    }

    if (ipv6Blocks.length > 0) {
      lines.push("set address address-set FIREWALL_LIST");
      for (let i = 0; i < ipv6Blocks.length; i++) {
        lines.push(`set address FIREWALL_LIST ADDR-${i}`);
      }
    }

    return lines.join("\n");
  }

  getName() {
    return "juniper-ipv6";
  }

  supportsIPv6() {
    return true;
  }
}

class IptablesTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    for (const block of cidrBlocks) {
      if (block.version === IPVersion.IPv4) {
        lines.push(`iptables -A INPUT -s ${block.toCIDRString()} -j ACCEPT`);
      } else if (block.version === IPVersion.IPv6) {
        lines.push(`ip6tables -A INPUT -s ${block.toCIDRString()} -j ACCEPT`);
      }
    }

    return lines.join("\n");
  }

  getName() {
    return "iptables";
  }

  supportsIPv6() {
    return true;
  }
}

class UFWTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    for (const block of cidrBlocks) {
      lines.push(`ufw allow from ${block.toCIDRString()}`);
    }

    return lines.join("\n");
  }

  getName() {
    return "ufw";
  }

  supportsIPv6() {
    return true;
  }
}

class PaloAltoTransformer extends FormatTransformer {
  format(cidrBlocks) {
    return cidrBlocks.map((block) => block.toCIDRString()).join("\n");
  }

  getName() {
    return "palo-alto";
  }

  supportsIPv6() {
    return true;
  }
}

class AWSSecurityGroupTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const rules = [];
    for (const block of cidrBlocks) {
      const rule = {
        IpProtocol: "-1",
        FromPort: -1,
        ToPort: -1,
        Description: `Allow from ${block.toCIDRString()}`,
      };
      if (block.version === IPVersion.IPv4) {
        rule.CidrIp = block.toCIDRString();
      } else {
        rule.CidrIpv6 = block.toCIDRString();
      }
      rules.push(rule);
    }
    return JSON.stringify({ Rules: rules }, null, 2);
  }

  getName() {
    return "aws-security-group";
  }

  supportsIPv6() {
    return true;
  }
}

class GCPFirewallTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const rules = [];
    for (const block of cidrBlocks) {
      const address = block.address;
      const name = "rule-" + address.replace(/\./g, "-").replace(/:/g, "-");
      const rule = {
        name: name,
        sourceRanges: [block.toCIDRString()],
        allowed: [{ IPProtocol: "TCP", ports: ["80", "443"] }],
      };
      rules.push(rule);
    }
    return JSON.stringify({ Rules: rules }, null, 2);
  }

  getName() {
    return "gcp-firewall";
  }

  supportsIPv6() {
    return true;
  }
}

class AzureNSGTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const rules = [];
    for (const block of cidrBlocks) {
      const address = block.address;
      const name = "rule-" + address.replace(/\./g, "-").replace(/:/g, "-");
      const rule = {
        name: name,
        properties: {
          sourceAddressPrefix: block.toCIDRString(),
          access: "Allow",
          priority: 1000,
        },
      };
      rules.push(rule);
    }
    return JSON.stringify({ rules: rules }, null, 2);
  }

  getName() {
    return "azure-nsg";
  }

  supportsIPv6() {
    return true;
  }
}

class ReverseDNSTransformer extends FormatTransformer {
  format(cidrBlocks) {
    const lines = [];

    for (const block of cidrBlocks) {
      if (block.version === IPVersion.IPv4) {
        const octets = block.address.split(".");
        const numOctets = Math.ceil(block.prefix / 8);
        const reversedOctets = octets.slice(0, numOctets).reverse();
        lines.push(`${reversedOctets.join(".")}.in-addr.arpa`);
      } else {
        const reverseDNS = calculateIPv6ReverseDNS(block);
        lines.push(reverseDNS);
      }
    }

    return lines.join("\n");
  }

  getName() {
    return "reverse-dns";
  }

  supportsIPv6() {
    return true;
  }
}

const FormatRegistry = {
  cidr: new CIDRFormatTransformer(),
  "cisco-acl": new CiscoACLTransformer(),
  "cisco-prefix-list": new CiscoPrefixListTransformer(),
  "cisco-wildcard": new CiscoWildcardTransformer(),
  "ip-mask": new IPMaskTransformer(),
  fortigate: new FortigateTransformer(),
  "cisco-ipv6-acl": new CiscoIPv6ACLTransformer(),
  "juniper-ipv6": new JuniperIPv6Transformer(),
  "palo-alto": new PaloAltoTransformer(),
  iptables: new IptablesTransformer(),
  ufw: new UFWTransformer(),
  "aws-sg": new AWSSecurityGroupTransformer(),
  "gcp-firewall": new GCPFirewallTransformer(),
  "azure-nsg": new AzureNSGTransformer(),
  "reverse-dns": new ReverseDNSTransformer(),
};

/** @type {string|null} Sorted input before aggregation (for diff) */
let sortedInput = null;

/** @type {string|null} Aggregated output */
let aggregatedOutput = null;

/** @type {string} Default transformation format */
let currentFormat = "cidr";

/** @type {string} Transformation timing - 'before' or 'after' aggregation */
let transformationTiming = "after";

/**
 * Apply format transformation to an array of CIDRBlock models
 * @param {CIDRBlock[]} cidrModels - Array of CIDRBlock instances
 * @param {string} formatName - Name of format to transform to
 * @returns {string} Formatted output string
 */
function transformToFormat(cidrModels, formatName) {
  const transformer = FormatRegistry[formatName];
  if (!transformer) {
    console.error(`Unknown format: ${formatName}`);
    return cidrModels.map((c) => c.toCIDRString()).join("\n");
  }

  return transformer.format(cidrModels);
}

/**
 * Sort CIDRBlock models by version (IPv4 first), then by start address, then by prefix
 * @param {CIDRBlock[]} cidrModels - Array of CIDRBlock instances
 * @returns {CIDRBlock[]} Sorted array of CIDRBlock models
 */
function sortCIDRModels(cidrModels) {
  return [...cidrModels].sort((a, b) => {
    if (a.version !== b.version) {
      return a.version === IPVersion.IPv4 ? -1 : 1;
    }

    if (a.version === IPVersion.IPv4) {
      if (a.startAddress !== b.startAddress) {
        return a.startAddress - b.startAddress;
      }
      return a.prefix - b.prefix;
    }

    const aExpanded = a.expandedAddress;
    const bExpanded = b.expandedAddress;

    if (aExpanded !== bExpanded) {
      return aExpanded < bExpanded ? -1 : 1;
    }

    if (a.version === IPVersion.IPv4) {
      if (a.startAddress !== b.startAddress) {
        return a.startAddress - b.startAddress;
      }
      return a.prefix - b.prefix;
    } else {
      if (a.startAddress !== b.startAddress) {
        return a.startAddress < b.startAddress ? -1 : 1;
      }
      return a.prefix - b.prefix;
    }
  });
}

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

/**
 * Main processing function
 * @returns {Promise<void>}
 */
async function aggregateAddresses() {
  const inputTextarea = document.getElementById("addressInput");
  const outputTextarea = document.getElementById("addressOutput");
  const errorDiv = document.getElementById("error");

  errorDiv.textContent = "";

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

  const startTime = Date.now();
  showModal();

  try {
    const cidrModels = cidrStrings.map((cidr) => {
      return CIDRBlock.fromCIDRString(cidr);
    });

    const sorted = sortCIDRModels(cidrModels);
    const sortedStrings = sorted.map((m) => m.toCIDRString());
    sortedInput = sortedStrings.join("\n");

    const aggregatedStrings = aggregateCIDRs(sortedStrings);
    const aggregatedModels = aggregatedStrings.map((s) => {
      return CIDRBlock.fromCIDRString(s);
    });
    aggregatedOutput = aggregatedStrings.join("\n");

    const sourceModels =
      transformationTiming === "before" ? sorted : aggregatedModels;
    const transformedOutput = transformToFormat(sourceModels, currentFormat);

    const diffParts = generateDiff(sortedStrings, aggregatedStrings);
    renderDiff(diffParts);

    outputTextarea.value = transformedOutput;

    const elapsedTime = Date.now() - startTime;
    const minTime = 1500;
    const remainingTime = Math.max(0, minTime - elapsedTime);

    await new Promise((resolve) => setTimeout(resolve, remainingTime));
  } catch (e) {
    errorDiv.textContent = `Error during transformation: ${e.message}`;
  } finally {
    hideModal();
  }
}

/**
 * Copy input to clipboard
 * @returns {Promise<void>}
 */
async function copyInput() {
  const inputTextarea = document.getElementById("addressInput");
  const copyBtn = document.querySelector(".copy-input-btn");

  if (!inputTextarea.value.trim()) {
    alert("No input to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(inputTextarea.value);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    const textareaCopy = document.createElement("textarea");
    textareaCopy.value = inputTextarea.value;
    textareaCopy.style.position = "fixed";
    textareaCopy.style.opacity = "0";
    document.body.appendChild(textareaCopy);
    textareaCopy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaCopy);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  }
}

/**
 * Copy output to clipboard
 * @returns {Promise<void>}
 */
async function copyOutput() {
  const outputTextarea = document.getElementById("addressOutput");
  const copyBtn = document.querySelector(".copy-output-btn");

  if (!outputTextarea.value.trim()) {
    alert("No output to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(outputTextarea.value);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    const textareaCopy = document.createElement("textarea");
    textareaCopy.value = outputTextarea.value;
    textareaCopy.style.position = "fixed";
    textareaCopy.style.opacity = "0";
    document.body.appendChild(textareaCopy);
    textareaCopy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaCopy);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  }
}

/**
 * Copy before column (sorted input) to clipboard
 * @returns {Promise<void>}
 */
async function copyBeforeColumn() {
  const beforeColumn = document.getElementById("beforeColumn");
  const copyBtn = document.querySelector(".copy-before-btn");

  if (!beforeColumn.textContent.trim()) {
    alert("No input to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(beforeColumn.textContent);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    const textareaCopy = document.createElement("textarea");
    textareaCopy.value = beforeColumn.textContent;
    textareaCopy.style.position = "fixed";
    textareaCopy.style.opacity = "0";
    document.body.appendChild(textareaCopy);
    textareaCopy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaCopy);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  }
}

/**
 * Copy after column (aggregated output) to clipboard
 * @returns {Promise<void>}
 */
async function copyAfterColumn() {
  const afterColumn = document.getElementById("afterColumn");
  const copyBtn = document.querySelector(".copy-after-btn");

  if (!afterColumn.textContent.trim()) {
    alert("No output to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(afterColumn.textContent);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    const textareaCopy = document.createElement("textarea");
    textareaCopy.value = afterColumn.textContent;
    textareaCopy.style.position = "fixed";
    textareaCopy.style.opacity = "0";
    document.body.appendChild(textareaCopy);
    textareaCopy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaCopy);

    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add("checkmark");
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.classList.remove("checkmark");
      copyBtn.innerHTML = originalContent;
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

window.processAddresses = aggregateAddresses;
window.aggregateAddresses = aggregateAddresses;
window.copyInput = copyInput;
window.copyOutput = copyOutput;
window.copyBeforeColumn = copyBeforeColumn;
window.copyAfterColumn = copyAfterColumn;

export {
  IPVersion,
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
  numberToIPv4,
  numberToIPv6,
  compareCIDR,
  sortCIDRs,
  aggregateCIDRs,
  generateDiff,
  renderDiff,
  showModal,
  hideModal,
  aggregateAddresses,
  copyInput,
  copyOutput,
  copyBeforeColumn,
  copyAfterColumn,
  init,
  expandIPv6,
  compressIPv6,
  calculateIPv6ReverseDNS,
  detectIPVersion,
  normalizeAddress,
  calculateStartAddress,
  calculateEndAddress,
  CIDRBlock,
  FormatTransformer,
  CIDRFormatTransformer,
  CiscoACLTransformer,
  CiscoPrefixListTransformer,
  CiscoWildcardTransformer,
  IPMaskTransformer,
  FortigateTransformer,
  CiscoIPv6ACLTransformer,
  JuniperIPv6Transformer,
  IptablesTransformer,
  UFWTransformer,
  PaloAltoTransformer,
  AWSSecurityGroupTransformer,
  GCPFirewallTransformer,
  AzureNSGTransformer,
  ReverseDNSTransformer,
  FormatRegistry,
  transformToFormat,
  sortCIDRModels,
};
