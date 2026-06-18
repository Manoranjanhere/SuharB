#!/usr/bin/env node
/**
 * Prints instructions — prod RDS is private; seeds must run on EC2.
 * On EC2: bash scripts/seed-prod-all.sh 20 20
 */
console.log(`
Production RDS is inside AWS VPC — not reachable from your laptop (ETIMEDOUT).

Run seeds ON EC2:

  1. SSH into EC2 with your real .pem key:
     ssh -i "C:\\path\\to\\your-key.pem" ubuntu@13.234.67.80

  2. On the server:
     cd ~/SuharB/backend    # adjust path to your repo
     git pull
     bash scripts/seed-prod-all.sh 20 20

  Or one city at a time:
     node scripts/seed-rourkela-users.js --prod --confirm-prod 20
     node scripts/seed-test-users.js --prod --confirm-prod 20

If SSH says "Permission denied (publickey)":
  - Use the .pem file from when you created the EC2 instance
  - Not the placeholder "your-key.pem"

Alternative: AWS Console → EC2 → Connect → Session Manager (no .pem needed)
`);
