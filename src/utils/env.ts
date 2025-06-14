import { z } from 'zod'

// Define the schema as an object with all of the env
// variables and their types
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENV: z.enum(["development", "testing", "production"]).default("development"),

  // GitHub App credentials
  GITHUB_APP_ID: z.string().min(1), // App ID from GitHub App settings
  GITHUB_APP_PRIVATE_KEY: z.string().min(1), // Private key (.pem file contents)
  GITHUB_APP_INSTALLATION_ID: z.string().min(1), // Installation ID (71169774)
  GIT_PROVIDER_TYPE: z.enum(["github", "gitlab"]).default("github"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  // Comma-separated list of regions to scan, defaults to common regions
  AWS_REGIONS: z.string().default("us-east-1,us-west-1,us-west-2,eu-west-1,eu-central-1,ap-southeast-1,ap-northeast-1").transform(val => val.split(',')),

  // LlamaIndex Cloud credentials
  LLAMA_API_KEY: z.string().min(1),
  LLAMA_CLOUD_BASE_URL: z.string().url().default("https://api.cloud.llamaindex.ai"),
  
  // OpenAI API key for embeddings
  OPENAI_API_KEY: z.string().min(1),
})

// Validate `process.env` against our schema
// and return the result
const env = envSchema.parse(process.env);

export default env;
