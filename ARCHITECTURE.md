# IP Address Aggregate - Architecture

## Overview

IP Address Aggregate is a static single-page web application that runs entirely in the browser after loading HTML, JavaScript, and CSS. It follows the same technical approach as the [v6plan](../v6plan/) application.

## Technical Stack

- **HTML5** - Single HTML file with embedded CSS
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **CSS3** - Minimal, responsive styling
- **cidr-tools** - Dependency-free CIDR manipulation library
- **diff** (jsdiff) - Diff visualization library

## File Structure

````
ip-aggregate/
├── index.html           # HTML with embedded CSS
├── app.js               # ES6 module with all logic
├── package.json         # npm config with test scripts
├── vitest.config.js     # Unit test config
├── playwright.config.js # E2E test config
├── README.md            # Usage documentation
├── ARCHITECTURE.md      # Technical docs (this file)
└── tests/
    ├── parse.test.js          # Input parsing tests
    ├── aggregate.test.js      # Aggregation logic tests
    ├── diff.test.js           # Diff generation tests
    ├── models.test.js         # CIDRBlock model tests
    ├── transformers.test.js   # Format transformer tests
    ├── ipv6.test.js          # IPv6 utility tests
    └── e2e/
        ├── basic-flow.spec.js                    # Main user flow
        ├── input-formats.spec.js                 # Various input formats
        ├── copy-button.spec.js                  # Clipboard functionality
        └── error-handling.spec.js              # Invalid input scenarios
    ├── tests.md                            # Comprehensive test scenarios with inputs/outputs
    └── coverage/                              # Coverage report data

## Core Modules

### Data Models

#### CIDRBlock Class

Rich model representing both IPv4 and IPv6 CIDR blocks with version awareness.

**Properties:**

- `address` - Normalized address string
- `prefix` - Prefix length (0-32 for IPv4, 0-128 for IPv6)
- `version` - IPVersion enum (IPv4 or IPv6)
- `startAddress` - Numeric representation for comparison (number for IPv4, bigint for IPv6)
- `endAddress` - Calculated end of range

**Instance Methods:**

- `toCIDRString()` - Returns CIDR notation for both versions
- `toStartAddress()` - Returns first IP in range as string
- `toEndAddress()` - Returns last IP in range as string
- `getRange()` - Returns [startAddress, endAddress] tuple
- `toNetmask()` - Returns netmask (IPv4 only, throws for IPv6)
- `toWildcard()` - Returns wildcard mask (IPv4 only, throws for IPv6)

**Static Factory Methods:**

- `fromCIDRString(cidrString)` - Create instance from CIDR notation string
- `fromBytes(bytes, prefix, version)` - Create instance from byte array

### Input Parsing

- `parseInput(input)` - Parse text into array of CIDR strings
  - Handles newlines, commas, and mixed separators
  - Filters empty entries and trims whitespace
  - Auto-normalizes bare addresses to /32 or /128

### Validation

- `isValidCIDR(cidr)` - Validate CIDR notation (both IPv4 and IPv6)
- `isValidIPv4(address, prefix)` - Validate IPv4 address and prefix
- `isValidIPv6(address, prefix)` - Validate IPv6 address and prefix
- `parseIPv6(addr)` - Parse IPv6 address to 16-byte array

### Normalizer Module (normalizer.js)

The normalizer module handles all input format detection, validation, and normalization.

#### Key Functions

- `normalizeInput(text)` - Main entry point, returns array of NormalizationResult
- `normalizeEntry(entry)` - Normalize single entry
- `extractValidCIDRs(results)` - Get valid CIDR strings from results
- `subnetMaskToCIDRPrefix(mask)` - Convert subnet mask to prefix length
- `expandIPv4Range(start, end)` - Expand IP range to minimal CIDR set
- `getNormalizationSummary(results)` - Get summary statistics

#### NormalizationResult Structure

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
````

#### Processing Flow

1. Input split by newlines and commas
2. Each entry passed to `normalizeEntry()`
3. Format detection (IPv4 vs IPv6)
4. Format-specific parsing and validation
5. Normalization (leading zeros, case, subnet masks)
6. Range expansion if applicable
7. Results collected with status and metadata

### IPv6 Utilities

