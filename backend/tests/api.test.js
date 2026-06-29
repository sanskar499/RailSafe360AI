import http from 'http';

const testHealthAPI = () => {
  console.log('📡 Testing RailSafe360 API Health Endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API Health test passed!');
        console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
        process.exit(0);
      } else {
        console.error(`❌ Health test failed with status: ${res.statusCode}`);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ API request error. Make sure the backend server is running on port 5000.');
    console.error(error.message);
    process.exit(1);
  });

  req.end();
};

testHealthAPI();
