FROM rust:1-alpine AS rust-builder
WORKDIR /app/rust/semantica-core
RUN apk add --no-cache musl-dev
COPY rust/semantica-core/Cargo.toml rust/semantica-core/Cargo.lock ./
COPY rust/semantica-core/src ./src
RUN cargo build --release --bin praxis-semantica-core

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm install` instead of `npm ci` so Linux regenerates platform-specific
# optional binaries (e.g. @esbuild/linux-x64) when the lock was authored on
# a different host (Windows dev machines). `--no-audit --no-fund` keeps the
# Cloud Build log clean.
RUN npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Backend URL (injected at Cloud Build time from the deployed backend service)
ARG NEXT_PUBLIC_PRAXIS_BACKEND_URL
ENV NEXT_PUBLIC_PRAXIS_BACKEND_URL=$NEXT_PUBLIC_PRAXIS_BACKEND_URL

# Firebase public config — required at build time because src/lib/firebase/config.ts
# validates presence at module-import time (Next.js 16 Turbopack evaluates these
# during "page data collection"). All values are public/safe-to-embed.
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=$NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV PRAXIS_SEMANTICA_CORE_BIN=/app/bin/praxis-semantica-core
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/bin
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=rust-builder --chown=nextjs:nodejs /app/rust/semantica-core/target/release/praxis-semantica-core ./bin/praxis-semantica-core
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