- `expandIPv6(address)` - Expand compressed IPv6 notation (:: to full 8 hextets)
- `compressIPv6(address)` - Compress IPv6 with :: notation
- `calculateIPv6ReverseDNS(cidrBlock)` - Generate PTR record format (.ip6.arpa)
- `detectIPVersion(cidrString)` - Auto-detect IP version from CIDR string

### Sorting

- `compareCIDR(a, b)` - Compare two CIDR strings
  - IPv4 before IPv6
  - Sorted numerically by address, then by prefix
- `sortCIDRs(cidrs)` - Sort array of CIDR strings
- `sortCIDRModels(cidrModels)` - Sort CIDRBlock models with version awareness

### Aggregation

- `aggregateCIDRs(cidrs)` - Aggregate using cidr-tools `merge()` function
  - Merges overlapping ranges
  - Merges adjacent ranges
  - Handles IPv4 and IPv6 separately

### Transformation Engine

#### FormatTransformer Base Class

Abstract base class for all output format transformers.

**Methods:**

- `format(cidrBlocks)` - Format CIDR blocks to output string
- `getName()` - Get transformer name
- `supportsIPv6()` - Check if transformer supports IPv6

#### Format Registry

Central registry of all format transformers:

- `cidr` - Default CIDR notation
- `cisco-acl` - Cisco ACL format (IPv4 wildcard, IPv6 CIDR)
- `cisco-prefix-list` - Cisco prefix-list format
- `cisco-wildcard` - Cisco wildcard mask (IPv4 only)
- `ip-mask` - IP + netmask format (IPv4 netmask, IPv6 CIDR)
- `fortigate` - FortiGate config CLI syntax
- `cisco-ipv6-acl` - Dedicated IPv6 ACL format
- `juniper-ipv6` - Juniper SRX IPv6 firewall syntax
- `iptables` - Linux iptables/ip6tables rules
- `ufw` - UFW firewall rules
- `palo-alto` - Palo Alto EDL format
- `aws-sg` - AWS Security Group JSON format
- `gcp-firewall` - GCP firewall JSON format
- `azure-nsg` - Azure NSG JSON format
- `reverse-dns` - Reverse DNS PTR records

#### State Management

- `currentFormat` - Current output format (default: "cidr")
- `transformationTiming` - When to apply format ("before" or "after" aggregation)
- `transformToFormat(cidrModels, formatName)` - Apply format transformation

### Diff Visualization

- `generateDiff(before, after)` - Generate line-by-line diff using jsdiff
- `renderDiff(diffParts)` - Render diff to DOM with color coding

### UI Interaction

- `showModal()` - Show processing modal with spinner
- `hideModal()` - Hide processing modal
- `aggregateAddresses()` - Main aggregation workflow
  - Validates input
  - Converts to CIDRBlock models
  - Sorts addresses with version awareness
  - Aggregates ranges
  - Applies format transformation
  - Renders output to output textarea (preserving input)
  - Renders diff
  - Ensures minimum 1.5s modal display
- `copyInput()` - Copy input textarea contents to clipboard with feedback
- `copyOutput()` - Copy output textarea contents to clipboard with feedback

## Data Flow

```
User Input (Input textarea - preserved)
    ↓
parseInput() - Parse and normalize CIDR strings
    ↓
validate each CIDR
    ↓
Convert to CIDRBlock models (with version detection)
    ↓
sortCIDRModels() (IPv4 first, then IPv6, each sorted numerically)
    ↓
aggregateCIDRs() using cidr-tools merge()
    ↓
Convert aggregated strings back to CIDRBlock models
    ↓
transformToFormat() - Apply selected output format
    ├── before aggregation: Transform sorted models
    └── after aggregation: Transform aggregated models
    ↓
Display transformed output in Output textarea (Input remains unchanged)
    ↓
generateDiff() comparing sorted vs aggregated
    ↓
renderDiff() with color coding
    ↓
User can copy input or output using individual copy buttons
```

## Transformation Architecture

### Transformer Categories

#### IPv4-Only Formats

- **cisco-wildcard** - Traditional Cisco wildcard mask format
  - Skips IPv6 blocks with console warning
  - Uses inverted netmask (0.0.0.255 instead of 255.255.255.0)

#### IPv6-Only Formats

- **cisco-ipv6-acl** - Dedicated IPv6 access list rules
- **juniper-ipv6** - Juniper SRX firewall filters

#### Dual-Version Formats

