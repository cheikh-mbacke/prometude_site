#!/bin/bash
set -euo pipefail

IMAGE_TAG="${1:?Image tag required}"
CLEAN_TAG=$(echo "$IMAGE_TAG" | head -n1 | tr -d '\n' | xargs)
DEPLOY_DIR="/opt/prometude-site"
HOST_PORT=8081

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DÉPLOIEMENT PROMETUDE SITE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Image: $CLEAN_TAG"
echo "📂 Dossier: $DEPLOY_DIR"
echo ""

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

cp /tmp/docker-compose.prod.yml "$DEPLOY_DIR/docker-compose.prod.yml"
sed -i "s#ghcr.io/cheikh-mbacke/prometude-site:.*#$CLEAN_TAG#g" docker-compose.prod.yml

echo "🔐 Connexion au registre Docker..."
echo "${DOCKER_TOKEN}" | docker login ghcr.io -u "${DOCKER_USER}" --password-stdin 2>/dev/null

echo "📥 Téléchargement de l'image..."
docker compose -f docker-compose.prod.yml pull --quiet

echo "🔄 Redémarrage du site..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker ps --filter "publish=${HOST_PORT}" --format '{{.ID}}' | xargs -r docker stop 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --no-build

echo "🏥 Vérification..."
WAIT=0
MAX_WAIT=60
while [ $WAIT -lt $MAX_WAIT ]; do
  if curl -sf --max-time 5 "http://127.0.0.1:${HOST_PORT}/" >/dev/null 2>&1; then
    echo "✅ Site opérationnel après ${WAIT}s"
    docker compose -f docker-compose.prod.yml ps
    exit 0
  fi
  WAIT=$((WAIT + 1))
  sleep 1
done

echo "❌ Timeout — logs :"
docker compose -f docker-compose.prod.yml logs site --tail 50
exit 1
