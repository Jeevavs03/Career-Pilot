# Configuration

## Environment Variables

All config is in `.env` at project root. Copy from `.env.example`:

```bash
cp .env.example .env
```

## Key Settings

### Hardware Mode
```env
HARDWARE_MODE=medium  # low | medium | high
```

| Mode | RAM | Chat Model | Embed Model |
|------|-----|-----------|-------------|
| low | 8GB | qwen2:1.5b | nomic-embed-text |
| medium | 16GB | llama3 | nomic-embed-text |
| high | 32GB | qwen2:14b | nomic-embed-text |

### AI Models
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_FALLBACK_MODEL=mistral
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### Scheduler
```env
SCHEDULER_MORNING=0 8 * * *    # 08:00 IST
SCHEDULER_EVENING=0 20 * * *   # 20:00 IST
SCHEDULER_TZ=Asia/Kolkata
```

### Job Filters (via Settings API or UI)
- Min Salary: 7 LPA
- Max Experience: 3 years
- Location: India
- Exclude: Lead, Principal, Architect, Manager, Staff Engineer
- Min Match Score: 75%

### Email (Optional)
Leave SMTP fields empty to use local HTML reports instead.

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| MongoDB | 27017 | Primary database |
| Redis | 6379 | Queue + cache |
| PostgreSQL | 5432 | Relational analytics |
| ChromaDB | 8000 | Vector search |
| Prometheus | 9090 | Metrics |
| Grafana | 3001 | Dashboards |
