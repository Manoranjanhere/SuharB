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

## 3. Seed Rourkela / Noida users (production)

**On EC2** (RDS is private — run here, not on your laptop):

```bash
cd ~/SuharB/backend
git pull
docker compose up -d --build
bash scripts/seed-via-docker.sh 20 20
```

Requires `backend/.env` with DB credentials (same file Docker uses). You do **not** need Node installed on the host.

Creates discover-ready profiles (`profileStage=2`, photo, lat/lng near Rourkela).

---

## Safety

- Scripts refuse RDS hosts unless you pass `--confirm-prod`
- Never commit `.env.production.local` (contains DB password)
- Seeded users have **no phone/login** — they appear in Discover only; they cannot sign in until linked to Firebase auth
