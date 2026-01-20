# IP Address Aggregation Tests

## Overview

This document describes comprehensive test scenarios for IP address aggregation functionality. Test coverage includes IPv4 and IPv6 adjacent, overlapping, non-overlapping, and non-adjacent addresses, as well as IPv6 compression variations, bare IP auto-conversion, and diff highlighting validation.

## Running Tests

```bash
# Run all comprehensive tests
npm run test:e2e tests/e2e/ip-aggregation-comprehensive.spec.js

# Run with specific browser
npm run test:e2e tests/e2e/ip-aggregation-comprehensive.spec.js --project chromium

# Run with UI mode
npm run test:e2e:ui
```

**Current Status:** All 19 tests passing

---

## Test Scenarios

### 1. IPv4 Adjacent Addresses (Should Merge)

**Input:**

```
192.168.1.0/25
192.168.1.128/25
```

**Expected Output:**

```
192.168.1.0/24
```

**Checks:**

- Output box shows `192.168.1.0/24`
- Input diff shows `192.168.1.0/25` and `192.168.1.128/25` as removed (red)
- Output diff shows `192.168.1.0/24` as added (green)

---

### 2. IPv4 Overlapping Addresses (Should Merge)

**Input:**

```
10.0.0.0/24
10.0.0.0/25
10.0.0.128/25
```

**Expected Output:**

```
10.0.0.0/24
```

**Checks:**

- Output box shows single `10.0.0.0/24`
- Input diff shows all three entries as removed (red)
- Output diff shows `10.0.0.0/24` as added (green)

---

### 3. IPv4 Non-Overlapping Addresses (Should NOT Merge)

**Input:**

```
172.16.0.0/24
172.16.2.0/24
172.16.4.0/24
```

**Expected Output:**

```
172.16.0.0/24
172.16.2.0/24
172.16.4.0/24
```

**Checks:**

- Output box shows all three addresses unchanged
- Input and output diffs show all addresses as unchanged (no highlight)

---

### 4. IPv4 Non-Adjacent Addresses (Should NOT Merge)

**Input:**

```
192.168.1.0/24
192.168.3.0/24
192.168.5.0/24
```

**Expected Output:**

```
192.168.1.0/24
192.168.3.0/24
192.168.5.0/24
```

**Checks:**

- Output box shows all three addresses unchanged
- Input and output diffs show all addresses as unchanged

---

### 5. IPv6 Adjacent Addresses (Should Merge)

**Input:**

```
2001:db8::/64
2001:db8:1::/64
```

**Expected Output:**

```
2001:db8::/64
2001:db8:1::/64
```

**Checks:**

- Output box shows both addresses unchanged (not adjacent in CIDR space)
- Input and output diffs show no changes (no highlight)

---

### 6. IPv6 Overlapping Addresses (Should Merge)

**Input:**

```
2001:db8:1::/48
2001:db8:1::/64
2001:db8:1:1::/64
```

**Expected Output:**

```
2001:db8:1::/48
2001:db8:1:1::/64
```

**Checks:**

- Output box shows consolidated blocks
- Input diff shows 1 entry as removed, 2 unchanged
- Output diff shows 1 entry as added, 2 unchanged

---

### 7. IPv6 Non-Overlapping Addresses (Should NOT Merge)

**Input:**

```
2001:db8:10::/48
2001:db8:20::/48
2001:db8:30::/48
```

**Expected Output:**

```
2001:db8:10::/48
2001:db8:20::/48
2001:db8:30::/48
```

**Checks:**

- Output box shows all three addresses unchanged
- Input and output diffs show all addresses as unchanged

---

### 8. IPv6 Non-Adjacent Addresses (Should NOT Merge)

**Input:**

```
2001:db8:1::/48
2001:db8:3::/48
2001:db8:5::/48
```

**Expected Output:**

```
2001:db8:1::/48
2001:db8:3::/48
2001:db8:5::/48
```

**Checks:**

- Output box shows all three addresses unchanged
- Input and output diffs show all addresses as unchanged

---

### 9. IPv6 with Different Compression Methods

**Input:**

```
2001:0db8:0000:0000:0000:0000:0000:0000/32
2001:db8::/32
```

**Expected Output:**

```
2001:db8::/32
```

**Checks:**

- Output box shows single normalized `2001:db8::/32`
- Output is lowercase (no uppercase A-F)
- Zero-compression applied

---

### 10. Mixed IPv4 and IPv6 - Adjacent and Overlapping

**Input:**

```
192.168.1.0/25
192.168.1.128/25
2001:db8::/63
2001:db8:2::/63
10.0.0.0/24
10.0.0.0/25
```

**Expected Output:**

