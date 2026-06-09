#!/bin/bash
# Run this on your Hostinger VPS after uploading the code
# Usage: bash deploy.sh

set -e

APP_DIR="/var/www/ca-billing"
DATA_DIR="/var/www/ca-billing-data"

echo "==> Creating data directory (DB lives here, survives redeploys)..."
mkdir -p $DATA_DIR

echo "==> Installing dependencies..."
cd $APP_DIR
npm install --omit=dev

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running DB migrations..."
DATABASE_FILE=$DATA_DIR/prod.db npx prisma migrate deploy

echo "==> Building Next.js..."
npm run build

echo "==> Restarting app with PM2..."
pm2 restart ca-billing 2>/dev/null || pm2 start ecosystem.config.js

pm2 save

echo ""
echo "✅ Deployed! App running on port 3001."
echo "   Check status: pm2 status"
echo "   View logs:    pm2 logs ca-billing"
