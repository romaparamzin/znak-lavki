#!/bin/bash
# Setup replication on primary database

set -e

echo "Setting up replication on primary database..."

# Create replication user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create replication user
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'replicator') THEN
            CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
        END IF;
    END
    \$\$;

    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO replicator;
EOSQL

# Configure pg_hba.conf for replication
cat >> "$PGDATA/pg_hba.conf" <<EOF

# Replication connections
host    replication     replicator      all                     md5
host    all             replicator      all                     md5
EOF

echo "Replication setup completed on primary!"

