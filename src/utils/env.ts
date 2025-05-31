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

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  // Comma-separated list of regions to scan, defaults to common regions
  AWS_REGIONS: z.string().default("us-east-1,us-west-1,us-west-2,eu-west-1,eu-central-1,ap-southeast-1,ap-northeast-1").transform(val => val.split(',')),
})

// Validate `process.env` against our schema
// and return the result
const env = envSchema.parse(process.env);

export default env;
