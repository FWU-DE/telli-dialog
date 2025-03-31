# telli dialog

## Requirements

- nvm
- [docker compose](https://docs.docker.com/compose/install/)

## Basic Tools

Before the application can be started, you need to install the necessary tools.

```sh
nvm use # sets up the node version
corepack enable # sets up the proper package manager
corepack prepare
pnpm i # installs the dependencies
```

## Environment variables

You will need environment variables to work with.
Place those in the `.env` file.

You can find the env variables [here](https://start.1password.com/open/i?a=ADERP2QHK5HBPLKMBFF2QU5CXI&v=jtidfrchgfg2sunjzwpzgendlq&i=a2khk5vx6hrqmtkta2gg7vonga&h=deutschlandgpt.1password.eu).

## Database

For local development it makes sense to spin up a local postgresql database

```sh
docker compose -f devops/docker/docker-compose.db.local.yml up -d
```

Check that you can access it:

```sh
psql "postgresql://telli_dialog_db:test1234@127.0.0.1:5432/telli_dialog_db"
```

If you start with a fresh database, do not forget to apply migrations, otherwise the application will not work.

```sh
pnpm db:migrate
```

You can now start the application:

```sh
pnpm dev
```

## Load Tests

If you need to load test, you need to install `k6`.

```sh
brew install k6
```

## More

You can find more docs in the [./docs](./docs) folder.
For information about the project structure, see [here](./docs/structure.md).


## Security issues

Please see [SECURITY.md](SECURITY.md) for guidance on reporting security-related issues.
