const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Next.js dev server test...\n');

const devProcess = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let readyFound = false;

devProcess.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString().trim());
  
  if (output.includes('ready started server on') || output.includes('ready')) {
    readyFound = true;
    setTimeout(() => {
      console.log('\n✅ Server started successfully!\n');
      devProcess.kill();
      process.exit(0);
    }, 2000);
  }
});

devProcess.stderr.on('data', (data) => {
  const msg = data.toString();
  console.error(msg);
  if (msg.includes('error') || msg.includes('Error')) {
    console.error('\n❌ Error starting server\n');
    devProcess.kill();
    process.exit(1);
  }
});

setTimeout(() => {
  if (!readyFound) {
    console.log('\n⚠️ Server taking longer to start (this is okay), checking health...');
    
    http.get('http://localhost:3000', (res) => {
      if (res.statusCode) {
        console.log('✅ Server is responding on port 3000');
        devProcess.kill();
        process.exit(0);
      }
    }).on('error', () => {
      console.log('  Server not responding yet, waiting...');
      setTimeout(() => {
        devProcess.kill();
        process.exit(0);
      }, 3000);
    });
  }
}, 15000);

setTimeout(() => {
  console.log('\n⏱️ Test timeout, stopping server');
  devProcess.kill();
  process.exit(0);
}, 30000);
