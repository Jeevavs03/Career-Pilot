const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`\x1b[36m[CareerPilot Setup]\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`);
const err = (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`);

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
    return true;
  } catch {
    return false;
  }
}

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  log('🚀 CareerPilot AI - Setup Starting...');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check prerequisites
  log('Checking prerequisites...');
  const checks = {
    'node': checkCommand('node'),
    'npm': checkCommand('npm'),
    'docker': checkCommand('docker'),
    'git': checkCommand('git'),
  };

  let ollamaInstalled = false;
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    ollamaInstalled = true;
  } catch {
    ollamaInstalled = false;
  }
  checks['ollama'] = ollamaInstalled;

  Object.entries(checks).forEach(([tool, ok]) => {
    if (ok) log(`  ✅ ${tool} found`);
    else warn(`  ❌ ${tool} not found - please install it`);
  });

  if (!checks.node || !checks.npm) {
    err('Node.js and npm are required. Please install them first.');
    process.exit(1);
  }

  // Create .env if not exists
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('Creating .env from .env.example...');
    fs.copyFileSync(path.join(__dirname, '..', '.env.example'), envPath);
  }

  // Create reports directory
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  // Create logs directory
  const logsDir = path.join(__dirname, '..', 'backend', 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  // Install backend deps
  log('Installing backend dependencies...');
  run('npm install', { cwd: path.join(__dirname, '..', 'backend') });

  // Install frontend deps
  log('Installing frontend dependencies...');
  run('npm install', { cwd: path.join(__dirname, '..', 'frontend') });

  // Install root deps
  log('Installing root dependencies...');
  run('npm install', { cwd: path.join(__dirname, '..') });

  // Docker services
  if (checks.docker) {
    log('Starting Docker services (MongoDB, Redis, PostgreSQL, ChromaDB)...');
    run('docker-compose up -d', { cwd: path.join(__dirname, '..') });
  } else {
    warn('Docker not found. Please start MongoDB, Redis manually.');
  }

  // Pull Ollama models
  if (checks.ollama) {
    log('Pulling AI models (this may take a while)...');
    log('  Pulling llama3...');
    run('ollama pull llama3');
    log('  Pulling nomic-embed-text...');
    run('ollama pull nomic-embed-text');
  } else {
    warn('Ollama not found. Install from https://ollama.ai');
    warn('Then run: ollama pull llama3 && ollama pull nomic-embed-text');
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('✅ Setup complete!');
  log('');
  log('To start development:');
  log('  npm run dev');
  log('');
  log('Services running at:');
  log('  Frontend:   http://localhost:5173');
  log('  Backend:    http://localhost:5000');
  log('  MongoDB:    localhost:27017');
  log('  Redis:      localhost:6379');
  log('  PostgreSQL: localhost:5432');
  log('  ChromaDB:   localhost:8000');
  log('  Grafana:    http://localhost:3001 (admin/admin)');
  log('  Prometheus: http://localhost:9090');
}

setup().catch(console.error);
