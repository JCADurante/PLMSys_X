<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PersonnelController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT id, full_name, short_name, position, is_authorized, password FROM personnel ORDER BY full_name ASC");
        $records = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'fullName' => $row['full_name'],
                'shortName' => $row['short_name'],
                'position' => $row['position'],
                'isAuthorized' => (bool)$row['is_authorized'],
                'password' => $row['password']
            ];
        }, $records);

        Response::success($formatted);
    }

    public static function authenticate(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['role'])) {
            Response::error('Invalid credentials', 400);
            return;
        }

        $role = strtoupper($input['role']);
        $password = $input['password'] ?? '';

        if ($role === 'ADMIN') {
            if ($password === 'JADB1994' || $password === ADMIN_DEFAULT_PIN) {
                Response::success([
                    'user' => ['name' => 'Administrator', 'role' => 'ADMIN'],
                    'token' => bin2hex(random_bytes(16))
                ], 'Admin authenticated successfully');
                return;
            } else {
                Response::error('Invalid Admin PIN', 401);
                return;
            }
        }

        // Operator
        Response::success([
            'user' => ['name' => $input['name'] ?? 'Operator', 'role' => 'OPERATOR']
        ], 'Operator authenticated');
    }
}
