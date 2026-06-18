#!/usr/bin/env node
const { loadEnv, createPgClient } = require('./lib/db');

const envPath = loadEnv(process.argv);

async function main() {
  const client = createPgClient();
  await client.connect();
  try {
    const { rows } = await client.query('SELECT current_database() AS db, now() AS ts');
    const mig = await client.query(
      `SELECT name FROM migrations ORDER BY id DESC LIMIT 5`,
    ).catch(() => ({ rows: [] }));
    console.log('✅ Connected');
    console.log(`   Env:  ${envPath}`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   DB:   ${rows[0].db}`);
    console.log(`   Time: ${rows[0].ts}`);
    if (mig.rows.length) {
      console.log('   Recent migrations:');
      mig.rows.forEach((r) => console.log(`     - ${r.name}`));
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('❌ DB connection failed:', e.message);
  process.exit(1);
});
