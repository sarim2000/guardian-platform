import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({
  path: ".env.local"
})

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "postgresql", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/db/schema",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
