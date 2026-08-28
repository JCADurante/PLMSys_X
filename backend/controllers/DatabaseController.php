<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class DatabaseController {
    public static function status(): void {
        try {
            $db = Database::getConnection();
            $driver = DB_DRIVER;
            $versionStmt = $db->query($driver === 'pgsql' ? 'SELECT version()' : 'SELECT VERSION() as v');
            $ver = $versionStmt->fetchColumn();

            // Count tables
            $tablesCount = [];
            $tableNames = ['sets', 'positions', 'plates', 'plate_installations', 'plate_removals', 'daily_productions', 'replacements', 'job_orders', 'audit_logs', 'personnel'];
            
            foreach ($tableNames as $t) {
                try {
                    $cnt = $db->query("SELECT COUNT(*) FROM {$t}")->fetchColumn();
                    $tablesCount[$t] = (int)$cnt;
                } catch (Exception $e) {
                    $tablesCount[$t] = 0;
                }
            }

            Response::success([
                'status' => 'CONNECTED',
                'driver' => $driver,
                'host' => DB_HOST,
                'port' => DB_PORT,
                'database' => DB_NAME,
                'serverVersion' => $ver,
                'tables' => $tablesCount,
                'phpVersion' => PHP_VERSION
            ]);
        } catch (Exception $e) {
            Response::error('Database status error: ' . $e->getMessage(), 500);
        }
    }

    public static function executeQuery(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $query = trim($input['query'] ?? '');

        if (empty($query)) {
            Response::error('Query cannot be empty', 400);
            return;
        }

        try {
            $db = Database::getConnection();
            $stmt = $db->query($query);
            $results = $stmt->fetchAll();
            Response::success($results, 'Query executed successfully');
        } catch (Exception $e) {
            Response::error('Query execution error: ' . $e->getMessage(), 400);
        }
    }

    public static function exportSql(string $format = 'mysql'): void {
        try {
            $db = Database::getConnection();
            $tables = ['personnel', 'job_orders', 'sets', 'positions', 'plates', 'plate_installations', 'plate_removals', 'daily_productions', 'replacements', 'audit_logs'];
            
            $output = "-- ==========================================================\n";
            $output .= "-- PLMSys Database Export ({$format})\n";
            $output .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n";
            $output .= "-- ==========================================================\n\n";

            if ($format === 'mysql') {
                $output .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";
            }

            foreach ($tables as $table) {
                $stmt = $db->query("SELECT * FROM {$table}");
                $rows = $stmt->fetchAll();
                if (empty($rows)) continue;

                $output .= "-- Table: {$table}\n";
                foreach ($rows as $row) {
                    $cols = array_keys($row);
                    $escapedCols = array_map(fn($c) => $format === 'mysql' ? "`{$c}`" : "\"{$c}\"", $cols);
                    $values = array_map(function($v) use ($db) {
                        if ($v === null) return 'NULL';
                        return $db->quote((string)$v);
                    }, array_values($row));

                    $output .= "INSERT INTO " . ($format === 'mysql' ? "`{$table}`" : "\"{$table}\"") . " (" . implode(', ', $escapedCols) . ") VALUES (" . implode(', ', $values) . ");\n";
                }
                $output .= "\n";
            }

            if ($format === 'mysql') {
                $output .= "SET FOREIGN_KEY_CHECKS = 1;\n";
            }

            header('Content-Type: text/plain; charset=utf-8');
            header('Content-Disposition: attachment; filename="plmsys_backup_' . $format . '_' . date('Ymd_His') . '.sql"');
            echo $output;
            exit;
        } catch (Exception $e) {
            Response::error('Export failed: ' . $e->getMessage(), 500);
        }
    }
}
