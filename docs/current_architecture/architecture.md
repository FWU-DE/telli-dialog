# Architecture

> Status: Non-authoritative snapshot.
> Agent rule: Do not use this file as implementation context unless the user explicitly asks to update architecture docs.

> Generated from codebase analysis. Update when significant structural changes are made.
> Sections without current content are omitted; numbering follows the [arc42](https://arc42.org) template.

---

## 3. System Scope and Context

### 3.1 Overview

Actors and the three applications they interact with.

```mermaid
graph LR
    users(["Users\n(Students · Teachers)"])
    admins(["Admins"])
    clients(["API Clients"])

    subgraph system["ais-chat"]
        direction TB
        chatbot["apps/chat-bot\nNext.js · :3000"]
        admin["apps/admin\nNext.js · :3001"]
        api["apps/api\nFastify AI Gateway"]
    end

    users --> chatbot
    admins --> admin
    clients --> api
    chatbot -->|model sync| api
    admin -->|model sync| api
```

### 3.2 apps/chat-bot context

The main user-facing web application. A Next.js app with the App Router used by students and teachers.

```mermaid
graph TB
    chatbot["apps/chat-bot\nNext.js · :3000"]

    chatbot --> auth["Authentication\n(VIDIS SSO)"]
    chatbot --> llm["LLM Providers\n(OpenAI · Azure · IONOS · Vertex AI)"]
    chatbot --> data[("Data Stores\n(App DB · API DB · Valkey · S3)")]
    chatbot --> ext["External Services\n(RabbitMQ · Crawl4AI · Xberg / Linkup)"]
    chatbot --> obs["Observability\n(Sentry · OpenTelemetry)"]
```

### 3.3 apps/admin context

The admin web application. A Next.js app that allows admins to configure the system — federal state settings, models, and more.

```mermaid
graph TB
    admin["apps/admin\nNext.js · :3001"]

    admin --> auth["Authentication\n(Keycloak)"]
    admin --> bifrost["Bifrost\n(org & identity mgmt)"]
    admin --> data[("Data Stores\n(App DB · API DB)")]
    admin --> obs["Observability\n(Sentry · OpenTelemetry)"]
```

### 3.4 apps/api context

Fastify REST API acting as a proxy to LLM providers, handling billing and access control. Swagger docs are served at `/docs`.

```mermaid
graph TB
    api["apps/api\nFastify AI Gateway"]

    api --> llm["LLM Providers\n(OpenAI · Azure · IONOS · Vertex AI)"]
    api --> data[("Data Stores\n(API DB)")]
    api --> obs["Observability\n(Sentry · OpenTelemetry)"]
```

> **Note:** `apps/chat-bot` calls LLM providers directly via `@ais-chat/ai-core` (not through `apps/api`). `apps/api` is the AI gateway for external API clients and is also called by `apps/chat-bot` and `apps/admin` to sync the LLM model catalog (knotenpunkt).

---

## 5. Building Block View

Internal `@ais-chat/*` dependencies. `@ais-chat/eslint-config` and `@ais-chat/typescript-config` are dev-only and omitted.

### 5.1 High-level package graph

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    subgraph t1[" "]
        direction TB
        chatbot["apps/chat-bot"]
        admin["apps/admin"]
        api["apps/api"]
    end

    subgraph t2[" "]
        direction TB
        shared["@ais-chat/shared"]
        ui["@ais-chat/ui"]
    end

    subgraph t3[" "]
        direction TB
        aicore["@ais-chat/ai-core"]
        sharedcore["@ais-chat/shared-core"]
    end

    apidb["@ais-chat/api-database"]

    style t1 fill:none,stroke:none
    style t2 fill:none,stroke:none
    style t3 fill:none,stroke:none

    chatbot --> aicore & shared & ui
    admin --> shared & ui & apidb
    api --> aicore & sharedcore & apidb
    shared --> aicore & sharedcore
    aicore --> apidb
```

### 5.2 Frontend/client package view

Runtime dependencies used by browser-facing applications (`apps/chat-bot`, `apps/admin`).

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    subgraph feapps["Frontend Apps"]
        chatbot["apps/chat-bot"]
        admin["apps/admin"]
    end

    subgraph fepkg["Frontend-facing packages"]
        ui["@ais-chat/ui"]
        shared["@ais-chat/shared"]
        aicore["@ais-chat/ai-core"]
    end

    subgraph beds["Indirect backend dependencies"]
        apidb["@ais-chat/api-database"]
        sharedcore["@ais-chat/shared-core"]
    end

    chatbot --> ui & shared & aicore
    admin --> ui & shared & apidb
    shared --> aicore & sharedcore
    aicore --> apidb
```

### 5.3 Backend/server package view

Runtime dependencies used by server-side API execution paths.

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    api["apps/api"]

    subgraph bepkgs["Backend packages"]
        direction TB
        aicore["@ais-chat/ai-core"]
        sharedcore["@ais-chat/shared-core"]
        apidb["@ais-chat/api-database"]
    end

    api --> aicore & sharedcore & apidb
    aicore --> apidb
```

### 5.4 Package internals

#### 5.4.1 Cross-package module flow

Cross-package call flow through the three tightly coupled runtime packages. `@ais-chat/ui` and `@ais-chat/shared-core` are standalone utility packages covered separately in 5.4.4.

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    subgraph shared["@ais-chat/shared"]
        shared_actions["actions"]
        shared_services["feature services"]
        shared_db["db access + migrations"]
        shared_integrations["integrations\n(knotenpunkt, logging, etc.)"]
        shared_actions --> shared_services
        shared_services --> shared_db & shared_integrations
    end

    subgraph aicore["@ais-chat/ai-core"]
        ai_entry["generation entrypoints"]
        ai_provider["provider adapters"]
        ai_usage["usage/billing tracking"]
        ai_entry --> ai_provider & ai_usage
    end

    subgraph apidb["@ais-chat/api-database"]
        api_schema["schema"]
        api_queries["typed DB access"]
        api_migrations["migrations + seed"]
        api_queries --> api_schema
        api_migrations --> api_schema
    end

    shared_services --> ai_entry
    ai_provider --> api_queries
    ai_usage --> api_queries
```

#### 5.4.2 `@ais-chat/shared`

Shared code used by `apps/chat-bot` and `apps/admin`. Contains the App DB schema, Drizzle ORM configuration, database access functions, services, and utilities. Internally split between frontend-facing entrypoints and backend/integration concerns.

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    subgraph fe["Frontend-facing entrypoints"]
        sa["src/actions/\n(run-server-action, server-action-result)"]
        sl["feature service modules\n(src/assistants/, src/conversation/,\nsrc/characters/, src/sharing/, ...)"]
        sa --> sl
    end

    sg["src/auth/ · src/error/ · src/utils/"]

    subgraph be["Backend / integration concerns"]
        sdb["src/db/\n(schema.ts, migrate.ts, seed/)"]
        sint["src/knotenpunkt/ · src/logging/\nsrc/s3/ · src/valkey/ · src/sentry/"]
        score["src/env.ts · src/metrics/"]
    end

    sl --> sg
    sl --> sdb & sint & score
    sint --> aicore["@ais-chat/ai-core"]
```

#### 5.4.3 `@ais-chat/ai-core`

Logic to communicate with AI providers and LLMs. Handles chat completions, embeddings, image generation, and API key management including billing and access control. Below is the internal request pipeline from callers to providers and usage tracking.

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    callers["Callers\n(apps/chat-bot, apps/api, @ais-chat/shared)"] --> entry["src/chat/index.ts\nsrc/images/ · src/embeddings/"]

    subgraph orchestration["AI orchestration"]
        direction TB
        modelres["src/api-keys/ · src/models/\n(resolve model + credentials)"]
        prompt["src/chat/agent-loop.ts\n(prompt + tool orchestration)"]
        provider["src/chat/providers/\n(OpenAI, Azure, Vertex, IONOS)"]
        usage["usage recorded via\n@ais-chat/api-database"]
    end

    entry --> modelres
    entry --> prompt
    prompt --> provider
    provider --> usage

    modelres --> apidb["@ais-chat/api-database\nsrc/schema.ts · src/api-utils/"]
    usage --> apidb
```

#### 5.4.4 `@ais-chat/ui` and `@ais-chat/shared-core`

`@ais-chat/ui` is the shared UI component library based on [shadcn/ui](https://ui.shadcn.com/), providing reusable React components and global Tailwind styles used across `apps/chat-bot` and `apps/admin`. `@ais-chat/shared-core` contains cross-app, framework-agnostic utilities used by all three applications.

```mermaid
%%{init: {'flowchart': {'curve': 'rounded'}}}%%
graph LR
    subgraph ui["@ais-chat/ui (frontend only)"]
        direction TB
        primitives["src/components/\n(button, dialog, table, select, ...)"]
        composites["src/components/common/\n(composed domain components)"]
        hooks["src/hooks/ · src/types/"]
        styles["src/styles/ (Tailwind tokens)"]
        composites --> primitives
        composites --> hooks
        composites --> styles
    end

    subgraph core["@ais-chat/shared-core (cross-runtime)"]
        direction TB
        coreutils["src/crypto/ (hashing, key utils)"]
        coresentry["src/sentry/ (shared Sentry helpers)"]
    end

    chat["apps/chat-bot"] --> composites
    adm["apps/admin"] --> composites
    api["apps/api"] --> coreutils
    shared["@ais-chat/shared"] --> coreutils
    shared --> coresentry
```

### 5.5 Database architecture

The system uses two separate PostgreSQL databases with distinct responsibilities.

```mermaid
graph LR
    chatbot(["apps/chat-bot"])
    admin(["apps/admin"])
    api(["apps/api"])
    aicore(["@ais-chat/ai-core"])
    shared(["@ais-chat/shared\n(owns migrations)"])
    apidbpkg(["@ais-chat/api-database\n(owns migrations)"])

    subgraph AppDB["App DB (DATABASE_URL)"]
        appnode[("PostgreSQL")]
    end

    subgraph APIDB["API DB (API_DATABASE_URL)"]
        apinode[("PostgreSQL")]
    end

    chatbot --> appnode
    admin --> appnode
    shared --> appnode

    api --> apinode
    admin --> apinode
    aicore --> apinode
    apidbpkg --> apinode
```

#### App DB — Core entities

Core user-facing domain tables. Audit columns (`created_at`, `updated_at`, `is_deleted`, `suspended`) omitted for brevity.

Note: `assistant` has no direct FK to `llm_model` in the App DB schema. For assistant chats, the active model is selected at runtime by chat request/model resolution logic.

Table structure:

```mermaid
erDiagram
    user_entity {
        uuid id PK
        enum user_role
        text federal_state_id FK
        text last_used_model
        int version_accepted_conditions
    }
    federal_state {
        text id PK
        int teacher_price_limit
        int student_price_limit
        uuid api_key_id
        int chat_storage_time
        json feature_toggles
        json design_configuration
    }
    llm_model {
        uuid id PK
        text provider
        text name
        text display_name
        text description
        json price_metadata
        bool is_new
    }
    conversation {
        uuid id PK
        text name
        uuid user_id FK
        uuid character_id FK
        uuid learning_scenario_id FK
        uuid assistant_id FK
        enum type
        timestamp deleted_at
    }
    conversation_message {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        text content
        text model_name
        enum role
        int order_number
        json tool_calls
    }
    character {
        uuid id PK
        text name
        text author
        uuid user_id FK
        uuid model_id FK
        enum access_level
        text instructions
        text description
        bool has_link_access
    }
    assistant {
        uuid id PK
        text name
        text author
        uuid user_id FK
        enum access_level
        text system_prompt
        text description
        bool is_web_search_enabled
    }
    learning_scenario {
        uuid id PK
        text name
        text author
        uuid user_id FK
        uuid model_id FK
        enum access_level
        text student_exercise
        bool has_link_access
    }
```

Relationships (ownership/context):

```mermaid
graph LR
    subgraph col1[" "]
        federal_state["federal_state"]
    end

    subgraph col2[" "]
        user_entity["user_entity"]
    end

    subgraph col3[" "]
        character["character"]
        assistant["assistant"]
        learning_scenario["learning_scenario"]
    end

    subgraph col4[" "]
        conversation["conversation"]
    end

    style col1 fill:none,stroke:none
    style col2 fill:none,stroke:none
    style col3 fill:none,stroke:none
    style col4 fill:none,stroke:none

    federal_state -->|home state| user_entity
    user_entity -->|creates| character
    user_entity -->|creates| assistant
    user_entity -->|creates| learning_scenario
    user_entity -->|owns| conversation

    character -->|used in| conversation
    assistant -->|used in| conversation
    learning_scenario -->|used in| conversation
```

Relationships (chat + model wiring):

```mermaid
graph TB
    llm_model["llm_model"] -->|used by| character["character"]
    llm_model -->|used by| learning_scenario["learning_scenario"]

    character -->|used in| conversation["conversation"]
    assistant["assistant"] -->|used in| conversation
    learning_scenario -->|used in| conversation

    conversation -->|contains| conversation_message["conversation_message"]
```

#### App DB — Supporting tables

Sharing sessions, config, model assignment, usage tracking and moderation. FK columns reference core entities above.

Table structure:

```mermaid
erDiagram
    federal_state_llm_model_mapping {
        uuid id PK
        text federal_state_id FK
        uuid llm_model_id FK
    }
    character_template_mappings {
        uuid character_id FK
        text federal_state_id FK
    }
    learning_scenario_template_mappings {
        uuid learning_scenario_id FK
        text federal_state_id FK
    }
    shared_character_conversation {
        uuid id PK
        uuid character_id FK
        uuid user_id FK
        text invite_code UK
        int token_points_limit
        int max_usage_time_limit
        timestamp started_at
        timestamp expired_at
        timestamp manually_stopped_at
    }
    shared_learning_scenario {
        uuid id PK
        uuid learning_scenario_id FK
        uuid user_id FK
        text invite_code UK
        int token_points_limit
        int max_usage_time_limit
        timestamp started_at
        timestamp expired_at
        timestamp manually_stopped_at
    }
    suspension_request {
        uuid id PK
        uuid character_id FK
        uuid assistant_id FK
        uuid learning_scenario_id FK
        uuid requester_id FK
        enum reason
        varchar description
        bool checked
    }
    info_banner {
        uuid id PK
        enum type
        text message
        text button_label
        text button_url
        timestamp starts_at
        timestamp ends_at
        int max_login_count
    }
    info_banner_federal_state_mapping {
        uuid info_banner_id FK
        text federal_state_id FK
    }
    info_banner_user_state {
        uuid info_banner_id FK
        uuid user_id FK
        int login_count
    }
    tool_call_cost {
        enum tool_call_name PK
        double costs_in_cent
    }
    conversation_usage_tracking {
        uuid id PK
        uuid conversation_id
        uuid user_id
        uuid model_id FK
        int completion_tokens
        int prompt_tokens
        double costs_in_cent
    }
    shared_learning_scenario_usage_tracking {
        uuid id PK
        uuid learning_scenario_id
        uuid user_id
        uuid model_id FK
        int completion_tokens
        int prompt_tokens
        double costs_in_cent
    }
    shared_character_chat_usage_tracking {
        uuid id PK
        uuid character_id
        uuid user_id
        uuid model_id FK
        int completion_tokens
        int prompt_tokens
        double costs_in_cent
    }
```

Relationships:

```mermaid
graph LR
    info_banner["info_banner"] -->|shown in| info_banner_federal_state_mapping["info_banner_federal_state_mapping"]
    info_banner -->|tracked for| info_banner_user_state["info_banner_user_state"]
```

#### API DB

```mermaid
erDiagram
    organization {
        uuid id PK
        text name
    }
    project {
        text id PK
        text name
        uuid organization_id FK
    }
    admin {
        uuid id PK
        text email
        text password_hash
    }
    llm_model {
        uuid id PK
        text provider
        text name
        text display_name
        json settings
        json price_metadata
        uuid organization_id FK
        bool is_new
        bool is_deleted
    }
    api_key {
        uuid id PK
        text name
        text key_id
        text project_id FK
        enum state
        int limit_in_cent
        timestamp expires_at
    }
    llm_model_api_key_mapping {
        uuid id PK
        uuid llm_model_id FK
        uuid api_key_id FK
    }
    completion_usage_tracking {
        uuid id PK
        int completion_tokens
        int prompt_tokens
        int total_tokens
        double costs_in_cent
        uuid model_id FK
        uuid api_key_id FK
    }
    image_generation_usage_tracking {
        uuid id PK
        double costs_in_cent
        uuid model_id FK
        uuid api_key_id FK
    }
```

Relationships:

```mermaid
graph LR
    subgraph col1[" "]
        organization["organization"]
    end

    subgraph col2[" "]
        project["project"]
        llm_model["llm_model"]
    end

    subgraph col3[" "]
        api_key["api_key"]
    end

    subgraph col4[" "]
        llm_model_api_key_mapping["llm_model_api_key_mapping"]
    end

    style col1 fill:none,stroke:none
    style col2 fill:none,stroke:none
    style col3 fill:none,stroke:none
    style col4 fill:none,stroke:none

    organization -->|has| project
    organization -->|owns| llm_model
    project -->|has| api_key
    api_key -->|grants| llm_model_api_key_mapping
    llm_model -->|accessed via| llm_model_api_key_mapping
```

Usage tracking relations:

```mermaid
graph LR
    subgraph col1[" "]
        llm_model["llm_model"]
        api_key["api_key"]
    end

    subgraph col2[" "]
        completion_usage_tracking["completion_usage_tracking"]
        image_generation_usage_tracking["image_generation_usage_tracking"]
    end

    style col1 fill:none,stroke:none
    style col2 fill:none,stroke:none

    api_key -->|billed to| completion_usage_tracking
    api_key -->|billed to| image_generation_usage_tracking
    llm_model -->|used for| completion_usage_tracking
    llm_model -->|used for| image_generation_usage_tracking
```

### 5.6 Type landscape

Overview of the main type sources used across applications and packages. This subsection is intentionally focused on where canonical types come from and how they flow, not on listing every exported type.

#### 5.6.1 Type source map

| Area                                    | Primary source files                                                                | Type pattern                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| App DB domain types                     | `packages/shared/src/db/schema.ts`                                                  | Drizzle table definitions + Zod schemas + inferred models (`*SelectModel`, `*InsertModel`, `*UpdateModel`) |
| API DB domain types                     | `packages/api-database/src/schema.ts`                                               | Drizzle table definitions + `$inferSelect` / `$inferInsert` model types                                    |
| AI chat contract types                  | `packages/ai-core/src/chat/types.ts`                                                | Explicit TypeScript aliases for messages, tools, stream events, token usage                                |
| AI image/embedding contract types       | `packages/ai-core/src/images/types.ts`, `packages/ai-core/src/embeddings/types.ts`  | Provider-agnostic request/response aliases                                                                 |
| API request validation types            | `apps/api/src/routes/(app)/v1/**/post.ts`, `apps/api/src/routes/(app)/v1/**/get.ts` | Zod runtime validation + `z.infer` request types                                                           |
| Shared auth and cross-feature app types | `packages/shared/src/auth/user-model.ts`, `packages/shared/src/db/types.ts`         | Shared service-facing aliases and compositional app models                                                 |

#### 5.6.2 High-level type flow

```mermaid
graph LR
    appdb["App DB types\npackages/shared/src/db/schema.ts"]
    apidb["API DB types\npackages/api-database/src/schema.ts"]
    aitypes["AI core types\npackages/ai-core/src/**/types.ts"]
    apiroutes["API route request types\napps/api/src/routes/**"]
    chatapp["apps/chat-bot"]
    adminapp["apps/admin"]
    apiapp["apps/api"]

    appdb --> chatapp
    appdb --> adminapp
    appdb --> apiapp

    apidb --> apiapp
    apidb --> aitypes

    aitypes --> chatapp
    aitypes --> apiapp

    apiroutes --> apiapp
```

#### 5.6.3 Canonical patterns currently used

1. Database-backed domain types in shared are generated from table schemas and exposed as `*SelectModel`, `*InsertModel`, and `*UpdateModel` aliases.
2. API DB models are inferred directly from Drizzle tables (`$inferSelect`, `$inferInsert`) and used in API-facing services.
3. Request bodies in `apps/api` are validated with Zod in route handlers; static request types are derived via `z.infer` from the same schemas.
4. AI-core uses explicit TypeScript aliases for chat/message/tool/stream contracts to keep provider integrations consistent.

#### 5.6.4 Semantic overlap in type information

The following domains contain same or very similar information represented by separate type families:

| Information domain             | Type families / locations                                                                                                                                                                                                                                                   | Overlap                                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI design configuration        | `packages/shared/src/db/types.ts` (`DesignConfiguration`), `packages/ui/src/types/design-configuration.ts` (`DesignConfigurationSchema` + inferred type)                                                                                                                    | Same four color fields (`primaryColor`, `primaryTextColor`, `secondaryColor`, `secondaryTextColor`) represented in both shared and UI layers.                                 |
| LLM price metadata             | `packages/shared/src/db/types.ts` (`LlmModelPriceMetadata` via `KnotenpunktPriceMetadata`), `packages/api-database/src/types.ts` (`llmModelPriceMetadataSchema` + inferred type)                                                                                            | Both model text/image/embedding pricing information with parallel structures and variant logic.                                                                               |
| Entity classification          | `packages/shared/src/entities/entity-types.ts` (`EntityType`, `UrlEntityType`), `apps/chat-bot/src/components/hooks/use-persisted-overview-filter.ts` (local `EntityType`)                                                                                                  | Same conceptual entity set (assistant/character/learning scenario) expressed in multiple string-union formats (domain form, URL form, pluralized UI form).                    |
| Chat/file metadata             | `packages/shared/src/utils/chat.ts` (`FileMetadata`, `ConversationMessageMetadata`), `packages/shared/src/db/schema.ts` (`FileMetadata`)                                                                                                                                    | Both represent file-related metadata for conversation content, but one is a concrete chat payload shape while the DB-side alias is unconstrained (`Record<string, unknown>`). |
| Token usage and billing        | `packages/ai-core/src/chat/types.ts` (`TokenUsage`), `packages/ai-core/src/embeddings/types.ts` (`EmbeddingUsage`), `packages/ai-core/src/images/types.ts` (`Usage`), usage tracking models in `packages/api-database/src/schema.ts` and `packages/shared/src/db/schema.ts` | Prompt/completion/total token counts and cost fields recur across runtime contracts and persistence models with modality-specific variations.                                 |
| Chat message contract          | `packages/ai-core/src/chat/types.ts` (`Message`, `ChatAttachment`), `apps/api/src/routes/(app)/v1/chat/completions/post.ts` (request message schema), `apps/api/src/ai-core-adapter/messages.ts` (mapping layer)                                                            | Role/content/attachment semantics are modeled both as public API request schema and internal ai-core contract, requiring explicit transformation.                             |
| Error-result transport pattern | `packages/shared/src/utils/error.ts` (`Result<T>`, `AsyncResult<T>`), `packages/api-database/src/api-utils/error.ts` (`Result<T>`, `AsyncResult<T>`)                                                                                                                        | Same tuple-based success/error transport is implemented independently in multiple packages.                                                                                   |

#### 5.6.5 Terminology overlap analysis: `custom-chat` vs `entity`

The same conceptual object family (assistant, character, learning scenario) is currently described with multiple naming systems.

| Naming system | Representative locations                                                                                                                                                                                    | Typical forms                                          | Semantic scope in practice                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `custom-chat` | `apps/chat-bot/src/components/custom-chat/**`, `apps/chat-bot/src/app/api/chat/chat-service.ts` (`CustomChatIds`), `packages/shared/src/auth/authorization-service.ts` (`filterReadableCustomChats`)        | `custom-chat`, `customChat`, `CustomChat*`             | Used as a UX/composable feature label, but frequently refers to the same assistant/character/learning-scenario domain entities. |
| `entity`      | `packages/shared/src/entities/entity-types.ts` (`EntityType`, `EntityRef`), `apps/chat-bot/src/components/entity-overview/**`, `apps/chat-bot/src/app/(authed)/(chat-bot)/actions/entity-filter-actions.ts` | `entity`, `EntityType`, `EntityRef`, `entity-overview` | Used as a domain abstraction and cross-feature identifier for the same object family.                                           |

Observed form variants for the same concept set:

1. Singular domain form: `assistant`, `character`, `learningScenario`.
2. URL/slugs form: `assistant`, `character`, `learning-scenario`.
3. UI pluralized form: `assistants`, `characters`, `learning-scenarios`.

Observations:

- `custom-chat` and `entity` are not cleanly separated by architecture layer; both appear in UI, service, and shared utility contexts.
- Function and component names communicate different mental models for the same business object family (feature-first vs domain-first naming).

---

## 6. Runtime View

### 6.1 AI request flow

How a chat message travels from the browser to a LLM provider and back.
A periodic side-flow synchronises the LLM model catalog from `apps/api` into the App DB.

```mermaid
sequenceDiagram
    actor User
    participant CB as apps/chat-bot
    participant AppDB as App DB
    participant AC as @ais-chat/ai-core
    participant API as apps/api
    participant ApiDB as API DB
    participant LLM as LLM Provider

    Note over CB,LLM: Chat completion
    User->>CB: send message
    CB->>CB: requireAuth()
    CB->>AppDB: load conversation history & RAG context
    CB->>AC: generateTextStreamWithBilling()
    AC->>ApiDB: validate API key + resolve model & credentials
    AC->>LLM: streaming chat completion request
    LLM-->>AC: token stream
    AC->>ApiDB: record usage & billing
    AC-->>CB: SSE token stream
    CB-->>User: streamed response

    Note over CB,ApiDB: Model catalog sync (knotenpunkt)
    CB->>API: GET /v1/models
    API->>ApiDB: query llm_model
    API-->>CB: model list
    CB->>AppDB: upsert model catalog
```

---
