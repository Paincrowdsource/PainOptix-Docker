# Multi-stage build for optimized Next.js 15.4.2 with Puppeteer
# Stage 1: Dependencies
FROM node:20-slim AS deps

WORKDIR /app

# Create package.json directly in the Docker image (no package.json at repo root!)
RUN echo '{ \
  "name": "painoptix-app", \
  "version": "1.0.0", \
  "main": "index.js", \
  "engines": { \
    "node": "20.x", \
    "npm": "10.x" \
  }, \
  "scripts": { \
    "dev": "next dev -p 3000", \
    "build": "next build", \
    "start": "next start", \
    "lint": "next lint", \
    "typecheck": "tsc --noEmit" \
  }, \
  "dependencies": { \
    "@hookform/resolvers": "^5.1.1", \
    "@radix-ui/react-checkbox": "^1.3.2", \
    "@radix-ui/react-label": "^2.1.7", \
    "@radix-ui/react-progress": "^1.1.7", \
    "@radix-ui/react-radio-group": "^1.3.7", \
    "@radix-ui/react-slider": "^1.3.5", \
    "@radix-ui/react-slot": "^1.2.3", \
    "@react-pdf/font": "^4.0.2", \
    "@react-pdf/renderer": "^4.3.0", \
    "@sendgrid/mail": "^8.1.5", \
    "@sparticuz/chromium": "^119.0.2", \
    "@stripe/stripe-js": "^7.5.0", \
    "@supabase/auth-helpers-nextjs": "^0.10.0", \
    "@supabase/ssr": "^0.6.1", \
    "@supabase/supabase-js": "^2.52.0", \
    "@types/js-yaml": "^4.0.9", \
    "@types/jspdf": "^1.3.3", \
    "class-variance-authority": "^0.7.1", \
    "clsx": "^2.1.1", \
    "date-fns": "^4.1.0", \
    "dotenv": "^17.2.0", \
    "gray-matter": "^4.0.3", \
    "js-yaml": "^4.1.0", \
    "jspdf": "^3.0.1", \
    "jspdf-autotable": "^5.0.2", \
    "lucide-react": "^0.525.0", \
    "mammoth": "^1.9.1", \
    "marked": "^16.1.1", \
    "next": "^15.4.2", \
    "pdf-parse": "^1.1.1", \
    "puppeteer": "^23.11.1", \
    "react": "^19.1.0", \
    "react-dom": "^19.1.0", \
    "react-hook-form": "^7.60.0", \
    "react-hot-toast": "^2.5.2", \
    "react-markdown": "^10.1.0", \
    "stripe": "^18.3.0", \
    "tailwind-merge": "^3.3.1", \
    "twilio": "^5.7.3", \
    "winston": "^3.17.0", \
    "ws": "^8.18.0", \
    "zod": "^4.0.10", \
    "cheerio": "^1.1.2" \
  }, \
  "devDependencies": { \
    "@types/node": "^24.0.15", \
    "@types/react": "^19.1.8", \
    "@types/react-dom": "^19.1.6", \
    "autoprefixer": "^10.4.21", \
    "eslint": "^9.31.0", \
    "eslint-config-next": "^15.4.2", \
    "postcss": "^8.5.6", \
    "tailwindcss": "^3.4.17", \
    "typescript": "^5.8.3" \
  } \
}' > package.json

# Install dependencies with increased network timeout
RUN npm install --production --network-timeout=600000

# Stage 2: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create package.json again for builder stage
RUN echo '{ \
  "name": "painoptix-app", \
  "version": "1.0.0", \
  "main": "index.js", \
  "engines": { \
    "node": "20.x", \
    "npm": "10.x" \
  }, \
  "scripts": { \
    "build": "next build", \
    "start": "next start" \
  }, \
  "dependencies": { \
    "@hookform/resolvers": "^5.1.1", \
    "@radix-ui/react-checkbox": "^1.3.2", \
    "@radix-ui/react-label": "^2.1.7", \
    "@radix-ui/react-progress": "^1.1.7", \
    "@radix-ui/react-radio-group": "^1.3.7", \
    "@radix-ui/react-slider": "^1.3.5", \
    "@radix-ui/react-slot": "^1.2.3", \
    "@react-pdf/font": "^4.0.2", \
    "@react-pdf/renderer": "^4.3.0", \
    "@sendgrid/mail": "^8.1.5", \
    "@sparticuz/chromium": "^119.0.2", \
    "@stripe/stripe-js": "^7.5.0", \
    "@supabase/auth-helpers-nextjs": "^0.10.0", \
    "@supabase/ssr": "^0.6.1", \
    "@supabase/supabase-js": "^2.52.0", \
    "@types/js-yaml": "^4.0.9", \
    "@types/jspdf": "^1.3.3", \
    "class-variance-authority": "^0.7.1", \
    "clsx": "^2.1.1", \
    "date-fns": "^4.1.0", \
    "dotenv": "^17.2.0", \
    "gray-matter": "^4.0.3", \
    "js-yaml": "^4.1.0", \
    "jspdf": "^3.0.1", \
    "jspdf-autotable": "^5.0.2", \
    "lucide-react": "^0.525.0", \
    "mammoth": "^1.9.1", \
    "marked": "^16.1.1", \
    "next": "^15.4.2", \
    "pdf-parse": "^1.1.1", \
    "puppeteer": "^23.11.1", \
    "react": "^19.1.0", \
    "react-dom": "^19.1.0", \
    "react-hook-form": "^7.60.0", \
    "react-hot-toast": "^2.5.2", \
    "react-markdown": "^10.1.0", \
    "stripe": "^18.3.0", \
    "tailwind-merge": "^3.3.1", \
    "twilio": "^5.7.3", \
    "winston": "^3.17.0", \
    "ws": "^8.18.0", \
    "zod": "^4.0.10", \
    "cheerio": "^1.1.2" \
  }, \
  "devDependencies": { \
    "@types/node": "^24.0.15", \
    "@types/react": "^19.1.8", \
    "@types/react-dom": "^19.1.6", \
    "autoprefixer": "^10.4.21", \
    "eslint": "^9.31.0", \
    "eslint-config-next": "^15.4.2", \
    "postcss": "^8.5.6", \
    "tailwindcss": "^3.4.17", \
    "typescript": "^5.8.3" \
  } \
}' > package.json

RUN npm install --network-timeout=600000

# Copy application code (everything except package.json which we created)
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

# Optional: sanity (do NOT print secrets)
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
# Using glob pattern to handle missing directory gracefully
COPY --from=builder --chown=app:app /app/content* ./

# ensure we're in /app and owned by app
WORKDIR /app

# create cache dir for puppeteer under the app user and make sure it exists
ENV PUPPETEER_CACHE_DIR=/home/app/.cache/puppeteer
RUN mkdir -p /home/app/.cache/puppeteer && chown -R app:app /home/app

# switch to app user BEFORE installing puppeteer so chromium lands in /home/app
USER app

# install puppeteer (downloads bundled Chromium)
RUN npm set fund false && npm set audit false \
 && npm install puppeteer@23.11.1 --no-save

# sanity: print path puppeteer thinks it will use (path only, not a secret)
RUN node -e "console.log('pupp executable:', require('puppeteer').executablePath())"

# Create temp directory for Chromium with proper permissions
USER root
RUN mkdir -p /tmp/.chromium \
    && chown -R app:app /tmp/.chromium

# Switch back to non-root user
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