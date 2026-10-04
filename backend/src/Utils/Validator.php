<?php
namespace Kpl\Utils;

/**
 * Input Validator & Request Body Parsing Utility
 */
class Validator {

    /**
     * Parse JSON request payload or fall back to $_POST
     */
    public static function getJsonInput(): array {
        $input = file_get_contents('php://input');
        if (empty($input)) {
            return $_POST ?: [];
        }
        $data = json_decode($input, true);
        return is_array($data) ? $data : ($_POST ?: []);
    }

    public static function sanitizeString(string $input): string {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    public static function isValidEmail(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function isValidPhone(string $phone): bool {
        return preg_match('/^[0-9\-\+\s\(\)]{7,20}$/', $phone) === 1;
    }

    public static function generateUuid(): string {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
