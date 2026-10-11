<?php
/**
 * Legacy API Wrapper - Payments
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\PaymentController;
use Kpl\Models\Payment;
use Kpl\Utils\Response;

Payment::ensureSchema();

$method = $_SERVER['REQUEST_METHOD'];
$controller = new PaymentController();

if ($method === 'GET') {
    $controller->index();
} elseif ($method === 'POST') {
    $controller->store();
} elseif ($method === 'PUT') {
    $controller->updateStatus();
} else {
    Response::error("Method not allowed", 405);
}
