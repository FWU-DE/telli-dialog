# This Dockerfile uses a multi-stage build to create a minimal production image.
# https://docs.docker.com/build/building/multi-stage/

# Alpine image
FROM node:22-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Setup pnpm and turbo on the alpine base
FROM alpine as base
RUN npm install pnpm turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

# Prune projects
FROM base AS pruner
WORKDIR /app

COPY . .
RUN turbo prune --scope=telli-dialog --docker

# Build the project
FROM base AS builder
WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
# RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm install --frozen-lockfile
RUN pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

RUN turbo build:envless
# RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN pnpm prune --prod --no-optional
RUN cp -r /app/apps/dialog/.next/standalone/* /app/

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
EXPOSE ${PORT}

CMD pnpm db:migrate && node server.js


## RUN rm -rf ./**/*/src

# Final image
# FROM base AS runner

# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nodejs
# USER nodejs

# WORKDIR /app
# # copy nextjs application 
# COPY --from=builder --chown=nodejs:nodejs /app/apps/dialog/.next/standalone ./
# COPY --from=builder --chown=nodejs:nodejs /app/apps/dialog/.next/static ./apps/dialog/.next/static
# # copy whole db folder in order to run database migrations
# COPY --from=pruner --chown=nodejs:nodejs /app/apps/dialog/src/db /app/apps/dialog/src/db

# ARG PORT=3000
# ENV PORT=${PORT}
# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV TURBO_TELEMETRY_DISABLED=1
# EXPOSE ${PORT}

# # https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
# CMD pnpm db:migrate && node server.js
