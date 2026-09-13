<?php
/**
 * API Central Router
 * Khoraghat Premier League (KPL) PHP Enterprise Architecture
 */

use Kpl\Controllers\AuthController;
use Kpl\Controllers\PlayerController;
use Kpl\Controllers\TeamController;
use Kpl\Controllers\HighlightController;
use Kpl\Controllers\ContentController;
use Kpl\Controllers\SettingsController;
use Kpl\Controllers\PaymentController;
use Kpl\Controllers\DashboardController;
use Kpl\Utils\Response;

class Router {

    public static function dispatch(string $uri, string $method): void {
        // Strip query string and base paths
        $path = parse_url($uri, PHP_URL_PATH);
        $path = preg_replace('#^.*/public/api/#', '', $path);
        $path = preg_replace('#^.*/backend/api/#', '', $path);
        $path = preg_replace('#^/api/#', '', $path);
        $path = trim($path, '/');

        // Route definitions
        switch ($path) {
            case 'auth':
            case 'auth.php':
                if ($method === 'POST') (new AuthController())->login();
                break;

            case 'players':
            case 'players.php':
                $controller = new PlayerController();
                if ($method === 'GET') {
                    if (isset($_GET['id'])) $controller->show();
                    else $controller->index();
                } elseif ($method === 'POST') {
                    $controller->store();
                } elseif ($method === 'PUT') {
                    $controller->update();
                } elseif ($method === 'DELETE') {
                    $controller->destroy();
                }
                break;

            case 'teams':
            case 'teams.php':
                $controller = new TeamController();
                if ($method === 'GET') {
                    if (isset($_GET['id'])) $controller->show();
                    else $controller->index();
                } elseif ($method === 'POST') {
                    $controller->store();
                } elseif ($method === 'PUT') {
                    $controller->update();
                } elseif ($method === 'DELETE') {
                    $controller->destroy();
                }
                break;

            case 'highlights':
            case 'highlights.php':
                $controller = new HighlightController();
                if ($method === 'GET') $controller->index();
                elseif ($method === 'POST') $controller->store();
                elseif ($method === 'PUT') $controller->update();
                elseif ($method === 'DELETE') $controller->destroy();
                break;

            case 'content':
            case 'content.php':
                $controller = new ContentController();
                if ($method === 'GET') $controller->index();
                elseif ($method === 'POST') $controller->store();
                break;

            case 'settings':
            case 'settings.php':
                $controller = new SettingsController();
                if ($method === 'GET') $controller->index();
                elseif ($method === 'POST') $controller->store();
                break;

            case 'payments':
            case 'payments.php':
                $controller = new PaymentController();
                if ($method === 'GET') $controller->index();
                elseif ($method === 'POST') $controller->store();
                break;

            case 'dashboard':
            case 'dashboard.php':
                $controller = new DashboardController();
                if ($method === 'GET') $controller->index();
                break;

            default:
                Response::error("Endpoint dynamic route '{$path}' not found", 404);
                break;
        }

        Response::error("Method {$method} not allowed for endpoint '{$path}'", 405);
    }
}
