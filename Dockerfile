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
    "puppeteer-core": "^24.15.0", \
    "react": "^19.1.0", \
    "react-dom": "^19.1.0", \
    "react-hook-form": "^7.60.0", \
    "react-hot-toast": "^2.5.2", \
    "react-markdown": "^10.1.0", \
    "stripe": "^18.3.0", \
    "tailwind-merge": "^3.3.1", \
    "twilio": "^5.7.3", \
    "winston": "^3.17.0", \
    "zod": "^4.0.10" \
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
    "puppeteer-core": "^24.15.0", \
    "react": "^19.1.0", \
    "react-dom": "^19.1.0", \
    "react-hook-form": "^7.60.0", \
    "react-hot-toast": "^2.5.2", \
    "react-markdown": "^10.1.0", \
    "stripe": "^18.3.0", \
    "tailwind-merge": "^3.3.1", \
    "twilio": "^5.7.3", \
    "winston": "^3.17.0", \
    "zod": "^4.0.10" \
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

# Hardcode build-time environment variables to avoid build-arg issues
ENV NEXT_PUBLIC_SUPABASE_URL=https://wljwlgjeqoulxvwbfgpy.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsandsZ2plcW91bHh2d2JmZ3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODU1ODAsImV4cCI6MjA2ODM2MTU4MH0.t1CJVew2x97n4HUwerOOyijSblkw0R4GcSHadT1A7ek
ENV NEXT_PUBLIC_APP_URL=https://painoptix-kmyw6.ondigitalocean.app
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51KgX8CJCbOhp4gDdLuVE9Npd2IOCoeUUmLBvc3KI4kHxFKTbrJwVa2tzmxurnh4GA3NhaU1nILlh0S8mX9gTQHoG00QJnLuzhj
ENV NEXT_PUBLIC_ENVIRONMENT=production

# Build Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Debug: Print environment variables to verify they're set
RUN echo "=== Build Environment ===" && \
    echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" && \
    echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" && \
    echo "NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}" && \
    echo "========================"

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

# Puppeteer configuration
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Memory optimization for large PDF generation
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy standalone build from builder
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# Copy content directory for PDF generation
COPY --from=builder --chown=app:app /app/content ./content 2>/dev/null || true

# Install Puppeteer with bundled Chromium
RUN npm install puppeteer@23.11.1 --no-save \
    && chmod -R 755 /app/node_modules/puppeteer/.local-chromium 2>/dev/null || true

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