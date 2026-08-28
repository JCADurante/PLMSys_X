<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class SetsController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM sets ORDER BY set_number DESC");
        $sets = $stmt->fetchAll();
        
        // Format to match JS client expectations (camelCase)
        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'setNumber' => (int)$row['set_number'],
                'displayName' => $row['display_name'],
                'shortCode' => $row['short_code'],
                'status' => $row['status'],
                'currentTotalCycle' => (int)$row['current_total_cycle'],
                'initialCycle' => (int)($row['initial_cycle'] ?? 0),
                'todayProduction' => (int)($row['today_production'] ?? 0),
                'lastProductionDate' => $row['last_production_date'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }, $sets);

        Response::success($formatted);
    }

    public static function show(string $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM sets WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $set = $stmt->fetch();

        if (!$set) {
            Response::error('Set not found', 404);
            return;
        }

        Response::success($set);
    }

    public static function create(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['setNumber'])) {
            Response::error('Invalid input data', 400);
            return;
        }

        $db = Database::getConnection();
        $id = $input['id'] ?? ('set-' . $input['setNumber']);
        $setNum = (int)$input['setNumber'];
        $numPadded = $setNum < 10 ? '0' . $setNum : (string)$setNum;
        $displayName = $input['displayName'] ?? ("SET " . $numPadded);
        $shortCode = $input['shortCode'] ?? ("S" . $numPadded);
        $initialCycle = (int)($input['initialCycle'] ?? 0);
        $todayStr = date('Y-m-d');

        try {
            $db->beginTransaction();

            $stmt = $db->prepare("
                INSERT INTO sets (id, set_number, display_name, short_code, status, current_total_cycle, initial_cycle, today_production, last_production_date)
                VALUES (:id, :set_number, :display_name, :short_code, 'ACTIVE', :cycle, :init_cycle, 0, :today)
            ");
            $stmt->execute([
                ':id' => $id,
                ':set_number' => $setNum,
                ':display_name' => $displayName,
                ':short_code' => $shortCode,
                ':cycle' => $initialCycle,
                ':init_cycle' => $initialCycle,
                ':today' => $todayStr
            ]);

            // Auto-generate 11 positions (P01 to P11)
            $posStmt = $db->prepare("
                INSERT INTO positions (id, set_id, set_number, position_number, position_code, full_code, status)
                VALUES (:id, :set_id, :set_number, :position_number, :position_code, :full_code, 'EMPTY')
            ");

            for ($p = 1; $p <= 11; $p++) {
                $pNumStr = $p < 10 ? '0' . $p : (string)$p;
                $posId = "pos-{$setNum}-{$p}";
                $posCode = "P{$pNumStr}";
                $fullCode = "{$shortCode}-{$posCode}";

                $posStmt->execute([
                    ':id' => $posId,
                    ':set_id' => $id,
                    ':set_number' => $setNum,
                    ':position_number' => $p,
                    ':position_code' => $posCode,
                    ':full_code' => $fullCode
                ]);
            }

            $db->commit();
            Response::success(['id' => $id, 'displayName' => $displayName], 'Set and 11 positions created successfully');
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Failed to create set: ' . $e->getMessage(), 500);
        }
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
        if (isset($input['currentTotalCycle'])) {
            $fields[] = "current_total_cycle = :currentTotalCycle";
            $params[':currentTotalCycle'] = (int)$input['currentTotalCycle'];
        }
        if (isset($input['todayProduction'])) {
            $fields[] = "today_production = :todayProduction";
            $params[':todayProduction'] = (int)$input['todayProduction'];
        }
        if (isset($input['lastProductionDate'])) {
            $fields[] = "last_production_date = :lastProductionDate";
            $params[':lastProductionDate'] = $input['lastProductionDate'];
        }

        if (empty($fields)) {
            Response::error('No update fields provided', 400);
            return;
        }

        $sql = "UPDATE sets SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'Set updated successfully');
    }

    public static function delete(string $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM sets WHERE id = :id");
        $stmt->execute([':id' => $id]);
        Response::success(null, 'Set deleted successfully');
    }
}
