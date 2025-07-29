// rotateSecrets.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateJWTSecrets() {
  const accessSecret = generateSecret(64);
  const refreshSecret = generateSecret(64);

  return {
    JWT_SECRET: accessSecret,
    JWT_REFRESH_SECRET: refreshSecret,
    JWT_ACCESS_EXPIRES_IN: ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRES_IN: REFRESH_EXPIRY,
  };
}

function writeEnvFile(secrets) {
  const envPath = path.resolve(process.cwd(), '.env.jwt');
  const lines = Object.entries(secrets).map(([key, val]) => `${key}=${val}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', { flag: 'w' });

  console.log(`New secrets written to ${envPath}`);
  console.log('Copy them into your .env file manually to avoid accidental commits.\n');
  console.table(secrets);
}

const secrets = generateJWTSecrets();
writeEnvFile(secrets);
