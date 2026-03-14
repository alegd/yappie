import { defineConfig, mergeConfig } from "vitest/config";
import { baseVitestConfig } from "@yappie/config/vitest/base";

export default mergeConfig(
  baseVitestConfig,
  defineConfig({
    test: {
      root: ".",
    },
  }),
);
