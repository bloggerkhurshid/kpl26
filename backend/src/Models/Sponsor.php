<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Sponsor Database Model
 */
class Sponsor {

    private static function getDb(): PDO {
        $pdo = Database::getConnection();
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `sponsors` (
              `id` VARCHAR(36) NOT NULL PRIMARY KEY,
              `name` VARCHAR(255) NOT NULL,
              `tier` VARCHAR(100) NOT NULL DEFAULT 'Official Partner',
              `tier_badge_color` VARCHAR(50) DEFAULT '#22c55e',
              `logo_url` LONGTEXT NOT NULL,
              `description` TEXT NOT NULL,
              `highlight` VARCHAR(255) DEFAULT '',
              `website` VARCHAR(255) DEFAULT '',
              `display_order` INT DEFAULT 0,
              `status` VARCHAR(20) DEFAULT 'active',
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (\Throwable $e) {
            // Ignore table creation error if already exists
        }
        return $pdo;
    }

    public static function findById(string $id): ?array {
        $stmt = self::getDb()->prepare("SELECT * FROM `sponsors` WHERE `id` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function all(?string $status = null): array {
        $sql = "SELECT * FROM `sponsors`";
        $params = [];

        if ($status !== null && $status !== 'all') {
            $sql .= " WHERE `status` = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY `display_order` ASC, `created_at` ASC";

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
            INSERT INTO `sponsors` (
                `id`, `name`, `tier`, `tier_badge_color`, `logo_url`,
                `description`, `highlight`, `website`, `display_order`, `status`
            ) VALUES (
                :id, :name, :tier, :tier_badge_color, :logo_url,
                :description, :highlight, :website, :display_order, :status
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => trim($data['name'] ?? ''),
            ':tier' => trim($data['tier'] ?? 'Official Partner'),
            ':tier_badge_color' => trim($data['tier_badge_color'] ?? ($data['tierBadgeColor'] ?? '#22c55e')),
            ':logo_url' => $data['logo_url'] ?? ($data['logo'] ?? ''),
            ':description' => trim($data['description'] ?? ''),
            ':highlight' => trim($data['highlight'] ?? ''),
            ':website' => trim($data['website'] ?? ''),
            ':display_order' => isset($data['display_order']) ? (int)$data['display_order'] : 0,
            ':status' => $data['status'] ?? 'active'
        ]);

        return $id;
    }

    public static function update(string $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        $mapping = [
            'name' => 'name',
            'tier' => 'tier',
            'tier_badge_color' => 'tier_badge_color',
            'tierBadgeColor' => 'tier_badge_color',
            'logo_url' => 'logo_url',
            'logo' => 'logo_url',
            'description' => 'description',
            'highlight' => 'highlight',
            'website' => 'website',
            'display_order' => 'display_order',
            'status' => 'status'
        ];

        foreach ($mapping as $inputKey => $colName) {
            if (array_key_exists($inputKey, $data)) {
                $fields[$colName] = "`{$colName}` = :{$colName}";
                $params[":{$colName}"] = $data[$inputKey];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE `sponsors` SET " . implode(', ', array_values($fields)) . " WHERE `id` = :id";
        $stmt = self::getDb()->prepare($sql);
        return $stmt->execute($params);
    }

    public static function delete(string $id): bool {
        $stmt = self::getDb()->prepare("DELETE FROM `sponsors` WHERE `id` = :id");
        return $stmt->execute([':id' => $id]);
    }
}
