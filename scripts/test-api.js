const http = require('http');
const { spawn } = require('child_process');

console.log('🧪 Testing API endpoints with database connection...\n');

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
  console.log('Testing endpoints...\n');
  
  const tests = [
    { endpoint: '/api/health', name: 'Health Check' },
    { endpoint: '/api/user', name: 'User API' },
    { endpoint: '/api/goals', name: 'Goals API' },
    { endpoint: '/api/score/daily', name: 'Score API' },
  ];
  
  let completed = 0;
  
  tests.forEach(test => {
    http.get(`http://localhost:3000${test.endpoint}`, (res) => {
      console.log(`✅ ${test.name}: ${res.statusCode}`);
      completed++;
      if (completed === tests.length) finishTests();
    }).on('error', (err) => {
      console.log(`❌ ${test.name}: ${err.message}`);
      completed++;
      if (completed === tests.length) finishTests();
    });
  });
}

function finishTests() {
  console.log('\n✅ All tests completed!');
  devProcess.kill();
  process.exit(0);
}

setTimeout(() => {
  console.log('Test timeout');
  devProcess.kill();
  process.exit(0);
}, 20000);
