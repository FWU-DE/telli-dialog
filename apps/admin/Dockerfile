# This Dockerfile uses a multi-stage build to create a minimal production image.
# https://docs.docker.com/build/building/multi-stage/

# Alpine image
FROM node:24.13.1-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Prune projects
FROM base AS pruner
WORKDIR /app

COPY . .

# setup pnpm and pnpm install in order to install turbo in the correct version
RUN corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile --dev
RUN pnpm turbo prune telli-admin --docker

# Build the project
FROM base AS builder
WORKDIR /app

# Git is required for sentry
RUN apk add --no-cache git

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN corepack enable && corepack prepare
RUN pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# Copy git history, required for sentry to determine release name
COPY .git ./.git

ARG CI

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=SENTRY_ORG,env=SENTRY_ORG \
    --mount=type=secret,id=SENTRY_PROJECT,env=SENTRY_PROJECT \
    CI=${CI} \
    pnpm turbo build:envless

# Final image
FROM base AS runner

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# copy nextjs application 
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/admin/public ./apps/admin/public

ARG APP_VERSION
ARG PORT=3000

ENV APP_VERSION=${APP_VERSION}
ENV PORT=${PORT}
ENV NODE_ENV=production

EXPOSE ${PORT}

HEALTHCHECK --timeout=10s --start-period=5s \
  CMD wget http://127.0.0.1:${PORT}/api/healthz -qO-

# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["node", "./apps/admin/server.js"]
