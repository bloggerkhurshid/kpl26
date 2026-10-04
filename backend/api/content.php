<?php
/**
 * Legacy API Wrapper - Content Settings
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\ContentController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$controller = new ContentController();

if ($method === 'GET') {
    $controller->index();
} elseif ($method === 'POST') {
    $controller->store();
} else {
    Response::error("Method not allowed", 405);
}
