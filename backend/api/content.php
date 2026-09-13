<?php
/**
 * Content Settings REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$DEFAULTS = [
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

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT `key`, `value` FROM content_settings");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $settings = $DEFAULTS;
    foreach ($rows as $row) {
        $settings[$row['key']] = $row['value'];
    }

    sendJson($settings);
}

if ($method === 'POST') {
    $input = getJsonInput();

    if (empty($input)) {
        sendError("No content settings provided", 400);
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
        "message" => "Content settings updated successfully"
    ]);
}

sendError("Method not allowed", 405);
