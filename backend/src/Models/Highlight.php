<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Highlight Database Model
 */
class Highlight {

    private static function getDb(): PDO {
        return Database::getConnection();
    }

    public static function findById(int $id): ?array {
        $stmt = self::getDb()->prepare("SELECT * FROM highlights WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if ($row) {
            $row['image'] = $row['image_url'];
        }
        return $row ?: null;
    }

    public static function all(int $limit = 100): array {
        $stmt = self::getDb()->prepare("SELECT * FROM highlights ORDER BY created_at DESC LIMIT " . (int)$limit);
        $stmt->execute();
        $items = $stmt->fetchAll() ?: [];

        return array_map(function($item) {
            $item['image'] = $item['image_url'];
            return $item;
        }, $items);
    }

    public static function create(array $data): int {
        $title = trim($data['title'] ?? '');
        $imageUrl = $data['image_url'] ?? ($data['image'] ?? '');
        $size = trim($data['size'] ?? 'normal');

        $stmt = self::getDb()->prepare("INSERT INTO highlights (title, image_url, size) VALUES (:title, :image_url, :size)");
        $stmt->execute([
            ':title' => $title,
            ':image_url' => $imageUrl,
            ':size' => $size
        ]);

        return (int)self::getDb()->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $title = trim($data['title'] ?? '');
        $imageUrl = $data['image_url'] ?? ($data['image'] ?? '');
        $size = trim($data['size'] ?? 'normal');

        $stmt = self::getDb()->prepare("UPDATE highlights SET title = :title, image_url = :image_url, size = :size WHERE id = :id");
        return $stmt->execute([
            ':title' => $title,
            ':image_url' => $imageUrl,
            ':size' => $size,
            ':id' => $id
        ]);
    }

    public static function delete(int $id): bool {
        $stmt = self::getDb()->prepare("DELETE FROM highlights WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
