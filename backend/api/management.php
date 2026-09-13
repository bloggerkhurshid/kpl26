<?php
/**
 * Legacy API Wrapper - Management Personnel
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\ManagementController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$controller = new ManagementController();

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $controller->show();
    } else {
        $controller->index();
    }
} elseif ($method === 'POST') {
    $controller->store();
} elseif ($method === 'PUT') {
    $controller->update();
} elseif ($method === 'DELETE') {
    $controller->destroy();
} else {
    Response::error("Method not allowed", 405);
}
