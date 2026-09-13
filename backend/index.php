<?php
/**
 * Khoraghat Premier League (KPL) PHP REST API Status & Health Check
 */

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';

$dbConnected = false;
$dbError = null;

try {
    $db = Database::getConnection();
    if ($db) {
        $dbConnected = true;
    }
} catch (Exception $e) {
    $dbError = $e->getMessage();
}

sendJson([
    "name" => "KPL Khoraghat Premier League REST API",
    "version" => "1.0.0",
    "status" => "online",
    "php_version" => PHP_VERSION,
    "database" => [
        "connected" => $dbConnected,
        "error" => $dbError
    ],
    "endpoints" => [
        "auth" => "/api/auth.php",
        "players" => "/api/players.php",
        "teams" => "/api/teams.php",
        "highlights" => "/api/highlights.php",
        "content" => "/api/content.php",
        "settings" => "/api/settings.php",
        "payments" => "/api/payments.php",
        "dashboard" => "/api/dashboard.php"
    ],
    "timestamp" => date('c')
]);
