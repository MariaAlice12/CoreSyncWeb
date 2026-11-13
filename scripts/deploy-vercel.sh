#!/usr/bin/env bash
# Deploy do front no Vercel com a API rodando no PC (docker compose do CoreSync).
# O Vercel repassa /backend/* para o túnel Cloudflare. A URL do quick tunnel
# muda a cada reinício, então este script pega a URL atual e refaz o deploy.
#
# Uso: ./scripts/deploy-vercel.sh   (com o docker compose do CoreSync no ar)
set -euo pipefail
cd "$(dirname "$0")/.."
API_DIR="${API_DIR:-../CoreSync}"

TUNNEL_URL=$(docker compose --project-directory "$API_DIR" logs tunnel 2>/dev/null \
  | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -1)
if [ -z "$TUNNEL_URL" ]; then
  echo "URL do túnel não encontrada. Suba a API: (cd $API_DIR && ./scripts/start.sh)" >&2
  exit 1
fi
echo "Túnel: $TUNNEL_URL"

sed -i -E "s#https://[a-z0-9-]+\.trycloudflare\.com#$TUNNEL_URL#g" vercel.json

npx -y vercel@65.15.0 deploy --prod --yes --build-env VITE_API_URL=/backend
