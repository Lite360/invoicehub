require('dotenv').config();
const { put } = require('@vercel/blob');

async function run() {
  try {
    const buffer = Buffer.from('test');
    const blob = await put('test.txt', buffer, { access: 'public', contentType: 'text/plain' });
    console.log('Success:', blob);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
