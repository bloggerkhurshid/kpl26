<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Management Personnel Database Model
 */
class Management {

    private static function getDb(): PDO {
        $pdo = Database::getConnection();
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `management` (
              `id` VARCHAR(36) NOT NULL PRIMARY KEY,
              `name` VARCHAR(255) NOT NULL,
              `designation` VARCHAR(255) NOT NULL,
              `contact` VARCHAR(100) DEFAULT '',
              `photo_url` LONGTEXT DEFAULT NULL,
              `display_order` INT DEFAULT 0,
              `status` VARCHAR(20) DEFAULT 'active',
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (\Throwable $e) {
            // Ignore table creation error if already present or restricted permissions
        }
        return $pdo;
    }

    public static function findById(string $id): ?array {
        $stmt = self::getDb()->prepare("SELECT * FROM management WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function all(?string $status = null): array {
        $sql = "SELECT * FROM management";
        $params = [];

        if ($status !== null && $status !== 'all') {
            $sql .= " WHERE status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY display_order ASC, created_at DESC";

        $stmt = self::getDb()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    }

    public static function create(array $data): string {
        $id = $data['id'] ?? sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $stmt = self::getDb()->prepare("
            INSERT INTO management (
                id, name, designation, contact, photo_url, display_order, status
            ) VALUES (
                :id, :name, :designation, :contact, :photo_url, :display_order, :status
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => trim($data['name'] ?? ''),
            ':designation' => trim($data['designation'] ?? ''),
            ':contact' => trim($data['contact'] ?? ''),
            ':photo_url' => $data['photo_url'] ?? null,
            ':display_order' => isset($data['display_order']) ? (int)$data['display_order'] : 0,
            ':status' => $data['status'] ?? 'active'
        ]);

        return $id;
    }

    public static function update(string $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        $allowed = ['name', 'designation', 'contact', 'photo_url', 'display_order', 'status'];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE management SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = self::getDb()->prepare($sql);
        return $stmt->execute($params);
    }

    public static function delete(string $id): bool {
        $stmt = self::getDb()->prepare("DELETE FROM management WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
