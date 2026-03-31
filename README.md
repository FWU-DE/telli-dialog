# telli dialog

## Self-Hosted / Quick Start

This guide helps you run telli using pre-built Docker images with minimal configuration.

> [!CAUTION]
> The Docker Compose setup and credentials described in this section are intended **only for local exploration and testing**.
> They use hard-coded default secrets and users and are **not safe for production deployments**.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. **Start all services:**

   ```sh
   docker compose -f devops/docker/docker-compose.yml up -d
   ```

2. **Wait for initialization**

   The first startup will automatically:
   - Initialize empty databases and run migrations
   - Import the Keycloak realm and create predefined users
   - Create S3 bucket in RustFS

3. **Access the applications:**
   - **Dialog app**: http://localhost:3000
   - **Admin app**: http://localhost:3001
   - **API**: http://localhost:3002
   - **Keycloak**: http://localhost:8080 (credentials: `admin` / `admin`)
   - **RustFS Console**: http://localhost:9001 (S3-compatible storage, credentials: `rustfsadmin` / `rustfsadmin123`)

4. **Configure the application using telli-admin:**
   - Navigate to the admin app at http://localhost:3001
   - Login with teacher credentials (username: `teacher`, password: `password`)
   - In `telli-api` section:
     - Create your LLM models
     - Create Projects (i.e., federal states) and assign the models to them.
       The federal states `DE-TEST` must exist. Others can be created optionally.
     - Create API Key(s) for the project(s) you created and copy the key.
   - In `telli-dialog` section:
     - Create at least the `DE-TEST` federal state and assign the corresponding API Key to it.
     - Configure settings as needed.

5. **Login with default credentials:**

   Use any of the predefined users from the Keycloak realm configuration:
   - Username: `teacher` / Password: `password` (teacher)
   - See [telli-local-realm.json](devops/docker/keycloak/telli-local-realm.json) for all available users

### Customization

All services are preconfigured with sensible defaults in `devops/docker/docker-compose.yml`.
To customize environment variables edit `devops/docker/docker-compose.yml` directly or create a `docker-compose.override.yml`.

### Stopping and Cleanup

```sh
# Stop all services
docker compose -f devops/docker/docker-compose.yml down

# Remove all data (databases, volumes)
docker compose -f devops/docker/docker-compose.yml down -v
```

---

## Local Development (from source)

This section is for developers who want to run telli from source code.

### Requirements

- nvm
- [docker compose](https://docs.docker.com/compose/install/)

### Basic Tools

Before the application can be started, you need to install the necessary tools.

```sh
nvm use # sets up the node version
corepack enable # sets up the proper package manager
corepack prepare
pnpm i # installs the dependencies
```

### Environment variables

The project uses environment variables in `.env.local` files for local development configuration.

**Required `.env.local` files:**

- `apps/dialog/.env.local` — For the dialog app (database URLs, API connection, authentication, storage)
- `apps/api/.env.local` — For the API app (database URL, logging, telemetry)

For detailed variable documentation and values for local development with docker-compose, see the `.env.example` files in each app directory.

### Service dependencies

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

### Database

The project uses two separate PostgreSQL databases:

- **Dialog database** — managed by `packages/shared`, used by the dialog and admin apps
- **API database** — managed by `packages/api-database`, used by the API app

Check that you can access the local postgresql databases:

```sh
psql "postgresql://telli_dialog_db:test1234@127.0.0.1:5432/telli_dialog_db"
psql "postgresql://telli_api_db:test1234@127.0.0.1:5433/telli_api_db"
```

If you start with a fresh database, apply migrations and seed both databases; otherwise the application will not work.

```sh
pnpm db:migrate
```

Add api keys in your `.env.local` files for all federal states that you want to seed. These keys are used to fetch the available LLM models from the telli-api (e.g. `DE_BY_API_KEY` for Bavaria). If you previously seeded the api database, use the resulting API key.

The api database seed also requires LLM provider credentials for the models it creates locally. Add these to `apps/api/.env.local`:

```sh
LLM_IONOS_API_KEY=...
LLM_IONOS_BASE_URL=...
LLM_GPT4OMINI_API_KEY=...
LLM_GPT4OMINI_BASE_URL=...
LLM_GPT5NANO_API_KEY=...
LLM_GPT5NANO_BASE_URL=...
```

Without these, placeholder values are used and the models will not work until real keys are configured.

```sh
pnpm db:seed
```

You can now start the application from the root directory:

```sh
pnpm dev
```

### Keycloak

Keycloak is used for logins both locally and in e2e tests.
The realm, client and several predefined users are configured in [telli-local-realm.json](devops/docker/keycloak/telli-local-realm.json).
Users are defined at the bottom of the json.

The json is imported once when starting keycloak, but only if the realm does not yet exist.
When updating the json, remember to drop your local keycloak docker volume to re-import the realm.

### Valkey

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

To set up the monitoring and tracing stack in local development, use the following docker compose file:

```sh
docker compose -f devops/docker/monitoring.yml up -d
```

Also make sure to include the required env variables in your `.env.local`.

## E2E Tests

We use playwright for e2e testing, refer to the [details](apps/dialog/e2e/README.md) for a setup guide.
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

All whitelabel configurations can be set up in the telli-admin interface.
Custom designs and titles for federal states:

- **telliName**:  
  Custom name appearing in the sidebar and as website title.
  This value is configured in the SQL column `federal_state/telli_name`.

- **logos**:  
  The logo and favicon are stored in the S3 Bucket and referenced from the SQL column `federal_state/picture_urls`:

  ```
  {
    "logo": "whitelabels/Federal-State-ID/logo.svg",
    "favicon": "whitelabels/Federal-State-ID/favicon.svg"
  }
  ```

- **design configuration**:  
  Custom color palette for buttons, icons, etc. (see Figma designs).  
  This value is configured in the SQL column `federal_state/design_configuration`.
