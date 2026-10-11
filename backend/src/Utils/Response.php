<?php
namespace Kpl\Utils;

/**
 * Standardized API Response Helper
 */
class Response {

    public static function json($data = [], int $statusCode = 200): void {
        header("Content-Type: application/json; charset=UTF-8");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }

    public static function success(string $message = "Success", $data = null, int $statusCode = 200): void {
        $response = [
            "status" => "success",
            "message" => $message
        ];
        if ($data !== null) {
            if (is_array($data) && (isset($data['id']) || isset($data['data']) || isset($data['count']))) {
                $response = array_merge($response, $data);
            } else {
                $response["data"] = $data;
            }
        }
        self::json($response, $statusCode);
    }

    public static function error(string $message = "Bad Request", int $statusCode = 400, $details = null): void {
        $response = [
            "status" => "error",
            "message" => $message
        ];
        if ($details !== null) {
            $response["details"] = $details;
        }
        self::json($response, $statusCode);
    }

    public static function notFound(string $message = "Resource not found"): void {
        self::error($message, 404);
    }

    public static function unauthorized(string $message = "Unauthorized access"): void {
        self::error($message, 401);
    }
}
