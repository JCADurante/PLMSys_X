<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class JobOrdersController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM job_orders ORDER BY date DESC");
        $records = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'jobOrderNumber' => $row['job_order_number'],
                'description' => $row['description'],
                'date' => $row['date'],
                'status' => $row['status']
            ];
        }, $records);

        Response::success($formatted);
    }

    public static function create(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['jobOrderNumber'])) {
            Response::error('Missing job order number', 400);
            return;
        }

        $db = Database::getConnection();
        $id = $input['id'] ?? ('jo-' . bin2hex(random_bytes(4)));
        $joNum = trim($input['jobOrderNumber']);
        $desc = $input['description'] ?? 'Production Batch';
        $date = $input['date'] ?? date('Y-m-d');
        $status = $input['status'] ?? 'OPEN';

        $stmt = $db->prepare("
            INSERT INTO job_orders (id, job_order_number, description, date, status)
            VALUES (:id, :num, :desc, :date, :status)
        ");
        $stmt->execute([
            ':id' => $id,
            ':num' => $joNum,
            ':desc' => $desc,
            ':date' => $date,
            ':status' => $status
        ]);

        Response::success(['id' => $id], 'Job Order created');
    }
}
