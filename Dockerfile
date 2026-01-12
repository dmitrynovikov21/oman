# ExpertOS Docker Configuration
# Multi-stage build for Next.js application with OCR support

# Stage 1: Dependencies (ALL for build)
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files AND prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL dependencies (including devDeps needed for build)
RUN npm install

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Production Runner with OCR support
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install OCR dependencies + ImageMagick for preprocessing + OpenSSL compat
RUN apk add --no-cache \
  tesseract-ocr \
  tesseract-ocr-data-rus \
  tesseract-ocr-data-eng \
  tesseract-ocr-data-ara \
  poppler-utils \
  imagemagick \
  openssl \
  libc6-compat \
  && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Create uploads directory with correct permissions
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Set correct permissions
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
