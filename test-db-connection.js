const { testConnection } = require('./src/database/connection');

async function runTest() {
  console.log('Testing database connection...');
  await testConnection();
  process.exit(0);
}

runTest();