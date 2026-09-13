<?php
/**
 * Teams Management REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $stmt = $db->prepare("SELECT * FROM teams WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $team = $stmt->fetch();
        if ($team) {
            sendJson($team);
        } else {
            sendError("Team not found", 404);
        }
    }

    $status = $_GET['status'] ?? null;
    $sql = "SELECT * FROM teams";
    $params = [];

    if ($status !== null && $status !== 'all') {
        $sql .= " WHERE status = :status";
        $params[':status'] = $status;
    }

    $sql .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $teams = $stmt->fetchAll();

    sendJson($teams);
}

// Handle POST requests (Create Team)
if ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $short_code = trim($input['short_code'] ?? '');

    if (empty($name) || empty($short_code)) {
        sendError("Team name and short code are required", 400);
    }

    $id = generateUuid();
    $owner_name = trim($input['owner_name'] ?? '');
    $owner_contact = trim($input['owner_contact'] ?? '');
    $accent_color = trim($input['accent_color'] ?? '#22c55e');
    $logo_url = $input['logo_url'] ?? null;
    $squad_limit = isset($input['squad_limit']) ? (int)$input['squad_limit'] : 15;
    $budget = isset($input['budget']) ? (float)$input['budget'] : 100000.00;
    $spent = isset($input['spent']) ? (float)$input['spent'] : 0.00;
    $status = trim($input['status'] ?? 'active');

    $stmt = $db->prepare("
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
        ':name' => $name,
        ':short_code' => $short_code,
        ':owner_name' => $owner_name,
        ':owner_contact' => $owner_contact,
        ':accent_color' => $accent_color,
        ':logo_url' => $logo_url,
        ':squad_limit' => $squad_limit,
        ':budget' => $budget,
        ':spent' => $spent,
        ':status' => $status
    ]);

    sendJson([
        "status" => "success",
        "message" => "Team created successfully",
        "id" => $id
    ], 201);
}

// Handle PUT requests (Update Team)
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? null);

    if (empty($id)) {
        sendError("Team ID is required for update", 400);
    }

    $fields = [];
    $params = [':id' => $id];

    $allowed = ['name', 'short_code', 'owner_name', 'owner_contact', 'accent_color', 'logo_url', 'squad_limit', 'budget', 'spent', 'status'];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $input)) {
            $fields[] = "{$field} = :{$field}";
            $params[":{$field}"] = $input[$field];
        }
    }

    if (empty($fields)) {
        sendError("No valid fields provided for update", 400);
    }

    $sql = "UPDATE teams SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    sendJson([
        "status" => "success",
        "message" => "Team updated successfully"
    ]);
}

// Handle DELETE requests
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (empty($id)) {
        sendError("Team ID is required for deletion", 400);
    }

    // Unassign players belonging to this team first
    $unassign = $db->prepare("UPDATE players SET team_id = NULL WHERE team_id = :id");
    $unassign->execute([':id' => $id]);

    $stmt = $db->prepare("DELETE FROM teams WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendJson([
        "status" => "success",
        "message" => "Team deleted successfully"
    ]);
}

sendError("Method not allowed", 405);
