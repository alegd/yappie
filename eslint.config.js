import { base } from "./packages/config/eslint/base.js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/font/google",
              message:
                "Fonts are self-hosted from src/fonts via next/font/local. next/font/google fetches from fonts.gstatic.com at BUILD time, which made the web-e2e job non-deterministic.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/fonts\\.(googleapis|gstatic)\\.com/]",
          message:
            "Do not reference Google's font CDN. Fonts are self-hosted from src/fonts; use var(--font-dm-sans) or var(--font-sora).",
        },
      ],
    },
  },
];
