<?php
/**
 * Khoraghat Premier League (KPL) PHP Enterprise API Entrypoint
 * Public Front Controller
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/Autoloader.php';
require_once __DIR__ . '/../routes/api.php';

$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

Router::dispatch($uri, $method);
