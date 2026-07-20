# Character-Specific Diagrams

> Status: Non-authoritative snapshot.
> Agent rule: Do not use this file as implementation context unless the user explicitly asks to update architecture docs.

This document contains architecture diagrams and notes focused on character creation, access, and sharing.

---

## 1. Character Data Model

The character system enables teachers to create reusable AI personas that can be shared with students.

```mermaid
erDiagram
    USER ||--o{ CHARACTER : creates
    CHARACTER ||--o{ CONVERSATION : has
    CHARACTER ||--o{ CHARACTER_FILE : has
    CHARACTER ||--o{ CHARACTER_TEMPLATE_MAPPING : maps
    CHARACTER ||--o{ SHARED_CHARACTER_CONVERSATION : shares

    FEDERAL_STATE ||--o{ CHARACTER_TEMPLATE_MAPPING : filters
    USER ||--o{ SHARED_CHARACTER_CONVERSATION : initiates

    SHARED_CHARACTER_CONVERSATION ||--o{ SHARED_CHARACTER_CHAT_USAGE_TRACKING : tracks

    CHARACTER {
        uuid id PK
        uuid userId FK "owner"
        uuid modelId FK
        string name
        string description
        string instructions
        string learningContext
        string accessLevel "private|school|community|global"
        boolean suspended
        boolean isDeleted
        json filterGroup "school_types, subjects, grade_ranges, etc"
        uuid pictureId "avatar in S3"
        uuid originalCharacterId "if duplicated from template"
        timestamp createdAt
        timestamp updatedAt
    }

    SHARED_CHARACTER_CONVERSATION {
        uuid id PK
        uuid characterId FK
        uuid userId FK "teacher who shared"
        text inviteCode UK "unique invite code"
        integer tokenPointsLimit "budget for students"
        integer maxUsageTimeLimit "max minutes active"
        timestamp startedAt
        timestamp expiredAt
        timestamp manuallyStoppedAt "null if still active"
    }

    CHARACTER_TEMPLATE_MAPPING {
        uuid characterId FK "composite PK"
        text federalStateId FK "composite PK"
    }

    CHARACTER_FILE {
        uuid id PK
        uuid characterId FK
        uuid fileId FK "S3 file reference"
    }

    CONVERSATION {
        uuid id PK
        uuid userId FK
        uuid characterId FK "null if no character"
        string title
        timestamp createdAt
    }

    SHARED_CHARACTER_CHAT_USAGE_TRACKING {
        uuid id PK
        uuid sharedCharacterConversationId FK
        integer tokenPointsUsed "cumulative"
        timestamp lastUsedAt
    }

    FEDERAL_STATE {
        text id PK
        string name
    }

    USER {
        uuid id PK
        string email
        string name
    }
```

**Key Insights:**

- **Access Levels** differentiate character types: `private` (owner only) -> `school` (same schools) -> `community` (all teachers) -> `global` (everyone, subject to template mapping)
- **character_template_mappings** gates global characters to specific federal states; a global character not mapped to a state will not appear in that region's listings
- **shared_character_conversation** is not a conversation row. It is a sharing session with an invite code, token budget, and expiry time. One teacher can create multiple shares for the same character
- **shared_character_chat_usage_tracking** tracks cumulative token consumption per share session, enabling budget enforcement

---

## 2. Character Access and Sharing Flow

How characters are discovered, accessed, and shared with permission gates.

