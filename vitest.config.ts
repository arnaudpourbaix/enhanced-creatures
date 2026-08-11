import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "es2022",
  },
  test: {
    include: ["lib/**/*.test.ts"],
    // Explicitly false rather than "passed-only" (which suppresses console output for passing
    // tests) - this codebase's production code paths log real diagnostics during generation
    // (e.g. documentationService's "Generating documentation for X"), and hiding those for
    // passing runs isn't worth the tradeoff versus just seeing everything.
    silent: false,
    coverage: {
      provider: "istanbul",
      reporter: ["text-summary", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/config/**", "lib/creatures/**"],
    },
  },
});
