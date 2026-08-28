-- ==========================================================
-- Plate Lifecycle Monitoring System (PLMSys)
-- Database Schema for MySQL 8.0+
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `daily_productions`;
DROP TABLE IF EXISTS `replacements`;
DROP TABLE IF EXISTS `plate_removals`;
DROP TABLE IF EXISTS `plate_installations`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `plates`;
DROP TABLE IF EXISTS `sets`;
DROP TABLE IF EXISTS `job_orders`;
DROP TABLE IF EXISTS `personnel`;
DROP TABLE IF EXISTS `app_settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Personnel & Users
CREATE TABLE `personnel` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `short_name` VARCHAR(50) NOT NULL,
  `position` VARCHAR(100) NOT NULL DEFAULT 'Operator',
  `is_authorized` TINYINT(1) NOT NULL DEFAULT 0,
  `password` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Sets
CREATE TABLE `sets` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `set_number` INT NOT NULL UNIQUE,
  `display_name` VARCHAR(50) NOT NULL,
  `short_code` VARCHAR(20) NOT NULL,
  `status` ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `current_total_cycle` BIGINT NOT NULL DEFAULT 0,
  `initial_cycle` BIGINT NOT NULL DEFAULT 0,
  `today_production` BIGINT NOT NULL DEFAULT 0,
  `last_production_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sets_status` (`status`),
  INDEX `idx_sets_number` (`set_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Plates
CREATE TABLE `plates` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `plate_serial_number` VARCHAR(100) NOT NULL UNIQUE,
  `manufacturing_date` DATE NOT NULL,
  `status` ENUM('ACTIVE', 'REMOVED', 'REJECTED', 'RETIRED', 'REPLACED') NOT NULL DEFAULT 'ACTIVE',
  `current_set_id` VARCHAR(64) DEFAULT NULL,
  `current_position_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_plates_status` (`status`),
  INDEX `idx_plates_serial` (`plate_serial_number`),
  CONSTRAINT `fk_plates_set` FOREIGN KEY (`current_set_id`) REFERENCES `sets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Positions (11 positions per set: P01 to P11)
CREATE TABLE `positions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `set_id` VARCHAR(64) NOT NULL,
  `set_number` INT NOT NULL,
  `position_number` INT NOT NULL,
  `position_code` VARCHAR(10) NOT NULL,
  `full_code` VARCHAR(30) NOT NULL UNIQUE,
  `status` ENUM('OCCUPIED', 'EMPTY') NOT NULL DEFAULT 'EMPTY',
  `current_plate_id` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_positions_set` (`set_id`),
  INDEX `idx_positions_status` (`status`),
  CONSTRAINT `fk_pos_set` FOREIGN KEY (`set_id`) REFERENCES `sets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pos_plate` FOREIGN KEY (`current_plate_id`) REFERENCES `plates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Plate Installations
CREATE TABLE `plate_installations` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `plate_id` VARCHAR(64) NOT NULL,
  `set_id` VARCHAR(64) NOT NULL,
  `position_id` VARCHAR(64) NOT NULL,
  `installation_date` DATE NOT NULL,
  `installation_cycle` BIGINT NOT NULL DEFAULT 0,
  `initial_cycles` BIGINT NOT NULL DEFAULT 0,
  `operator_id` VARCHAR(100) NOT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inst_plate` (`plate_id`),
  INDEX `idx_inst_set` (`set_id`),
  INDEX `idx_inst_pos` (`position_id`),
  CONSTRAINT `fk_inst_plate` FOREIGN KEY (`plate_id`) REFERENCES `plates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inst_set` FOREIGN KEY (`set_id`) REFERENCES `sets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inst_pos` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Plate Removals
CREATE TABLE `plate_removals` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `plate_id` VARCHAR(64) NOT NULL,
  `set_id` VARCHAR(64) NOT NULL,
  `position_id` VARCHAR(64) NOT NULL,
  `removal_date` DATE NOT NULL,
  `removal_cycle` BIGINT NOT NULL DEFAULT 0,
  `total_cycles_achieved` BIGINT NOT NULL DEFAULT 0,
  `status` ENUM('REMOVED', 'REJECTED', 'RETIRED', 'REPLACED') NOT NULL DEFAULT 'REMOVED',
  `reject_type` ENUM('WEAR', 'SURFACE', 'CRACK', 'DIM', 'CHIP', 'DENT', 'OTHER') DEFAULT NULL,
  `reject_description` TEXT DEFAULT NULL,
  `source_of_reject` VARCHAR(150) DEFAULT NULL,
  `corrective_action` TEXT DEFAULT NULL,
  `operator_id` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rem_plate` (`plate_id`),
  INDEX `idx_rem_set` (`set_id`),
  CONSTRAINT `fk_rem_plate` FOREIGN KEY (`plate_id`) REFERENCES `plates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rem_set` FOREIGN KEY (`set_id`) REFERENCES `sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Job Orders
CREATE TABLE `job_orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `job_order_number` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Daily Production Records
CREATE TABLE `daily_productions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `set_id` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `job_order_id` VARCHAR(64) NOT NULL,
  `previous_total_cycle` BIGINT NOT NULL DEFAULT 0,
  `production_cycles` BIGINT NOT NULL DEFAULT 0,
  `current_total_cycle` BIGINT NOT NULL DEFAULT 0,
  `operator_id` VARCHAR(100) NOT NULL,
  `checked_by` VARCHAR(100) NOT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dp_set` (`set_id`),
  INDEX `idx_dp_date` (`date`),
  CONSTRAINT `fk_dp_set` FOREIGN KEY (`set_id`) REFERENCES `sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Replacements
CREATE TABLE `replacements` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `set_id` VARCHAR(64) NOT NULL,
  `position_id` VARCHAR(64) NOT NULL,
  `old_plate_id` VARCHAR(64) NOT NULL,
  `new_plate_id` VARCHAR(64) NOT NULL,
  `old_removal_cycle` BIGINT NOT NULL DEFAULT 0,
  `new_installation_cycle` BIGINT NOT NULL DEFAULT 0,
  `reason` TEXT NOT NULL,
  `operator_id` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rep_set` (`set_id`),
  INDEX `idx_rep_pos` (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Logs
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `audit_code` VARCHAR(50) NOT NULL,
  `user` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `record_id` VARCHAR(64) DEFAULT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `device_info` VARCHAR(255) DEFAULT 'Web Local Client',
  `checked_by` VARCHAR(100) DEFAULT NULL,
  INDEX `idx_audit_timestamp` (`timestamp`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Personnel
INSERT INTO `personnel` (`id`, `full_name`, `short_name`, `position`, `is_authorized`, `password`) VALUES
('pers-1', 'Jane Smith', 'JS', 'Supervisor', 1, 'password123'),
('pers-2', 'John Doe', 'JD', 'Operator', 0, ''),
('pers-3', 'Administrator', 'Admin', 'Admin', 1, 'JADB1994')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Seed Default Job Orders
INSERT INTO `job_orders` (`id`, `job_order_number`, `description`, `date`, `status`) VALUES
('jo-1', '0626-26', 'Heavy Production Run Q3', CURDATE(), 'IN_PROGRESS'),
('jo-2', '0712-26', 'High Speed Strip Rollout', CURDATE(), 'OPEN')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
