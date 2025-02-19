# Next.js Template v15

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

You can see an overview of required env variables in the `.env.example` file.

Env variables are currently stores in the aws secrets manager (as neither ionos nor otc provide such a service)

With the correct aws credentials you can run this command to automatically get local env variables.

```sh
aws secretsmanager get-secret-value --secret-id local/telli/chatbot --query 'SecretString' --output text | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > .env
```

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
