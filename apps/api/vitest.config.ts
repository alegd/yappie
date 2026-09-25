import { defineConfig, mergeConfig } from "vitest/config";
import { baseVitestConfig } from "@yappie/config/vitest/base";

export default mergeConfig(
  baseVitestConfig,
  defineConfig({
    test: {
      root: ".",
      include: ["test/e2e/helpers/seed-ui.e2e.spec.ts"],
    },
  }),
);
