# Before: Message Flow (Simplified)

```mermaid
flowchart TB
    User(["👤 User sends message"])

    subgraph Dialog["telli-dialog"]
        Hook["useChat Hook\n(Vercel AI SDK)"]
        Route["API Route\n/api/chat"]
        SDK["streamText()\n+ OpenAI format"]
    end

    subgraph API["telli-api (Gateway)"]
        Validate["Validate API Key"]
        Limits["Check Limits"]
        Provider["Route to Provider"]
    end

    Cloud[("☁️ Azure/IONOS")]

    User --> Hook
    Hook -->|"HTTP #1"| Route
    Route --> SDK
    SDK -->|"HTTP #2"| Validate
    Validate --> Limits
    Limits --> Provider
    Provider -->|"HTTP #3"| Cloud

    Cloud -.->|"Stream"| Provider
    Provider -.->|"Re-format SSE"| SDK
    SDK -.->|"Parse proprietary"| Hook
    Hook -.-> User
```

**Pain Points:**

- 🔄 **3 network hops** (Hook→Route→API→Cloud)
- 📦 **Vercel AI SDK dependency** (proprietary stream format)
- 🔀 **Format translation** at every layer
- 🏗️ **Separate gateway service** to maintain
