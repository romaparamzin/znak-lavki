-- Performance Optimization Indexes for Znak Lavki
-- This migration adds indexes for common query patterns

-- ============================================
-- 1. QUALITY MARKS TABLE INDEXES
-- ============================================

-- Index for mark code lookups (most frequent query)
-- This is our primary lookup key for QR validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_mark_code 
ON quality_marks(mark_code);

-- Index for status filtering (used in dashboard and filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_status 
ON quality_marks(status) 
WHERE status != 'expired'; -- Partial index for active records

-- Composite index for status + creation date (trending queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_status_created 
ON quality_marks(status, created_at DESC);

-- Index for expiration date queries (monitoring expiring marks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_expires_at 
ON quality_marks(expires_at) 
WHERE status = 'active' AND expires_at IS NOT NULL;

-- Index for supplier analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_supplier 
ON quality_marks(supplier_id, status) 
WHERE supplier_id IS NOT NULL;

-- Index for product filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_product 
ON quality_marks(product_id, status) 
WHERE product_id IS NOT NULL;

-- Composite index for date range queries (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_created_status 
ON quality_marks(created_at DESC, status);

-- Index for validation tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_last_validated 
ON quality_marks(last_validated_at DESC NULLS LAST) 
WHERE last_validated_at IS NOT NULL;

-- Index for batch operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_marks_batch_id 
ON quality_marks(batch_id) 
WHERE batch_id IS NOT NULL;

-- ============================================
-- 2. AUDIT LOGS TABLE INDEXES
-- ============================================

-- Index for mark code lookups in audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_mark_code 
ON audit_logs(mark_code);

-- Index for action filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action, created_at DESC);

-- Index for user activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Composite index for date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_action 
ON audit_logs(created_at DESC, action);

-- Index for recent activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent 
ON audit_logs(created_at DESC) 
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- 3. STATISTICS AND ANALYZE
-- ============================================

-- Update statistics for query planner
ANALYZE quality_marks;
ANALYZE audit_logs;

-- ============================================
-- 4. QUERY OPTIMIZATION COMMENTS
-- ============================================

COMMENT ON INDEX idx_quality_marks_mark_code IS 
'Primary lookup index for QR code validation - most frequent query';

COMMENT ON INDEX idx_quality_marks_status IS 
'Partial index for status filtering, excludes expired marks to reduce size';

COMMENT ON INDEX idx_quality_marks_expires_at IS 
'Partial index for monitoring expiring marks, only active marks with expiry date';

COMMENT ON INDEX idx_audit_logs_recent IS 
'Partial index for recent activity dashboard, covers last 30 days';

-- ============================================
-- 5. PERFORMANCE MONITORING VIEWS
-- ============================================

-- View for index usage statistics
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for table statistics
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    n_mod_since_analyze as modifications_since_analyze,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for slow queries monitoring
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time / 1000 as total_time_seconds,
    mean_exec_time / 1000 as mean_time_seconds,
    max_exec_time / 1000 as max_time_seconds,
    stddev_exec_time / 1000 as stddev_time_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking more than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================
-- 6. MAINTENANCE RECOMMENDATIONS
-- ============================================

-- Run VACUUM ANALYZE regularly (daily)
-- Run REINDEX CONCURRENTLY monthly for heavily updated tables
-- Monitor index bloat and rebuild if needed
-- Review query plans for complex queries using EXPLAIN ANALYZE

