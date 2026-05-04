const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

console.log('--- OrkaEval Connectivity Probe ---');
console.log('Testing connection to http://localhost:5000/health...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('SUCCESS: Backend is reachable!');
  process.exit(0);
});

req.on('error', (e) => {
  console.error(`FAILURE: Backend unreachable. Error: ${e.message}`);
  console.log('This means your Windows system is blocking the connection.');
  process.exit(1);
});

req.end();
