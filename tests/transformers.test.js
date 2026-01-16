/**
 * Format Transformers tests
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from "vitest";
import {
  CIDRBlock,
  IPVersion,
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
} from "../app.js";

describe("Format Transformers", () => {
  describe("CIDR Format Transformer", () => {
    it("should output CIDR notation for IPv4", () => {
      const transformer = new CIDRFormatTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe("192.168.1.0/24\n10.0.0.0/8");
    });

    it("should support IPv6", () => {
      const transformer = new CIDRFormatTransformer();
      const blocks = [
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
        new CIDRBlock("fe80::", 10, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "2001:0db8:0000:0000:0000:0000:0000:0000/32\nfe80:0000:0000:0000:0000:0000:0000:0000/10",
      );
    });

    it("should handle mixed IPv4/IPv6", () => {
      const transformer = new CIDRFormatTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "192.168.1.0/24\n2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new CIDRFormatTransformer();
      expect(transformer.getName()).toBe("cidr");
    });

    it("should support IPv6", () => {
      const transformer = new CIDRFormatTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Cisco ACL Transformer", () => {
    it("should format IPv4 ACL rules", () => {
      const transformer = new CiscoACLTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "access-list 101 permit ip 192.168.1.0 0.0.0.255 any\naccess-list 101 permit ip 10.0.0.0 0.255.255.255 any",
      );
    });

    it("should format IPv6 ACL rules", () => {
      const transformer = new CiscoACLTransformer();
      const blocks = [
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
        new CIDRBlock("fe80::", 10, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ipv6 access-list FIREWALL permit 2001:0db8:0000:0000:0000:0000:0000:0000/32\nipv6 access-list FIREWALL permit fe80:0000:0000:0000:0000:0000:0000:0000/10",
      );
    });

    it("should handle mixed IPv4/IPv6", () => {
      const transformer = new CiscoACLTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "access-list 101 permit ip 192.168.1.0 0.0.0.255 any\nipv6 access-list FIREWALL permit 2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new CiscoACLTransformer();
      expect(transformer.getName()).toBe("cisco-acl");
    });

    it("should support IPv6", () => {
      const transformer = new CiscoACLTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Cisco Prefix List Transformer", () => {
    it("should format IPv4 prefix-list", () => {
      const transformer = new CiscoPrefixListTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ip prefix-list LIST seq 10 permit 192.168.1.0/24 le 24\nip prefix-list LIST seq 20 permit 10.0.0.0/8 le 8",
      );
    });

    it("should format IPv6 prefix-list", () => {
      const transformer = new CiscoPrefixListTransformer();
      const blocks = [
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
        new CIDRBlock("fe80::", 10, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ipv6 prefix-list LIST6 seq 10 permit 2001:0db8:0000:0000:0000:0000:0000:0000/32 le 32\nipv6 prefix-list LIST6 seq 20 permit fe80:0000:0000:0000:0000:0000:0000:0000/10 le 10",
      );
    });

    it("should handle mixed IPv4/IPv6", () => {
      const transformer = new CiscoPrefixListTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ip prefix-list LIST seq 10 permit 192.168.1.0/24 le 24\nipv6 prefix-list LIST6 seq 10 permit 2001:0db8:0000:0000:0000:0000:0000:0000/32 le 32",
      );
    });

    it("should return correct name", () => {
      const transformer = new CiscoPrefixListTransformer();
      expect(transformer.getName()).toBe("cisco-prefix-list");
    });

    it("should support IPv6", () => {
      const transformer = new CiscoPrefixListTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Cisco Wildcard Transformer", () => {
    it("should format IPv4 with wildcard mask", () => {
      const transformer = new CiscoWildcardTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe("192.168.1.0 0.0.0.255\n10.0.0.0 0.255.255.255");
    });

    it("should skip IPv6 with warning", () => {
      const transformer = new CiscoWildcardTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const consoleSpy = vi.spyOn(console, "warn");
      const result = transformer.format(blocks);
      expect(result).toBe("");
      expect(consoleSpy).toHaveBeenCalledWith(
        "CiscoWildcardTransformer skipped 1 IPv6 blocks",
      );
      consoleSpy.mockRestore();
    });

    it("should return correct name", () => {
      const transformer = new CiscoWildcardTransformer();
      expect(transformer.getName()).toBe("cisco-wildcard");
    });

    it("should not support IPv6", () => {
      const transformer = new CiscoWildcardTransformer();
      expect(transformer.supportsIPv6()).toBe(false);
    });
  });

  describe("IP Mask Transformer", () => {
    it("should format IPv4 with netmask", () => {
      const transformer = new IPMaskTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe("192.168.1.0 255.255.255.0\n10.0.0.0 255.0.0.0");
    });

    it("should format IPv6 with CIDR", () => {
      const transformer = new IPMaskTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const result = transformer.format(blocks);
      expect(result).toBe("2001:0db8:0000:0000:0000:0000:0000:0000/32");
    });

    it("should handle mixed input", () => {
      const transformer = new IPMaskTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "192.168.1.0 255.255.255.0\n2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new IPMaskTransformer();
      expect(transformer.getName()).toBe("ip-mask");
    });

    it("should support IPv6", () => {
      const transformer = new IPMaskTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Fortigate Transformer", () => {
    it("should format IPv4 addresses", () => {
      const transformer = new FortigateTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        'config firewall addrgrp\n  edit "address_group"\n    set member "192.168.1.0/24"\n    set member "10.0.0.0/8"\n  next\nend',
      );
    });

    it("should format IPv6 addresses", () => {
      const transformer = new FortigateTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const result = transformer.format(blocks);
      expect(result).toBe(
        'config firewall addrgrp\n  edit "address_group"\n    set member "2001:0db8:0000:0000:0000:0000:0000:0000/32"\n  next\nend',
      );
    });

    it("should handle mixed IPv4/IPv6", () => {
      const transformer = new FortigateTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        'config firewall addrgrp\n  edit "address_group"\n    set member "192.168.1.0/24"\n    set member "2001:0db8:0000:0000:0000:0000:0000:0000/32"\n  next\nend',
      );
    });

    it("should return correct name", () => {
      const transformer = new FortigateTransformer();
      expect(transformer.getName()).toBe("fortigate");
    });

    it("should support IPv6", () => {
      const transformer = new FortigateTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Cisco IPv6 ACL Transformer", () => {
    it("should format IPv6 ACL rules", () => {
      const transformer = new CiscoIPv6ACLTransformer();
      const blocks = [
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
        new CIDRBlock("fe80::", 10, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ipv6 access-list FIREWALL permit 2001:0db8:0000:0000:0000:0000:0000:0000/32\nipv6 access-list FIREWALL permit fe80:0000:0000:0000:0000:0000:0000:0000/10",
      );
    });

    it("should return correct name", () => {
      const transformer = new CiscoIPv6ACLTransformer();
      expect(transformer.getName()).toBe("cisco-ipv6-acl");
    });

    it("should support IPv6", () => {
      const transformer = new CiscoIPv6ACLTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Juniper IPv6 Transformer", () => {
    it("should format Juniper address-set", () => {
      const transformer = new JuniperIPv6Transformer();
      const blocks = [
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
        new CIDRBlock("fe80::", 10, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "set security address-book global\nset address ADDR-0 2001:0db8:0000:0000:0000:0000:0000:0000 32\nset address ADDR-1 fe80:0000:0000:0000:0000:0000:0000:0000 10\nset address address-set FIREWALL_LIST\nset address FIREWALL_LIST ADDR-0\nset address FIREWALL_LIST ADDR-1",
      );
    });

    it("should return correct name", () => {
      const transformer = new JuniperIPv6Transformer();
      expect(transformer.getName()).toBe("juniper-ipv6");
    });

    it("should support IPv6", () => {
      const transformer = new JuniperIPv6Transformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Iptables Transformer", () => {
    it("should generate iptables rules", () => {
      const transformer = new IptablesTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT\niptables -A INPUT -s 10.0.0.0/8 -j ACCEPT",
      );
    });

    it("should generate ip6tables rules", () => {
      const transformer = new IptablesTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ip6tables -A INPUT -s 2001:0db8:0000:0000:0000:0000:0000:0000/32 -j ACCEPT",
      );
    });

    it("should generate mixed rules", () => {
      const transformer = new IptablesTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT\nip6tables -A INPUT -s 2001:0db8:0000:0000:0000:0000:0000:0000/32 -j ACCEPT",
      );
    });

    it("should return correct name", () => {
      const transformer = new IptablesTransformer();
      expect(transformer.getName()).toBe("iptables");
    });

    it("should support IPv6", () => {
      const transformer = new IptablesTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("UFW Transformer", () => {
    it("should format UFW allow rules", () => {
      const transformer = new UFWTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "ufw allow from 192.168.1.0/24\nufw allow from 2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new UFWTransformer();
      expect(transformer.getName()).toBe("ufw");
    });

    it("should support IPv6", () => {
      const transformer = new UFWTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Palo Alto Transformer", () => {
    it("should output one CIDR per line", () => {
      const transformer = new PaloAltoTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("10.0.0.0", 8, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe(
        "192.168.1.0/24\n10.0.0.0/8\n2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new PaloAltoTransformer();
      expect(transformer.getName()).toBe("palo-alto");
    });

    it("should support IPv6", () => {
      const transformer = new PaloAltoTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("AWS Security Group Transformer", () => {
    it("should generate JSON with IPv4 CidrIp", () => {
      const transformer = new AWSSecurityGroupTransformer();
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformer.format(blocks);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("Rules");
      expect(parsed.Rules).toHaveLength(1);
      expect(parsed.Rules[0]).toHaveProperty("CidrIp", "192.168.1.0/24");
      expect(parsed.Rules[0]).not.toHaveProperty("CidrIpv6");
    });

    it("should generate JSON with IPv6 CidrIpv6", () => {
      const transformer = new AWSSecurityGroupTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const result = transformer.format(blocks);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("Rules");
      expect(parsed.Rules).toHaveLength(1);
      expect(parsed.Rules[0]).toHaveProperty(
        "CidrIpv6",
        "2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
      expect(parsed.Rules[0]).not.toHaveProperty("CidrIp");
    });

    it("should generate JSON with mixed versions", () => {
      const transformer = new AWSSecurityGroupTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("Rules");
      expect(parsed.Rules).toHaveLength(2);
      expect(parsed.Rules[0]).toHaveProperty("CidrIp", "192.168.1.0/24");
      expect(parsed.Rules[1]).toHaveProperty(
        "CidrIpv6",
        "2001:0db8:0000:0000:0000:0000:0000:0000/32",
      );
    });

    it("should return correct name", () => {
      const transformer = new AWSSecurityGroupTransformer();
      expect(transformer.getName()).toBe("aws-security-group");
    });

    it("should support IPv6", () => {
      const transformer = new AWSSecurityGroupTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("GCP Firewall Transformer", () => {
    it("should generate GCP firewall JSON", () => {
      const transformer = new GCPFirewallTransformer();
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformer.format(blocks);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("Rules");
      expect(parsed.Rules).toHaveLength(1);
      expect(parsed.Rules[0]).toHaveProperty("name", "rule-192-168-1-0");
      expect(parsed.Rules[0]).toHaveProperty("sourceRanges", [
        "192.168.1.0/24",
      ]);
      expect(parsed.Rules[0]).toHaveProperty("allowed");
      expect(parsed.Rules[0].allowed).toHaveLength(1);
    });

    it("should return correct name", () => {
      const transformer = new GCPFirewallTransformer();
      expect(transformer.getName()).toBe("gcp-firewall");
    });

    it("should support IPv6", () => {
      const transformer = new GCPFirewallTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Azure NSG Transformer", () => {
    it("should generate Azure NSG JSON", () => {
      const transformer = new AzureNSGTransformer();
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformer.format(blocks);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("rules");
      expect(parsed.rules).toHaveLength(1);
      expect(parsed.rules[0]).toHaveProperty("name", "rule-192-168-1-0");
      expect(parsed.rules[0]).toHaveProperty("properties");
      expect(parsed.rules[0].properties).toHaveProperty(
        "sourceAddressPrefix",
        "192.168.1.0/24",
      );
    });

    it("should return correct name", () => {
      const transformer = new AzureNSGTransformer();
      expect(transformer.getName()).toBe("azure-nsg");
    });

    it("should support IPv6", () => {
      const transformer = new AzureNSGTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Reverse DNS Transformer", () => {
    it("should generate IPv4 reverse DNS", () => {
      const transformer = new ReverseDNSTransformer();
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformer.format(blocks);
      expect(result).toBe("1.168.192.in-addr.arpa");
    });

    it("should generate IPv6 reverse DNS", () => {
      const transformer = new ReverseDNSTransformer();
      const blocks = [new CIDRBlock("2001:db8::", 32, IPVersion.IPv6)];
      const result = transformer.format(blocks);
      expect(result).toBe("0.0.0.0.0.0.0.0.ip6.arpa");
    });

    it("should handle mixed input", () => {
      const transformer = new ReverseDNSTransformer();
      const blocks = [
        new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4),
        new CIDRBlock("2001:db8::", 32, IPVersion.IPv6),
      ];
      const result = transformer.format(blocks);
      expect(result).toBe("1.168.192.in-addr.arpa\n0.0.0.0.0.0.0.0.ip6.arpa");
    });

    it("should return correct name", () => {
      const transformer = new ReverseDNSTransformer();
      expect(transformer.getName()).toBe("reverse-dns");
    });

    it("should support IPv6", () => {
      const transformer = new ReverseDNSTransformer();
      expect(transformer.supportsIPv6()).toBe(true);
    });
  });

  describe("Format Registry", () => {
    it("should contain all 15 transformers", () => {
      expect(FormatRegistry).toHaveProperty("cidr");
      expect(FormatRegistry).toHaveProperty("cisco-acl");
      expect(FormatRegistry).toHaveProperty("cisco-prefix-list");
      expect(FormatRegistry).toHaveProperty("cisco-wildcard");
      expect(FormatRegistry).toHaveProperty("ip-mask");
      expect(FormatRegistry).toHaveProperty("fortigate");
      expect(FormatRegistry).toHaveProperty("cisco-ipv6-acl");
      expect(FormatRegistry).toHaveProperty("juniper-ipv6");
      expect(FormatRegistry).toHaveProperty("palo-alto");
      expect(FormatRegistry).toHaveProperty("iptables");
      expect(FormatRegistry).toHaveProperty("ufw");
      expect(FormatRegistry).toHaveProperty("aws-sg");
      expect(FormatRegistry).toHaveProperty("gcp-firewall");
      expect(FormatRegistry).toHaveProperty("azure-nsg");
      expect(FormatRegistry).toHaveProperty("reverse-dns");
    });

    it("should provide access to transformer instances", () => {
      expect(FormatRegistry.cidr).toBeInstanceOf(CIDRFormatTransformer);
      expect(FormatRegistry["cisco-acl"]).toBeInstanceOf(CiscoACLTransformer);
      expect(FormatRegistry.iptables).toBeInstanceOf(IptablesTransformer);
    });
  });

  describe("transformToFormat Function", () => {
    it("should apply CIDR transformer", () => {
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformToFormat(blocks, "cidr");
      expect(result).toBe("192.168.1.0/24");
    });

    it("should apply Cisco ACL transformer", () => {
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const result = transformToFormat(blocks, "cisco-acl");
      expect(result).toBe(
        "access-list 101 permit ip 192.168.1.0 0.0.0.255 any",
      );
    });

    it("should handle unknown format gracefully", () => {
      const blocks = [new CIDRBlock("192.168.1.0", 24, IPVersion.IPv4)];
      const consoleSpy = vi.spyOn(console, "error");
      const result = transformToFormat(blocks, "unknown-format");
      expect(result).toBe("192.168.1.0/24");
      expect(consoleSpy).toHaveBeenCalledWith("Unknown format: unknown-format");
      consoleSpy.mockRestore();
    });
  });
});
