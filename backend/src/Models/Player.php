<?php
namespace Kpl\Models;

use Database;
use PDO;

/**
 * Player Database Model
 */
class Player {

    private static function getDb(): PDO {
        return Database::getConnection();
    }

    public static function findById(string $id): ?array {
        $stmt = self::getDb()->prepare("
            SELECT p.*, t.name as team_name, t.short_code as team_short_code, t.accent_color as team_accent_color
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = :id LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $player = $stmt->fetch();
        return $player ?: null;
    }

    public static function count(string $status = 'active'): int {
        $stmt = self::getDb()->prepare("SELECT COUNT(*) as count FROM players WHERE status = :status");
        $stmt->execute([':status' => $status]);
        $res = $stmt->fetch();
        return (int)($res['count'] ?? 0);
    }

    public static function migrateBase64(): void {
        static $migrated = false;
        if ($migrated) return;
        $migrated = true;

        try {
            $db = self::getDb();
            // Migrate up to 10 players with base64 per request to keep it fast
            $stmt = $db->query("SELECT id, photo, address_proof, player_signature FROM players WHERE (photo LIKE 'data:%' OR address_proof LIKE 'data:%' OR player_signature LIKE 'data:%') LIMIT 10");
            $rows = $stmt->fetchAll();
            foreach ($rows as $row) {
                $updates = [];
                $params = [':id' => $row['id']];
                if (!empty($row['photo']) && str_starts_with($row['photo'], 'data:')) {
                    $url = \Kpl\Utils\FileUploader::uploadBase64($row['photo'], 'photos');
                    if ($url && !str_starts_with($url, 'data:')) {
                        $updates[] = "photo = :photo";
                        $params[':photo'] = $url;
                    }
                }
                if (!empty($row['address_proof']) && str_starts_with($row['address_proof'], 'data:')) {
                    $url = \Kpl\Utils\FileUploader::uploadBase64($row['address_proof'], 'documents');
                    if ($url && !str_starts_with($url, 'data:')) {
                        $updates[] = "address_proof = :address_proof";
                        $params[':address_proof'] = $url;
                    }
                }
                if (!empty($row['player_signature']) && str_starts_with($row['player_signature'], 'data:')) {
                    $url = \Kpl\Utils\FileUploader::uploadBase64($row['player_signature'], 'signatures');
                    if ($url && !str_starts_with($url, 'data:')) {
                        $updates[] = "player_signature = :player_signature";
                        $params[':player_signature'] = $url;
                    }
                }
                if (!empty($updates)) {
                    $upStmt = $db->prepare("UPDATE players SET " . implode(', ', $updates) . " WHERE id = :id");
                    $upStmt->execute($params);
                }
            }
        } catch (\Throwable $t) {
            // Silently continue if table locked or read-only
        }
    }

    public static function all(array $filters = [], int $limit = 500): array {
        // self::migrateBase64();
        $sql = "
            SELECT p.*, 
                   t.name as team_name, 
                   t.short_code as team_short_code, 
                   t.accent_color as team_accent_color
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $sql .= " AND p.status = :status";
            $params[':status'] = $filters['status'];
        }

        if (!empty($filters['team_id'])) {
            $sql .= " AND p.team_id = :team_id";
            $params[':team_id'] = $filters['team_id'];
        }

        if (isset($filters['auction_eligible']) && $filters['auction_eligible'] !== '') {
            $sql .= " AND p.auction_eligible = :auction_eligible";
            $params[':auction_eligible'] = ($filters['auction_eligible'] === 'true' || $filters['auction_eligible'] === '1' || $filters['auction_eligible'] === 1) ? 1 : 0;
        }

        if (!empty($filters['approval']) && $filters['approval'] !== 'all') {
            $sql .= " AND p.approval = :approval";
            $params[':approval'] = $filters['approval'];
        }

        if (!empty($filters['registered_by'])) {
            if ($filters['registered_by'] === 'self') {
                $sql .= " AND (p.registered_by LIKE '%self%' OR p.registered_by = 'Self Registration')";
            } elseif ($filters['registered_by'] === 'admin') {
                $sql .= " AND (p.registered_by = 'admin' OR p.registered_by = '' OR p.registered_by IS NULL)";
            } else {
                $sql .= " AND p.registered_by = :registered_by";
                $params[':registered_by'] = $filters['registered_by'];
            }
        }

        $sql .= " ORDER BY p.created_at DESC LIMIT " . (int)$limit;

        $stmt = self::getDb()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    }

