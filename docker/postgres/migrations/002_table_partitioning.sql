-- Table Partitioning for Quality Marks
-- Implements range partitioning by creation date for improved query performance

-- ============================================
-- 1. BACKUP EXISTING DATA
-- ============================================

-- Create backup table (run this before partitioning)
CREATE TABLE IF NOT EXISTS quality_marks_backup AS 
SELECT * FROM quality_marks;

-- ============================================
-- 2. CREATE PARTITIONED TABLE
-- ============================================

-- Rename existing table
ALTER TABLE quality_marks RENAME TO quality_marks_old;

-- Create new partitioned table
CREATE TABLE quality_marks (
    id SERIAL,
    mark_code VARCHAR(255) NOT NULL UNIQUE,
    qr_data TEXT NOT NULL,
    product_id INTEGER,
    supplier_id INTEGER,
    batch_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP,
    last_validated_at TIMESTAMP,
    validation_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ============================================
-- 3. CREATE PARTITIONS (Monthly)
-- ============================================

-- Create partitions for past 6 months
CREATE TABLE quality_marks_2024_08 PARTITION OF quality_marks
    FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE quality_marks_2024_09 PARTITION OF quality_marks
    FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE quality_marks_2024_10 PARTITION OF quality_marks
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE quality_marks_2024_11 PARTITION OF quality_marks
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE quality_marks_2024_12 PARTITION OF quality_marks
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE quality_marks_2025_01 PARTITION OF quality_marks
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Create partition for current month (October 2025)
CREATE TABLE quality_marks_2025_10 PARTITION OF quality_marks
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Create partition for next month (auto-created by function below)
CREATE TABLE quality_marks_2025_11 PARTITION OF quality_marks
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Default partition for future dates
CREATE TABLE quality_marks_default PARTITION OF quality_marks DEFAULT;

-- ============================================
-- 4. MIGRATE DATA FROM OLD TABLE
-- ============================================

-- Insert data from old table to new partitioned table
INSERT INTO quality_marks 
SELECT * FROM quality_marks_old;

-- Verify data migration
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM quality_marks_old;
    SELECT COUNT(*) INTO new_count FROM quality_marks;
    
    IF old_count != new_count THEN
        RAISE EXCEPTION 'Data migration failed: old table has % rows, new table has % rows', 
            old_count, new_count;
    ELSE
        RAISE NOTICE 'Data migration successful: % rows migrated', new_count;
    END IF;
END $$;

-- ============================================
-- 5. RECREATE INDEXES ON PARTITIONED TABLE
-- ============================================

-- Primary indexes
CREATE INDEX idx_quality_marks_mark_code ON quality_marks(mark_code);
CREATE INDEX idx_quality_marks_status ON quality_marks(status);
CREATE INDEX idx_quality_marks_status_created ON quality_marks(status, created_at DESC);
CREATE INDEX idx_quality_marks_expires_at ON quality_marks(expires_at) 
    WHERE status = 'active' AND expires_at IS NOT NULL;
CREATE INDEX idx_quality_marks_supplier ON quality_marks(supplier_id, status) 
    WHERE supplier_id IS NOT NULL;

-- ============================================
-- 6. RECREATE CONSTRAINTS AND TRIGGERS
-- ============================================

-- Recreate updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quality_marks_updated_at 
    BEFORE UPDATE ON quality_marks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. AUTO-CREATE PARTITIONS FUNCTION
-- ============================================

-- Function to automatically create next month's partition
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS void AS $$
DECLARE
    next_month DATE;
    month_after DATE;
    partition_name TEXT;
BEGIN
    -- Calculate next month
    next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    month_after := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months');
    
    -- Generate partition name
    partition_name := 'quality_marks_' || TO_CHAR(next_month, 'YYYY_MM');
    
    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = partition_name
    ) THEN
        -- Create partition
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF quality_marks 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            next_month,
            month_after
        );
        
        RAISE NOTICE 'Created partition: %', partition_name;
    ELSE
        RAISE NOTICE 'Partition % already exists', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition creation (requires pg_cron extension)
-- Run this manually or via cron:
-- SELECT create_next_month_partition();

-- ============================================
-- 8. PARTITION MAINTENANCE FUNCTIONS
-- ============================================

-- Function to drop old partitions (older than 2 years)
CREATE OR REPLACE FUNCTION drop_old_partitions(retention_months INTEGER DEFAULT 24)
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (retention_months || ' months')::INTERVAL);
    
    FOR partition_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'quality_marks_20%'
        AND tablename != 'quality_marks_default'
    LOOP
        -- Extract date from partition name (e.g., quality_marks_2024_01)
        DECLARE
            partition_date DATE;
        BEGIN
            partition_date := TO_DATE(
                SUBSTRING(partition_record.tablename FROM 'quality_marks_(\d{4}_\d{2})'),
                'YYYY_MM'
            );
            
            IF partition_date < cutoff_date THEN
                -- Archive to backup table before dropping
                EXECUTE format(
                    'INSERT INTO quality_marks_archive SELECT * FROM %I',
                    partition_record.tablename
                );
                
                -- Drop old partition
                EXECUTE format('DROP TABLE %I', partition_record.tablename);
                
                RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to process partition %: %', 
                partition_record.tablename, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create archive table for old partitions
CREATE TABLE IF NOT EXISTS quality_marks_archive (
    LIKE quality_marks INCLUDING ALL
);

-- ============================================
-- 9. MONITORING AND STATISTICS
-- ============================================

-- View for partition information
CREATE OR REPLACE VIEW v_partition_info AS
SELECT 
    schemaname,
    tablename as partition_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM quality_marks WHERE tableoid = (schemaname||'.'||tablename)::regclass) as row_count
FROM pg_tables
WHERE tablename LIKE 'quality_marks_%'
AND schemaname = 'public'
ORDER BY tablename;

-- View for partition query performance
CREATE OR REPLACE VIEW v_partition_performance AS
SELECT 
    relname as partition_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE relname LIKE 'quality_marks_%'
ORDER BY relname;

-- ============================================
-- 10. CLEANUP (after verification)
-- ============================================

-- After verifying the migration, drop the old table:
-- DROP TABLE quality_marks_old;

-- ============================================
-- 11. USAGE NOTES
-- ============================================

/*
BENEFITS OF PARTITIONING:
1. Faster queries when filtering by date range
2. Easier data archival (drop old partitions)
3. Improved maintenance (VACUUM only active partitions)
4. Better index performance (smaller indexes per partition)

MAINTENANCE SCHEDULE:
- Monthly: Run create_next_month_partition()
- Quarterly: Run ANALYZE on all partitions
- Yearly: Run drop_old_partitions(24) to archive data older than 2 years

QUERY EXAMPLES:
-- Query specific partition (very fast)
SELECT * FROM quality_marks_2025_10 WHERE status = 'active';

-- Query across partitions (optimizer will prune unnecessary partitions)
SELECT * FROM quality_marks 
WHERE created_at >= '2025-10-01' AND status = 'active';

MONITORING:
-- Check partition sizes
SELECT * FROM v_partition_info;

-- Check partition performance
SELECT * FROM v_partition_performance;
*/

