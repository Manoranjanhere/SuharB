#!/usr/bin/env node
/**
 * Run TypeORM migrations using ENV_FILE (default: backend/.env).
 *
 * Production RDS from your laptop:
 *   npm run migration:run:prod
 *
 * Or:
 *   ENV_FILE=.env.production.local npm run migration:run
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { loadEnv, isLikelyProductionDb } = require('./lib/db');

const argv = process.argv.slice(2);
const envPath = loadEnv(argv);

if (isLikelyProductionDb() && !argv.includes('--confirm-prod')) {
  console.error(
    `\n⚠️  Migrations target looks like production (${process.env.DB_HOST}).\n` +
      '   Add --confirm-prod to proceed.\n' +
      '   Example: npm run migration:run:prod\n',
  );
  process.exit(1);
}

console.log(`Using env: ${envPath}`);
console.log(`DB: ${process.env.DB_USERNAME}@${process.env.DB_HOST}/${process.env.DB_NAME}`);

const backendRoot = path.resolve(__dirname, '..');
const result = spawnSync(
  'npx',
  [
    'typeorm-ts-node-commonjs',
    '-d',
    'src/config/typeorm.data-source.ts',
    'migration:run',
  ],
  {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ENV_FILE: require('./lib/db').resolveEnvFile(argv),
    },
  },
);

process.exit(result.status === null ? 1 : result.status);
