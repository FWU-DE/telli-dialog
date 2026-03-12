# Project Directory Structure

This document provides an overview of the top-level directories in the project with brief explanations of their purpose and contents.

## [`/apps/dialog`](/apps/dialog)

The main user-facing web application. A Next.js app with the app router used by students and teachers.

## [`/apps/admin`](/apps/admin)

The admin web application. A Next.js app that allows admins to configure telli-api and telli-dialog (federal state settings, models, etc.).

## [`/apps/api`](/apps/api)

The telli proxy API. A Fastify REST API that acts as a proxy to LLM providers, handling billing and access control. Swagger docs are served at `/docs`.

## [`/packages/shared`](/packages/shared)

Shared code used by the dialog and admin apps. Contains the dialog database schema, Drizzle ORM configuration, database access functions, services, and utilities.

Key contents:

- `src/db/` — Schema definitions, migrations, seed scripts, and database access functions
- `src/knotenpunkt/` — Client for calling the telli-api service to access LLM providers (completions, embeddings, images). Note: ai-core now reads model configuration directly from the database, but still uses knotenpunkt to make requests to the telli-api service.
- `src/s3/` — S3-compatible storage utilities
- `src/logging/` — Shared logging helpers

## [`/packages/api-database`](/packages/api-database)

Database schema, Drizzle ORM configuration, and seed scripts for the API app. Manages the separate PostgreSQL database used exclusively by `apps/api`.

Key contents:

- `src/schema.ts` — Table definitions (organizations, projects, API keys, LLM models)
- `src/seed.ts` — Database seed script
- `src/migrate.ts` — Migration runner

## [`/packages/ai-core`](/packages/ai-core)

Logic to communicate with AI providers and LLMs. Handles chat completions, embeddings, image generation, and API key management including billing and access control.

## [`/packages/ui`](/packages/ui)

Shared UI component library based on [shadcn/ui](https://ui.shadcn.com/). Contains reusable React components and global Tailwind styles used across dialog and admin apps.

## [`/packages/typescript-config`](/packages/typescript-config)

Shared TypeScript configuration presets (`base.json`, `nextjs.json`, `react-library.json`, `api-base.json`) used across all apps and packages.

## [`/devops`](/devops)

Infrastructure configuration.

Key contents:

- `docker/docker-compose.local.yml` — Local development services (PostgreSQL, Keycloak, Valkey)
- `docker/monitoring.yml` — Local monitoring stack (OpenTelemetry, Jaeger)
- `docker/keycloak/` — Keycloak realm configuration
