import { coverageConfigDefaults, defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    setupFiles: ["./__tests__/setup.ts"],
    hookTimeout: 90000, // 90 seconds for all hooks
  },
});
