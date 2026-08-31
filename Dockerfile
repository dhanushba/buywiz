FROM node:23-alpine as builder

WORKDIR /app
COPY package*.json ./

RUN npm ci
RUN npm run build

# Production stage
FROM node:23-alpine

WORKDIR /app

# Install chromium and required dependencies for Puppeteer
RUN apk add --no-cache chromium ca-certificates

# Copy built application and dependencies from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
