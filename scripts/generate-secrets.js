#!/usr/bin/env node

/**
 * Generate Secrets Script
 * Generates secure random secrets for JWT and other security purposes
 * Usage: node scripts/generate-secrets.js
 */

import crypto from 'crypto';

/**
 * Generate a secure random secret
 * @param {number} length - Length of the secret in bytes
 * @returns {string} Base64 encoded secret
 */
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('base64');
};

console.log('\n🔐 Generating Secure Secrets for Deployment\n');
console.log('=' .repeat(60));
console.log('\nJWT_SECRET (use this in your backend environment variables):');
console.log(generateSecret(32));
console.log('\n' + '='.repeat(60));
console.log('\n✅ Copy the JWT_SECRET above to your Render environment variables');
console.log('⚠️  Keep this secret secure and never commit it to git!\n');

