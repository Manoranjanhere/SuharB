/**
 * Seed discover-ready users for a specific city/locality.
 *
 * Defaults: Rourkela, Odisha, India (22.2604, 84.8536)
 *
 * Local DB:
 *   npm run seed:rourkela
 *   npm run seed:rourkela -- 25
 *
 * Production RDS (from .env.production.local):
 *   npm run seed:rourkela:prod -- --confirm-prod 20
 */
const { randomBytes } = require('crypto');
const {
  loadEnv,
  createPgClient,
  requireProductionConfirmation,
  randomFrom,
  randomReferralCode,
  jitterCoord,
  ALLOWANCE_TIERS,
} = require('./lib/db');

const argv = process.argv.slice(2);

const LOCALITY = {
  city: process.env.SEED_CITY || 'Rourkela',
  country: process.env.SEED_COUNTRY || 'India',
  state: process.env.SEED_STATE || 'Odisha',
  baseLat: Number(process.env.SEED_LAT || 22.2604),
  baseLng: Number(process.env.SEED_LNG || 84.8536),
};

const MALE_FIRST = [
  'Rahul', 'Amit', 'Vikram', 'Sourav', 'Debasis', 'Manish', 'Pratik', 'Ankit',
  'Rohan', 'Siddharth', 'Abhishek', 'Nikhil', 'Arjun', 'Karan', 'Rajat',
];

const FEMALE_FIRST = [
  'Priya', 'Ananya', 'Sneha', 'Ishita', 'Pooja', 'Ritika', 'Shreya', 'Kavya',
  'Aditi', 'Neha', 'Divya', 'Swati', 'Megha', 'Tanvi', 'Aishwarya',
];

const BIOS_PRO = [
  'Established professional based in Rourkela, looking for genuine connections.',
  'Business owner in steel city — value discretion and chemistry.',
  'Frequent traveler from Rourkela, open to meaningful arrangements.',
];

const BIOS_COMPANION = [
  'Friendly and ambitious — exploring lifestyle connections in Rourkela.',
  'Student in Rourkela, seeking a respectful and generous partner.',
  'Love good conversation, travel plans, and honest expectations.',
];

function parseCount(argv) {
  const n = Number(argv.find((a) => /^\d+$/.test(a)));
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return 15;
}

async function insertUser(client, index) {
  const gender = Math.random() > 0.45 ? 'female' : 'male';
  const role = gender === 'female' ? 'companion' : 'professional';
  const firstPool = gender === 'female' ? FEMALE_FIRST : MALE_FIRST;
  const name = `${randomFrom(firstPool)} ${LOCALITY.city.slice(0, 3)}${100 + index}`;
  const age = Math.floor(20 + Math.random() * 18);
  const bio = randomFrom(role === 'professional' ? BIOS_PRO : BIOS_COMPANION);
  const latitude = jitterCoord(LOCALITY.baseLat, 0.08);
  const longitude = jitterCoord(LOCALITY.baseLng, 0.08);
  const allowance = randomFrom(ALLOWANCE_TIERS);
  const referralCode = randomReferralCode();

  const weeklyAllowanceExpectation = role === 'companion' ? allowance : null;
  const canProvideAllowance = role === 'professional' ? true : false;
  const weeklyAllowanceAmount = role === 'professional' ? allowance : null;

  const userResult = await client.query(
    `INSERT INTO users (
      name, age, gender, city, country, role, bio,
      "profileStage", "isActive", "isBanned", "isVerified",
      latitude, longitude, "locationUpdatedAt",
      "subscriptionTier", coins, "referralCode",
      "weeklyAllowanceExpectation", "canProvideAllowance", "weeklyAllowanceAmount",
      "turnOns", "turnOffs"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      2,true,false,false,
      $8,$9,now(),
      0,0,$10,
      $11,$12,$13,
      $14,$15
    )
    RETURNING id`,
    [
      name,
      age,
      gender,
      LOCALITY.city,
      LOCALITY.country,
      role,
      bio,
      latitude,
      longitude,
      referralCode,
      weeklyAllowanceExpectation,
      canProvideAllowance,
      weeklyAllowanceAmount,
      'Travel,Good communication,Honesty',
      'Rudeness,Dishonesty,Spam',
    ],
  );

  const userId = userResult.rows[0].id;
  const seed = `rkl_${Date.now()}_${index}_${randomBytes(2).toString('hex')}`;
  const imageUrl = `https://picsum.photos/seed/${seed}/600/900`;

  await client.query(
    `INSERT INTO user_photos ("userId", url, "s3Key", "order", "isPrimary", "isApproved")
     VALUES ($1,$2,$3,0,true,true)`,
    [userId, imageUrl, `seed/${seed}.jpg`],
  );

  return { userId, name, role, gender, referralCode };
}

async function main() {
  loadEnv();
  requireProductionConfirmation(argv);

  const count = parseCount(argv);
  const client = createPgClient();

  console.log(`Seeding ${count} users near ${LOCALITY.city}, ${LOCALITY.state}`);
  console.log(`DB: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

  await client.connect();
  const created = [];

  try {
    for (let i = 0; i < count; i += 1) {
      created.push(await insertUser(client, i));
    }
    console.log(`\n✅ Inserted ${created.length} users with photos.\n`);
    created.forEach((u) => {
      console.log(`  • ${u.name} (${u.role}, ${u.gender}) ref:${u.referralCode}`);
    });
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
