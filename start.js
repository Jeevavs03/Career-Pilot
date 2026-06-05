const { execSync, spawn } = require('child_process');
const path = require('path');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;
const ROOT = __dirname;

function killPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr ":${port}.*LISTENING"`, { encoding: 'utf8' });
    const pids = [...new Set(result.split('\n').map(l => l.trim().split(/\s+/).pop()).filter(Boolean))];
    pids.forEach(pid => {
      try { execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' }); } catch {}
    });
    console.log(`✅ Killed process(es) on port ${port}`);
  } catch {
    console.log(`⚡ Port ${port} is free`);
  }
}

function startProcess(name, cwd, command, args) {
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'pipe' });
  proc.stdout.on('data', d => {
    const line = d.toString().trim();
    if (line) console.log(`[${name}] ${line}`);
  });
  proc.stderr.on('data', d => {
    const line = d.toString().trim();
    if (line && !line.includes('ExperimentalWarning')) console.log(`[${name}] ${line}`);
  });
  proc.on('exit', code => console.log(`[${name}] exited with code ${code}`));
  return proc;
}

console.log('\n🚀 CareerPilot AI - Starting...\n');

// Kill existing
killPort(BACKEND_PORT);
killPort(FRONTEND_PORT);

// Wait a moment for ports to free
setTimeout(() => {
  // Start backend
  const backend = startProcess('Backend', path.join(ROOT, 'backend'), 'npx', ['ts-node-dev', '--respawn', 'src/server.ts']);

  // Start frontend after 2s
  setTimeout(() => {
    const frontend = startProcess('Frontend', path.join(ROOT, 'frontend'), 'npx', ['vite', '--host']);
  }, 2000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    killPort(BACKEND_PORT);
    killPort(FRONTEND_PORT);
    process.exit();
  });
}, 1000);