```
10.0.0.0/24
192.168.1.0/24
2001:db8::/62
```

**Checks:**

- Output box shows three aggregated entries
- IPv4 addresses sorted before IPv6
- Input diff shows removed entries
- Output diff shows added entries
- Proper diff highlighting

---

### 11. Mixed Adjacent and Non-Adjacent - Complex

**Input:**

```
192.168.0.0/24
192.168.1.0/24
192.168.3.0/24
192.168.4.0/24
```

**Expected Output:**

```
192.168.0.0/23
192.168.3.0/24
192.168.4.0/24
```

**Checks:**

- Output box shows three entries (first two merged, last two cannot merge)
- Input diff shows first two as removed, last two unchanged
- Output diff shows one added, two unchanged

---

### 12. IPv6 Full Compression Spectrum

**Input:**

```
2001:0000:0000:0000:0000:0000:0000:0001/128
2001::1/128
```

**Expected Output:**

```
2001::1/128
```

**Checks:**

- Output box shows single normalized entry
- Full zero-compression (::)
- No uppercase letters (A-F)

---

### 13. Large IPv4 CIDR Blocks Merging

**Input:**

```
10.0.0.0/8
10.0.0.0/9
10.128.0.0/9
```

**Expected Output:**

```
10.0.0.0/8
```

**Checks:**

- Output box shows single largest block
- Input diff shows all three as removed
- Output diff shows one as added

---

### 14. IPv6 Leading and Trailing Zero Compression

**Input:**

```
2001:0db8:0000:0000:0000:0000:0000:0000/64
2001:db8::/64
```

**Expected Output:**

```
2001:db8::/64
```

**Checks:**

- Output box shows normalized entry
- Uppercase letters removed (0db8 → db8)
- All leading zeros removed
- Zero-compression applied

---

### 15. IPv4 Bare IP Auto-Conversion

**Input:**

```
10.0.0.0
10.0.0.1
10.0.0.2
10.0.0.3
```

**Expected Output:**

```
10.0.0.0/30
```

**Checks:**

- Output box shows aggregated CIDR
- Auto-conversion to /32 and proper merging

---

### 16. IPv6 Bare IP Auto-Conversion

**Input:**

```
2001:db8::1
2001:db8::2
2001:db8::3
2001:db8::4
```

**Expected Output:**

```
2001:db8::2/127
2001:db8::1/128
2001:db8::4/128
```

**Checks:**

- Auto-conversion to /128
- Proper aggregation of adjacent IPs

---

### 17. Mixed Aggregation - Diff Highlighting

**Input:**

```
10.0.0.0/25
10.0.0.128/25
192.168.1.0/24
192.168.2.0/24
2001:db8::/64
2001:db8:1::/64
```

**Expected Output:**

```
10.0.0.0/24
192.168.1.0/24
192.168.2.0/24
2001:db8::/64
2001:db8:1::/64
```

**Checks:**

- IPv4 adjacent blocks merge correctly
- IPv6 non-adjacent blocks stay separate
- Input diff shows 2 removed, 4 unchanged
- Output diff shows 1 added, 4 unchanged

---

### 18. Comma-Separated Input with Aggregation

**Input:**

```
192.168.1.0/25,192.168.1.128/25,10.0.0.0/25,10.0.0.128/25
```

**Expected Output:**

```
10.0.0.0/24
192.168.1.0/24
```

**Checks:**

- Output box shows aggregated entries
- Input format doesn't affect aggregation
- Proper handling of comma separators

---

### 19. Input Preservation

**Input:**

```
192.168.1.0/25, 192.168.1.128/25
```

**Expected Output:**

```
192.168.1.0/24
```

**Checks:**

- Original input format preserved in input box
- Only output box contains aggregated results
- Mixed separators maintained

---

## Test Checklist

### Output Box Validation

- [x] Correct number of aggregated entries
- [x] Correct CIDR notation in output
- [x] IPv4 addresses sorted before IPv6
- [x] Proper normalization (lowercase for IPv6, no leading zeros)

### Input Diff Validation

- [x] Removed entries highlighted in red (`.diff-line.removed`)
- [x] All original entries present in diff
- [x] Correct count of removed entries

### Output Diff Validation

- [x] Added entries highlighted in green (`.diff-line.added`)
- [x] All aggregated entries present in diff
- [x] Correct count of added entries

### Sorting Validation

- [x] IPv4 addresses sorted numerically
- [x] IPv6 addresses sorted numerically
- [x] All IPv4 addresses appear before any IPv6 addresses

### Compression Validation

- [x] IPv6 addresses normalized to lowercase
- [x] IPv6 zero-compression applied (::)
- [x] Leading zeros removed from IPv6 hextets
- [x] Consistent formatting across all outputs
