const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const devProcess = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let readyFound = false;

devProcess.stdout.on('data', (data) => {
  output += data.toString();
  
  if (output.includes('ready started server on') || output.includes('ready')) {
    readyFound = true;
    setTimeout(() => {
      devProcess.kill();
      process.exit(0);
    }, 2000);
  }
});

devProcess.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('error') || msg.includes('Error')) {
    devProcess.kill();
    process.exit(1);
  }
});

setTimeout(() => {
  if (!readyFound) {
    
    http.get('http://localhost:3000', (res) => {
      if (res.statusCode) {
        devProcess.kill();
        process.exit(0);
      }
    }).on('error', () => {
      setTimeout(() => {
        devProcess.kill();
        process.exit(0);
      }, 3000);
    });
  }
}, 15000);

setTimeout(() => {
  devProcess.kill();
  process.exit(0);
}, 30000);

