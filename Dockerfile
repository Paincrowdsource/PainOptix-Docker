# Multi-stage build for optimized Next.js with Puppeteer
# Stage 1: Dependencies
FROM node:20-slim AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with increased network timeout
RUN npm ci --production --network-timeout=600000

# Stage 2: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci --network-timeout=600000

# Copy application code
COPY . .

# Make DO's RUN_AND_BUILD_TIME envs visible as build args
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_ENVIRONMENT
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SENDGRID_API_KEY
ARG STRIPE_SECRET_KEY

# Promote to ENV so Node/Next sees them at build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV SENDGRID_API_KEY=$SENDGRID_API_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

# Build Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# More heap for Next build
ENV NODE_OPTIONS=--max_old_space_size=2048

# Optional: sanity check (do NOT print secrets)
RUN node -e "console.log('has URL?',!!process.env.NEXT_PUBLIC_SUPABASE_URL,'has SRK?',!!process.env.SUPABASE_SERVICE_ROLE_KEY)"

RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner

WORKDIR /app

# Install Chromium dependencies and utilities
RUN apt-get update && apt-get install -y \
    # Core Chromium dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxcb1 \
    libxss1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    # Additional font support for medical PDFs
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    # Utilities
    ca-certificates \
    wget \
    gnupg \
    # Process management
    dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

# Create app user for security
RUN groupadd -r app && useradd -r -g app -G audio,video app \
    && mkdir -p /home/app \
    && chown -R app:app /home/app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Memory optimization for large PDF generation
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy standalone build from builder
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# Copy content directory for PDF generation
COPY --from=builder --chown=app:app /app/content ./content

# Copy node_modules with puppeteer from builder
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

# Create cache dir for puppeteer
ENV PUPPETEER_CACHE_DIR=/home/app/.cache/puppeteer
RUN mkdir -p /home/app/.cache/puppeteer && chown -R app:app /home/app

# Create temp directory for Chromium with proper permissions
RUN mkdir -p /tmp/.chromium \
    && chown -R app:app /tmp/.chromium

# Switch to non-root user
USER app

# Health check for DigitalOcean
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# DigitalOcean expects port 8080
EXPOSE 8080

# Set hostname to support Next.js
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the standalone server
CMD ["node", "server.js"]