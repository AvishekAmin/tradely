FROM node:20-alpine AS runner

WORKDIR /app

# Install curl/wget for readiness check
RUN apk add --no-cache wget

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Install production dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Run as non-root user
USER node

# Expose backend port
EXPOSE 8000

# Container readiness probe (verifies both HTTP server and MongoDB availability)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8000/ready | grep -q '"status":"ready"' || exit 1

# Start production server
CMD ["node", "src/server.js"]