```mermaid
graph TD
    %% TEACHER PATH
    teacher["Teacher"]
    discover["Discover character"]
    gate1{"accessLevel\n(private|school|\ncommunity|global)"}
    gate2{"geographic gating\n(template mappings\nfor global)"}
    create_share["Create share session"]
    share_details["inviteCode · maxUsageTimeLimit\ntokenPointsLimit\nshared_character_conversation"]
    send_code["Share inviteCode\nwith students"]
    manage["Manage share:\nextendExpiration\nupdateBudget\nunshare"]

    %% STUDENT PATH
    student["Student"]
    receive_code["Receive inviteCode"]
    lookup["getSharedCharacter\ninviteCode"]
    gate3{"code valid?\nexpired?\nmanually stopped?"}
    gate4{"character\nsuspended?"}
    access_granted["Access granted +\nbudget info"]
    access_denied["Access denied"]

    %% USAGE PATH
    send_msg["Student sends message"]
    generate["Streaming token\ngeneration"]
    track["Track token usage\nin usage_tracking"]
    gate5{"within\nbudget limit?"}
    continue_gen["Continue generation"]
    over_budget["Over budget:\nstop generation\nRabbitMQ alert"]

    %% TEACHER FLOW
    teacher --> discover
    discover --> gate1
    gate1 -->|fail| discover
    gate1 -->|pass| gate2
    gate2 -->|fail| discover
    gate2 -->|pass| create_share
    create_share --> share_details
    share_details --> send_code
    send_code --> manage

    %% STUDENT FLOW
    student --> receive_code
    receive_code --> lookup
    lookup --> gate3
    gate3 -->|fail| access_denied
    gate3 -->|pass| gate4
    gate4 -->|fail| access_denied
    gate4 -->|pass| access_granted

    %% USAGE FLOW
    access_granted --> send_msg
    send_msg --> generate
    generate --> track
    track --> gate5
    gate5 -->|yes| continue_gen
    continue_gen --> send_msg
    gate5 -->|no| over_budget
    over_budget -.->|teacher notified| manage

    %% SHARING ENABLES STUDENT ACCESS
    send_code -.->|via code| lookup

    style gate1 fill:#fff4e6
    style gate2 fill:#fff4e6
    style gate3 fill:#fff4e6
    style gate4 fill:#fff4e6
    style gate5 fill:#fff4e6
```

**Access Control Gates (all must pass):**

