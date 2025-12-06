const http = require('http');

// Simple load test
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/health',
  method: 'GET',
};

const concurrentRequests = 50;
const totalRequests = 200;
let completed = 0;
let startTime = Date.now();

console.log(`🚀 Starting load test: ${totalRequests} requests, ${concurrentRequests} concurrent`);

function makeRequest() {
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      completed++;
      if (completed === totalRequests) {
        const duration = Date.now() - startTime;
        console.log(`✅ Completed ${totalRequests} requests in ${duration}ms`);
        console.log(`📊 Average: ${(duration / totalRequests).toFixed(2)}ms per request`);
        console.log(`⚡ RPS: ${(totalRequests / (duration / 1000)).toFixed(2)} requests/second`);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    completed++;
  });

  req.end();
}

// Start concurrent requests
for (let i = 0; i < concurrentRequests; i++) {
  setTimeout(() => {
    for (let j = 0; j < Math.ceil(totalRequests / concurrentRequests); j++) {
      makeRequest();
    }
  }, i * 100);
}
