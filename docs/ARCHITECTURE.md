# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  Dashboard │ Jobs │ Applications │ Resumes │ Analytics│
└─────────────────────────┬───────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┴───────────────────────────┐
│                  Backend (Express.js)                 │
│  Controllers → Services → Repositories               │
├──────────┬──────────┬──────────┬────────────────────┤
│  Auth    │  Queue   │ Scheduler│    AI Layer         │
│  (JWT)   │ (BullMQ) │  (Cron)  │   (Ollama)         │
└────┬─────┴────┬─────┴────┬─────┴──────┬─────────────┘
     │          │           │            │
┌────┴──┐ ┌────┴──┐  ┌────┴──┐   ┌────┴──────┐
│MongoDB│ │ Redis │  │Postgres│   │  Ollama   │
│       │ │       │  │       │   │ (Local AI) │
└───────┘ └───────┘  └───────┘   └───────────┘
```

## Design Patterns

- **Repository Pattern** - Database access abstraction
- **Service Pattern** - Business logic layer
- **Controller Pattern** - Request/response handling
- **Queue Pattern** - Async job processing (BullMQ)
- **Observer Pattern** - Event-driven scheduling

## Data Flow

1. User adds job URLs → Scraper extracts data → MongoDB storage
2. Scheduler triggers → Filter engine runs → Matched jobs identified
3. AI Matching → Score calculation → Application package creation
4. User reviews → Approve/Reject → Status tracking

## AI Architecture

- **Chat/Generation**: Ollama → Llama3/Mistral/Qwen/DeepSeek
- **Embeddings**: nomic-embed-text for semantic search
- **Vector Storage**: ChromaDB for similarity search
- All processing is 100% local - no external API calls
