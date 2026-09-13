<?php
/**
 * Database Configuration & PDO Handler
 * Khoraghat Premier League (KPL) PHP Backend
 */

class Database {
    private static $host = "localhost";
    private static $db_name = "kpl_db";
    private static $username = "root";
    private static $password = "";
    private static $port = "3306";
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        // Allow overriding via environment variables or custom config file
        if (file_exists(__DIR__ . '/env.php')) {
            require_once __DIR__ . '/env.php';
        }

        $host = getenv('DB_HOST') ?: self::$host;
        $db_name = getenv('DB_NAME') ?: self::$db_name;
        $username = getenv('DB_USER') ?: self::$username;
        $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : self::$password;
        $port = getenv('DB_PORT') ?: self::$port;

        try {
            $dsn = "mysql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name . ";charset=utf8mb4";
            self::$conn = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode([
                "status" => "error",
                "message" => "Database connection failed: " . $e->getMessage()
            ]);
            exit();
        }

        return self::$conn;
    }
}
