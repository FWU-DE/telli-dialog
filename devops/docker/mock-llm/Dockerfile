FROM node:24.17.0-alpine
WORKDIR /app
COPY server.mjs .
EXPOSE 6556
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -qO- http://127.0.0.1:6556/health || exit 1
CMD ["node", "server.mjs"]
