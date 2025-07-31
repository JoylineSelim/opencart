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
    // FIXED: Use consistent naming with your JWT functions
    JWT_SECRET: accessSecret,      // Was JWT_SECRET
    REFRESH_TOKEN_SECRET: refreshSecret,
    JWT_EXPIRES_IN: ACCESS_EXPIRY, // Was JWT_EXPIRES_IN
    REFRESH_TOKEN_EXPIRES_IN: REFRESH_EXPIRY,
  };
}

function writeEnvFile(secrets) {
  const envPath = path.resolve(process.cwd(), '.env.jwt');
  
  try {
    // FIXED: Add error handling for file operations
    const lines = Object.entries(secrets).map(([key, val]) => `${key}=${val}`);
    
    // FIXED: Check if directory exists and is writable
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    fs.writeFileSync(envPath, lines.join('\n') + '\n', { 
      flag: 'w',
      mode: 0o600 // FIXED: Restrict file permissions for security
    });
    
    console.log(`✅ New secrets written to ${envPath}`);
    console.log('📋 Copy them into your .env file manually to avoid accidental commits.\n');
    console.table(secrets);
    
    // FIXED: Add manual copy instructions
    console.log('\nManual steps:');
    console.log('1. Copy the values above into your main .env file');
    console.log('2. Restart your application to load new secrets');
    console.log('3. Delete .env.jwt file after copying (for security)');
    
  } catch (error) {
    console.error(' Error writing secrets file:', error.message);
    console.log('\n🔧 Fallback - Copy these values manually:');
    console.table(secrets);
    process.exit(1);
  }
}

// FIXED: Add validation and error handling
try {
  console.log('🔄 Generating new JWT secrets...\n');
  const secrets = generateJWTSecrets();
  writeEnvFile(secrets);
  
  console.log('\nSecurity reminder:');
  console.log('- Never commit .env files to version control');
  console.log('- Store production secrets in secure environment variable management');
  console.log('- Rotate secrets regularly in production');
  
} catch (error) {
  console.error(' Fatal error:', error.message);
  process.exit(1);
}