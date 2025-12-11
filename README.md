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

## Local development

For local development spin up all required services using docker compose:

```sh
docker compose -f devops/docker/docker-compose.local.yml up -d
```

To remove all data and start from scratch, you can stop and remove the container and its volume.
This will delete your database and keycloak configuration.

```sh
docker compose -f devops/docker/docker-compose.local.yml down -v
```

To delete only the keycloak data, shutdown all containers and delete the volume:

```sh
docker compose -f devops/docker/docker-compose.local.yml down
docker volume rm telli_keycloak_data
```

## Database

Check that you can access the local postgresql database:

```sh
psql "postgresql://telli_dialog_db:test1234@127.0.0.1:5432/telli_dialog_db"
```

If you start with a fresh database, apply migrations and seed the database; otherwise the application will not work.

Add api keys in your .env.local file for all federal states that you want to login with, e.g. DE_BY_API_KEY for bavaria.

```sh
# with proper values in /apps/dialog/.env.local file
cd packages/shared
pnpm db:seed:local

```

You can now start the application from the root directory:

```sh
pnpm dev
```

## Keycloak

Keycloak is used for logins both locally and in e2e tests.
The realm, client and several predefined users are configured in [telli-local-realm.json](devops/docker/keycloak/telli-local-realm.json).
Users are defined at the bottom of the json.

The json is imported once when starting keycloak, but only if the realm does not yet exist.
When updating the json, remember to drop your local keycloak docker volume to re-import the realm.

## Valkey

We use Valkey for storing session data.
It is part of the `docker-compose.local.yml` file.
If you want to access the values for testing or experimenting, you can use [valkey-cli](https://valkey.io/topics/installation/).
Then you can access the local instance as follows:

```sh
# check if valkey-cli is installed correctly
valkey-cli --version
# check if connection to local instance is working, otherwise check hostname, port, etc.
valkey-cli PING
# show current stats
valkey-cli --stats
```

## Monitoring

To setup the monitoring and tracing stack in local development use following docker compose file:

```sh
docker compose -f devops/docker/monitoring.yml up -d
```

Also make sure to include the required env variables in your `.env.local`.

## E2E Tests

We use playwright for e2e testing, refer to the [details](apps/dialog/e2e/README.md) for setup guide.
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
