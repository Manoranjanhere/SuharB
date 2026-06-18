const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { randomBytes } = require('crypto');

const backendRoot = path.resolve(__dirname, '..', '..');

/**
 * Load backend env file.
 * Default: backend/.env
 * Production RDS from your machine: ENV_FILE=.env.production.local
 */
function resolveEnvFile(argv = process.argv) {
  if (process.env.ENV_FILE) return process.env.ENV_FILE;
  if (argv.includes('--prod')) {
    const candidates = ['.env.production.local', '.env.production', '.env'];
    for (const name of candidates) {
      if (fs.existsSync(path.join(backendRoot, name))) return name;
    }
    return '.env.production';
  }
  return '.env';
}

function loadEnv(argv = process.argv) {
  // Docker Compose injects DB_* into the container — no file needed
  if (
    process.env.DB_HOST &&
    typeof process.env.DB_PASSWORD === 'string' &&
    process.env.DB_PASSWORD.length > 0
  ) {
    return '(environment variables)';
  }

  const envFile = resolveEnvFile(argv);
  const envPath = path.isAbsolute(envFile)
    ? envFile
    : path.join(backendRoot, envFile);
  const result = dotenv.config({ path: envPath });
  if (result.error && argv.includes('--prod')) {
    console.error(`\n❌ Could not read env file: ${envPath}`);
    console.error('   On EC2: create backend/.env (copy from .env.production.example)');
    console.error('   Or run seeds inside Docker: bash scripts/seed-via-docker.sh 20 20\n');
    process.exit(1);
  }
  return envPath;
}

function assertDbConfig() {
  const missing = [];
  if (!process.env.DB_HOST) missing.push('DB_HOST');
  if (!process.env.DB_USERNAME) missing.push('DB_USERNAME');
  if (!process.env.DB_NAME) missing.push('DB_NAME');
  if (typeof process.env.DB_PASSWORD !== 'string' || process.env.DB_PASSWORD.length === 0) {
    missing.push('DB_PASSWORD');
  }
  if (missing.length) {
    console.error('\n❌ Missing or empty in env file:', missing.join(', '));
    console.error('   Set DB_PASSWORD=your_rds_master_password (no quotes needed unless password has spaces).\n');
    process.exit(1);
  }
}

function createPgClient() {
  assertDbConfig();
  const useSsl = process.env.DB_SSL === 'true';
  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    ssl: useSsl
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
      : false,
  });
}

function isLikelyProductionDb() {
  const host = (process.env.DB_HOST || '').toLowerCase();
  return host.includes('rds.amazonaws.com') || host.includes('aurora');
}

function requireProductionConfirmation(argv) {
  if (isLikelyProductionDb() && !argv.includes('--confirm-prod')) {
    console.error(
      '\n⚠️  DB_HOST looks like AWS RDS (production).\n' +
        '   Re-run with --confirm-prod if you intend to write to that database.\n' +
        '   Example: npm run seed:rourkela -- --confirm-prod 20\n',
    );
    process.exit(1);
  }
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomReferralCode() {
  return randomBytes(3).toString('hex').toUpperCase();
}

function jitterCoord(base, spread = 0.12) {
  return base + (Math.random() - 0.5) * spread;
}

const ALLOWANCE_TIERS = [5000, 7000, 10000, 15000, 20000];

module.exports = {
  resolveEnvFile,
  loadEnv,
  createPgClient,
  isLikelyProductionDb,
  requireProductionConfirmation,
  randomFrom,
  randomReferralCode,
  jitterCoord,
  ALLOWANCE_TIERS,
};
