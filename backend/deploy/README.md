# AWS deployment (EC2 + RDS)

Use this to run the API on AWS so your phone can reach it without `adb reverse` or localhost.

## Architecture

- **RDS PostgreSQL** — database (recommended)
- **EC2** — runs the NestJS API in Docker on port 3000
- **Optional** — nginx + Let's Encrypt on `api.sugarbfapp.com`

Region suggestion: `ap-south-1` (Mumbai) for India users.

---

## 1. RDS Aurora PostgreSQL (your cluster)

| Role | Endpoint |
|------|----------|
| **Writer** (use for API `DB_HOST`) | `database-1.cluster-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com` |
| **Reader** (read-only; optional) | `database-1.cluster-ro-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com` |
| Port | `5432` |
| Region | `ap-south-1` |

Security group: allow **5432** from your EC2 security group.

Create the app database (once), via IAM or master password:

```sql
CREATE DATABASE sugarbf;
```

### Connect with IAM auth (CLI)

```bash
export RDSHOST="database-1.cluster-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com"
psql "host=$RDSHOST port=5432 dbname=postgres user=postgres sslmode=require password=$(aws rds generate-db-auth-token --hostname $RDSHOST --port 5432 --username postgres --region ap-south-1)"
```

Or run: `bash deploy/rds-iam-connect.sh`

### API `.env` (password auth — what NestJS uses today)

```env
DB_HOST=database-1.cluster-chsuw4a8mjnh.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_master_password
DB_NAME=sugarbf
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

Copy full template from `.env.production.example`.

---

## 2. EC2 instance

1. **Launch instance** — Ubuntu 22.04, `t3.small` or `t3.micro`
2. Security group inbound rules:
   - **22** — SSH (your IP)
   - **3000** — API (temporary; lock down later)
   - **80 / 443** — if using nginx + domain
3. Elastic IP (optional but recommended) — attach to instance

SSH in:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
# log out and back in
```

---

## 3. Deploy the API

On EC2:

```bash
git clone https://github.com/YOUR_ORG/SuharB.git
cd SuharB/backend
```

Create `.env` from `.env.production.example` and set:

- `NODE_ENV=production`
- `DB_HOST` = RDS endpoint
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` = long random string
- All `FIREBASE_*` vars (same as local)
- `AWS_*` for S3

Build and run:

```bash
cp .env.production .env   # or edit .env manually
docker compose up -d --build
docker compose logs -f api
```

Check logs:

```bash
docker compose logs -f api
```

You should see: `[Firebase] Admin SDK ready` and `SugarBf API running`.

Test from your PC:

```bash
curl http://YOUR_EC2_IP:3000/api/v1/auth/phone/check \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

---

## 4. Point the mobile app at AWS

### Dev build on phone (Metro / `npm run android`)

Edit `frontend/src/config/api.config.ts`:

```ts
export const DEV_API_BASE_URL = 'http://YOUR_EC2_IP:3000/api/v1';
```

Reload the app. Check Metro: `[API] Using base URL: ...`

### Release build

Set `PROD_API_BASE_URL` to your HTTPS API, e.g. `https://api.sugarbfapp.com/api/v1`, and build release APK.

---

## 5. HTTPS + domain (recommended for production)

1. Point DNS `api.sugarbfapp.com` → EC2 Elastic IP
2. On EC2: install nginx + certbot
3. Proxy `443` → `localhost:3000`
4. Update `PROD_API_BASE_URL` and rebuild app
5. Remove public access to port **3000** in security group (only 80/443)

---

## 6. Updates

```bash
cd SuharB/backend
git pull
docker compose up -d --build
```

Migrations run automatically when `DB_MIGRATIONS_RUN=true`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't reach API from phone | Security group allows 3000; use EC2 public IP |
| DB connection failed | RDS security group allows EC2; check `DB_HOST` |
| Firebase error on verify | Same `FIREBASE_*` as local in server `.env` |
| HTTP blocked on Android release | Use HTTPS (nginx + SSL) |
