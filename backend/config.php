<?php
declare(strict_types=1);

/**
 * Plate Lifecycle Monitoring System (PLMSys)
 * PHP 8 Backend Configuration
 */

// Supported Database Drivers: 'mysql' or 'pgsql'
define('DB_DRIVER', getenv('DB_DRIVER') ?: 'mysql');

// Database Connection Parameters
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: (DB_DRIVER === 'pgsql' ? '5432' : '3306'));
define('DB_NAME', getenv('DB_NAME') ?: 'plm_system');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Application Settings
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ALLOWED_ORIGINS') ?: '*');
define('ADMIN_DEFAULT_PIN', 'JADB1994');
