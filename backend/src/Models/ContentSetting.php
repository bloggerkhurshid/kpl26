<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Content Settings & Key-Value Configuration Model
 */
class ContentSetting {

    private static array $defaultContent = [
        'show_hero' => 'true',
        'show_stats' => 'true',
        'show_about' => 'true',
        'show_format' => 'true',
        'show_champions' => 'true',
        'show_teams' => 'true',
        'show_players' => 'true',
        'show_register' => 'true',
        'show_highlights' => 'true',
        'hero_title' => 'Where local legends become <em>champions.</em>',
        'hero_subtitle' => "Assam's premier hard tennis ball cricket championship. Eight franchises. One unforgettable summer.",
        'about_title' => 'A different kind of cricket.',
        'about_text' => "KPL is more than a tournament. It is where the region's fearless players find their stage, where rivalries become traditions, and every over writes a new story.\n\nBringing together Khoraghat's finest talent in a franchise-based format, the league delivers fast, competitive hard tennis ball cricket with the energy of a packed stadium and the heart of Assam.",
        'format_title' => 'The format',
        'format_subtitle' => "Short, intense and built for heroes.\nEvery match carries the weight of a season.",
        'deadline_date' => '',
        'deadline_text' => 'Secure your franchise or player spot before the registration closes.',
    ];

    private static array $defaultFeeSettings = [
        'fee_player' => '500',
        'fee_foreign_player' => '1000',
        'fee_team' => '5000',
        'active_gateway' => 'upi_direct',
        'gateway_mode' => 'sandbox',
        'upi_id' => '8638479115@ybl',
        'upi_payee_name' => 'Khoraghat Premier League'
    ];

    private static function getDb(): PDO {
        $pdo = Database::getConnection();
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `content_settings` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `key` VARCHAR(100) NOT NULL UNIQUE,
              `value` LONGTEXT NOT NULL,
              `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (\Throwable $e) {
            // Ignore table creation error if already present
        }
        return $pdo;
    }

    public static function getContentSettings(): array {
        $stmt = self::getDb()->prepare("SELECT `key`, `value` FROM content_settings");
        $stmt->execute();
        $rows = $stmt->fetchAll() ?: [];

        $settings = self::$defaultContent;
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }

        return $settings;
    }

    public static function getFeeSettings(): array {
        $stmt = self::getDb()->prepare("SELECT `key`, `value` FROM content_settings");
        $stmt->execute();
        $rows = $stmt->fetchAll() ?: [];

        $settings = self::$defaultFeeSettings;
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }

        return [
            'fee_player' => (float)($settings['fee_player'] ?? 500),
            'fee_foreign_player' => (float)($settings['fee_foreign_player'] ?? 1000),
            'fee_team' => (float)($settings['fee_team'] ?? 5000),
            'active_gateway' => $settings['active_gateway'] ?? 'upi_direct',
            'gateway_mode' => $settings['gateway_mode'] ?? 'sandbox',
            'upi_id' => $settings['upi_id'] ?? '8638479115@ybl',
            'upi_payee_name' => $settings['upi_payee_name'] ?? 'Khoraghat Premier League',
            'raw_settings' => $settings
        ];
    }

    public static function saveMultiple(array $data): bool {
        if (empty($data)) return false;

        $stmt = self::getDb()->prepare("
            INSERT INTO content_settings (`key`, `value`)
            VALUES (:key, :value)
            ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
        ");

        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value);
            }
            $stmt->execute([
                ':key' => (string)$key,
                ':value' => (string)$value
            ]);
        }

        return true;
    }
}
