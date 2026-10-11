<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Payment Model
 */
class Payment {

    private static function getDb(): PDO {
        return Database::getConnection();
    }

    public static function ensureSchema(): void {
        static $ensured = false;
        if ($ensured) return;
        $ensured = true;
        try {
            $db = self::getDb();
            $cols = $db->query("SHOW COLUMNS FROM payments LIKE 'screenshot'")->fetchAll();
            if (empty($cols)) {
                $db->exec("ALTER TABLE payments ADD COLUMN screenshot LONGTEXT DEFAULT NULL AFTER payment_id");
            }
        } catch (\Throwable $t) {
            // Ignore if already exists or restricted
        }
    }

    public static function count(string $status = 'completed'): int {
        $stmt = self::getDb()->prepare("SELECT COUNT(*) as count FROM payments WHERE status = :status");
        $stmt->execute([':status' => $status]);
        $res = $stmt->fetch();
        return (int)($res['count'] ?? 0);
    }

    public static function totalRevenue(): float {
        $stmt = self::getDb()->prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'completed'");
        $stmt->execute();
        $res = $stmt->fetch();
        return (float)($res['total'] ?? 0.0);
    }

    public static function all(int $limit = 500): array {
        self::ensureSchema();
        $stmt = self::getDb()->prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT " . (int)$limit);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public static function create(array $data): string {
        self::ensureSchema();
        $id = $data['id'] ?? sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $screenshot = $data['screenshot'] ?? ($data['payment_proof'] ?? null);
        try {
            $stmt = self::getDb()->prepare("
                INSERT INTO payments (
                    id, registration_type, registration_id, name, phone, amount, payment_gateway, payment_id, status, screenshot
                ) VALUES (
                    :id, :registration_type, :registration_id, :name, :phone, :amount, :payment_gateway, :payment_id, :status, :screenshot
                )
            ");

            $stmt->execute([
                ':id' => $id,
                ':registration_type' => $data['registration_type'] ?? 'player',
                ':registration_id' => $data['registration_id'] ?? null,
                ':name' => $data['name'],
                ':phone' => $data['phone'],
                ':amount' => (float)$data['amount'],
                ':payment_gateway' => $data['payment_gateway'] ?? 'upi_direct',
                ':payment_id' => $data['payment_id'] ?? null,
                ':status' => $data['status'] ?? 'completed',
                ':screenshot' => $screenshot
            ]);
            return $id;
        } catch (\PDOException $e) {
            // Fallback if screenshot column is not present in legacy schema
            $stmt = self::getDb()->prepare("
                INSERT INTO payments (
                    id, registration_type, registration_id, name, phone, amount, payment_gateway, payment_id, status
                ) VALUES (
                    :id, :registration_type, :registration_id, :name, :phone, :amount, :payment_gateway, :payment_id, :status
                )
            ");

            $stmt->execute([
                ':id' => $id,
                ':registration_type' => $data['registration_type'] ?? 'player',
                ':registration_id' => $data['registration_id'] ?? null,
                ':name' => $data['name'],
                ':phone' => $data['phone'],
                ':amount' => (float)$data['amount'],
                ':payment_gateway' => $data['payment_gateway'] ?? 'upi_direct',
                ':payment_id' => $data['payment_id'] ?? null,
                ':status' => $data['status'] ?? 'completed'
            ]);
            return $id;
        }
    }

    public static function updateStatus(string $id, string $status, ?string $screenshot = null): bool {
        self::ensureSchema();
        $db = self::getDb();

        if ($screenshot !== null && $screenshot !== '') {
            $stmt = $db->prepare("UPDATE payments SET status = :status, screenshot = :screenshot WHERE id = :id");
            $success = $stmt->execute([':status' => $status, ':screenshot' => $screenshot, ':id' => $id]);
        } else {
            $stmt = $db->prepare("UPDATE payments SET status = :status WHERE id = :id");
            $success = $stmt->execute([':status' => $status, ':id' => $id]);
        }

        if ($success && ($status === 'completed' || $status === 'success')) {
            // Find payment record to activate matching registration
            $payStmt = $db->prepare("SELECT * FROM payments WHERE id = :id LIMIT 1");
            $payStmt->execute([':id' => $id]);
            $payment = $payStmt->fetch();

            if ($payment && !empty($payment['registration_id'])) {
                $type = $payment['registration_type'] ?? 'player';
                $regId = $payment['registration_id'];

                if ($type === 'player') {
                    $db->prepare("UPDATE players SET status = 'active' WHERE id = :id OR registration_number = :regId")->execute([':id' => $regId, ':regId' => $regId]);
                } elseif ($type === 'team') {
                    $db->prepare("UPDATE teams SET status = 'active' WHERE id = :id OR name = :regId")->execute([':id' => $regId, ':regId' => $regId]);
                    $db->prepare("UPDATE team_registrations SET status = 'active' WHERE id = :id OR team_name = :regId")->execute([':id' => $regId, ':regId' => $regId]);
                }
            }
        }

        return $success;
    }
}

