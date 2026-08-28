-- ==========================================================
-- Plate Lifecycle Monitoring System (PLMSys)
-- Database Schema for PostgreSQL 14+
-- ==========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS daily_productions CASCADE;
DROP TABLE IF EXISTS replacements CASCADE;
DROP TABLE IF EXISTS plate_removals CASCADE;
DROP TABLE IF EXISTS plate_installations CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS plates CASCADE;
DROP TABLE IF EXISTS sets CASCADE;
DROP TABLE IF EXISTS job_orders CASCADE;
DROP TABLE IF EXISTS personnel CASCADE;

-- 1. Personnel & Users
CREATE TABLE personnel (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  position VARCHAR(100) NOT NULL DEFAULT 'Operator',
  is_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  password VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sets
CREATE TABLE sets (
  id VARCHAR(64) PRIMARY KEY,
  set_number INT NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  short_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  current_total_cycle BIGINT NOT NULL DEFAULT 0,
  initial_cycle BIGINT NOT NULL DEFAULT 0,
  today_production BIGINT NOT NULL DEFAULT 0,
  last_production_date DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sets_status ON sets(status);
CREATE INDEX idx_sets_number ON sets(set_number);

-- 3. Plates
CREATE TABLE plates (
  id VARCHAR(64) PRIMARY KEY,
  plate_serial_number VARCHAR(100) NOT NULL UNIQUE,
  manufacturing_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  current_set_id VARCHAR(64) REFERENCES sets(id) ON DELETE SET NULL,
  current_position_id VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plates_status ON plates(status);
CREATE INDEX idx_plates_serial ON plates(plate_serial_number);

-- 4. Positions
CREATE TABLE positions (
  id VARCHAR(64) PRIMARY KEY,
  set_id VARCHAR(64) NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  position_number INT NOT NULL,
  position_code VARCHAR(10) NOT NULL,
  full_code VARCHAR(30) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'EMPTY',
  current_plate_id VARCHAR(64) REFERENCES plates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_positions_set ON positions(set_id);
CREATE INDEX idx_positions_status ON positions(status);

-- 5. Plate Installations
CREATE TABLE plate_installations (
  id VARCHAR(64) PRIMARY KEY,
  plate_id VARCHAR(64) NOT NULL REFERENCES plates(id) ON DELETE CASCADE,
  set_id VARCHAR(64) NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  position_id VARCHAR(64) NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  installation_date DATE NOT NULL,
  installation_cycle BIGINT NOT NULL DEFAULT 0,
  initial_cycles BIGINT NOT NULL DEFAULT 0,
  operator_id VARCHAR(100) NOT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inst_plate ON plate_installations(plate_id);
CREATE INDEX idx_inst_set ON plate_installations(set_id);
CREATE INDEX idx_inst_pos ON plate_installations(position_id);

-- 6. Plate Removals
CREATE TABLE plate_removals (
  id VARCHAR(64) PRIMARY KEY,
  plate_id VARCHAR(64) NOT NULL REFERENCES plates(id) ON DELETE CASCADE,
  set_id VARCHAR(64) NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  position_id VARCHAR(64) NOT NULL,
  removal_date DATE NOT NULL,
  removal_cycle BIGINT NOT NULL DEFAULT 0,
  total_cycles_achieved BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'REMOVED',
  reject_type VARCHAR(20) DEFAULT NULL,
  reject_description TEXT DEFAULT NULL,
  source_of_reject VARCHAR(150) DEFAULT NULL,
  corrective_action TEXT DEFAULT NULL,
  operator_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rem_plate ON plate_removals(plate_id);
CREATE INDEX idx_rem_set ON plate_removals(set_id);

-- 7. Job Orders
CREATE TABLE job_orders (
  id VARCHAR(64) PRIMARY KEY,
  job_order_number VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Daily Productions
CREATE TABLE daily_productions (
  id VARCHAR(64) PRIMARY KEY,
  set_id VARCHAR(64) NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  job_order_id VARCHAR(64) NOT NULL,
  previous_total_cycle BIGINT NOT NULL DEFAULT 0,
  production_cycles BIGINT NOT NULL DEFAULT 0,
  current_total_cycle BIGINT NOT NULL DEFAULT 0,
  operator_id VARCHAR(100) NOT NULL,
  checked_by VARCHAR(100) NOT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dp_set ON daily_productions(set_id);
CREATE INDEX idx_dp_date ON daily_productions(date);

-- 9. Replacements
CREATE TABLE replacements (
  id VARCHAR(64) PRIMARY KEY,
  set_id VARCHAR(64) NOT NULL,
  position_id VARCHAR(64) NOT NULL,
  old_plate_id VARCHAR(64) NOT NULL,
  new_plate_id VARCHAR(64) NOT NULL,
  old_removal_cycle BIGINT NOT NULL DEFAULT 0,
  new_installation_cycle BIGINT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  operator_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  audit_code VARCHAR(50) NOT NULL,
  "user" VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  record_id VARCHAR(64) DEFAULT NULL,
  old_value TEXT DEFAULT NULL,
  new_value TEXT DEFAULT NULL,
  reason TEXT DEFAULT NULL,
  device_info VARCHAR(255) DEFAULT 'Web Local Client',
  checked_by VARCHAR(100) DEFAULT NULL
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Seed Default Personnel
INSERT INTO personnel (id, full_name, short_name, position, is_authorized, password) VALUES
('pers-1', 'Jane Smith', 'JS', 'Supervisor', TRUE, 'password123'),
('pers-2', 'John Doe', 'JD', 'Operator', FALSE, ''),
('pers-3', 'Administrator', 'Admin', 'Admin', TRUE, 'JADB1994')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Seed Default Job Orders
INSERT INTO job_orders (id, job_order_number, description, date, status) VALUES
('jo-1', '0626-26', 'Heavy Production Run Q3', CURRENT_DATE, 'IN_PROGRESS'),
('jo-2', '0712-26', 'High Speed Strip Rollout', CURRENT_DATE, 'OPEN')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;