- **cidr** - Standard CIDR notation (default)
- **cisco-acl** - Cisco ACL with different syntax per version
- **cisco-prefix-list** - Cisco route-map prefix lists
- **ip-mask** - Netmask for IPv4, CIDR for IPv6
- **fortigate** - FortiGate config CLI
- **iptables** - Linux iptables/ip6tables
- **ufw** - UFW firewall rules
- **palo-alto** - Palo Alto EDL format

#### Cloud Provider Formats

- **aws-sg** - AWS Security Group JSON (CidrIp vs CidrIpv6)
- **gcp-firewall** - GCP firewall JSON
- **azure-nsg** - Azure Network Security Group JSON

#### Utility Formats

- **reverse-dns** - PTR record format (.in-addr.arpa vs .ip6.arpa)

### Version Splitting Pattern

Transformers supporting both versions typically use this pattern:

```javascript
format(cidrBlocks) {
  const lines = [];
  const ipv4Blocks = cidrBlocks.filter(b => b.version === IPVersion.IPv4);
  const ipv6Blocks = cidrBlocks.filter(b => b.version === IPVersion.IPv6);

  // Process IPv4
  for (const block of ipv4Blocks) {
    lines.push(/* IPv4-specific format */);
  }

  // Process IPv6
  for (const block of ipv6Blocks) {
    lines.push(/* IPv6-specific format */);
  }

  return lines.join("\n");
}
```

### Error Handling

- Version guards throw informative errors for incorrect method calls
- Unknown format defaults to CIDR output
- Invalid CIDR strings caught before transformation
- IPv6 blocks skipped with warnings in IPv4-only formats

## Key Design Decisions

### Single File Architecture

- HTML, CSS, and JS are separate files (not a single file like some projects)
- CSS is embedded in HTML in a `<style>` block
- JS is a separate ES6 module
- No build step required

### Model-Based Architecture

- CIDRBlock class encapsulates all address and range logic
- Version-aware properties (IPv4 vs IPv6)
- Factory methods for easy instantiation from strings or bytes
- Version guards prevent incorrect method calls (e.g., netmask on IPv6)

### Transformation Engine

- Strategy pattern with pluggable format transformers
- Each transformer implements FormatTransformer base class
- FormatRegistry provides centralized access to all formats
- Transformers can support IPv4 only, IPv6 only, or both
- Dual-version formats split processing by IP version

### Separation of IPv4 and IPv6

- IPv4 addresses are always sorted before IPv6 addresses
- Within each IP version, sorting is numerical (not lexical)
- Aggregation is handled separately by cidr-tools
- Version detected automatically from address format
- Mixed inputs handled gracefully (IPv4 and IPv6 in same list)

### Modal Timing

- Modal displays for minimum 1.5 seconds
- Ensures user perceives processing even for fast operations
- Provides visual feedback for all operations

### Transformation Pipeline

- Timing control: Transform before or after aggregation
- Default behavior: CIDR format after aggregation (backward compatible)
- Version-aware formats handle IPv4 and IPv6 differently
- JSON transformers output structured data for cloud providers
- Format capabilities tracked via `supportsIPv6()` method

### IPv6-Specific Features

- Full support for compressed (::) and expanded IPv6 notation
- Automatic expansion/compression for internal processing
- Nibble-based reverse DNS generation (.ip6.arpa)
- Bigint arithmetic for 128-bit address comparisons
- CIDR notation preferred over netmask/wildcard formats

### Diff Visualization

