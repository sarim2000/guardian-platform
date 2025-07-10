# syntax=docker.io/docker/dockerfile:1

# Use a specific Node.js version for better reproducibility
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-alpine AS base

# Add labels for better image management
LABEL maintainer="Guardian Platform Team"
LABEL description="Guardian Platform - Next.js Application"

# Install dependencies only when needed
FROM base AS deps
# Install system dependencies required for node-gyp and native modules
RUN apk add --no-cache libc6-compat python3 make g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy only package files for better layer caching
COPY package*.json ./
COPY .npmrc* ./

# Install dependencies with npm ci for faster, more reliable builds
RUN npm ci --only=production \
    && cp -R node_modules prod_node_modules \
    && npm ci \
    && npm cache clean --force

# Development dependencies stage for build process
FROM base AS dev-deps
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Build stage
FROM dev-deps AS builder
WORKDIR /app

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Skip validation during build
ENV SKIP_ENV_VALIDATION=1

# Build the application with better error handling
RUN npm run build || \
    (echo "Build failed. Checking for common issues..." && \
     echo "1. Ensure all required environment variables are set" && \
     echo "2. Check for TypeScript errors" && \
     echo "3. Verify all dependencies are installed" && \
     exit 1)

# Prune dev dependencies after build
RUN npm prune --production

# Production image - minimal size
FROM base AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/prod_node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
