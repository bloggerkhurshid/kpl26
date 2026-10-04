<?php
namespace Kpl\Utils;

/**
 * File & Base64 Upload Handler
 */
class FileUploader {

    private static $uploadDir = __DIR__ . '/../../uploads';

    public static function saveBase64(string $base64String, string $subfolder = 'documents'): ?string {
        return self::uploadBase64($base64String, $subfolder);
    }

    public static function uploadBase64(string $base64String, string $subfolder = 'documents'): ?string {
        if (empty($base64String)) {
            return null;
        }

        // Return original if already a path or external URL
        if (!str_starts_with($base64String, 'data:')) {
            return $base64String;
        }

        $parts = explode(',', $base64String);
        if (count($parts) < 2) {
            return $base64String;
        }

        preg_match('/:(.*?);/', $parts[0], $matches);
        $mime = $matches[1] ?? 'image/png';
        $extension = match ($mime) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            default => 'png',
        };

        $fileName = uniqid($subfolder . '_', true) . '.' . $extension;
        $targetPath = self::$uploadDir . '/' . $subfolder;

        if (!file_exists($targetPath)) {
            @mkdir($targetPath, 0777, true);
        }

        $filePath = $targetPath . '/' . $fileName;
        $decoded = base64_decode($parts[1]);

        if ($decoded !== false && @file_put_contents($filePath, $decoded) !== false) {
            $baseUrl = getenv('APP_URL') ?: 'https://kpl.projuktisoft.com';
            return rtrim($baseUrl, '/') . '/uploads/' . $subfolder . '/' . $fileName;
        }

        // If file saving on disk fails (e.g. permission restriction), return base64 string so database insertion still succeeds
        return $base64String;
    }
}
