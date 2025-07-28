# Multi-stage Docker build for RevivaTech shared components

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Test stage (optional, for testing in CI)
FROM builder AS tester

# Install dev dependencies for testing
RUN npm ci --include=dev

# Run tests
RUN npm run test:unit
RUN npm run lint
RUN npm run type-check

# Stage 3: Production stage
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create app directory and user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S revivatech -u 1001

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=revivatech:nodejs /app/dist ./dist
COPY --from=builder --chown=revivatech:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=revivatech:nodejs /app/package*.json ./

# Copy configuration files
COPY --chown=revivatech:nodejs .env.example .env
COPY --chown=revivatech:nodejs monitoring ./monitoring
COPY --chown=revivatech:nodejs config ./config

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R revivatech:nodejs /app/logs /app/uploads /app/temp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Switch to non-root user
USER revivatech

# Expose port
EXPOSE $PORT

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="RevivaTech Shared Services"
LABEL org.opencontainers.image.description="Shared components and services for RevivaTech platform"
LABEL org.opencontainers.image.vendor="RevivaTech"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/revivatech/platform"