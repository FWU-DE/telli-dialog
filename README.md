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
Place those in the `.env.local` file.

You can find the env variables [here](https://start.1password.com/open/i?a=ADERP2QHK5HBPLKMBFF2QU5CXI&v=jtidfrchgfg2sunjzwpzgendlq&i=a2khk5vx6hrqmtkta2gg7vonga&h=deutschlandgpt.1password.eu).

## Database

For local development spin up a local postgresql database

```sh
docker compose -f devops/docker/docker-compose.db.local.yml up -d
```

Check that you can access it:

```sh
psql "postgresql://telli_dialog_db:test1234@127.0.0.1:5432/telli_dialog_db"
```

If you start with a fresh database, apply migrations and seed the database, otherwise the application will not work.

Add api keys in your .env.local file for all federal states that you want to login with, e.g. DE_BY_API_KEY for bavaria.

```sh
# with proper values in .env.local file
cd apps/dialog
pnpm db:migrate:local
pnpm db:seed:local

```

You can now start the application from the root directory:

```sh
pnpm dev
```

To remove the database and delete all its data you can stop and remove the container and its volume:

```sh
docker compose -f devops/docker/docker-compose.db.local.yml down -v
```

## E2E Tests

We use playwright with a vidis mock server for e2e testing, refer to the [details](apps/dialog/e2e/readme.md) for setup guide.
The e2e tests are integrated into the pipeline and run on every pull request.

## Load Tests

If you need to run load tests, you need to install `k6`.

```sh
brew install k6
```

## More

You can find more docs in the [./docs](./docs) folder.
For information about the project structure, see [here](./docs/structure.md).

## Security issues

Please see [SECURITY.md](SECURITY.md) for guidance on reporting security-related issues.

## Configurations by Federal State

There are several functionalities to customize look and functionality for each federal state:

### Access Flags

- **student_access**:  
  Whether students are allowed to login.
  This value is configured in the SQL column federal_state/student_access.

### Feature Flags

These are hidden in the sidebar, but the routes are still accessible.

- **enableCharacters**:  
  Whether custom characters (Dialogpartner) are enabled for teachers.
  This value is configured in the SQL column federal_state/enable_characters.

- **enableSharedChats**:  
  Whether shared school chats (Lernszenario) are enabled for teachers.
  This value is configured in the SQL column federal_state/enable_shared_chats.

- **enableCustomGpt**:  
  Whether customGpts (Assistenten) are enabled for teachers.
  This value is configured in the SQL column federal_state/enable_custom_gpts.

### Whitelabel

Custom designs and titles for federal states:

- **telliName**:  
  Custom name appearing in the sidebar and as website title.
  This value is configured in the SQL column federal_state/telli_name.

- **logos**:  
  The logo and favicon are stored in the OTC S3 Bucket at a fixed path:  
  `/whitelabels/<Federal-State-ID>/logo.svg`
  `/whitelabels/<Federal-State-ID>/favicon.svg`

- **design configuration**:  
  Custom color palette for buttons, icons, etc. (see Figma designs).  
  This value is configured in the SQL column federal_state/design_configuration.
