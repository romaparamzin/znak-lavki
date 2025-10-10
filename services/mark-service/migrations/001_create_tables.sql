-- Migration: Create quality marks and audit logs tables
-- Created: 2025-10-10

-- Create enum for mark status
CREATE TYPE mark_status AS ENUM ('active', 'blocked', 'expired', 'used');

-- Create enum for audit action
CREATE TYPE audit_action AS ENUM (
  'mark_generated',
  'mark_blocked',
  'mark_unblocked',
  'mark_validated',
  'mark_expired',
  'mark_used',
  'bulk_block',
  'bulk_unblock'
);

-- Create quality_marks table
CREATE TABLE quality_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_code VARCHAR(50) UNIQUE NOT NULL,
  gtin VARCHAR(14) NOT NULL,
  status mark_status DEFAULT 'active' NOT NULL,
  production_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  supplier_id INTEGER,
  manufacturer_id INTEGER,
  order_id VARCHAR(100),
  blocked_reason TEXT,
  blocked_by VARCHAR(100),
  blocked_at TIMESTAMP,
  validation_count INTEGER DEFAULT 0 NOT NULL,
  last_validated_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for quality_marks
CREATE INDEX idx_quality_marks_mark_code ON quality_marks(mark_code);
CREATE INDEX idx_quality_marks_status_expiry ON quality_marks(status, expiry_date);
CREATE INDEX idx_quality_marks_gtin ON quality_marks(gtin);
CREATE INDEX idx_quality_marks_supplier ON quality_marks(supplier_id);
CREATE INDEX idx_quality_marks_manufacturer ON quality_marks(manufacturer_id);
CREATE INDEX idx_quality_marks_order ON quality_marks(order_id);
CREATE INDEX idx_quality_marks_created ON quality_marks(created_at);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_code VARCHAR(50),
  action audit_action NOT NULL,
  user_id VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_logs_mark_code ON audit_logs(mark_code);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_quality_marks_updated_at
  BEFORE UPDATE ON quality_marks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE quality_marks IS 'Quality marks for product tracking and validation';
COMMENT ON TABLE audit_logs IS 'Audit log for all mark operations';
COMMENT ON COLUMN quality_marks.mark_code IS 'Unique mark code format: 99LAV{GTIN}66LAV{16-chars}';
COMMENT ON COLUMN quality_marks.gtin IS 'Global Trade Item Number (product barcode)';
COMMENT ON COLUMN quality_marks.validation_count IS 'Number of times this mark has been validated';
COMMENT ON COLUMN quality_marks.metadata IS 'Additional metadata stored as JSON';
COMMENT ON COLUMN audit_logs.previous_state IS 'State before the operation (JSON)';
COMMENT ON COLUMN audit_logs.new_state IS 'State after the operation (JSON)';

