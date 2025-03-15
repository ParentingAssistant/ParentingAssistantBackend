# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code and service account
COPY src ./src
COPY firebase-service-account.json ./firebase-service-account.json

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

# Install Redis client and curl for health checks
RUN apk add --no-cache redis curl netcat-openbsd procps jq

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# Install required packages
RUN apk add --no-cache curl netcat-openbsd jq

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Health check with appropriate timeout
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set the entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]