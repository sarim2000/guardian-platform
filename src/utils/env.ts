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

  AWS_CREDENTIALS_ENCRYPTION_KEY: z.string().min(1),

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
