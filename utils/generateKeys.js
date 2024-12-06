import crypto from 'crypto'

console.log('Starting key generation...');
const key1=crypto.randomBytes(32).toString('hex');
const key2=crypto.randomBytes(32).toString('hex');
console.log(key1);
console.log(key2);
