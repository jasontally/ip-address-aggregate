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
- **Clipboard Export** - Copy aggregated results with one click
- **Offline Ready** - Works entirely in the browser after loading

## Usage

1. Enter IPv4 and/or IPv6 CIDR addresses in textarea
   - One address per line, or
   - Comma-separated, or
   - Mixed newlines and commas
   - **Bare IP addresses** are auto-converted (e.g., `10.0.0.0` → `10.0.0.0/32`)
2. Click the **Aggregate** button (or press Ctrl+Enter) to merge overlapping
   and adjacent ranges.
3. View the sorted input and aggregated output with diff highlighting.
4. Click **Copy** to copy the aggregated results to your clipboard.

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
192.168.1.0/25
192.168.1.128/25
10.0.0.0/9
10.128.0.0/9
2001:db8::/64
2001:db8:0:0:1::/64
```

### Example Output

```
10.0.0.0/8
192.168.1.0/24
2001:db8::/63
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
