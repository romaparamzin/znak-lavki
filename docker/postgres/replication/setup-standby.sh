#!/bin/bash
# Setup standby (replica) database

set -e

echo "Setting up standby database..."

# Wait for primary to be ready
until PGPASSWORD=$REPLICATION_PASSWORD psql -h "$PRIMARY_HOST" -U "$REPLICATION_USER" -c '\q' 2>/dev/null; do
  echo "Waiting for primary database..."
  sleep 2
done

echo "Primary database is ready!"

# Remove existing data
rm -rf /var/lib/postgresql/data/*

# Create base backup from primary
echo "Creating base backup from primary..."
PGPASSWORD=$REPLICATION_PASSWORD pg_basebackup \
    -h "$PRIMARY_HOST" \
    -p "$PRIMARY_PORT" \
    -U "$REPLICATION_USER" \
    -D /var/lib/postgresql/data \
    -Fp \
    -Xs \
    -P \
    -R

# Create standby.signal file (PostgreSQL 12+)
touch /var/lib/postgresql/data/standby.signal

# Configure replication connection
cat > /var/lib/postgresql/data/postgresql.auto.conf <<EOF
primary_conninfo = 'host=$PRIMARY_HOST port=$PRIMARY_PORT user=$REPLICATION_USER password=$REPLICATION_PASSWORD'
primary_slot_name = 'replica_slot_$(hostname)'
restore_command = 'cp /var/lib/postgresql/data/pg_wal/%f %p'
EOF

echo "Standby setup completed!"
echo "Starting replica in hot standby mode..."

