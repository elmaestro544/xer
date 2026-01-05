FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev

# Copy package files
COPY package*.json ./

# Install dependencies (production)
RUN npm install --omit=dev && \
    npm cache clean --force

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
  cairo \
  jpeg \
  pango \
  giflib \
  dumb-init

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application
COPY server.js ./
COPY public ./public
COPY utils ./utils
COPY parsers ./parsers

# Create uploads directory
RUN mkdir -p /app/uploads /app/temp && \
  chmod 755 /app/uploads /app/temp

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 80
# Add Traefik labels directly in Dockerfile
LABEL traefik.enable="true"
LABEL traefik.http.routers.xer.rule="Host(`xer.roadmap.casa`)"
LABEL traefik.http.routers.xer.entrypoints="websecure"
LABEL traefik.http.routers.xer.tls.certresolver="letsencrypt"
LABEL traefik.http.services.xer.loadbalancer.server.port="3000"

CMD ["dumb-init", "node", "server.js"]
