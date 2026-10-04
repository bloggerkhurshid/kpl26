<?php
/**
 * Legacy API Wrapper - Photo Gallery
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\GalleryController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$controller = new GalleryController();

if ($method === 'GET') {
    $controller->index();
} elseif ($method === 'POST') {
    $controller->store();
} elseif ($method === 'DELETE') {
    $controller->destroy();
} else {
    Response::error("Method not allowed", 405);
}
