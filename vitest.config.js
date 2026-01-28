/**
 * Vitest Configuration
 * Copyright (c) 2025 Jason Tally and contributors
 * SPDX-License-Identifier: MIT
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "https://esm.sh/cidr-tools@8.0.0": path.resolve(
        __dirname,
        "node_modules/fast-cidr-tools",
      ),
      "https://esm.sh/fast-cidr-tools@0.3.4": path.resolve(
        __dirname,
        "node_modules/fast-cidr-tools",
      ),
      "https://esm.sh/diff@5.1.0": path.resolve(__dirname, "node_modules/diff"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/*.test.js"],
    exclude: ["tests/e2e/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "tests/**",
        "node_modules/**",
        "**/*.test.js",
        "**/*.spec.js",
        "index.html",
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
});
