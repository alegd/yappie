import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load env vars for CLI commands (migrate, generate, etc.)
config({ path: path.resolve(__dirname, "../../.env") });
config({ path: path.resolve(__dirname, ".env") });

const dbUrl = `postgresql://${process.env.DB_USER || "yappie"}:${process.env.DB_PASSWORD || "yappie_dev"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "54320"}/${process.env.DB_NAME || "yappie"}`;

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: dbUrl,
  },
  migrate: {
    url: dbUrl,
  },
});
