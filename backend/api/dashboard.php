<?php
/**
 * Legacy API Wrapper - Dashboard Metrics
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\DashboardController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    (new DashboardController())->index();
} else {
    Response::error("Method not allowed", 405);
}
