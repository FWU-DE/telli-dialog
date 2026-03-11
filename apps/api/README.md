# telli-api

This app contains the telli proxy api.

Before you can start the app, you have to setup the required tooling described in the root `README.md`.

Start the app from the root directory:

```sh
pnpm dev
```

Or run only the API:

```sh
cd apps/api && pnpm dev
```

The server listens on `http://127.0.0.1:3002` per default.

Swagger docs will be served here: `http://127.0.0.1:3002/docs`.

## Database

The API uses its own database managed by the `packages/api-database` package.
Use the top-level seed script from the root directory to seed all databases at once:

```sh
pnpm db:seed
```

## Tooling

We use [fastify](https://fastify.dev/) as our web framework.
