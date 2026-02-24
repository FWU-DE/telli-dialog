# @dgpt/api

This app contains the dgpt proxy api.

Before you can start the app, you have to setup the required tooling described in the root `README.md`.

Start the app like this:

```sh
pnpm dev:api
```

The server listens on `http://127.0.0.1:3002` per default.

Swagger docs will be served here: `http://127.0.0.1:3002/docs`.

## tooling

We use [fastify](https://fastify.dev/) as our web framework.
