<?php
/**
 * TEMPORARY DEBUG ENDPOINT — REMOVE AFTER DEBUGGING
 * Access: https://kpl.projuktisoft.com/api/debug.php
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$result = [
    'php_version' => PHP_VERSION,
    'db_status' => 'not_tested',
    'db_error' => null,
    'player_test' => null,
    'autoloader' => null,
];

// Test DB connection
try {
    require_once __DIR__ . '/../config/database.php';
    $db = Database::getConnection();
    $result['db_status'] = 'connected';

    // Test simple query
    $stmt = $db->query("SELECT COUNT(*) as c FROM players");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $result['player_count'] = $row['c'] ?? 'n/a';

    // Test show query (the one that 500s)
    $stmt2 = $db->prepare("SELECT p.*, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id LIMIT 1");
    $stmt2->execute();
    $sample = $stmt2->fetch(PDO::FETCH_ASSOC);
    $result['player_test'] = $sample ? 'ok' : 'no_rows';

} catch (Throwable $e) {
    $result['db_status'] = 'error';
    $result['db_error'] = $e->getMessage();
}

// Test autoloader
try {
    require_once __DIR__ . '/../src/Autoloader.php';
    $result['autoloader'] = 'ok';
} catch (Throwable $e) {
    $result['autoloader'] = 'error: ' . $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
