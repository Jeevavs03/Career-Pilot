# API Reference

Base URL: `http://localhost:5000/api/v1`

## Authentication

### POST /auth/register
```json
{ "email": "user@example.com", "password": "password123", "name": "User Name" }
```

### POST /auth/login
```json
{ "email": "user@example.com", "password": "password123" }
```

### POST /auth/refresh
```json
{ "refreshToken": "..." }
```

### GET /auth/profile
Headers: `Authorization: Bearer <token>`

### PUT /auth/profile
Headers: `Authorization: Bearer <token>`

---

## Jobs

### GET /jobs?page=1&limit=20
List all jobs with pagination.

### GET /jobs/matched?page=1&minScore=75
List matched jobs above minimum score.

### GET /jobs/stats
Job statistics (total, matched, applied, interview, offer).

### GET /jobs/search?q=react
Search jobs by text query.

### POST /jobs/scrape
```json
{ "url": "https://linkedin.com/jobs/view/..." }
```

### POST /jobs/bulk-scrape
```json
{ "urls": ["https://...", "https://..."] }
```

### DELETE /jobs/:id

---

## Applications

### GET /applications?page=1&status=ready
List applications with optional status filter.

### GET /applications/stats
Application statistics.

### POST /applications
```json
{ "jobId": "..." }
```
Creates application package (cover letter, answers, match analysis).

### PATCH /applications/:id/approve
### PATCH /applications/:id/reject

---

## Resumes

### GET /resumes
### POST /resumes
```json
{ "content": "Resume text...", "name": "Master Resume" }
```

### POST /resumes/generate-variants
Generates Angular, React, MERN, Full Stack variants from master.

### POST /resumes/:id/ats-score
```json
{ "jobDescription": "..." }
```

### GET /resumes/:id/export/pdf
### GET /resumes/:id/export/docx

---

## Cover Letters

### GET /cover-letters
### POST /cover-letters
```json
{ "jobId": "..." }
```

### GET /cover-letters/:id/export/pdf
### GET /cover-letters/:id/export/docx

---

## Analytics

### GET /analytics/dashboard
### GET /analytics/salary-trends
### GET /analytics/tech-demand
### POST /analytics/report
Generate HTML report saved to /reports.

---

## AI

### GET /ai/status
Check Ollama availability and loaded models.

### POST /ai/chat
```json
{ "message": "Help me prepare for a React interview" }
```

### POST /ai/answer
```json
{ "question": "Why do you want this role?", "jobId": "..." }
```

---

## Settings

### GET /settings
### PUT /settings
```json
{
  "hardwareMode": "medium",
  "autoSearch": true,
  "filters": { "minSalary": 7, "maxExperience": 3, "minMatchScore": 75 }
}
```
