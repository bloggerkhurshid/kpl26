<?php
namespace Kpl\Utils;

/**
 * File & Base64 Upload Handler
 */
class FileUploader {

    private static $uploadDir = __DIR__ . '/../../uploads';

    public static function saveBase64(string $base64String, string $subfolder = 'documents'): ?string {
        if (empty($base64String) || !str_starts_with($base64String, 'data:')) {
            return $base64String; // Return original if already a path or empty
        }

        $parts = explode(',', $base64String);
        if (count($parts) < 2) return null;

        preg_match('/:(.*?);/', $parts[0], $matches);
        $mime = $matches[1] ?? 'image/png';
        $extension = match ($mime) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            default => 'bin',
        };

        $fileName = uniqid($subfolder . '_', true) . '.' . $extension;
        $targetPath = self::$uploadDir . '/' . $subfolder;

        if (!file_exists($targetPath)) {
            mkdir($targetPath, 0777, true);
        }

        $filePath = $targetPath . '/' . $fileName;
        $decoded = base64_decode($parts[1]);

        if (file_put_contents($filePath, $decoded) !== false) {
            return '/uploads/' . $subfolder . '/' . $fileName;
        }

        return null;
    }
}
