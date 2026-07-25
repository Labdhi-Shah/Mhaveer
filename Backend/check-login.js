const http = require('http');

const data = JSON.stringify({
  email: 'admin@mahveerfincap.com',
  password: 'Admin@123',
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', JSON.stringify(res.headers));
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY', body);
  });
});

req.on('error', (error) => {
  console.error('ERROR', error.message);
});

req.write(data);
req.end();
