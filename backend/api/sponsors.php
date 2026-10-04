<?php
/**
 * Legacy API Wrapper - Sponsors
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';

use Kpl\Controllers\SponsorController;
use Kpl\Utils\Response;

$method = $_SERVER['REQUEST_METHOD'];
$controller = new SponsorController();

switch ($method) {
    case 'GET':
        if (!empty($_GET['id'])) {
            $controller->show();
        } else {
            $controller->index();
        }
        break;
    case 'POST':
        $controller->store();
        break;
    case 'PUT':
        $controller->update();
        break;
    case 'DELETE':
        $controller->destroy();
        break;
    default:
        Response::error("Method not allowed", 405);
}
