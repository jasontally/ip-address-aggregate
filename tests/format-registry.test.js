/**
 * Format Registry tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  FormatRegistry,
  CIDRFormatTransformer,
  CiscoACLTransformer,
  CiscoPrefixListTransformer,
  CiscoWildcardTransformer,
  IPMaskTransformer,
  FortigateTransformer,
  CiscoIPv6ACLTransformer,
  JuniperIPv6Transformer,
  PaloAltoTransformer,
  IptablesTransformer,
  UFWTransformer,
  AWSSecurityGroupTransformer,
  GCPFirewallTransformer,
  AzureNSGTransformer,
  ReverseDNSTransformer,
  CIDRBlock,
  IPVersion,
} from "../app.js";

describe("FormatRegistry", () => {
  describe("Registry Completeness", () => {
    it("should contain all 15 expected transformer keys", () => {
      const expectedKeys = [
        "cidr",
        "cisco-acl",
        "cisco-prefix-list",
        "cisco-wildcard",
        "ip-mask",
        "fortigate",
        "cisco-ipv6-acl",
        "juniper-ipv6",
        "palo-alto",
        "iptables",
        "ufw",
        "aws-sg",
        "gcp-firewall",
        "azure-nsg",
        "reverse-dns",
      ];

      for (const key of expectedKeys) {
        expect(FormatRegistry[key]).toBeDefined();
      }
    });

    it("should have exactly 15 transformers registered", () => {
      const transformerCount = Object.keys(FormatRegistry).length;
      expect(transformerCount).toBe(15);
    });
  });

  describe("Transformer Instance Types", () => {
    it("should have CIDRFormatTransformer for 'cidr'", () => {
      const transformer = FormatRegistry.cidr;
      expect(transformer).toBeInstanceOf(CIDRFormatTransformer);
    });

    it("should have CiscoACLTransformer for 'cisco-acl'", () => {
      const transformer = FormatRegistry["cisco-acl"];
      expect(transformer).toBeInstanceOf(CiscoACLTransformer);
    });

    it("should have CiscoPrefixListTransformer for 'cisco-prefix-list'", () => {
      const transformer = FormatRegistry["cisco-prefix-list"];
      expect(transformer).toBeInstanceOf(CiscoPrefixListTransformer);
    });

    it("should have CiscoWildcardTransformer for 'cisco-wildcard'", () => {
      const transformer = FormatRegistry["cisco-wildcard"];
      expect(transformer).toBeInstanceOf(CiscoWildcardTransformer);
    });

    it("should have IPMaskTransformer for 'ip-mask'", () => {
      const transformer = FormatRegistry["ip-mask"];
      expect(transformer).toBeInstanceOf(IPMaskTransformer);
    });

    it("should have FortigateTransformer for 'fortigate'", () => {
      const transformer = FormatRegistry.fortigate;
      expect(transformer).toBeInstanceOf(FortigateTransformer);
    });

    it("should have CiscoIPv6ACLTransformer for 'cisco-ipv6-acl'", () => {
      const transformer = FormatRegistry["cisco-ipv6-acl"];
      expect(transformer).toBeInstanceOf(CiscoIPv6ACLTransformer);
    });

    it("should have JuniperIPv6Transformer for 'juniper-ipv6'", () => {
      const transformer = FormatRegistry["juniper-ipv6"];
      expect(transformer).toBeInstanceOf(JuniperIPv6Transformer);
    });

    it("should have PaloAltoTransformer for 'palo-alto'", () => {
      const transformer = FormatRegistry["palo-alto"];
      expect(transformer).toBeInstanceOf(PaloAltoTransformer);
    });

    it("should have IptablesTransformer for 'iptables'", () => {
      const transformer = FormatRegistry.iptables;
      expect(transformer).toBeInstanceOf(IptablesTransformer);
    });

    it("should have UFWTransformer for 'ufw'", () => {
      const transformer = FormatRegistry.ufw;
      expect(transformer).toBeInstanceOf(UFWTransformer);
    });

    it("should have AWSSecurityGroupTransformer for 'aws-sg'", () => {
      const transformer = FormatRegistry["aws-sg"];
      expect(transformer).toBeInstanceOf(AWSSecurityGroupTransformer);
    });

    it("should have GCPFirewallTransformer for 'gcp-firewall'", () => {
      const transformer = FormatRegistry["gcp-firewall"];
      expect(transformer).toBeInstanceOf(GCPFirewallTransformer);
    });

    it("should have AzureNSGTransformer for 'azure-nsg'", () => {
      const transformer = FormatRegistry["azure-nsg"];
      expect(transformer).toBeInstanceOf(AzureNSGTransformer);
    });

    it("should have ReverseDNSTransformer for 'reverse-dns'", () => {
      const transformer = FormatRegistry["reverse-dns"];
      expect(transformer).toBeInstanceOf(ReverseDNSTransformer);
    });
  });

  describe("Transformer Interface Compliance", () => {
    it("should have format method on all transformers", () => {
      const formatNames = Object.keys(FormatRegistry);

      for (const formatName of formatNames) {
        const transformer = FormatRegistry[formatName];
        expect(typeof transformer.format).toBe("function");
      }
    });

    it("should have getName method on all transformers", () => {
      const formatNames = Object.keys(FormatRegistry);

      for (const formatName of formatNames) {
        const transformer = FormatRegistry[formatName];
        expect(typeof transformer.getName).toBe("function");
      }
    });

    it("should have supportsIPv6 method on all transformers", () => {
      const formatNames = Object.keys(FormatRegistry);

      for (const formatName of formatNames) {
        const transformer = FormatRegistry[formatName];
        expect(typeof transformer.supportsIPv6).toBe("function");
      }
    });
  });

  describe("Transformer Names", () => {
    it("should return correct names from getName method", () => {
      expect(FormatRegistry.cidr.getName()).toBe("cidr");
      expect(FormatRegistry["cisco-acl"].getName()).toBe("cisco-acl");
      expect(FormatRegistry["cisco-prefix-list"].getName()).toBe(
        "cisco-prefix-list",
      );
      expect(FormatRegistry["cisco-wildcard"].getName()).toBe("cisco-wildcard");
      expect(FormatRegistry["ip-mask"].getName()).toBe("ip-mask");
      expect(FormatRegistry.fortigate.getName()).toBe("fortigate");
      expect(FormatRegistry["cisco-ipv6-acl"].getName()).toBe("cisco-ipv6-acl");
      expect(FormatRegistry["juniper-ipv6"].getName()).toBe("juniper-ipv6");
      expect(FormatRegistry["palo-alto"].getName()).toBe("palo-alto");
      expect(FormatRegistry.iptables.getName()).toBe("iptables");
      expect(FormatRegistry.ufw.getName()).toBe("ufw");
      expect(FormatRegistry["aws-sg"].getName()).toBe("aws-security-group");
      expect(FormatRegistry["gcp-firewall"].getName()).toBe("gcp-firewall");
      expect(FormatRegistry["azure-nsg"].getName()).toBe("azure-nsg");
      expect(FormatRegistry["reverse-dns"].getName()).toBe("reverse-dns");
    });
  });

  describe("Transformer Functionality", () => {
    it("should accept CIDRBlock array for format", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const transformer = FormatRegistry.cidr;

      expect(() => transformer.format([block])).not.toThrow();
    });

    it("should return string from format method", () => {
      const block = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const transformer = FormatRegistry.cidr;
      const result = transformer.format([block]);

      expect(typeof result).toBe("string");
      expect(result).toContain("192.168.1.0/24");
    });

    it("should handle multiple CIDRBlocks", () => {
      const block1 = new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4);
      const block2 = new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4);
      const transformer = FormatRegistry.cidr;
      const result = transformer.format([block1, block2]);

      expect(result).toContain("192.168.1.0/24");
      expect(result).toContain("10.0.0.0/8");
      expect(result).toContain("\n");
    });
  });

  describe("Registry Access Patterns", () => {
    it("should allow accessing transformers by string key", () => {
      const transformer = FormatRegistry["cidr"];
      expect(transformer).toBeDefined();
    });

    it("should allow accessing transformers by dot notation", () => {
      const transformer = FormatRegistry.cidr;
      expect(transformer).toBeDefined();
    });

    it("should return same instance for same key", () => {
      const instance1 = FormatRegistry.cidr;
      const instance2 = FormatRegistry.cidr;
      expect(instance1).toBe(instance2);
    });
  });
});
