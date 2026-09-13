<?php
/**
 * Highlights Gallery REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET requests
if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $stmt = $db->prepare("SELECT * FROM highlights ORDER BY created_at DESC LIMIT " . $limit);
    $stmt->execute();
    $items = $stmt->fetchAll();
    
    // Alias image_url as image for frontend compatibility
    $formatted = array_map(function($item) {
        $item['image'] = $item['image_url'];
        return $item;
    }, $items);

    sendJson($formatted);
}

// Handle POST requests (Create Highlight)
if ($method === 'POST') {
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $image_url = $input['image_url'] ?? ($input['image'] ?? '');
    $size = trim($input['size'] ?? 'normal');

    if (empty($title) || empty($image_url)) {
        sendError("Title and image URL are required", 400);
    }

    $stmt = $db->prepare("INSERT INTO highlights (title, image_url, size) VALUES (:title, :image_url, :size)");
    $stmt->execute([
        ':title' => $title,
        ':image_url' => $image_url,
        ':size' => $size
    ]);

    $id = $db->lastInsertId();

    sendJson([
        "status" => "success",
        "message" => "Highlight created successfully",
        "id" => $id
    ], 201);
}

// Handle PUT requests (Update Highlight)
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? null);

    if (empty($id)) {
        sendError("Highlight ID is required for update", 400);
    }

    $title = trim($input['title'] ?? '');
    $image_url = $input['image_url'] ?? ($input['image'] ?? '');
    $size = trim($input['size'] ?? 'normal');

    $stmt = $db->prepare("UPDATE highlights SET title = :title, image_url = :image_url, size = :size WHERE id = :id");
    $stmt->execute([
        ':title' => $title,
        ':image_url' => $image_url,
        ':size' => $size,
        ':id' => $id
    ]);

    sendJson([
        "status" => "success",
        "message" => "Highlight updated successfully"
    ]);
}

// Handle DELETE requests
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (empty($id)) {
        sendError("Highlight ID is required for deletion", 400);
    }

    $stmt = $db->prepare("DELETE FROM highlights WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendJson([
        "status" => "success",
        "message" => "Highlight deleted successfully"
    ]);
}

sendError("Method not allowed", 405);
