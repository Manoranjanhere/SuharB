# Backend scripts

Scripts read database settings from env files in `backend/`.

| File | Use |
|------|-----|
| `.env` | Local Postgres (default) |
| `.env.production.local` | **Your laptop → AWS RDS** (copy from `.env.production.local.example`) |

Set `ENV_FILE` to pick another file:

```bash
# Windows PowerShell
$env:ENV_FILE = ".env.production.local"

# macOS / Linux
export ENV_FILE=.env.production.local
```

---

## 1. Connect locally to production RDS

1. Copy `backend/.env.production.local.example` → `backend/.env.production.local`
2. Fill in RDS password and secrets (same as EC2 `.env.production`)
3. Ensure your IP is allowed in the **RDS security group** (inbound 5432)

RDS writer endpoint (from deploy docs):

```
database-1.cluster-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com
```

Test connection:

```bash
cd backend
npm run db:ping:prod
```

---

## 2. Run migrations on production DB

From your machine (recommended before deploy):

```bash
cd backend
npm run migration:run:prod
```

This runs all pending migrations in `src/migrations/` against the DB in `.env.production.local`.

On EC2 after deploy, migrations also run on API start when `DB_MIGRATIONS_RUN=true`.

Revert last migration (careful on prod):

```bash
ENV_FILE=.env.production.local npm run migration:revert
```

---

## 3. Seed Rourkela users

Creates discover-ready profiles (`profileStage=2`, photo, lat/lng near Rourkela).

**Local DB:**

```bash
npm run seed:rourkela
npm run seed:rourkela -- 25
```

**Production RDS** (requires explicit flag):

```bash
npm run seed:rourkela:prod -- --confirm-prod 20
```

Optional env overrides:

```env
SEED_CITY=Rourkela
SEED_COUNTRY=India
SEED_LAT=22.2604
SEED_LNG=84.8536
```

Legacy NCR test seed (Noida/Delhi area):

```bash
npm run seed:test-users -- 12
```

---

## Safety

- Scripts refuse RDS hosts unless you pass `--confirm-prod`
- Never commit `.env.production.local` (contains DB password)
- Seeded users have **no phone/login** — they appear in Discover only; they cannot sign in until linked to Firebase auth
