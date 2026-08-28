<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PlatesController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM plates ORDER BY created_at DESC");
        $plates = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'plateSerialNumber' => $row['plate_serial_number'],
                'manufacturingDate' => $row['manufacturing_date'],
                'status' => $row['status'],
                'currentSetId' => $row['current_set_id'],
                'currentPositionId' => $row['current_position_id'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }, $plates);

        Response::success($formatted);
    }

    public static function install(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['plateSerialNumber'], $input['setId'], $input['positionId'])) {
            Response::error('Missing required installation parameters', 400);
            return;
        }

        $db = Database::getConnection();
        try {
            $db->beginTransaction();

            $plateId = $input['plateId'] ?? ('plate-' . bin2hex(random_bytes(6)));
            $serialNumber = trim($input['plateSerialNumber']);
            $mfgDate = $input['manufacturingDate'] ?? date('Y-m-d');
            $setId = $input['setId'];
            $posId = $input['positionId'];
            $operatorId = $input['operatorId'] ?? 'Operator';
            $instCycle = (int)($input['installationCycle'] ?? 0);
            $initialCycles = (int)($input['initialCycles'] ?? 0);
            $remarks = $input['remarks'] ?? 'Normal Installation';

            // Insert or update plate
            $plateStmt = $db->prepare("
                INSERT INTO plates (id, plate_serial_number, manufacturing_date, status, current_set_id, current_position_id)
                VALUES (:id, :serial, :mfg, 'ACTIVE', :setId, :posId)
                ON DUPLICATE KEY UPDATE status = 'ACTIVE', current_set_id = :setId, current_position_id = :posId
            ");
            $plateStmt->execute([
                ':id' => $plateId,
                ':serial' => $serialNumber,
                ':mfg' => $mfgDate,
                ':setId' => $setId,
                ':posId' => $posId
            ]);

            // Update position to OCCUPIED
            $posStmt = $db->prepare("UPDATE positions SET status = 'OCCUPIED', current_plate_id = :plateId WHERE id = :posId");
            $posStmt->execute([':plateId' => $plateId, ':posId' => $posId]);

            // Log Installation record
            $instId = $input['installationId'] ?? ('inst-' . bin2hex(random_bytes(6)));
            $instStmt = $db->prepare("
                INSERT INTO plate_installations (id, plate_id, set_id, position_id, installation_date, installation_cycle, initial_cycles, operator_id, remarks)
                VALUES (:id, :plateId, :setId, :posId, :instDate, :cycle, :initCycle, :operator, :remarks)
            ");
            $instStmt->execute([
                ':id' => $instId,
                ':plateId' => $plateId,
                ':setId' => $setId,
                ':posId' => $posId,
                ':instDate' => date('Y-m-d'),
                ':cycle' => $instCycle,
                ':initCycle' => $initialCycles,
                ':operator' => $operatorId,
                ':remarks' => $remarks
            ]);

            $db->commit();
            Response::success(['plateId' => $plateId, 'installationId' => $instId], 'Plate installed successfully');
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Installation failed: ' . $e->getMessage(), 500);
        }
    }

    public static function remove(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['plateId'], $input['positionId'])) {
            Response::error('Missing required removal parameters', 400);
            return;
        }

        $db = Database::getConnection();
        try {
            $db->beginTransaction();

            $plateId = $input['plateId'];
            $posId = $input['positionId'];
            $setId = $input['setId'] ?? '';
            $status = $input['status'] ?? 'REMOVED';
            $removalCycle = (int)($input['removalCycle'] ?? 0);
            $totalCyclesAchieved = (int)($input['totalCyclesAchieved'] ?? 0);
            $operatorId = $input['operatorId'] ?? 'Operator';
            $rejectType = $input['rejectType'] ?? null;
            $rejectDesc = $input['rejectDescription'] ?? null;
            $sourceReject = $input['sourceOfReject'] ?? null;
            $corrAction = $input['correctiveAction'] ?? null;

            // Update plate
            $plateStmt = $db->prepare("UPDATE plates SET status = :status, current_set_id = NULL, current_position_id = NULL WHERE id = :plateId");
            $plateStmt->execute([':status' => $status, ':plateId' => $plateId]);

            // Update position
            $posStmt = $db->prepare("UPDATE positions SET status = 'EMPTY', current_plate_id = NULL WHERE id = :posId");
            $posStmt->execute([':posId' => $posId]);

            // Log removal record
            $remId = 'rem-' . bin2hex(random_bytes(6));
            $remStmt = $db->prepare("
                INSERT INTO plate_removals (id, plate_id, set_id, position_id, removal_date, removal_cycle, total_cycles_achieved, status, reject_type, reject_description, source_of_reject, corrective_action, operator_id)
                VALUES (:id, :plateId, :setId, :posId, :remDate, :remCycle, :achieved, :status, :rejType, :rejDesc, :source, :corr, :op)
            ");
            $remStmt->execute([
                ':id' => $remId,
                ':plateId' => $plateId,
                ':setId' => $setId,
                ':posId' => $posId,
                ':remDate' => date('Y-m-d'),
                ':remCycle' => $removalCycle,
                ':achieved' => $totalCyclesAchieved,
                ':status' => $status,
                ':rejType' => $rejectType,
                ':rejDesc' => $rejectDesc,
                ':source' => $sourceReject,
                ':corr' => $corrAction,
                ':op' => $operatorId
            ]);

            $db->commit();
            Response::success(['removalId' => $remId], 'Plate removed successfully');
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            Response::error('Removal failed: ' . $e->getMessage(), 500);
        }
    }
}
