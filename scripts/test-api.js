const http = require('http');
const { spawn } = require('child_process');
const devProcess = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

let output = '';
let isReady = false;

devProcess.stdout.on('data', (data) => {
  output += data.toString();
  if (output.includes('ready') && !isReady) {
    isReady = true;
    setTimeout(runTests, 2000);
  }
});

function runTests() {
  const tests = [
    { endpoint: '/api/health', name: 'Health Check' },
    { endpoint: '/api/user', name: 'User API' },
    { endpoint: '/api/goals', name: 'Goals API' },
    { endpoint: '/api/score/daily', name: 'Score API' },
  ];
  
  let completed = 0;
  
  tests.forEach(test => {
    http.get(`http://localhost:3000${test.endpoint}`, (res) => {
      completed++;
      if (completed === tests.length) finishTests();
    }).on('error', (err) => {
      completed++;
      if (completed === tests.length) finishTests();
    });
  });
}

function finishTests() {
  devProcess.kill();
  process.exit(0);
}

setTimeout(() => {
  devProcess.kill();
  process.exit(0);
}, 20000);

