#!/bin/bash
# Run on a fresh Ubuntu 22.04 EC2 instance (as root or with sudo).
set -euo pipefail

echo "==> Installing Docker..."
apt-get update -qq
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git

echo "==> Docker installed. Clone your repo and run:"
echo "    cd backend && docker build -t sugarbf-api ."
echo "    docker run -d --name sugarbf-api --restart unless-stopped -p 3000:3000 --env-file .env sugarbf-api"
echo ""
echo "Open EC2 security group: inbound TCP 3000 (or 80/443 with nginx)."
