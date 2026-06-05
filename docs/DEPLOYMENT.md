# Deployment

## Local Development (Default)

```bash
npm run setup
npm run dev
```

## Production Build

```bash
# Build
npm run build

# Start backend
cd backend && npm start

# Serve frontend (use any static server)
cd frontend && npx serve dist
```

## Docker Deployment

### Full Stack
```bash
docker-compose up -d
```

### Backend Only Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

## Rollback Strategy

1. All deployments are local - no cloud rollback needed
2. Database: Use MongoDB dump/restore
   ```bash
   mongodump --db careerpilot --out ./backup
   mongorestore --db careerpilot ./backup/careerpilot
   ```
3. Git: `git revert` or `git checkout <commit>`

## Health Monitoring

- Backend: `GET /health`
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
