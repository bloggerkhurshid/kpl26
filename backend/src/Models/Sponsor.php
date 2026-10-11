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

            // Seed default sponsors if table is brand new and empty
            $count = (int)$pdo->query("SELECT COUNT(*) FROM `sponsors`")->fetchColumn();
            if ($count === 0) {
                self::seedDefaults($pdo);
            }
        } catch (\Throwable $e) {
            // Ignore table creation error if already exists
        }
        return $pdo;
    }

    private static function seedDefaults(PDO $pdo): void {
        $defaults = [
            [
                'id' => '1',
                'name' => 'Projukti Soft',
                'tier' => 'Title Sponsor',
                'tier_badge_color' => '#fbbf24',
                'logo_url' => 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80',
                'description' => 'Premier digital engineering & cloud technology enterprise powering high-scale community web platforms and tournament management software across Northeast India.',
                'highlight' => 'Official Technology & Title Partner',
                'website' => 'https://kpl.projuktisoft.com',
                'display_order' => 1
            ],
            [
                'id' => '2',
                'name' => 'Apex Arena Sports',
                'tier' => 'Co-Powered By',
                'tier_badge_color' => '#38bdf8',
                'logo_url' => 'https://images.unsplash.com/photo-1531415074868-8363325697c0?auto=format&fit=crop&w=500&q=80',
                'description' => 'Specialists in international cricket equipment, tournament match balls, stadium gear, and youth athletic training apparel.',
                'highlight' => 'Official Match Equipment Provider',
                'website' => '',
                'display_order' => 2
            ],
            [
                'id' => '3',
                'name' => 'GreenValley Agro & Refreshments',
                'tier' => 'Beverage Partner',
                'tier_badge_color' => '#4ade80',
                'logo_url' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80',
                'description' => 'Pure hydration and natural organic energy beverages keeping players and crowd refreshed under the Assam stadium sun.',
                'highlight' => 'Hydration & Nutrition Partner',
                'website' => '',
                'display_order' => 3
            ],
            [
                'id' => '4',
                'name' => 'Khoraghat Media Network',
                'tier' => 'Digital Media Partner',
                'tier_badge_color' => '#c084fc',
                'logo_url' => 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80',
                'description' => 'High-definition multi-camera live broadcast, social media highlights, drone stadium sweeps, and real-time score updates.',
                'highlight' => 'Broadcasting & Broadcast Stream',
                'website' => '',
                'display_order' => 4
            ]
        ];

        $stmt = $pdo->prepare("
            INSERT INTO `sponsors` (
                id, name, tier, tier_badge_color, logo_url, description, highlight, website, display_order, status
            ) VALUES (
                :id, :name, :tier, :tier_badge_color, :logo_url, :description, :highlight, :website, :display_order, 'active'
            )
        ");

        foreach ($defaults as $s) {
            $stmt->execute($s);
        }
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
