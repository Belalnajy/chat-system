// Simple API test script
const http = require('http');

// Test health endpoint
const testHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Health Check Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health Response:', JSON.parse(data));
    });
  });

  req.on('error', (e) => {
    console.error('Health check failed:', e.message);
  });

  req.end();
};

// Test register endpoint
const testRegister = () => {
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Register Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        console.log('Register Response:', JSON.parse(data));
      } catch (e) {
        console.log('Register Response (raw):', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Register failed:', e.message);
  });

  req.write(postData);
  req.end();
};

// Run tests
console.log('Testing API endpoints...');
setTimeout(testHealth, 1000);
setTimeout(testRegister, 2000);
