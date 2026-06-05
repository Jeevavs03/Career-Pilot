# Troubleshooting

## Common Issues

### "AI service unavailable"
- **Cause**: Ollama is not running
- **Fix**: Start Ollama: `ollama serve`
- **Verify**: `curl http://localhost:11434/api/tags`

### "MongoDB connection failed"
- **Cause**: MongoDB not running
- **Fix**: `docker-compose up -d mongodb`
- **Verify**: `docker ps | grep mongo`

### "Redis not available"
- **Cause**: Redis container not running
- **Fix**: `docker-compose up -d redis`
- **Note**: App works without Redis (queues disabled)

### "Port already in use"
- **Fix**: Change PORT in .env or kill existing process
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <pid> /F
  ```

### "Scraping fails"
- LinkedIn/Naukri may block automated access
- Use manual job entry as alternative
- Ensure Playwright browsers are installed: `npx playwright install chromium`

### AI responses are slow
- Switch to `low` hardware mode for faster (but lower quality) responses
- Ensure no other heavy processes are using GPU/CPU
- Check `ollama ps` for loaded models

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Docker compose errors
```bash
docker-compose down -v   # Remove volumes
docker-compose up -d     # Restart fresh
```

## Logs

- Backend logs: `backend/logs/combined.log`
- Error logs: `backend/logs/error.log`
- Docker logs: `docker logs careerpilot-mongo`

## Reset Everything

```bash
# Stop services
docker-compose down -v

# Clear database
# (This deletes all data)
docker volume rm careerpilot-ai_mongo_data

# Fresh start
docker-compose up -d
npm run dev
```
