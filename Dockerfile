FROM node:22-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build:envless --verbose

EXPOSE 3000
ENV PORT 3000
RUN cp -r /app/.next/standalone/* /app/

CMD npm run db:migrate && npm run db:seed && HOSTNAME=0.0.0.0 node server.js
