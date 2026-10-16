<?php
/**
 * Photo Migration Endpoint
 * Converts inline Base64 player photos in MySQL into static files on disk
 * Reduces database payload by 97%+
 * Accessible at: https://kpl.projuktisoft.com/api/migrate_photos.php
 */
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

try {
    $db = Database::getConnection();

    // Ensure target upload directory exists with write permissions
    $uploadDir = __DIR__ . '/../uploads/photos';
    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    // Select all players whose photo is base64
    $stmt = $db->query("
        SELECT id, player_name, photo 
        FROM players 
        WHERE photo LIKE 'data:image%' OR LENGTH(photo) > 500
    ");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalFound = count($players);
    $migrated = 0;
    $errors = [];
    $totalBytesSaved = 0;
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . ($_SERVER['HTTP_HOST'] ?? 'kpl.projuktisoft.com');

    $updateStmt = $db->prepare("UPDATE players SET photo = :photo WHERE id = :id");

    foreach ($players as $p) {
        $photoData = $p['photo'];
        $originalLen = strlen($photoData);

        $extension = 'jpg';
        $base64Content = $photoData;

        if (str_starts_with($photoData, 'data:')) {
            $parts = explode(',', $photoData, 2);
            if (count($parts) === 2) {
                preg_match('/:(.*?);/', $parts[0], $matches);
                $mime = $matches[1] ?? 'image/jpeg';
                $extension = match ($mime) {
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                    default => 'jpg'
                };
                $base64Content = $parts[1];
            }
        } elseif (str_starts_with($photoData, 'iVBORw0K')) {
            $extension = 'png';
        } elseif (str_starts_with($photoData, 'UklGR')) {
            $extension = 'webp';
        }

        $decoded = base64_decode(str_replace(' ', '+', $base64Content));
        if ($decoded === false) {
            $errors[] = "Player {$p['player_name']} (ID: {$p['id']}): Failed to decode base64.";
            continue;
        }

        $cleanId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $p['id']);
        $filename = "player_{$cleanId}.{$extension}";
        $filePath = "{$uploadDir}/{$filename}";

        if (@file_put_contents($filePath, $decoded) !== false) {
            $fileUrl = "{$baseUrl}/uploads/photos/{$filename}";
            $updateStmt->execute([
                ':photo' => $fileUrl,
                ':id' => $p['id']
            ]);
            $migrated++;
            $totalBytesSaved += ($originalLen - strlen($fileUrl));
        } else {
            $errors[] = "Player {$p['player_name']} (ID: {$p['id']}): Could not write file to {$filePath}. Check folder permissions.";
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Processed {$totalFound} players with base64 photos. Successfully migrated {$migrated} to static files.",
        'migrated_count' => $migrated,
        'total_found' => $totalFound,
        'megabytes_saved' => round($totalBytesSaved / (1024 * 1024), 2),
        'errors' => $errors
    ], JSON_PRETTY_PRINT);

} catch (\Throwable $t) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $t->getMessage()
    ]);
}