1. **accessLevel** - Filters character visibility in teacher discovery (private|school|community|global)
2. **character_template_mappings** - Geographic gating for global characters (teacher's federal state)
3. **inviteCode valid** - Code must exist, not expired, and not manually stopped by teacher
4. **character not suspended** - If character is suspended, access is denied even to owner
5. **token budget** - Usage must not exceed `tokenPointsLimit` per share session

**Key Flows:**

- **Teacher creates and shares** - Discovers character -> passes access gates -> creates share session with unique inviteCode -> shares code with students
- **Student receives code** - Gets inviteCode from teacher -> looks up character -> validates code status -> checks character suspension -> receives access and budget info
- **Student uses with budget** - Sends message -> tokens stream and are tracked -> compared against limit -> if over, generation stops and teacher is notified via RabbitMQ
- **Teacher manages** - While share is active, can extend expiry, adjust budget, or manually stop share session

---

## 3. Layered Architecture: Request Flow Through Layers

How a character chat request flows vertically through the system from UI to database.

```mermaid
graph TD
    subgraph UILayer["UI Layer"]
        chat["chat.tsx\n(React Component)"]
    end

    subgraph HookLayer["Hook Layer"]
        hook1["useMainChat / useCharacterChat\n(type-safe wrappers)"]
        hook2["useAisChat\n(core chat state + streaming)"]
    end

    subgraph ServerActionLayer["Server Action Layer"]
        action["sendChatMessageAction\n(auth boundary)"]
        instrument["Sentry instrumentation\nerrorHandler: runServerAction"]
    end

    subgraph ServiceLayer["Service Layer\n(packages/shared)"]
        chatservice["sendChatMessage\norchestrates complex logic"]
        charservice["Character validation\nAccess control"]
        fileservice["File linking\nAttachment retrieval"]
        toolservice["Tool registry builder\n(agentic mode)"]
    end

    subgraph DBQueryLayer["Database Query Layer"]
        queries["dbGetCharacter\ndbGetConversation\ndbInsertMessage\ndbUpdateConversationTitle\netc."]
    end

    subgraph ExternalLayer["External Systems"]
        aicore["@ais-chat/ai-core\n(generateTextStreamWithBilling)"]
        s3["S3 File Service"]
        rag["RAG / Web Search\n(Crawl4AI, Linkup)"]
    end

    chat -->|submit message| hook1
    hook1 -->|client-side state| hook2
    hook2 -->|invoke server action| action
    action -->|auth: requireAuth\naccess: checkProductAccess| instrument
    instrument -->|delegate| chatservice

    chatservice -->|validate ownership| charservice
    chatservice -->|fetch files| fileservice
    chatservice -->|build tools| toolservice
    chatservice -->|load/create| queries
    chatservice -->|generate stream| aicore
    chatservice -->|retrieve chunks| rag
    chatservice -->|upload/download| s3

    queries -->|App DB| appdb[("PostgreSQL")]
    aicore -->|models & API keys| apidb[("PostgreSQL")]

    aicore -->|stream tokens| chatservice
    chatservice -->|chunk stream| hook2
    hook2 -->|update state| chat
```

**Pattern Notes:**

- **Auth boundary**: Server actions (`'use server'`) are where auth runs; `requireAuth()` and `checkProductAccess()` block unauthorized requests before service execution
- **Streaming**: Native `ReadableStream` used; chunks passed to hook which batches and updates client state
- **Error handling**: `runServerAction` wrapper catches `BusinessError` (user-safe) and `AiGenerationError` (AI-specific), allowing Next.js errors (redirect, notFound) to propagate
- **Instrumentation**: Sentry wraps all server actions with context (userId, conversationId, etc.)

---

## 4. Chat Message Flow (Happy Path)

Detailed sequence of a user sending a message through all layers.

```mermaid
sequenceDiagram
    actor User
    participant Comp as chat.tsx
    participant Hook as useAisChat
    participant Action as sendChatMessageAction
    participant Svc as sendChatMessage
    participant DB as App DB
    participant Core as ai-core
    participant APIDb as API DB

    rect rgb(200, 220, 255)
        Note over User,Comp: 1. User Input
        User->>Comp: type message + submit
        Comp->>Hook: handleSubmit()
    end

    rect rgb(200, 235, 200)
        Note over Hook,Comp: 2. Client-Side Prep (Hook)
        Hook->>Hook: create user message UUID
        Hook->>Comp: onMessageCreated(uuid)<br/>for file association
        Hook->>Action: submitMessage(serverAction)
    end

    rect rgb(255, 240, 200)
        Note over Action: 3. Server Boundary (Auth)
        Action->>Action: requireAuth() -> user context
        Action->>Action: checkProductAccess() -> verify permissions
        Action->>Action: Sentry instrumentation
    end

    rect rgb(240, 220, 255)
        Note over Svc: 4. Service Orchestration
        Svc->>Svc: resolve model by ID
        Svc->>DB: dbGetCharacter(characterId)
        DB-->>Svc: character data
        Svc->>DB: dbGetConversation() or create
        DB-->>Svc: conversation + history
        Svc->>Svc: validate character access
        Svc->>Svc: fetch attached files content
        Svc->>Svc: parse web URLs from message
        Svc->>Svc: build RAG context + tool definitions
        Svc->>Svc: construct system prompt
    end

    rect rgb(255, 220, 240)
        Note over Core: 5. AI Generation
        Svc->>Core: generateTextStreamWithBilling()
        Core->>APIDb: validate API key & quota
        APIDb-->>Core: model credentials
        Core->>Core: select LLM provider
        Core->>Core: open streaming connection
    end

    rect rgb(200, 240, 220)
        Note over Svc: 6. Streaming Loop
        loop each token chunk
            Core-->>Svc: token chunk
            Svc->>DB: batch persist tool calls
            Svc->>Svc: collect text chunk
        end
        Core-->>Svc: stream complete
    end

    rect rgb(240, 240, 200)
        Note over Svc: 7. Finalization
        Svc->>DB: insert assistant message
        Svc->>DB: dbUpdateConversationTitle() if first message
        Svc->>DB: insert token usage & cost
        Svc->>APIDb: record billing
        Svc->>Svc: emit RabbitMQ event<br/>new_message + budget_alerts
    end

    rect rgb(200, 220, 255)
        Note over Hook: 8. Client Consumption
        Svc-->>Hook: ReadableStream<chunks>
        Hook->>Hook: readTextStream()
        loop for each chunk
            Hook->>Hook: decode event (text|web_search_results)
            Hook->>Hook: create assistant message on 1st chunk
            Hook->>Hook: append chunk to message state
            Hook->>Comp: update UI
        end
        Hook->>Comp: onFinish() callback
    end

    rect rgb(200, 235, 200)
        Note over Comp,User: 9. UI Update
        Comp->>User: display new message
        Comp->>Comp: refetch conversation list (sidebar)
    end
```
