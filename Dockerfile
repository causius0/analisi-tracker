# Multi-stage Dockerfile for analisi-tracker
# Stage 1: Base image with dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json ./

# Stage 2: Production dependencies
FROM base AS dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 3: Build client (if build files exist)
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY client ./client
WORKDIR /app/client

# Check if client has build config and build
RUN if [ -f package.json ]; then \
    npm run build 2>/dev/null || echo "No build script found"; \
    fi

# Stage 4: Production image
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy server files
COPY server ./server
COPY scripts ./scripts

# Copy client build artifacts if they exist
COPY --from=build /app/client/dist ./client/dist 2>/dev/null || true

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Start server
CMD ["node", "server/index.js"]
