
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
ARG PROJECT

WORKDIR /app
COPY . .
RUN turbo prune --scope=${PROJECT} --docker

# Build the project
FROM base AS builder
ARG PROJECT

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

RUN turbo build:envless --filter=${PROJECT}
# RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN pnpm prune --prod --no-optional
RUN rm -rf ./**/*/src

# Final image
FROM alpine AS runner
ARG PROJECT

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app .
WORKDIR /app/apps/${PROJECT}

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE ${PORT}

CMD npm run db:migrate && HOSTNAME=0.0.0.0 node dist/main


# RUN npm run build:envless --verbose
# RUN cp -r /app/.next/standalone/* /app/
# CMD npm run db:migrate && HOSTNAME=0.0.0.0 node server.js
