<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class ProductionController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM daily_productions ORDER BY date DESC, created_at DESC");
        $records = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'setId' => $row['set_id'],
                'date' => $row['date'],
                'jobOrderId' => $row['job_order_id'],
                'previousTotalCycle' => (int)$row['previous_total_cycle'],
                'productionCycles' => (int)$row['production_cycles'],
                'currentTotalCycle' => (int)$row['current_total_cycle'],
                'operatorId' => $row['operator_id'],
                'checkedBy' => $row['checked_by'],
                'remarks' => $row['remarks'],
                'createdAt' => $row['created_at']
            ];
        }, $records);

        Response::success($formatted);
    }

    public static function create(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['setId'], $input['productionCycles'])) {
            Response::error('Missing production data', 400);
            return;
        }

        $db = Database::getConnection();
        try {
            $db->beginTransaction();

            $setId = $input['setId'];
            $cycles = (int)$input['productionCycles'];
            $date = $input['date'] ?? date('Y-m-d');
            $jobOrderId = $input['jobOrderId'] ?? 'jo-1';
            $operatorId = $input['operatorId'] ?? 'Operator';
            $checkedBy = $input['checkedBy'] ?? 'Supervisor';
            $remarks = $input['remarks'] ?? '';
            $id = $input['id'] ?? ('dp-' . bin2hex(random_bytes(6)));

            // Fetch current set cycle
            $setStmt = $db->prepare("SELECT current_total_cycle, today_production, last_production_date FROM sets WHERE id = :id FOR UPDATE");
            $setStmt->execute([':id' => $setId]);
            $set = $setStmt->fetch();

            if (!$set) {
                Response::error('Set not found', 404);
                return;
            }

            $prevCycle = (int)$set['current_total_cycle'];
            $newCycle = $prevCycle + $cycles;
            $todayProd = ($set['last_production_date'] === $date) ? ((int)$set['today_production'] + $cycles) : $cycles;

            // Insert daily production record
            $dpStmt = $db->prepare("
                INSERT INTO daily_productions (id, set_id, date, job_order_id, previous_total_cycle, production_cycles, current_total_cycle, operator_id, checked_by, remarks)
                VALUES (:id, :setId, :date, :jobOrderId, :prevCycle, :cycles, :newCycle, :operator, :checkedBy, :remarks)
            ");
            $dpStmt->execute([
                ':id' => $id,
                ':setId' => $setId,
                ':date' => $date,
                ':jobOrderId' => $jobOrderId,
                ':prevCycle' => $prevCycle,
                ':cycles' => $cycles,
                ':newCycle' => $newCycle,
                ':operator' => $operatorId,
                ':checkedBy' => $checkedBy,
                ':remarks' => $remarks
            ]);

            // Update set
            $updSetStmt = $db->prepare("
                UPDATE sets SET current_total_cycle = :newCycle, today_production = :todayProd, last_production_date = :date WHERE id = :id
            ");
            $updSetStmt->execute([
                ':newCycle' => $newCycle,
                ':todayProd' => $todayProd,
                ':date' => $date,
                ':id' => $setId
            ]);

            $db->commit();
            Response::success(['id' => $id, 'newCycle' => $newCycle], 'Production logged successfully');
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Failed to log production: ' . $e->getMessage(), 500);
        }
    }
}
