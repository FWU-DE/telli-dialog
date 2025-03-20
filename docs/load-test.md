## load tests

If you need to load test, you need to install `k6` beforehand.

```sh
brew install k6
```

See [here](https://grafana.com/docs/k6/latest/set-up/install-k6/) for other systems.
You will also need to install some chromium based browser (`apt install chromium`).
See [here](https://grafana.com/docs/k6/latest/using-k6-browser/) for more details.

The load tests logic is contained inside the `e2e/load_test` folder.

There are two commands you can run:

```sh
pnpm k6:run:ui
```

This runs one user load tests with the browser enabled so you can see what the load test is doing exactly.

To execute the actual load test, run the following command:

```sh
pnpm k6:run
```

## local load tests (small)

For small load tests you can do it locally, do not forget to start the mock oidc server:

```sh
pnpm start:oidc
```

## remote load tests (big)

The single mock oidc server is not built for big loads, therefore this can be circumvented by spawning a lot of
instances of this server and load balancing.

You will need to get a big server (prefferable >=32GB).

The you should clone the repository into it and install all dependencies (see README.md) for basic setup.

Afterwards run the following commands:

```sh
docker compose -f e2e/docker-compose.redis.yml up -d
pnpm start:cluster
```

You will of course need a proper domain and ssl setup. I recommend [caddy](https://caddyserver.com/docs/install) for it.

You can find an example `Caddyfile` here: `e2e/load_test/Caddyfile`. The you need to point a domain to the server.
Currently it is harcoded [here](./src/auth/providers/vidis-mock.ts) and is set to `https://vidis-mock.dgpt.app`.

You can then run the load tests like this:

```sh
pnpm k6:run
```

Note: Load Testing this app is a big thing to do and should not be taken lightly. Plan in at least a day even with this existing configuration.
