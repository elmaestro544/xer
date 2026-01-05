# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Production build
RUN npm run build || echo "No build step needed"

# Production stage
FROM node:20-alpine

# Add dumb-init for signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app ./

# Expose port 80 (Traefik default)
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/api/health || exit 1

# Run
CMD ["dumb-init", "node", "server.js"]
