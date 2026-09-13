<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Team Database Model
 */
class Team {

    private static function getDb(): PDO {
        return Database::getConnection();
    }

    public static function findById(string $id): ?array {
        $stmt = self::getDb()->prepare("SELECT * FROM teams WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $team = $stmt->fetch();
        return $team ?: null;
    }

    public static function all(?string $status = null): array {
        $sql = "SELECT * FROM teams";
        $params = [];

        if ($status !== null && $status !== 'all') {
            $sql .= " WHERE status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY created_at DESC";

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
            INSERT INTO teams (
                id, name, short_code, owner_name, owner_contact,
                accent_color, logo_url, squad_limit, budget, spent, status
            ) VALUES (
                :id, :name, :short_code, :owner_name, :owner_contact,
                :accent_color, :logo_url, :squad_limit, :budget, :spent, :status
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $data['name'],
            ':short_code' => $data['short_code'],
            ':owner_name' => $data['owner_name'] ?? '',
            ':owner_contact' => $data['owner_contact'] ?? '',
            ':accent_color' => $data['accent_color'] ?? '#22c55e',
            ':logo_url' => $data['logo_url'] ?? null,
            ':squad_limit' => isset($data['squad_limit']) ? (int)$data['squad_limit'] : 15,
            ':budget' => isset($data['budget']) ? (float)$data['budget'] : 100000.00,
            ':spent' => isset($data['spent']) ? (float)$data['spent'] : 0.00,
            ':status' => $data['status'] ?? 'active'
        ]);

        return $id;
    }

    public static function update(string $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        $allowed = ['name', 'short_code', 'owner_name', 'owner_contact', 'accent_color', 'logo_url', 'squad_limit', 'budget', 'spent', 'status'];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE teams SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = self::getDb()->prepare($sql);
        return $stmt->execute($params);
    }

    public static function delete(string $id): bool {
        // Unassign players belonging to team
        $unassign = self::getDb()->prepare("UPDATE players SET team_id = NULL WHERE team_id = :id");
        $unassign->execute([':id' => $id]);

        $stmt = self::getDb()->prepare("DELETE FROM teams WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
