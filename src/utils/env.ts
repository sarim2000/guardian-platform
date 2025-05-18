import { z } from 'zod'

// Define the schema as an object with all of the env
// variables and their types
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENV: z.enum(["development", "testing", "production"]).default("development"),

  GIT_PROVIDER_PAT: z.string().min(1),
  GIT_PROVIDER_ORGANIZATION_NAME: z.string().min(1),
  GIT_PROVIDER_TYPE: z.enum(["github", "gitlab"]).default("github"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

// Validate `process.env` against our schema
// and return the result
const env = envSchema.parse(process.env);

console.log("env", env);

export default env;
