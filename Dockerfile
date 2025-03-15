# Build stage
FROM node:20-alpine as builder

# Add build arguments for Firebase credentials
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_PRIVATE_KEY
ARG FIREBASE_CLIENT_EMAIL

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create Firebase service account file
RUN echo '{\n\
    "type": "service_account",\n\
    "project_id": "'${FIREBASE_PROJECT_ID}'",\n\
    "private_key_id": "'$(echo ${FIREBASE_PRIVATE_KEY} | cut -d_ -f1)'",\n\
    "private_key": "'${FIREBASE_PRIVATE_KEY}'",\n\
    "client_email": "'${FIREBASE_CLIENT_EMAIL}'",\n\
    "client_id": "",\n\
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",\n\
    "token_uri": "https://oauth2.googleapis.com/token",\n\
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",\n\
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/'${FIREBASE_CLIENT_EMAIL}'"\n\
    }' > ./firebase-service-account.json || echo '{}' > ./firebase-service-account.json

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache redis curl netcat-openbsd procps jq

# Set working directory
WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]