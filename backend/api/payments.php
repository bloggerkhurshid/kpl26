<?php
/**
 * Payments REST API
 * Khoraghat Premier League (KPL) PHP Backend
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
    $stmt = $db->prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT " . $limit);
    $stmt->execute();
    $payments = $stmt->fetchAll();

    sendJson($payments);
}

if ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $amount = (float)($input['amount'] ?? 0);

    if (empty($name) || empty($phone) || $amount <= 0) {
        sendError("Name, phone, and a valid amount are required", 400);
    }

    $id = generateUuid();
    $registration_type = trim($input['registration_type'] ?? 'player');
    $registration_id = $input['registration_id'] ?? null;
    $payment_gateway = trim($input['payment_gateway'] ?? 'razorpay');
    $payment_id = $input['payment_id'] ?? null;
    $status = trim($input['status'] ?? 'completed');

    $stmt = $db->prepare("
        INSERT INTO payments (
            id, registration_type, registration_id, name, phone, amount, payment_gateway, payment_id, status
        ) VALUES (
            :id, :registration_type, :registration_id, :name, :phone, :amount, :payment_gateway, :payment_id, :status
        )
    ");

    $stmt->execute([
        ':id' => $id,
        ':registration_type' => $registration_type,
        ':registration_id' => $registration_id,
        ':name' => $name,
        ':phone' => $phone,
        ':amount' => $amount,
        ':payment_gateway' => $payment_gateway,
        ':payment_id' => $payment_id,
        ':status' => $status
    ]);

    sendJson([
        "status" => "success",
        "message" => "Payment logged successfully",
        "id" => $id
    ], 201);
}

sendError("Method not allowed", 405);
