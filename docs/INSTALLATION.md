# Installation Guide

## Prerequisites

### Required
1. **Node.js 20+** - https://nodejs.org
2. **Docker Desktop** - https://docker.com
3. **Ollama** - https://ollama.ai
4. **Git** - https://git-scm.com

### System Requirements
- **Minimum**: 8GB RAM, 10GB disk space
- **Recommended**: 16GB RAM, 20GB disk space
- **Optimal**: 32GB RAM, 50GB disk space

## Step-by-Step Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd careerpilot-ai
```

### 2. Automated Setup
```bash
npm run setup
```

This will:
- Install all dependencies
- Start Docker containers (MongoDB, Redis, PostgreSQL, ChromaDB)
- Pull AI models (llama3, nomic-embed-text)
- Create `.env` file
- Create reports directory

### 3. Start Development
```bash
npm run dev
```

## Manual Installation

### Install Dependencies
```bash
npm install                    # Root
cd backend && npm install     # Backend
cd ../frontend && npm install # Frontend
```

### Start Infrastructure
```bash
docker-compose up -d
```

### Pull AI Models
```bash
ollama pull llama3
ollama pull nomic-embed-text
# Optional:
ollama pull mistral
ollama pull deepseek-r1
ollama pull qwen2
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env as needed (defaults work for local development)
```

### Start Application
```bash
npm run dev
```

## Troubleshooting

### Docker not starting
- Ensure Docker Desktop is running
- Check: `docker ps`

### Ollama not available
- Ensure Ollama is running: `ollama serve`
- Check models: `ollama list`

### MongoDB connection failed
- Check Docker: `docker logs careerpilot-mongo`
- Verify port 27017 is available

### Frontend build errors
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
