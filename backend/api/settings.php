<?php
/**
 * Settings REST API (Payment & Registration Fees)
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$DEFAULTS = [
    'fee_player' => '500',
    'fee_foreign_player' => '1000',
    'fee_team' => '5000',
    'active_gateway' => 'razorpay',
    'gateway_mode' => 'sandbox'
];

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT `key`, `value` FROM content_settings");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $settings = $DEFAULTS;
    foreach ($rows as $row) {
        $settings[$row['key']] = $row['value'];
    }

    sendJson([
        'fee_player' => (float)($settings['fee_player'] ?? 500),
        'fee_foreign_player' => (float)($settings['fee_foreign_player'] ?? 1000),
        'fee_team' => (float)($settings['fee_team'] ?? 5000),
        'active_gateway' => $settings['active_gateway'] ?? 'razorpay',
        'gateway_mode' => $settings['gateway_mode'] ?? 'sandbox',
        'raw_settings' => $settings
    ]);
}

if ($method === 'POST') {
    $input = getJsonInput();

    if (empty($input)) {
        sendError("No settings provided", 400);
    }

    $stmt = $db->prepare("
        INSERT INTO content_settings (`key`, `value`)
        VALUES (:key, :value)
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
    ");

    foreach ($input as $key => $value) {
        $stmt->execute([
            ':key' => $key,
            ':value' => (string)$value
        ]);
    }

    sendJson([
        "status" => "success",
        "message" => "Settings saved successfully"
    ]);
}

sendError("Method not allowed", 405);
