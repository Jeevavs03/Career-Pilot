#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const platform = os.platform(); // 'linux', 'win32', 'darwin'
const isLinux = platform === 'linux';
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';

console.log(`\n🚀 CareerPilot AI - Automated Setup`);
console.log(`   OS: ${platform} | RAM: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB | CPUs: ${os.cpus().length}`);
console.log(`${'─'.repeat(50)}\n`);

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    if (!opts.ignore) console.log(`   ⚠️  Command failed: ${cmd}`);
    return '';
  }
}

function hasCommand(cmd) {
  try {
    execSync(isWindows ? `where ${cmd}` : `which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════
// Step 1: Check & Install System Dependencies
// ═══════════════════════════════════════════════
console.log('📦 Step 1: Checking system dependencies...\n');

// Node.js
if (hasCommand('node')) {
  const ver = run('node --version', { silent: true }).trim();
  console.log(`   ✅ Node.js ${ver}`);
} else {
  console.log('   ❌ Node.js not found. Install from https://nodejs.org (v20+)');
  process.exit(1);
}

// MongoDB
const mongoRunning = (() => {
  try {
    const out = execSync(isWindows
      ? 'netstat -ano | findstr ":27017"'
      : 'ss -tlnp | grep 27017 || netstat -tlnp 2>/dev/null | grep 27017',
      { encoding: 'utf8', stdio: 'pipe' });
    return out.trim().length > 0;
  } catch { return false; }
})();

if (mongoRunning) {
  console.log('   ✅ MongoDB running on port 27017');
} else {
  console.log('   ❌ MongoDB not running on port 27017');
  if (isLinux) {
    console.log('   📥 Installing MongoDB...');
    run('sudo apt-get update && sudo apt-get install -y gnupg curl', { ignore: true });
    run('curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg', { ignore: true });
    run('echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list', { ignore: true });
    run('sudo apt-get update && sudo apt-get install -y mongodb-org', { ignore: true });
    run('sudo systemctl start mongod && sudo systemctl enable mongod', { ignore: true });
  } else if (isMac) {
    run('brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community', { ignore: true });
  } else {
    console.log('   💡 Windows: Download from https://www.mongodb.com/try/download/community');
    console.log('   💡 Or install via winget: winget install MongoDB.Server');
  }
}

// Redis
const redisRunning = (() => {
  try {
    const out = execSync(isWindows
      ? 'netstat -ano | findstr ":6379"'
      : 'ss -tlnp | grep 6379 || netstat -tlnp 2>/dev/null | grep 6379',
      { encoding: 'utf8', stdio: 'pipe' });
    return out.trim().length > 0;
  } catch { return false; }
})();

if (redisRunning) {
  console.log('   ✅ Redis running on port 6379');
} else {
  console.log('   ❌ Redis not running on port 6379');
  if (isLinux) {
    console.log('   📥 Installing Redis...');
    run('sudo apt-get install -y redis-server', { ignore: true });
    run('sudo systemctl start redis-server && sudo systemctl enable redis-server', { ignore: true });
  } else if (isMac) {
    run('brew install redis && brew services start redis', { ignore: true });
  } else {
    console.log('   💡 Windows: winget install taizod1024.redis-windows-fork');
    console.log('   💡 Then start redis-server manually');
  }
}

// Ollama
if (hasCommand('ollama')) {
  console.log('   ✅ Ollama installed');
} else {
  console.log('   ❌ Ollama not found');
  if (isLinux) {
    console.log('   📥 Installing Ollama...');
    run('curl -fsSL https://ollama.ai/install.sh | sh', { ignore: true });
  } else if (isMac) {
    run('brew install ollama', { ignore: true });
  } else {
    console.log('   💡 Windows: Download from https://ollama.ai');
  }
}

// Git
if (hasCommand('git')) {
  console.log('   ✅ Git installed');
} else {
  console.log('   ❌ Git not found. Install from https://git-scm.com');
}

// ═══════════════════════════════════════════════
// Step 2: Pull AI Models
// ═══════════════════════════════════════════════
console.log('\n🤖 Step 2: Pulling AI models...\n');

if (hasCommand('ollama')) {
  const models = run('ollama list', { silent: true }) || '';
  
  if (!models.includes('llama3')) {
    console.log('   📥 Pulling llama3 (4.7GB)... This may take a few minutes.');
    run('ollama pull llama3');
  } else {
    console.log('   ✅ llama3 already available');
  }

  if (!models.includes('nomic-embed-text')) {
    console.log('   📥 Pulling nomic-embed-text (274MB)...');
    run('ollama pull nomic-embed-text');
  } else {
    console.log('   ✅ nomic-embed-text already available');
  }
} else {
  console.log('   ⚠️  Skipping model pull (Ollama not installed)');
}

// ═══════════════════════════════════════════════
// Step 3: Install Node Dependencies
// ═══════════════════════════════════════════════
console.log('\n📦 Step 3: Installing Node.js dependencies...\n');

const backendDir = path.join(ROOT, 'backend');
const frontendDir = path.join(ROOT, 'frontend');

if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
  console.log('   📥 Installing backend dependencies...');
  run('npm install', { cwd: backendDir });
} else {
  console.log('   ✅ Backend dependencies installed');
}

if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  console.log('   📥 Installing frontend dependencies...');
  run('npm install', { cwd: frontendDir });
} else {
  console.log('   ✅ Frontend dependencies installed');
}

// ═══════════════════════════════════════════════
// Step 4: Install Playwright Chromium
// ═══════════════════════════════════════════════
console.log('\n🌐 Step 4: Installing Playwright browser...\n');

const playwrightPath = isWindows
  ? path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
  : path.join(os.homedir(), '.cache', 'ms-playwright');

if (fs.existsSync(playwrightPath)) {
  console.log('   ✅ Playwright browsers already installed');
} else {
  console.log('   📥 Installing Chromium for Playwright...');
  run('npx playwright install chromium', { cwd: backendDir });
}

// ═══════════════════════════════════════════════
// Step 5: Setup .env file
// ═══════════════════════════════════════════════
console.log('\n⚙️  Step 5: Setting up environment...\n');

const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  
  // Auto-detect hardware mode based on RAM
  const ramGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  let hardwareMode = 'low';
  if (ramGB >= 32) hardwareMode = 'high';
  else if (ramGB >= 14) hardwareMode = 'medium';

  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/HARDWARE_MODE=\w+/, `HARDWARE_MODE=${hardwareMode}`);
  fs.writeFileSync(envPath, envContent);

  console.log(`   ✅ Created .env (HARDWARE_MODE=${hardwareMode} for ${ramGB}GB RAM)`);
} else if (fs.existsSync(envPath)) {
  console.log('   ✅ .env already exists');
} else {
  console.log('   ⚠️  .env.example not found');
}

// ═══════════════════════════════════════════════
// Step 6: Update services.js for current OS
// ═══════════════════════════════════════════════
if (isLinux || isMac) {
  const servicesPath = path.join(ROOT, 'services.js');
  const servicesContent = `const { execSync, spawn } = require('child_process');

const SERVICES = [
  { name: 'MongoDB', port: 27017, start: '${isLinux ? 'sudo systemctl start mongod' : 'brew services start mongodb-community'}' },
  { name: 'Redis', port: 6379, start: '${isLinux ? 'sudo systemctl start redis-server' : 'brew services start redis'}' },
  { name: 'Ollama', port: 11434, start: 'ollama serve' },
];

function isPortActive(port) {
  try {
    const out = execSync(\`ss -tlnp 2>/dev/null | grep :\${port} || netstat -tlnp 2>/dev/null | grep :\${port}\`, { encoding: 'utf8' });
    return out.trim().length > 0;
  } catch { return false; }
}

console.log('\\n⚙️  CareerPilot AI - Starting Essential Services...\\n');

SERVICES.forEach(s => {
  if (isPortActive(s.port)) {
    console.log(\`✅ \${s.name} already running on port \${s.port}\`);
    return;
  }
  try {
    if (s.name === 'Ollama') {
      spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
    } else {
      execSync(s.start, { stdio: 'ignore' });
    }
    console.log(\`✅ \${s.name} started\`);
  } catch {
    console.log(\`❌ \${s.name} failed to start. Start manually on port \${s.port}\`);
  }
});

setTimeout(() => {
  console.log('\\n--- Status ---');
  SERVICES.forEach(s => {
    console.log(\`\${isPortActive(s.port) ? '🟢' : '🔴'} \${s.name} (:\${s.port})\`);
  });
  console.log('\\nRun "node start.js" to launch the app.\\n');
}, 3000);
`;
  fs.writeFileSync(servicesPath, servicesContent);
  console.log(`   ✅ Updated services.js for ${isLinux ? 'Linux' : 'macOS'}`);
}

// ═══════════════════════════════════════════════
// Done
// ═══════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`);
console.log('✅ Setup complete!\n');
console.log('Next steps:');
console.log('  1. node services.js    # Start MongoDB, Redis, Ollama');
console.log('  2. node start.js       # Start Backend + Frontend');
console.log('  3. Open http://localhost:5173');
console.log(`\n${'─'.repeat(50)}\n`);
