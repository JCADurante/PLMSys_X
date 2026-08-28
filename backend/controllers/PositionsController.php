<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PositionsController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM positions ORDER BY set_number ASC, position_number ASC");
        $positions = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'setId' => $row['set_id'],
                'setNumber' => (int)$row['set_number'],
                'positionNumber' => (int)$row['position_number'],
                'positionCode' => $row['position_code'],
                'fullCode' => $row['full_code'],
                'status' => $row['status'],
                'currentPlateId' => $row['current_plate_id'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }, $positions);

        Response::success($formatted);
    }

    public static function update(string $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            Response::error('Invalid input data', 400);
            return;
        }

        $db = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        if (isset($input['status'])) {
            $fields[] = "status = :status";
            $params[':status'] = $input['status'];
        }
        if (array_key_exists('currentPlateId', $input)) {
            $fields[] = "current_plate_id = :currentPlateId";
            $params[':currentPlateId'] = $input['currentPlateId'];
        }

        if (empty($fields)) {
            Response::error('No update fields provided', 400);
            return;
        }

        $sql = "UPDATE positions SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'Position updated successfully');
    }
}
