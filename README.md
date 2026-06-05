# 🚀 CareerPilot AI

**AI-powered Job Discovery, Resume Optimization & Application Management Platform**

100% Free • 100% Local • Zero Cloud Dependencies • Works Offline

![Node.js](https://img.shields.io/badge/Node.js-20+-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![React](https://img.shields.io/badge/React-19-61dafb) ![MongoDB](https://img.shields.io/badge/MongoDB-7-green) ![Ollama](https://img.shields.io/badge/Ollama-AI-purple)

---

## 🎯 What is CareerPilot AI?

An intelligent job-search assistant that automatically:

- 🔍 **Collects jobs** from LinkedIn, Naukri, Indeed, Glassdoor, Instahyre, Foundit & Wellfound
- 🎯 **Filters jobs** by salary, experience, location & excluded titles
- 🤖 **AI-matches** jobs against your profile using local LLMs (Ollama)
- 📄 **Generates tailored resumes** (Angular, React, MERN, Full Stack variants)
- ✉️ **Creates personalized cover letters** (150-250 words)
- 📋 **Builds application packages** for user review before submission
- 💬 **Pre-fills application answers** (salary, notice period, skills, etc.)
- 📊 **Analytics dashboard** with salary trends & tech demand
- ⏰ **Scheduled runs** at 08:00 & 20:00 IST daily
- 📧 **Reports** saved locally as HTML/PDF (or emailed if SMTP configured)

> ⚠️ The system does NOT automatically submit applications. It queues them for your approval.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Zustand, TanStack Query, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB (Mongoose) |
| AI | Ollama (Llama3, nomic-embed-text) |
| Queue | BullMQ + Redis |
| Automation | Playwright |
| Logging | Winston |
| Auth | JWT + Refresh Tokens |
| Export | PDFKit, docx |

---

## 📋 Prerequisites

Install these before running the app:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 20+ | https://nodejs.org |
| **MongoDB** | 7+ | https://www.mongodb.com/try/download/community |
| **Redis** | 7+ | Windows: `winget install taizod1024.redis-windows-fork` |
| **Ollama** | Latest | https://ollama.ai |
| **Git** | Latest | https://git-scm.com |

### Install on Windows (via winget)

```bash
# Redis (Windows port)
winget install taizod1024.redis-windows-fork

# MongoDB - install via MSI from mongodb.com
# Ollama - install from ollama.ai
```

### Pull AI Models (after installing Ollama)

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Jeevavs03/Career-Pilot.git
cd Career-Pilot

# 2. Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 3. Install Playwright browsers
cd backend && npx playwright install chromium && cd ..

# 4. Copy environment file
cp .env.example .env

# 5. Start essential services (MongoDB, Redis, Ollama)
node services.js

# 6. Pull AI models (required)
ollama pull llama3
ollama pull nomic-embed-text

# 7. Start the application (Backend + Frontend)
node start.js
```

> **Note:** On first run, the auto-pilot will scrape jobs → filter via regex → deep-screen each job through Llama3. On 16GB RAM this takes ~1-2 min for 30 jobs. On 8GB RAM it's significantly slower.

---

## 🌐 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |
| Ollama | http://localhost:11434 |

---

## 📂 Project Structure

```
Career-Pilot/
├── backend/                 # Express.js API
│   └── src/
│       ├── ai/             # Ollama AI modules (matching, resume, cover letter, Q&A)
│       ├── config/         # Database, Redis, app configuration
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth (JWT), error handling
│       ├── models/         # Mongoose models
│       ├── queues/         # BullMQ workers
│       ├── routes/         # API routes
│       ├── scrapers/       # Playwright job scrapers (7 platforms)
│       ├── services/       # Business logic
│       ├── jobs/           # Cron scheduler
│       └── utils/          # Logger, response helpers
├── frontend/               # React SPA
│   └── src/
│       ├── pages/          # Dashboard, Jobs, Applications, Analytics, etc.
│       ├── services/       # API client (Axios)
│       ├── stores/         # Zustand state management
│       └── components/     # Reusable UI components
├── monitoring/             # Prometheus + Grafana configs
├── reports/                # Generated HTML/PDF reports
├── docs/                   # Documentation
├── services.js             # Start essential services
├── start.js                # Start backend + frontend
├── docker-compose.yml      # Docker setup (optional)
└── .env.example            # Environment variables template
```

---

## ⚙️ Configuration

Edit `.env` to customize:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/careerpilot

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Model (based on your RAM)
HARDWARE_MODE=medium    # low (8GB) | medium (16GB) | high (32GB)

# Scheduler
SCHEDULER_MORNING=0 8 * * *
SCHEDULER_EVENING=0 20 * * *
SCHEDULER_TZ=Asia/Kolkata
```

### Hardware Modes

| Mode | RAM | AI Model | Screening Speed |
|------|-----|----------|----------------|
| Low | 8GB | tinyllama (1B) | ~5s/job |
| Medium | 16GB | llama3 (8B) | ~2-5s/job |
| High | 32GB | qwen2:14b | ~3-5s/job |

---

## 📖 How to Use

### 1. Register & Login
Open http://localhost:5173 → Register with email/password

### 2. Configure Profile (Settings page)
- Add your skills, target roles, locations
- Set experience, salary expectations, notice period
- Add platform credentials (LinkedIn, Naukri, etc.) for auto-apply

### 3. Run Auto-Pilot
Click **"Run Now"** on the Dashboard → It will:
- Scrape jobs from 7 platforms
- Filter by your criteria
- AI-match against your profile
- Generate application packages

### 4. Review Applications
Go to **Applications** page → Approve/Reject matched jobs

### 5. Manage Resumes
Upload master resume → Click **"Generate Variants"** for role-specific versions

---

## 🤖 AI Job Screening Pipeline

CareerPilot uses a two-stage screening pipeline:

```
[ Scraped Jobs from 7 platforms ]
       │
       ▼
 Stage 1: Instant Regex Filter (0ms)
   • Rejects: Senior/Lead/Architect titles
   • Rejects: Irrelevant tech (Java/.NET/Python if not in your skills)
   • Rejects: Experience too high (e.g., "5+ years" when you have 1)
   • ~50-60% of garbage eliminated instantly
       │
       ▼
 Stage 2: Llama3 Deep Analysis (2-5s/job on 16GB)
   • Strict ATS filter with forced JSON output
   • Checks: experience_fits_max_limit, skills_threshold_passed, location_is_allowed
   • ALL verdicts must pass — single failure = REJECTED
   • Returns structured audit with reasoning
       │
       ▼
 Only matched jobs → Application Queue (for your approval)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/autopilot/run | Run full pipeline |
| GET | /api/v1/jobs | List jobs |
| GET | /api/v1/applications | List applications |
| POST | /api/v1/resumes | Upload resume |
| POST | /api/v1/resumes/generate-variants | Generate role variants |
| POST | /api/v1/cover-letters | Generate cover letter |
| GET | /api/v1/analytics/dashboard | Dashboard stats |
| GET | /api/v1/ai/status | Check AI engine |

---

## 🧰 Startup Scripts

### `services.js` — Start infrastructure
```bash
node services.js
```
Starts MongoDB, Redis, and Ollama. Checks if they're already running.

### `start.js` — Start the app
```bash
node start.js
```
Kills existing processes on ports 5000/5173, then starts backend + frontend.

---

## 🔒 Security

- JWT authentication with refresh tokens
- Password hashing (bcrypt)
- Rate limiting
- Helmet security headers
- CORS configured
- All credentials stored locally only

---

## 💰 Zero Cost Guarantee

- ✅ Free open-source software only
- ✅ Local AI models (Ollama)
- ✅ Local databases (MongoDB, Redis)
- ✅ No API keys required
- ✅ No subscriptions
- ✅ No cloud services
- ✅ Works completely offline

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Redis connection error | Run `node services.js` or start Redis manually |
| AI features not working | Ensure Ollama is running: `ollama serve` |
| No jobs found | Check your profile has skills & target roles in Settings |
| Port already in use | `node start.js` auto-kills existing processes |
| Playwright error | Run `cd backend && npx playwright install chromium` |
| AI screening slow | Use 16GB+ RAM. On 8GB, set `HARDWARE_MODE=low` in .env |
| Jobs still showing Java/.NET | Clear jobs and restart: see Clearing Data section |

### Clearing Data (Fresh Start)
```bash
cd backend && node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/careerpilot').then(async () => { const db = mongoose.connection.db; await db.collection('jobs').deleteMany({}); await db.collection('applications').deleteMany({}); console.log('Cleared'); process.exit(0); })"
```

---

## 📄 License

MIT

---

## 👤 Author

**Jeeva** - [GitHub](https://github.com/Jeevavs03)
