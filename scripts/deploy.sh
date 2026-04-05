#!/bin/bash
# /projects/mle-hr/scripts/deploy.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WALLET_TMP_DIR=""
SYNC_SQL_FILE=""
RESULTS_SQL_FILE=""
TEST_EXIT_CODE=0

if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  . "${SCRIPT_DIR}/.env"
  set +a
fi

cd "${PROJECT_ROOT}"

cleanup() {
  if [ -n "${WALLET_TMP_DIR}" ] && [ -d "${WALLET_TMP_DIR}" ]; then
    rm -rf "${WALLET_TMP_DIR}"
  fi
  if [ -n "${SYNC_SQL_FILE}" ] && [ -f "${SYNC_SQL_FILE}" ]; then
    rm -f "${SYNC_SQL_FILE}"
  fi
  if [ -n "${RESULTS_SQL_FILE}" ] && [ -f "${RESULTS_SQL_FILE}" ]; then
    rm -f "${RESULTS_SQL_FILE}"
  fi
}

trap cleanup EXIT

if [ -n "${DB_WALLET:-}" ] && [ -n "${DB_SERVICE:-}" ]; then
  WALLET_TMP_DIR="$(mktemp -d)"
  unzip -oq "${DB_WALLET}" -d "${WALLET_TMP_DIR}"
  export DB_CONFIG_DIR="${WALLET_TMP_DIR}"
fi

echo "→ Running Jest..."
set +e
npm run test:json
TEST_EXIT_CODE=$?
set -e

if [ "${TEST_EXIT_CODE}" -ne 0 ]; then
  echo "→ Jest reported test failures; continuing so the module and test results still sync..."
fi

echo "→ Building module sync SQL..."
SYNC_SQL_FILE="$(mktemp "${TMPDIR:-/tmp}/mle-sync.XXXXXX.sql")"
{
  printf 'CREATE OR REPLACE MLE MODULE leave_engine_module\n'
  printf 'LANGUAGE JAVASCRIPT AS\n\n'
  cat src/leaveEngine.js
  printf '\n/\n'
} > "${SYNC_SQL_FILE}"

echo "→ Syncing MLE module to Oracle..."
if [ -n "${DB_WALLET:-}" ] && [ -n "${DB_SERVICE:-}" ]; then
  sql /nolog <<EOF
set cloudconfig ${DB_WALLET}
conn ${DB_USER}/${DB_PASS}@${DB_SERVICE}
@${SYNC_SQL_FILE}
exit
EOF
elif [ -n "${DB_CS:-}" ]; then
  sql "${DB_USER}/${DB_PASS}@${DB_CS}" @"${SYNC_SQL_FILE}"
else
  echo "Missing connection settings. Set either DB_CS or DB_WALLET + DB_SERVICE in scripts/.env" >&2
  exit 1
fi

RUN_ID="$(date +%Y%m%d%H%M%S)"
if git -C "${PROJECT_ROOT}" rev-parse --short HEAD >/dev/null 2>&1; then
  RUN_ID="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD)"
fi

echo "→ Pushing test results to DB..."
RESULTS_SQL_FILE="$(mktemp "${TMPDIR:-/tmp}/mle-results.XXXXXX.sql")"
node scripts/push_results.js --run-id="${RUN_ID}" > "${RESULTS_SQL_FILE}"

if [ -n "${DB_WALLET:-}" ] && [ -n "${DB_SERVICE:-}" ]; then
  sql /nolog <<EOF
set cloudconfig ${DB_WALLET}
conn ${DB_USER}/${DB_PASS}@${DB_SERVICE}
@${RESULTS_SQL_FILE}
exit
EOF
elif [ -n "${DB_CS:-}" ]; then
  sql "${DB_USER}/${DB_PASS}@${DB_CS}" @"${RESULTS_SQL_FILE}"
else
  echo "Missing connection settings. Set either DB_CS or DB_WALLET + DB_SERVICE in scripts/.env" >&2
  exit 1
fi

echo " Done. Open APEX dashboard to see results."

if [ "${TEST_EXIT_CODE}" -ne 0 ]; then
  echo "→ Deploy completed, but Jest failed with exit code ${TEST_EXIT_CODE}."
  exit "${TEST_EXIT_CODE}"
fi
