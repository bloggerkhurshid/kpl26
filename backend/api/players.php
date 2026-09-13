<?php
/**
 * Players Management REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests
if ($method === 'GET') {
    // 1. Fetch single player by ID
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $stmt = $db->prepare("
            SELECT p.*, t.name as team_name, t.short_code as team_short_code, t.accent_color as team_accent_color
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = :id LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $player = $stmt->fetch();
        if ($player) {
            sendJson($player);
        } else {
            sendError("Player not found", 404);
        }
    }

    // 2. Count exact query
    if (isset($_GET['count_only']) && $_GET['count_only'] === 'true') {
        $status = $_GET['status'] ?? 'active';
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM players WHERE status = :status");
        $stmt->execute([':status' => $status]);
        $res = $stmt->fetch();
        sendJson(["count" => (int)($res['count'] ?? 0)]);
    }

    // 3. List players with optional filters
    $status = $_GET['status'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
    $team_id = $_GET['team_id'] ?? null;
    $auction_eligible = $_GET['auction_eligible'] ?? null;

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

    if ($status !== null && $status !== 'all') {
        $sql .= " AND p.status = :status";
        $params[':status'] = $status;
    }

    if ($team_id !== null && $team_id !== '') {
        $sql .= " AND p.team_id = :team_id";
        $params[':team_id'] = $team_id;
    }

    if ($auction_eligible !== null && $auction_eligible !== '') {
        $sql .= " AND p.auction_eligible = :auction_eligible";
        $params[':auction_eligible'] = ($auction_eligible === 'true' || $auction_eligible === '1') ? 1 : 0;
    }

    $sql .= " ORDER BY p.created_at DESC LIMIT " . $limit;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $players = $stmt->fetchAll();

    // Map nested teams object to match Supabase structure if requested
    $formatted = array_map(function($p) {
        if (!empty($p['team_id'])) {
            $p['teams'] = [
                'id' => $p['team_id'],
                'name' => $p['team_name'] ?? '',
                'short_code' => $p['team_short_code'] ?? '',
                'accent_color' => $p['team_accent_color'] ?? '#22c55e'
            ];
        } else {
            $p['teams'] = null;
        }
        $p['batsman'] = (bool)$p['batsman'];
        $p['wicket_keeper'] = (bool)$p['wicket_keeper'];
        $p['previously_played'] = (bool)$p['previously_played'];
        $p['all_rounder'] = (bool)$p['all_rounder'];
        $p['bowler'] = (bool)$p['bowler'];
        $p['auction_eligible'] = (bool)$p['auction_eligible'];
        $p['declaration_accepted'] = (bool)$p['declaration_accepted'];
        return $p;
    }, $players);

    sendJson($formatted);
}

// Handle POST requests (Create / Register Player)
if ($method === 'POST') {
    $input = getJsonInput();

    $player_name = trim($input['player_name'] ?? '');
    $contact_number = trim($input['contact_number'] ?? '');

    if (empty($player_name) || empty($contact_number)) {
        sendError("Player name and contact number are required", 400);
    }

    $id = generateUuid();
    $father_name = trim($input['father_name'] ?? '');
    $date_of_birth = !empty($input['date_of_birth']) ? $input['date_of_birth'] : null;
    $age = isset($input['age']) ? (int)$input['age'] : null;
    $present_address = trim($input['present_address'] ?? '');
    $address_proof = $input['address_proof'] ?? null;
    $role = trim($input['role'] ?? 'Batsman');
    $email = trim($input['email'] ?? '');
    $photo = $input['photo'] ?? null;
    $batsman = !empty($input['batsman']) ? 1 : 0;
    $batting_hand = trim($input['batting_hand'] ?? '');
    $wicket_keeper = !empty($input['wicket_keeper']) ? 1 : 0;
    $player_category = trim($input['player_category'] ?? 'local');
    $previously_played = !empty($input['previously_played']) ? 1 : 0;
    $all_rounder = !empty($input['all_rounder']) ? 1 : 0;
    $bowler = !empty($input['bowler']) ? 1 : 0;
    $bowling_type = trim($input['bowling_type'] ?? '');
    $player_signature = $input['player_signature'] ?? null;
    $declaration_accepted = !empty($input['declaration_accepted']) ? 1 : 0;
    $approval = trim($input['approval'] ?? 'pending');
    $registration_number = trim($input['registration_number'] ?? ('KPL-P' . rand(1000, 9999)));
    $registered_by = trim($input['registered_by'] ?? 'self');
    $team_id = !empty($input['team_id']) ? $input['team_id'] : null;
    $auction_eligible = isset($input['auction_eligible']) ? (!empty($input['auction_eligible']) ? 1 : 0) : 1;
    $base_price = isset($input['base_price']) ? (float)$input['base_price'] : 500.00;
    $status = trim($input['status'] ?? 'active');
    $notes = trim($input['notes'] ?? '');

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
        ':player_name' => $player_name,
        ':father_name' => $father_name,
        ':date_of_birth' => $date_of_birth,
        ':age' => $age,
        ':present_address' => $present_address,
        ':address_proof' => $address_proof,
        ':role' => $role,
        ':contact_number' => $contact_number,
        ':email' => $email,
        ':photo' => $photo,
        ':batsman' => $batsman,
        ':batting_hand' => $batting_hand,
        ':wicket_keeper' => $wicket_keeper,
        ':player_category' => $player_category,
        ':previously_played' => $previously_played,
        ':all_rounder' => $all_rounder,
        ':bowler' => $bowler,
        ':bowling_type' => $bowling_type,
        ':player_signature' => $player_signature,
        ':declaration_accepted' => $declaration_accepted,
        ':approval' => $approval,
        ':registration_number' => $registration_number,
        ':registered_by' => $registered_by,
        ':team_id' => $team_id,
        ':auction_eligible' => $auction_eligible,
        ':base_price' => $base_price,
        ':status' => $status,
        ':notes' => $notes
    ]);

    sendJson([
        "status" => "success",
        "message" => "Player created successfully",
        "id" => $id
    ], 201);
}

// Handle PUT requests (Update Player)
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? null);

    if (empty($id)) {
        sendError("Player ID is required for update", 400);
    }

    $fields = [];
    $params = [':id' => $id];

    $allowed = [
        'player_name', 'father_name', 'date_of_birth', 'age', 'present_address',
        'address_proof', 'role', 'contact_number', 'email', 'photo', 'batsman',
        'batting_hand', 'wicket_keeper', 'player_category', 'previously_played',
        'all_rounder', 'bowler', 'bowling_type', 'player_signature',
        'declaration_accepted', 'approval', 'registration_number', 'team_id',
        'auction_eligible', 'base_price', 'sold_price', 'status', 'notes'
    ];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = "{$field} = :{$field}";
            $val = $input[$field];
            if (in_array($field, ['batsman', 'wicket_keeper', 'previously_played', 'all_rounder', 'bowler', 'auction_eligible', 'declaration_accepted'])) {
                $val = !empty($val) ? 1 : 0;
            }
            if ($field === 'team_id' && empty($val)) {
                $val = null;
            }
            $params[":{$field}"] = $val;
        }
    }

    if (empty($fields)) {
        sendError("No valid fields provided for update", 400);
    }

    $sql = "UPDATE players SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    sendJson([
        "status" => "success",
        "message" => "Player updated successfully"
    ]);
}

// Handle DELETE requests
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (empty($id)) {
        sendError("Player ID is required for deletion", 400);
    }

    $stmt = $db->prepare("DELETE FROM players WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendJson([
        "status" => "success",
        "message" => "Player deleted successfully"
    ]);
}

sendError("Method not allowed", 405);
