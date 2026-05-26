const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_LAT = 28.6286546;
const BASE_LNG = 77.3696477;
const DEFAULT_COUNT = 12;

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Arjun",
  "Reyansh",
  "Aditya",
  "Kabir",
  "Ishaan",
  "Ayaan",
  "Rohan",
  "Vihaan",
  "Krish",
  "Dev",
  "Anika",
  "Kiara",
  "Sara",
  "Mira",
  "Riya",
  "Naina",
  "Tara",
  "Ira",
];

const CITIES = ["Noida", "Ghaziabad", "Delhi", "Gurgaon", "Faridabad"];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function seedUsers(count) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  let inserted = 0;

  try {
    for (let i = 0; i < count; i += 1) {
      const name = `${randomFrom(FIRST_NAMES)} Test${Math.floor(
        100 + Math.random() * 900,
      )}`;
      const age = Math.floor(21 + Math.random() * 20);
      const gender = Math.random() > 0.5 ? "female" : "male";
      const role = Math.random() > 0.5 ? "companion" : "professional";
      const city = randomFrom(CITIES);
      const latitude = BASE_LAT + (Math.random() - 0.5) * 0.25;
      const longitude = BASE_LNG + (Math.random() - 0.5) * 0.25;
      const bio =
        role === "professional"
          ? "Ambitious professional looking for meaningful premium connections."
          : "Fun and genuine personality, here for quality connections.";

      const userResult = await client.query(
        `INSERT INTO users (
          name,
          age,
          gender,
          city,
          country,
          role,
          bio,
          "profileStage",
          "isActive",
          "isBanned",
          latitude,
          longitude,
          "subscriptionTier"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,2,true,false,$8,$9,1
        )
        RETURNING id`,
        [name, age, gender, city, "India", role, bio, latitude, longitude],
      );

      const userId = userResult.rows[0].id;
      const seed = `sbtest_${Date.now()}_${i}`;
      const imageUrl = `https://picsum.photos/seed/${seed}/600/900`;

      await client.query(
        `INSERT INTO user_photos (
          "userId",
          url,
          "s3Key",
          "order",
          "isPrimary",
          "isApproved"
        ) VALUES (
          $1,$2,$3,0,true,true
        )`,
        [userId, imageUrl, `seed/${seed}.jpg`],
      );

      inserted += 1;
    }

    console.log(`Inserted ${inserted} seeded users with photos.`);
  } finally {
    await client.end();
  }
}

const countArg = Number(process.argv[2]);
const count = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : DEFAULT_COUNT;

seedUsers(count).catch((error) => {
  console.error("Failed to seed users:", error.message);
  process.exit(1);
});
