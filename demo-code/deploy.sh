#!/usr/bin/env bash

set -euo pipefail

# -----------------------------------------------------------------------------
# Enaya Legal AI demo deployment helper
# -----------------------------------------------------------------------------
# This script syncs the current working tree to a remote host over SSH and
# restarts the Docker Compose stack there. Override any variable via env vars:
#   SSH_USER=deploy ./deploy.sh
# -----------------------------------------------------------------------------

SSH_USER="${SSH_USER:-root}"
SSH_HOST="${SSH_HOST:-95.181.162.229}"
SSH_PORT="${SSH_PORT:-22}"

APP_NAME="${APP_NAME:-enaya-legal-demo}"
REMOTE_DIR="${REMOTE_DIR:-/root/${APP_NAME}}"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-${APP_NAME}}"

# Extend the exclusions by setting SYNC_EXCLUDES_EXTRA="--exclude foo --exclude bar"
RSYNC_ARGS=(
  "-az"
  "--delete"
  "--exclude" "node_modules"
  "--exclude" "dist"
  "--exclude" ".git"
  "--exclude" ".env.local"
)

if [[ -n "${SYNC_EXCLUDES_EXTRA:-}" ]]; then
  # shellcheck disable=SC2206 # we intentionally word-split into an array
  RSYNC_ARGS+=(${SYNC_EXCLUDES_EXTRA})
fi

SSH_OPTS=(
  -p "${SSH_PORT}"
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
)

REMOTE_SSH=("${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}")

info() {
  printf "\n\033[1;34m▸ %s\033[0m\n" "$*"
}

info "Ensuring remote directory exists: ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
ssh "${REMOTE_SSH[@]}" "mkdir -p '${REMOTE_DIR}'"

info "Syncing project sources via rsync"
rsync "${RSYNC_ARGS[@]}" -e "ssh ${SSH_OPTS[*]}" ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

if [[ -f ".env.example" ]]; then
  info "Copying .env.example -> remote .env if it does not exist"
  ssh "${REMOTE_SSH[@]}" "cd '${REMOTE_DIR}' && [ -f .env ] || cp .env.example .env"
else
  info "Skipping .env bootstrap (no .env.example present locally)"
fi

info "Pulling/building Docker images on remote host"
ssh "${REMOTE_SSH[@]}" "set -euo pipefail; cd '${REMOTE_DIR}'; docker compose -p '${COMPOSE_PROJECT_NAME}' -f '${COMPOSE_FILE}' pull || true; docker compose -p '${COMPOSE_PROJECT_NAME}' -f '${COMPOSE_FILE}' build"

info "Recreating Docker Compose stack"
ssh "${REMOTE_SSH[@]}" "set -euo pipefail; cd '${REMOTE_DIR}'; docker compose -p '${COMPOSE_PROJECT_NAME}' -f '${COMPOSE_FILE}' down --remove-orphans || true; docker compose -p '${COMPOSE_PROJECT_NAME}' -f '${COMPOSE_FILE}' up -d"

info "Deployment completed. Current containers:"
ssh "${REMOTE_SSH[@]}" "cd '${REMOTE_DIR}'; docker compose -p '${COMPOSE_PROJECT_NAME}' -f '${COMPOSE_FILE}' ps"

cat <<EOF
Tip: To follow logs run, for example:
  ssh ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT} "cd ${REMOTE_DIR}; docker compose -p ${COMPOSE_PROJECT_NAME} -f ${COMPOSE_FILE} logs -f backend"
or:
  ssh ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT} "cd ${REMOTE_DIR}; docker compose -p ${COMPOSE_PROJECT_NAME} -f ${COMPOSE_FILE} logs -f frontend"
EOF