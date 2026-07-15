# AWS deployment (EC2 + RDS)

Use this to run the API on AWS so your phone can reach it without `adb reverse` or localhost.

## Architecture

- **RDS PostgreSQL** — database (recommended)
- **EC2** — runs the NestJS API in Docker on port 3000
- **Recommended** — nginx + Let's Encrypt on `api.sugarbf.club`

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

Use the default RDS database `postgres` (`DB_NAME=postgres`). Only create a separate database if you prefer one:

```sql
-- optional
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
DB_NAME=postgres
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

Frontend config (`frontend/src/config/api.config.ts`) uses:

```ts
export const DEV_API_BASE_URL = 'https://api.sugarbf.club/api/v1';
export const PROD_API_BASE_URL = 'https://api.sugarbf.club/api/v1';
```

Until DNS + SSL are ready, temporary fallback (not for Play Store):

```ts
export const DEV_API_BASE_URL = 'http://YOUR_EC2_IP:3000/api/v1';
```

Reload / rebuild the app. Metro log should show: `[API] Using base URL: https://api.sugarbf.club/api/v1`

---

## 5. HTTPS + domain (`api.sugarbf.club`)

App already points at: `https://api.sugarbf.club/api/v1`

### A. DNS (wherever you manage sugarbf.club)

Create an **A record**:

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| A | `api` | your EC2 **Elastic IP** (e.g. `13.234.67.80`) | 300 |

Result: `api.sugarbf.club` → EC2.

Optional: if you want apex `sugarbf.club` for a website, keep that as a separate A/CNAME; do **not** reuse the same nginx site for both unless you add path rules.

### B. EC2 security group

Inbound:

| Port | Source | Why |
|------|--------|-----|
| 22 | your IP | SSH |
| 80 | 0.0.0.0/0 | HTTP (certbot + redirect) |
| 443 | 0.0.0.0/0 | HTTPS API |
| ~~3000~~ | remove public after nginx works | API only via nginx locally |

### C. Install nginx + SSL on EC2

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy site config from the repo
sudo cp /path/to/SuharB/backend/deploy/nginx-api.sugarbf.club.conf \
  /etc/nginx/sites-available/api.sugarbf.club
sudo ln -sf /etc/nginx/sites-available/api.sugarbf.club /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue certificate (DNS must already point to this EC2)
sudo certbot --nginx -d api.sugarbf.club
```

Keep API listening on localhost only pattern is fine: Docker still binds `3000:3000`; nginx proxies to `127.0.0.1:3000`.

### D. Verify

```bash
curl -i https://api.sugarbf.club/api/v1
# or any known health/auth route
curl https://api.sugarbf.club/api/v1/auth/phone/check \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}'
```

### E. App

No IP needed. Frontend uses:

```ts
export const PROD_API_BASE_URL = 'https://api.sugarbf.club/api/v1';
export const DEV_API_BASE_URL = 'https://api.sugarbf.club/api/v1';
```

Rebuild the release APK after DNS + SSL work.

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
