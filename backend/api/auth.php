<?php
/**
 * Legacy API Wrapper - Auth
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\AuthController;

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    (new AuthController())->login();
} else {
    \Kpl\Utils\Response::error("Method not allowed", 405);
}
