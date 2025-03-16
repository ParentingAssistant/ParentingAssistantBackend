# Build stage
FROM --platform=linux/amd64 node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-alpine

# Install required packages
RUN apk add --no-cache redis curl netcat-openbsd procps jq

# Set working directory
WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create healthcheck script
RUN echo '#!/bin/sh\n\
    curl -f http://localhost:${PORT:-8080}/health || exit 1\n\
    ' > /healthcheck.sh && chmod +x /healthcheck.sh

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app /healthcheck.sh

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Add build arguments for Firebase configuration
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_PRIVATE_KEY
ARG FIREBASE_CLIENT_EMAIL

# Set Firebase environment variables
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID} \
    FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY} \
    FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}

# Expose port
EXPOSE 8080

# Health check with more lenient settings
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

# Start the application
CMD ["node", "dist/server.js"]