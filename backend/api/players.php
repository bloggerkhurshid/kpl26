<?php
/**
 * Legacy API Wrapper - Players
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\PlayerController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$controller = new PlayerController();

try {
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
} catch (\Throwable $t) {
    http_response_code(500);
    echo json_encode([
        'error' => $t->getMessage(),
        'file' => $t->getFile(),
        'line' => $t->getLine(),
        'trace' => $t->getTraceAsString()
    ]);
    exit();
}
