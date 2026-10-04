<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Photo Gallery Database Model (No captions)
 */
class Gallery {

    private static function getDb(): PDO {
        $pdo = Database::getConnection();
        // Ensure table exists on the database
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS `gallery` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `photo_url` LONGTEXT NOT NULL,
              `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (\Throwable $e) {
            // Ignore table creation error if already present or restricted permissions
        }
        return $pdo;
    }

    public static function findById(int $id): ?array {
        $stmt = self::getDb()->prepare("SELECT * FROM gallery WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function all(int $limit = 500): array {
        $stmt = self::getDb()->prepare("SELECT * FROM gallery ORDER BY created_at DESC LIMIT " . (int)$limit);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }

    public static function create(string $photoUrl): int {
        $stmt = self::getDb()->prepare("INSERT INTO gallery (photo_url) VALUES (:photo_url)");
        $stmt->execute([':photo_url' => $photoUrl]);
        return (int)self::getDb()->lastInsertId();
    }

    public static function delete(int $id): bool {
        $stmt = self::getDb()->prepare("DELETE FROM gallery WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
