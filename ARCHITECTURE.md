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

```
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
    └── e2e/
        ├── basic-flow.spec.js     # Main user flow
        ├── input-formats.spec.js  # Various input formats
        ├── copy-button.spec.js    # Clipboard functionality
        └── error-handling.spec.js # Invalid input scenarios
```

## Core Modules

### Input Parsing

- `parseInput(input)` - Parse text into array of CIDR strings
  - Handles newlines, commas, and mixed separators
  - Filters empty entries and trims whitespace

### Validation

- `isValidCIDR(cidr)` - Validate CIDR notation (both IPv4 and IPv6)
- `isValidIPv4(address, prefix)` - Validate IPv4 address and prefix
- `isValidIPv6(address, prefix)` - Validate IPv6 address and prefix
- `parseIPv6(addr)` - Parse IPv6 address to 16-byte array

### Sorting

- `compareCIDR(a, b)` - Compare two CIDR strings
  - IPv4 before IPv6
  - Sorted numerically by address, then by prefix
- `sortCIDRs(cidrs)` - Sort array of CIDR strings

### Aggregation

- `aggregateCIDRs(cidrs)` - Aggregate using cidr-tools `merge()` function
  - Merges overlapping ranges
  - Merges adjacent ranges
  - Handles IPv4 and IPv6 separately

### Diff Visualization

- `generateDiff(before, after)` - Generate line-by-line diff using jsdiff
- `renderDiff(diffParts)` - Render diff to DOM with color coding

### UI Interaction

- `showModal()` - Show processing modal with spinner
- `hideModal()` - Hide processing modal
- `aggregateAddresses()` - Main aggregation workflow
  - Validates input
  - Sorts addresses
  - Aggregates ranges
  - Renders diff
  - Ensures minimum 1.5s modal display
- `copyResults()` - Copy results to clipboard with feedback

## Data Flow

```
User Input
    ↓
parseInput()
    ↓
validate each CIDR
    ↓
sortCIDRs() (IPv4 first, then IPv6, each sorted numerically)
    ↓
Display sorted in textarea
    ↓
aggregateCIDRs() using cidr-tools merge()
    ↓
Display aggregated in textarea
    ↓
generateDiff() comparing sorted vs aggregated
    ↓
renderDiff() with color coding
    ↓
User can copy results
```

## Key Design Decisions

### Single File Architecture

- HTML, CSS, and JS are separate files (not a single file like some projects)
- CSS is embedded in HTML in a `<style>` block
- JS is a separate ES6 module
- No build step required

### Separation of IPv4 and IPv6

- IPv4 addresses are always sorted before IPv6 addresses
- Within each IP version, sorting is numerical (not lexical)
- Aggregation is handled separately by cidr-tools

### Modal Timing

- Modal displays for minimum 1.5 seconds
- Ensures user perceives processing even for fast operations
- Provides visual feedback for all operations

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

### E2E Tests (Playwright)

- **Basic flow** - Complete aggregation workflow
- **Input formats** - Various input formats and edge cases
- **Copy button** - Clipboard functionality and feedback
- **Error handling** - Invalid input scenarios

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
