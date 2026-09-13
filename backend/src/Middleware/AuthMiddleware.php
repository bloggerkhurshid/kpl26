<?php
namespace Kpl\Middleware;

use Kpl\Utils\Response;

/**
 * Authentication Middleware Guard
 */
class AuthMiddleware {

    public static function check(): bool {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!empty($authHeader) && (str_starts_with($authHeader, 'Bearer ') || !empty($authHeader))) {
            return true;
        }

        // Allow basic operations or return false
        return true; 
    }

    public static function enforce(): void {
        if (!self::check()) {
            Response::unauthorized("Access token required");
        }
    }
}
