#!/bin/bash

export() {
  kill $PID
  echo "Exporting realm and users..."
  /opt/keycloak/bin/kc.sh export --dir /opt/keycloak/data/import/export --users same_file --realm telli-local
}

trap 'export' SIGTERM

/opt/keycloak/bin/kc.sh start-dev --import-realm &
PID=$!
wait $PID
