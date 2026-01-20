# IP Address Aggregate

A static browser application for aggregating and consolidating IPv4 and IPv6 CIDR addresses. Merge overlapping and adjacent network ranges for cleaner network documentation.

**Live App:** [https://agg.jasontally.com](https://agg.jasontally.com)

## Features

- **IPv4 Support** - Aggregate IPv4 CIDR ranges
- **IPv6 Support** - Aggregate IPv6 CIDR ranges
- **Mixed Mode** - Process both IPv4 and IPv6 together
- **Smart Sorting** - IPv4 sorted first, then IPv6, each sorted numerically
- **Diff Visualization** - See what changed between input and output
- **Keyboard Shortcut** - Press Ctrl+Enter to aggregate quickly
- **Clipboard Export** - Individual copy buttons for input and output panels
- **Input Preservation** - Original input is preserved and displayed alongside output
- **Accessible** - WCAG AA compliant with screen reader support, keyboard navigation, and proper color contrast
- **Offline Ready** - Works entirely in the browser after loading

## Usage

1.  Enter IPv4 and/or IPv6 CIDR addresses in the Input box
    - One address per line, or
    - Comma-separated, or
    - Mixed newlines and commas
    - **Bare IP addresses** are auto-converted (e.g., `10.0.0.0` → `10.0.0.0/32`)
2.  Click **Aggregate** button (or press Ctrl+Enter) to merge overlapping
    and adjacent ranges.
3.  View the aggregated results in the Output box. Your original input
    is preserved in the Input box.
4.  View sorted input and aggregated output with diff highlighting below.
5.  Click the **Copy** button in either the Input or Output box to copy
    its contents to your clipboard.

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

### Example Input

```
192.168.1.0/25
192.168.1.128/25
10.0.0.0
10.0.0.1
10.0.0.2
10.0.0.3
2001:db8::/64
2001:db8:0:0:1::/64
```

### Example Output

```
10.0.0.0/30
192.168.1.0/24
2001:db8::/63
```

**Note:** Bare IP addresses (without prefix) are automatically converted to host routes:

- IPv4: `10.0.0.0` → `10.0.0.0/32`
- IPv6: `2001:db8::` → `2001:db8::/128`

## Output Formats

The application supports 15 output formats for generating network configurations across different vendors and platforms. All formats support both IPv4 and IPv6 unless noted otherwise.

### Format List

| Format Name      | IPv6 Support | Description                            |
| ---------------- | ------------ | -------------------------------------- |
| `cidr`           | ✅ Yes       | Standard CIDR notation (default)       |
| `cisco-acl`      | ✅ Yes       | Cisco IOS access control lists         |
| `cisco-prefix`   | ✅ Yes       | Cisco prefix-list for route-maps       |
| `cisco-wildcard` | ❌ No        | Cisco wildcard mask format (IPv4 only) |
| `ip-mask`        | ✅ Yes       | IP address with netmask                |
| `fortigate`      | ✅ Yes       | FortiGate firewall address groups      |
| `cisco-ipv6-acl` | ✅ Yes       | Cisco IPv6-specific access lists       |
| `juniper-ipv6`   | ✅ Yes       | Juniper SRX IPv6 firewall filters      |
| `iptables`       | ✅ Yes       | Linux iptables/ip6tables rules         |
| `ufw`            | ✅ Yes       | Uncomplicated Firewall rules           |
| `palo-alto`      | ✅ Yes       | Palo Alto Networks EDL format          |
| `aws-sg`         | ✅ Yes       | AWS Security Group JSON rules          |
| `gcp-firewall`   | ✅ Yes       | Google Cloud Platform firewall JSON    |
| `azure-nsg`      | ✅ Yes       | Azure Network Security Group JSON      |
| `reverse-dns`    | ✅ Yes       | Reverse DNS PTR records                |

### Format Examples

#### CIDR Format (Default)

Standard CIDR notation for both IPv4 and IPv6.

**Input:**

```

192.168.1.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

10.0.0.0/8
192.168.1.0/24
2001:db8::/32

```

#### Cisco ACL Format

Cisco IOS access control lists with wildcard masks for IPv4 and CIDR notation for IPv6.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

access-list 101 permit ip 10.0.0.0 0.255.255.255 any
access-list 101 permit ip 192.168.0.0 0.0.0.255 any
ipv6 access-list FIREWALL permit 2001:db8::/32

```

#### Cisco Prefix List Format

Cisco prefix-list for route-map filtering with sequence numbers.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

ip prefix-list LIST seq 10 permit 10.0.0.0/8 le 8
ip prefix-list LIST seq 20 permit 192.168.0.0/24 le 24
ipv6 prefix-list LIST6 seq 10 permit 2001:db8::/32 le 32

```

#### Cisco Wildcard Format

Cisco wildcard mask format (IPv4 only). IPv6 addresses are skipped with a warning.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

10.0.0.0 0.255.255.255
192.168.0.0 0.0.0.255

```

#### IP Mask Format

IP address with netmask for IPv4, CIDR notation for IPv6.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

10.0.0.0 255.0.0.0
192.168.0.0 255.255.255.0
2001:db8::/32

```

#### FortiGate Format

FortiGate firewall configuration CLI syntax.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

config firewall addrgrp
edit "GROUP_NAME"
set member "10.0.0.0/8"
set member "192.168.0.0/24"
set member "2001:db8::/32"
next
end

```

#### Cisco IPv6 ACL Format

Dedicated IPv6 access list format (IPv6 addresses only).

**Input:**

```

192.168.0.0/24
2001:db8::/32
2001:db8:0:1::/48

```

**Output:**

```

ipv6 access-list FIREWALL permit 2001:db8::/32
ipv6 access-list FIREWALL permit 2001:db8:0:1::/48

```

#### Juniper IPv6 Format

Juniper SRX firewall address-book and address-set configuration (IPv6 addresses only).

**Input:**

```

192.168.0.0/24
2001:db8::/32
2001:db8:0:1::/48

```

**Output:**

```

set security address-book global
set address ADDR-0 2001:db8:: 32
set address ADDR-1 2001:db8:0:1:: 48
set address address-set FIREWALL_LIST
set address FIREWALL_LIST ADDR-0
set address FIREWALL_LIST ADDR-1

```

#### Iptables Format

Linux firewall rules - iptables for IPv4, ip6tables for IPv6.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

iptables -A INPUT -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -s 192.168.0.0/24 -j ACCEPT
ip6tables -A INPUT -s 2001:db8::/32 -j ACCEPT

```

#### UFW Format

Uncomplicated Firewall rules.

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/48

```

**Output:**

```

ufw allow from 10.0.0.0/8
ufw allow from 192.168.0.0/24
ufw allow from 2001:db8::/48

```

#### Palo Alto Format

Palo Alto Networks External Dynamic List format (one CIDR per line).

**Input:**

```

192.168.0.0/24
10.0.0.0/8
2001:db8::/32

```

**Output:**

```

10.0.0.0/8
192.168.0.0/24
2001:db8::/32

```

#### AWS Security Group Format

AWS Security Group rules in JSON format with CidrIp for IPv4 and CidrIpv6 for IPv6.

**Input:**

```

192.168.0.0/24
2001:db8::/32

```

**Output:**

```json
{
  "Rules": [
    {
      "IpProtocol": "-1",
      "FromPort": -1,
      "ToPort": -1,
      "CidrIp": "192.168.0.0/24",
      "Description": "Allow from 192.168.0.0/24"
    },
    {
      "IpProtocol": "-1",
      "FromPort": -1,
      "ToPort": -1,
      "CidrIpv6": "2001:db8::/32",
      "Description": "Allow from 2001:db8::/32"
    }
  ]
}
```

#### GCP Firewall Format

Google Cloud Platform firewall rules in JSON format.

**Input:**

```
192.168.0.0/24
2001:db8::/32
```

**Output:**

```json
{
  "Rules": [
    {
      "name": "rule-192-168-0-0",
      "sourceRanges": ["192.168.0.0/24"],
      "allowed": [{ "IPProtocol": "TCP", "ports": ["80", "443"] }]
    },
    {
      "name": "rule-2001-db8-0",
      "sourceRanges": ["2001:db8::/32"],
      "allowed": [{ "IPProtocol": "TCP", "ports": ["80", "443"] }]
    }
  ]
}
```

#### Azure NSG Format

Azure Network Security Group rules in JSON format.

**Input:**

```
192.168.0.0/24
2001:db8::/32
```

**Output:**

```json
{
  "rules": [
    {
      "name": "rule-192-168-0-0",
      "properties": {
        "sourceAddressPrefix": "192.168.0.0/24",
        "access": "Allow",
        "priority": 1000
      }
    },
    {
      "name": "rule-2001-db8-0",
      "properties": {
        "sourceAddressPrefix": "2001:db8::/32",
        "access": "Allow",
        "priority": 1000
      }
    }
  ]
}
```

#### Reverse DNS Format

Reverse DNS zone records - reversed octets for IPv4, nibble reversal for IPv6.

**Input:**

```
192.168.0.0/24
10.0.0.0/8
2001:db8::/32
```

**Output:**

```
0.0.10.in-addr.arpa
0.168.192.in-addr.arpa
0.8.b.d.0.0.8.db8.ip6.arpa
```

## Development

### Installation

```bash
npm install
```

### Running Tests

```bash
# Run unit tests
npm test

# Run unit tests with UI
npm run test:ui

# Run unit tests once
npm run test:run

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (visible browser)
npm run test:e2e:headed
```

### Running Locally

```bash
npx serve . -p 8082
```

Then open http://localhost:8082 in your browser.

## Testing

The project includes comprehensive E2E test coverage validating IP address aggregation functionality.

### Test Coverage

**19 Comprehensive Scenarios:**

- IPv4: adjacent, overlapping, non-overlapping, non-adjacent merging
- IPv6: adjacent, overlapping, non-overlapping, non-adjacent merging
- IPv6 compression: full expansion, zero-compressed, mixed case, leading zeros
- Bare IPs: auto-conversion to /32 (IPv4) and /128 (IPv6)
- Mixed: IPv4 + IPv6 together, sorting validation
- Input formats: newline, comma, mixed separators, extra whitespace
- Diff highlighting: removed (red), added (green), unchanged
- Input preservation: original format remains in input box

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with specific browser
npm run test:e2e -- --project chromium

# Run with UI mode
npm run test:e2e:ui
```

See `ARCHITECTURE.md` for complete testing strategy.

### Code Coverage

Target: 80% code coverage across statements, branches, functions, and lines.

## Architecture

- **Single HTML file** (`index.html`) with embedded CSS
- **Single JavaScript module** (`app.js`) as ES6 module
- **No build process** - works directly in browsers
- **No runtime framework dependencies** - vanilla JavaScript
- **cidr-tools** for CIDR aggregation logic
- **diff** for diff visualization

See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details.

## Credits

Created by [Jason Tally](https://JasonTally.com). Code is available on [GitHub](https://github.com/jasontally/ip-address-aggregate).

## License

MIT License - see LICENSE file for details.
