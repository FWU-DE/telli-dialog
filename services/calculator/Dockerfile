# Build libqalculate from the upstream release tarball, then keep only its CLI,
# definitions, and runtime libraries in the final image.
FROM debian:bookworm AS qalc-builder

ARG LIBQALCULATE_VERSION=5.12.0
ARG LIBQALCULATE_SHA256=f3dfdcf97d5a9e3a5bc0ebe66afd184721b606276eee3ba0ada8c92a5e71d44c

RUN apt-get update && apt-get install --no-install-recommends -y \
    autoconf \
    automake \
    build-essential \
    ca-certificates \
    gettext \
    libgmp-dev \
    libicu-dev \
    libmpfr-dev \
    libtool \
    libxml2-dev \
    pkg-config \
    xz-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/libqalculate
ADD https://github.com/Qalculate/libqalculate/releases/download/v${LIBQALCULATE_VERSION}/libqalculate-${LIBQALCULATE_VERSION}.tar.gz /tmp/libqalculate.tar.gz
RUN echo "${LIBQALCULATE_SHA256}  /tmp/libqalculate.tar.gz" | sha256sum -c - \
  && tar -xzf /tmp/libqalculate.tar.gz --strip-components=1 \
  && ./configure \
       --prefix=/usr/local \
       --disable-insecure \
       --without-libcurl \
       --without-gnuplot-call \
       --with-readline=no \
       --disable-unittests \
       --disable-tests \
  && make -j"$(nproc)" \
  && make install DESTDIR=/opt/qalc-root \
  && strip --strip-unneeded /opt/qalc-root/usr/local/bin/qalc /opt/qalc-root/usr/local/lib/libqalculate.so.*

FROM node:24.19.0-bookworm-slim AS service-builder

WORKDIR /service
COPY package.json ./package.json
COPY src ./src

# Compile the service separately from its production dependencies so the runtime
# image does not need a package manager or tsx.
RUN npm install --no-save --no-fund --no-audit typescript@6.0.3 @types/node@24.13.3 \
  && npx tsc --outDir dist --rootDir src --module NodeNext --moduleResolution NodeNext \
       --target ES2022 --skipLibCheck --types node src/index.ts

FROM node:24.19.0-bookworm-slim AS service-dependencies

WORKDIR /service
COPY package.json ./package.json
RUN npm install --omit=dev --no-save --no-fund --no-audit

FROM node:24.19.0-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    QALCULATE_DATA_DIR=/usr/local/share/qalculate

RUN apt-get update && apt-get install --no-install-recommends -y \
      libgmp10 \
      libicu72 \
      libmpfr6 \
      libxml2 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 qalc \
    && useradd --system --uid 10001 --gid qalc --home-dir /nonexistent --no-create-home qalc

COPY --from=qalc-builder /opt/qalc-root/usr/local/bin/qalc /usr/local/bin/qalc
COPY --from=qalc-builder /opt/qalc-root/usr/local/lib/libqalculate.so.* /usr/local/lib/
COPY --from=qalc-builder /opt/qalc-root/usr/local/share/qalculate /usr/local/share/qalculate
COPY --from=qalc-builder /opt/qalc-root/usr/local/share/locale /usr/local/share/locale
RUN ldconfig

WORKDIR /service
COPY --from=service-builder --chown=qalc:qalc /service/dist ./dist
COPY --from=service-dependencies --chown=qalc:qalc /service/node_modules ./node_modules

USER qalc:qalc
EXPOSE 8080
ENTRYPOINT ["node", "dist/index.js"]