    public static function create(array $data): string {
        $db = self::getDb();
        $id = $data['id'] ?? sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $isSelf = !empty($data['registered_by']) && (stripos($data['registered_by'], 'self') !== false);

        $stmt = $db->prepare("
            INSERT INTO players (
                id, player_name, father_name, date_of_birth, age, present_address, address_proof,
                role, contact_number, email, photo, batsman, batting_hand, wicket_keeper,
                player_category, previously_played, all_rounder, bowler, bowling_type,
                player_signature, declaration_accepted, approval, registration_number,
                registered_by, team_id, auction_eligible, base_price, status, notes
            ) VALUES (
                :id, :player_name, :father_name, :date_of_birth, :age, :present_address, :address_proof,
                :role, :contact_number, :email, :photo, :batsman, :batting_hand, :wicket_keeper,
                :player_category, :previously_played, :all_rounder, :bowler, :bowling_type,
                :player_signature, :declaration_accepted, :approval, :registration_number,
                :registered_by, :team_id, :auction_eligible, :base_price, :status, :notes
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':player_name' => $data['player_name'],
            ':father_name' => $data['father_name'] ?? '',
            ':date_of_birth' => !empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
            ':age' => isset($data['age']) ? (int)$data['age'] : null,
            ':present_address' => $data['present_address'] ?? '',
            ':address_proof' => $data['address_proof'] ?? null,
            ':role' => $data['role'] ?? 'Batsman',
            ':contact_number' => $data['contact_number'],
            ':email' => $data['email'] ?? null,
            ':photo' => $data['photo'] ?? null,
            ':batsman' => !empty($data['batsman']) ? 1 : 0,
            ':batting_hand' => $data['batting_hand'] ?? null,
            ':wicket_keeper' => !empty($data['wicket_keeper']) ? 1 : 0,
            ':player_category' => $data['player_category'] ?? 'local',
            ':previously_played' => !empty($data['previously_played']) ? 1 : 0,
            ':all_rounder' => !empty($data['all_rounder']) ? 1 : 0,
            ':bowler' => !empty($data['bowler']) ? 1 : 0,
            ':bowling_type' => $data['bowling_type'] ?? null,
            ':player_signature' => $data['player_signature'] ?? null,
            ':declaration_accepted' => !empty($data['declaration_accepted']) ? 1 : 0,
            ':approval' => $data['approval'] ?? ($isSelf ? 'pending' : 'approved'),
            ':registration_number' => $data['registration_number'] ?? ('KPL-P' . rand(1000, 9999)),
            ':registered_by' => $data['registered_by'] ?? ($isSelf ? 'Self Registration' : 'admin'),
            ':team_id' => !empty($data['team_id']) ? $data['team_id'] : null,
            ':auction_eligible' => isset($data['auction_eligible']) ? (!empty($data['auction_eligible']) ? 1 : 0) : ($isSelf ? 0 : 1),
            ':base_price' => isset($data['base_price']) ? (float)$data['base_price'] : 500.00,
            ':status' => $data['status'] ?? ($isSelf ? 'pending' : 'active'),
            ':notes' => $data['notes'] ?? ''
        ]);

        return $id;
    }

    public static function update(string $id, array $data): bool {
        $fields = [];
        $params = [':id' => $id];

        $allowed = [
            'player_name', 'father_name', 'date_of_birth', 'age', 'present_address',
            'address_proof', 'role', 'contact_number', 'email', 'photo', 'batsman',
            'batting_hand', 'wicket_keeper', 'player_category', 'previously_played',
            'all_rounder', 'bowler', 'bowling_type', 'player_signature',
            'declaration_accepted', 'approval', 'registration_number', 'registered_by', 'team_id',
            'auction_eligible', 'base_price', 'sold_price', 'status', 'notes'
        ];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $val = $data[$field];
                if (in_array($field, ['batsman', 'wicket_keeper', 'previously_played', 'all_rounder', 'bowler', 'auction_eligible', 'declaration_accepted'])) {
                    $val = !empty($val) ? 1 : 0;
                }
                if ($field === 'team_id' && empty($val)) {
                    $val = null;
                }
                $params[":{$field}"] = $val;
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE players SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = self::getDb()->prepare($sql);
        return $stmt->execute($params);
    }

    public static function delete(string $id): bool {
        $stmt = self::getDb()->prepare("DELETE FROM players WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
