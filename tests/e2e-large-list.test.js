/**
 * End-to-end test with large list of generated addresses
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import {
  aggregateCIDRs,
  isValidCIDR,
  CIDRBlock,
  normalizeToCIDR,
} from "../app.js";

describe("End-to-End Test: Large Address List", () => {
  const largeAddressList = [
    "81.154.6.165",
    "98.14.251.195",
    "1.155.239.128",
    "148.210.59.44",
    "213.77.150.208",
    "192.61.111.167",
    "170.118.187.143",
    "179.248.132.32",
    "96.187.173.235",
    "200.111.100.225",
    "231.10.216.237",
    "151.139.3.146",
    "246.173.210.193",
    "120.104.59.147",
    "127.28.142.244",
    "33.108.157.70",
    "228.136.245.112",
    "48.115.32.160",
    "49.135.15.180",
    "229.32.200.60",
    "e3b0:70c9:3e85:45e0:872:aaa4:7a83:d283",
    "52e5:7b8a:ceea:a811:3602:27ff:4f92:f1e4",
    "72e4:15c5:d23c:e0e5:6721:6fee:3ade:2289",
    "79b4:6614:3e5a:5dd5:fe13:c733:930:465b",
    "bf5:9948:bbc9:b461:b4ba:85c0:c6a2:1131",
    "2e3d:bfbe:b4c9:ff26:8b3f:45c0:b8b6:b582",
    "5e39:64ee:e595:d7a4:41e9:d992:63dd:7ba3",
    "3718:41cf:82a7:d7b9:e63:e0f5:5103:d41d",
    "d7d7:b8c6:c782:8ca7:d55a:d19a:e25f:6b8",
    "528b:e42:da52:56e5:f7c4:da51:f601:843a",
    "4997:24e8:c74a:b237:c9b:6763:8d80:14b4",
    "28c0:4ad3:f6b5:4507:6ef8:af2f:cd8f:5870",
    "e9fd:2390:ec92:b09:724a:9aae:e1fb:7b0a",
    "7c23:f728:212f:a427:1743:521b:2e7c:2c08",
    "5e2d:6357:693b:e61c:1fdf:fab8:170f:fc92",
    "82b5:b81d:baf2:824c:43a1:be4a:5d2d:815b",
    "9d94:a55d:3021:587e:80:103e:cc9e:a65a",
    "8250:f7fa:8af0:6ffc:7be6:31ed:b6fa:cf66",
    "d4f:3426:cc2:bc1e:6a23:6f34:93fa:5597",
    "620a:3e5a:a8d3:1342:ad5d:74a9:f134:3263",
    "228.39.95.32/29",
    "154.155.113.0/24",
    "218.120.178.0/24",
    "1.143.42.104/29",
    "9.0.163.128/29",
    "39.165.59.80/28",
    "144.150.5.32/27",
    "224.205.149.224/27",
    "228.113.191.192/26",
    "69.90.228.224/28",
    "84.163.19.0/24",
    "253.197.189.0/24",
    "95.155.135.124/30",
    "53.42.74.56/29",
    "253.55.37.144/30",
    "138.253.193.0/24",
    "205.20.146.0/25",
    "115.220.197.0/24",
    "26.93.239.0/24",
    "187.78.117.220/30",
    "224.203.89.0/24",
    "3.9.146.0/27",
    "207.238.68.128/25",
    "68.110.198.0/24",
    "137.109.133.84/30",
    "124.214.159.128/27",
    "114.116.26.224/27",
    "181.162.158.192/30",
    "57.45.187.224/30",
    "6.112.168.72/29",
    "cd7f:a1e7:4c93:2dd5:aee4:5064::/95",
    "efe3:31ae:ed96:f73b:6a28:b1d0::/93",
    "fbd5:be72:ac44:5802:2271:86e1:6680:0/105",
    "1287:6a66:c5b3:8993:e8e5:f66a:b600:0/104",
    "f6a9:c5df:1853:d835:af4a:9700::/88",
    "1918:3715:b425:2e5e:4000::/68",
    "ebcf:31bf:882a:ade2:6cdd:c000::/82",
    "9169:c556:438e:ad42:a339:5f4a:8000:0/97",
    "a9c7:f50d:3810:990b:d263:511::/96",
    "464f:a841:eccc:59d1:2947::/80",
    "9822:c3ca:113d:23f6:72e0:f3d3:df80:0/107",
    "a587:b944:688a:e4ee:5404::/79",
    "cb5:932:9edc:585d::/64",
    "2dc9:57c7:ad8e:691:bb35:4e50::/92",
    "3949:c8af:7197:ae46:3000::/68",
    "8abb:3bb2:b860:b707:4250::/76",
    "98f:c9b4:4bb6:b7b3:c90:18e5:4b20:c000/114",
    "5809:33e5:84d0:b9f5:ec4f:efeb:2300:0/104",
    "1af6:8224:bfba:571b:a1da:3ff0:f17c:0/110",
    "380:8660:85fd:60c:59d3:c600::/88",
    "fd68:5aa6:d1f6:edb:c180::/74",
    "bc94:a8df:653b:35ef:dbe3::/80",
    "1996:6137:e119:35cf:10a7:8a47:9eb0:0/108",
    "b07:5593:f307:b29d:cd65:cc25:c000:0/98",
    "e278:a64c:1a3f:a678:2dc3:bf8c:e3ab:c400/119",
    "8d7d:e609:474c:232c:1a48:5ea3::/98",
    "249:19a2:45d4:923f:d000::/68",
    "6c1c:9e18:6551:f49d:5ab0::/78",
    "503c:e45e:4fc5:7f46:8cfc:4000::/82",
    "c8d:21f3:3b92:ec15:9000::/68",
    "65.70.119.0/24",
    "65.70.120.0/24",
    "65.70.121.0/24",
    "65.70.122.0/24",
    "65.70.123.0/24",
    "18.6.0.0/16",
    "18.6.1.0/24",
    "18.6.2.0/24",
    "18.6.3.0/24",
    "18.6.1.0/25",
    "350b:fb60:2086:2b4e::/64",
    "350b:fb60:2086:2b4f::/64",
    "350b:fb60:2086:2b50::/64",
    "350b:fb60:2086:2b51::/64",
    "350b:fb60:2086:2b52::/64",
    "4b14:b350::/96",
    "4b14:b350::1:0/120",
    "4b14:b350::2:0/120",
    "4b14:b350::3:0/120",
    "4b14:b350::1:0/121",
    "165.222.76.64/28",
    "181.25.77.0/24",
    "181.25.78.0/24",
    "227.168.184.96/27",
    "211.252.41.60/30",
    "150.247.163.45",
    "624b:f16:9202:a168:8700::/76",
    "fbf0:f711:ed87:72c4:b78f:2493:d00e:9187",
    "11.16.0.0/16",
    "11.16.1.0/24",
    "103.132.130.192/27",
    "ea61:d3dd:f0d2:f8fe:536c:c749:e6dc:50f2",
    "4fa0:8e30:7d0f:5a5f:e988:4d98:cad5:7465",
    "44ce:4cd4:8403:4a37:2db7:3000::/84",
    "95.251.89.0/24",
    "95.251.90.0/24",
    "184.104.25.160/27",
    "4319:8fe:4c46:1a88:a000::/71",
    "214.199.134.128/28",
    "221.40.0.0/16",
    "221.40.1.0/24",
    "124.193.0.0/16",
    "124.193.1.0/24",
    "7ca3:9601:d48c:469e:a4a4:dd56:835f:2661",
    "275d:200d:e473:1013:ba0f:8766:55a2:4000/114",
    "ae:ca52:4452:8765:3fa4:16fc::/95",
    "48f7:56b9:ca45:d13a:6320::/75",
    "ef:a5cb:253b:2ce8:a034:8e0b:d25c:57df",
    "174.165.7.176/30",
    "4dd0:218a:f8bb:c341:3c91:dbb8:2c8c:410c",
    "63.49.0.0/16",
    "63.49.1.0/24",
    "153.21.0.0/16",
    "153.21.1.0/24",
    "184.106.246.41",
    "191.251.91.148",
    "136.35.65.196",
    "86.103.233.0/24",
    "86.103.234.0/24",
    "45.58.63.0/27",
    "89.130.0.0/16",
    "89.130.1.0/24",
    "211.238.248.0/24",
    "211.238.249.0/24",
    "3.144.49.216/30",
    "127.168.183.88/29",
    "80c:32f5:39cf:1bac:fa8:4048:e200:0/103",
    "183.166.36.0/25",
    "6cf9:ef5a:e56:ad6c:467e:d011:12e:0/112",
    "31.144.79.91",
    "135.181.0.0/16",
    "135.181.1.0/24",
    "190.251.0.0/16",
    "190.251.1.0/24",
    "103.65.22.0/25",
    "7ff:8056:aa:c6dc:e89a:1ef7:c000:0/98",
    "226.100.203.208/29",
    "32.243.0.0/16",
    "32.243.1.0/24",
    "210.116.66.28",
    "b2f1:5b69:d56d:6d89:e887:6d29:9436:30de",
    "43be:2d44:1a22:b786:1f99:9824:b56c:8f97",
    "168.118.211.0/24",
    "168.118.212.0/24",
  ];

  it("should validate all addresses in the large list", () => {
    const normalizedList = largeAddressList.map((addr) => {
      if (!addr.includes("/") && addr.includes(".")) {
        return `${addr}/32`;
      } else if (!addr.includes("/") && addr.includes(":")) {
        return `${addr}/128`;
      }
      return addr;
    });
    const invalidAddresses = [];

    for (const addr of normalizedList) {
      if (!isValidCIDR(addr)) {
        invalidAddresses.push(addr);
      }
    }

    expect(invalidAddresses).toHaveLength(0);
    console.log(`Validated ${normalizedList.length} addresses successfully`);
  });

  it("should aggregate the entire large list without errors", () => {
    const result = aggregateCIDRs(largeAddressList);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(largeAddressList.length);

    console.log(`Aggregated ${largeAddressList.length} addresses to ${result.length} CIDR blocks`);

    const reduction = largeAddressList.length - result.length;
    const reductionPercent = (reduction / largeAddressList.length * 100).toFixed(2);
    console.log(`Reduction: ${reduction} addresses (${reductionPercent}%)`);
  });

  it("should create CIDRBlock objects from aggregated results", () => {
    const aggregated = aggregateCIDRs(largeAddressList);
    const blocks = aggregated.map((cidr) => CIDRBlock.fromCIDRString(cidr));

    expect(blocks).toHaveLength(aggregated.length);

    for (const block of blocks) {
      expect(block).toBeDefined();
      expect(block.version).toBeDefined();
      expect(block.prefix).toBeGreaterThanOrEqual(0);
      expect(block.startAddress).toBeDefined();
      expect(block.endAddress).toBeDefined();
    }

    console.log(`Created ${blocks.length} CIDRBlock objects successfully`);
  });

  it("should maintain correct IP version distribution", () => {
    const aggregated = aggregateCIDRs(largeAddressList);
    const blocks = aggregated.map((cidr) => CIDRBlock.fromCIDRString(cidr));

    const ipv4Count = blocks.filter((b) => b.version === "ipv4").length;
    const ipv6Count = blocks.filter((b) => b.version === "ipv6").length;

    expect(ipv4Count).toBeGreaterThan(0);
    expect(ipv6Count).toBeGreaterThan(0);

    console.log(`IPv4 blocks: ${ipv4Count}, IPv6 blocks: ${ipv6Count}`);
  });
});