- Two-column layout showing "Before" and "After"
- Red highlighting for removed lines (sorted → aggregated)
- Green highlighting for added lines (aggregated → sorted)
- Standard diff colors (#ffecec for removed, #eaffea for added)

### Keyboard Shortcut

- Ctrl+Enter (or Cmd+Enter on Mac) triggers aggregation
- Provides power user efficiency
- Common pattern for form submissions

## Testing Strategy

### Unit Tests (Vitest)

- **Input parsing** - Various separators, whitespace, edge cases
- **Validation** - IPv4, IPv6, CIDR format validation
- **Sorting** - IPv4/IPv6 ordering, numerical sorting
- **Aggregation** - Adjacent and overlapping range merging
- **Diff generation** - Line-by-line comparison logic
- **Diff rendering** - DOM manipulation and styling
- **CIDRBlock models** - Model instantiation, methods, version guards
- **Transformers** - All 15 format transformers with IPv4/IPv6/mixed inputs
- **IPv6 utilities** - Compression, expansion, reverse DNS generation

### E2E Tests (Playwright)

- **Basic flow** - Complete aggregation workflow
- **Input formats** - Various input formats and edge cases
- **Copy buttons** - Individual clipboard functionality for input and output
- **Input preservation** - Verify original input remains unchanged after aggregation
- **Error handling** - Invalid input scenarios
- **Comprehensive aggregation** - 19 scenarios validating:
  - IPv4: adjacent, overlapping, non-overlapping, non-adjacent merging
  - IPv6: adjacent, overlapping, non-overlapping, non-adjacent merging
  - IPv6 compression: full expansion, zero-compressed, mixed case, leading zeros
  - Bare IPs: auto-conversion to /32 (IPv4) and /128 (IPv6)
  - Mixed: IPv4 + IPv6 together, sorting validation
  - Input formats: newline, comma, mixed separators, extra whitespace
  - Diff highlighting: removed (red), added (green), unchanged
  - Input preservation: original format remains in input box

See `tests/tests.md` for detailed test scenarios with inputs, expected outputs, and validation checks.

### Coverage Target

- 80% code coverage across all metrics
- Focused on core business logic
- UI interactions tested via E2E tests

## Browser Compatibility

- Modern browsers with ES6 module support
- Clipboard API for copy functionality
- Fallback to `execCommand('copy')` for older browsers

## Performance Considerations

- cidr-tools is dependency-free and efficient
- Sorting uses native Array.sort() with custom comparator
- Diff generation is O(n) where n is the number of lines
- Modal timing is purely for UX, not for processing requirements

## Accessibility

The application follows WCAG 2.1 AA guidelines for accessibility:

- **Semantic HTML** - Uses `<header>`, `<main>`, and `<footer>` landmarks for screen reader navigation
- **Skip Link** - Keyboard users can skip to main content
- **ARIA Attributes** - Proper ARIA labels, roles, and live regions for dynamic content
  - `aria-label` on input elements
  - `aria-live="polite"` on error and diff containers for announcements
  - `role="dialog"` and `aria-modal="true"` on processing modal
- **Form Accessibility** - Visually-hidden labels for all form controls
- **Keyboard Navigation** - Full keyboard support with visible focus indicators
  - `:focus-visible` styles for buttons and links
  - Tab order follows logical reading order
- **Color Contrast** - All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Screen Reader Support** - All interactive elements have accessible names

## Security

- No server-side processing
- No data leaves the browser
- No external API calls (except for npm packages during dev)
- Input validation prevents malformed CIDR strings

## Deployment

- Static files only (no server required)
- Can be deployed to any static hosting service
- Examples: GitHub Pages, Netlify, Vercel, S3
- No build process or runtime dependencies

## Icons and Visual Assets

### Icon System

The application uses **Lucide Icons** for all iconography:

- **License:** ISC (fully permissive for commercial and personal use)
- **Homepage:** https://lucide.dev
- **Source:** https://github.com/lucide-icons/lucide

### Usage Guidelines

#### Current Icon Implementations

- **Copy icon** (📋 replaced with Lucide Icons copy)
  - Used in both input and output panel headers
  - SVG implementation provides better visual quality than emoji
  - Works correctly in both light and dark modes

#### Icon Integration

All icons use inline SVG with `currentColor` for `stroke` attribute to automatically adapt to application's text color:

- Automatically adjusts for dark/light mode themes
- Follows CSS custom properties for color variables
- Ensures consistent visual hierarchy

#### Adding New Icons

When adding new icons:

1. Check Lucide Icons for suitable icon: https://lucide.dev/
2. Copy the SVG code
3. Use `fill="none"` and `stroke="currentColor"` attributes
4. Set `stroke-width="2"` for consistency with existing icons
5. Ensure proper `stroke-linecap="round"` and `stroke-linejoin="round"`
6. Update aria-label and title attributes for accessibility
7. Size to 16x16 for consistency with current icon buttons

#### Icon Sizing

- **Icon buttons:** 16x16 (defined in CSS: `.icon-button svg { width: 16px; height: 16px; }`)
- Maintain consistent sizing for uniform visual appearance
- Test scaling behavior on high-DPI displays
