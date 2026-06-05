const { execSync, spawn } = require('child_process');

const SERVICES = [
  { name: 'MongoDB', port: 27017, start: 'net start MongoDB', check: 'sc query MongoDB' },
  { name: 'Redis', port: 6379, exe: 'C:\\Users\\jeeva\\AppData\\Local\\Microsoft\\WinGet\\Packages\\taizod1024.redis-windows-fork_Microsoft.Winget.Source_8wekyb3d8bbwe\\Redis-8.8.0-Windows-x64-msys2\\redis-server.exe' },
  { name: 'Ollama', port: 11434, exe: null }, // Usually auto-starts or runs as service
];

function isPortActive(port) {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}.*LISTENING"`, { encoding: 'utf8' });
    return out.trim().length > 0;
  } catch { return false; }
}

function startService(service) {
  if (isPortActive(service.port)) {
    console.log(`✅ ${service.name} already running on port ${service.port}`);
    return;
  }

  // Try Windows service first
  if (service.start) {
    try {
      execSync(service.start, { stdio: 'ignore' });
      console.log(`✅ ${service.name} started via service`);
      return;
    } catch {}
  }

  // Try executable
  if (service.exe) {
    try {
      spawn(service.exe, [], { detached: true, stdio: 'ignore', shell: true }).unref();
      console.log(`✅ ${service.name} started from exe`);
      return;
    } catch {}
  }

  // Ollama special case
  if (service.name === 'Ollama') {
    try {
      spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', shell: true }).unref();
      console.log(`✅ Ollama started`);
      return;
    } catch {}
  }

  console.log(`❌ ${service.name} could not be started. Start it manually on port ${service.port}`);
}

console.log('\n⚙️  CareerPilot AI - Starting Essential Services...\n');

SERVICES.forEach(startService);

// Verify after 3 seconds
setTimeout(() => {
  console.log('\n--- Status Check ---');
  SERVICES.forEach(s => {
    const status = isPortActive(s.port) ? '🟢 Running' : '🔴 Down';
    console.log(`${status}  ${s.name} (:${s.port})`);
  });
  console.log('\nRun "node start.js" to start the app.\n');
}, 3000);
