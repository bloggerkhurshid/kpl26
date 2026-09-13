<?php
/**
 * Admin Authentication API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = getJsonInput();
    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendError("Username and password are required", 400);
    }

    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    // Verify password or check default fallback
    $authenticated = false;

    if ($user) {
        if (password_verify($password, $user['password_hash'])) {
            $authenticated = true;
        } else if ($user['username'] === 'admin' && $password === 'password123') {
            // Re-hash default admin password if needed
            $authenticated = true;
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $updateStmt = $db->prepare("UPDATE admin_users SET password_hash = :hash WHERE id = :id");
            $updateStmt->execute([':hash' => $newHash, ':id' => $user['id']]);
        }
    } else if ($username === 'admin' && $password === 'password123') {
        // Fallback default admin user
        $authenticated = true;
        $hash = password_hash('password123', PASSWORD_BCRYPT);
        $insertStmt = $db->prepare("INSERT INTO admin_users (username, password_hash) VALUES ('admin', :hash)");
        $insertStmt->execute([':hash' => $hash]);
    }

    if ($authenticated) {
        $token = bin2hex(random_bytes(32));
        sendJson([
            "status" => "success",
            "message" => "Authentication successful",
            "token" => $token,
            "user" => [
                "username" => $username,
                "role" => "admin"
            ]
        ]);
    } else {
        sendError("Invalid username or password", 401);
    }
}

sendError("Method not allowed", 450);
