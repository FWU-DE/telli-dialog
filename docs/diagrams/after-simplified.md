# After: Message Flow (Simplified)

```mermaid
flowchart TB
    User(["👤 User sends message"])

    subgraph Dialog["telli-dialog"]
        Hook["useTelliChat\n(custom hook)"]
        Action["Server Action"]
        Core["@telli/ai-core\ngenerateTextStream()"]
    end

    Cloud[("☁️ Azure/IONOS")]

    User --> Hook
    Hook --> Action
    Action --> Core
    Core -->|"HTTP (only 1!)"| Cloud

    Cloud -.->|"Native stream"| Core
    Core -.-> Action
    Action -.-> Hook
    Hook -.-> User
```

**Benefits:**

- ⚡ **1 network hop** (direct to cloud)
- 📦 **No external SDK** (own code, full control)
- 🎯 **Native streams** (no format translation)
- 🗑️ **No gateway service** needed
