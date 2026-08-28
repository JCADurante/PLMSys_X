<?php
declare(strict_types=1);

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';

class AuditController {
    public static function index(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500");
        $records = $stmt->fetchAll();

        $formatted = array_map(function($row) {
            return [
                'id' => $row['id'],
                'auditCode' => $row['audit_code'],
                'user' => $row['user'],
                'action' => $row['action'],
                'timestamp' => $row['timestamp'],
                'recordId' => $row['record_id'],
                'oldValue' => $row['old_value'],
                'newValue' => $row['new_value'],
                'reason' => $row['reason'],
                'deviceInfo' => $row['device_info'],
                'checkedBy' => $row['checked_by']
            ];
        }, $records);

        Response::success($formatted);
    }

    public static function log(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['action'])) {
            Response::error('Missing audit log parameters', 400);
            return;
        }

        $db = Database::getConnection();
        $id = $input['id'] ?? ('aud-' . bin2hex(random_bytes(6)));
        $auditCode = $input['auditCode'] ?? ('AUD-' . strtoupper(bin2hex(random_bytes(3))));
        $user = $input['user'] ?? 'Operator';
        $action = $input['action'];
        $recordId = $input['recordId'] ?? null;
        $oldVal = $input['oldValue'] ?? null;
        $newVal = $input['newValue'] ?? null;
        $reason = $input['reason'] ?? null;
        $deviceInfo = $input['deviceInfo'] ?? 'Web Client (PHP 8 Backend)';
        $checkedBy = $input['checkedBy'] ?? null;

        $stmt = $db->prepare("
            INSERT INTO audit_logs (id, audit_code, user, action, record_id, old_value, new_value, reason, device_info, checked_by)
            VALUES (:id, :code, :user, :action, :recId, :oldV, :newV, :reason, :dev, :chk)
        ");
        $stmt->execute([
            ':id' => $id,
            ':code' => $auditCode,
            ':user' => $user,
            ':action' => $action,
            ':recId' => $recordId,
            ':oldV' => $oldVal,
            ':newV' => $newVal,
            ':reason' => $reason,
            ':dev' => $deviceInfo,
            ':chk' => $checkedBy
        ]);

        Response::success(['id' => $id, 'auditCode' => $auditCode], 'Audit logged');
    }
}
