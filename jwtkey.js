// generate-jwt-secret.js
const crypto = require('crypto');

// Generate a random 64-character hex string
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔑 Your JWT Secret Key:');
console.log(secret);
console.log('\n📋 Add this to your .env file:');
console.log(`JWT_SECRET=${secret}\n`);