#!/usr/bin/env bash
# Atualiza o front no Vercel com a API rodando no PC (docker compose do CoreSync).
# O Vercel repassa /backend/* para o túnel Cloudflare, cuja URL muda a cada
# reinício. Este script pega a URL atual do túnel, grava no vercel.json, faz
# commit e push na main; o push dispara o deploy no Vercel (projeto ligado ao
# GitHub, com VITE_API_URL=/backend nas variáveis do projeto).
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

if [ "$(git branch --show-current)" != "main" ]; then
  echo "Rode na branch main (o Vercel publica em produção a partir dela)." >&2
  exit 1
fi

sed -i -E "s#https://[a-z0-9-]+\.trycloudflare\.com#$TUNNEL_URL#g" vercel.json

if git diff --quiet -- vercel.json; then
  echo "vercel.json já aponta para esse túnel; nada a publicar."
  exit 0
fi

# Commit só do vercel.json, mesmo que haja outras mudanças no working tree
git commit -q -m "chore(deploy): atualiza URL do túnel no vercel.json" -- vercel.json
git pull -q --rebase --autostash origin main
git push -q origin main
echo "Push feito; o Vercel vai publicar em ~1 min: https://coresync-web-orcin.vercel.app"
