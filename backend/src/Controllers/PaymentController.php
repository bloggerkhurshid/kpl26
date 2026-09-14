<?php
namespace Kpl\Controllers;

use Kpl\Models\Payment;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;

/**
 * Controller handling payments
 */
class PaymentController {

    public function index(): void {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
        $payments = Payment::all($limit);
        Response::json($payments);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $amount = (float)($input['amount'] ?? 0);

        if (empty($name) || empty($phone) || $amount <= 0) {
            Response::error("Name, phone, and a valid amount are required", 400);
        }

        // Handle base64 screenshot upload if provided
        $screenshot = $input['screenshot'] ?? ($input['payment_proof'] ?? null);
        if (!empty($screenshot) && str_starts_with($screenshot, 'data:')) {
            $uploadedUrl = \Kpl\Utils\FileUploader::uploadBase64($screenshot, 'payments');
            $input['screenshot'] = $uploadedUrl ?: $screenshot;
        } elseif (!empty($screenshot)) {
            $input['screenshot'] = $screenshot;
        }

        $id = Payment::create($input);

        Response::json([
            "status" => "success",
            "message" => "Payment logged successfully",
            "id" => $id
        ], 201);
    }

    public function updateStatus(): void {
        $input = Validator::getJsonInput();
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        $status = $input['status'] ?? null;

        if (empty($id) || empty($status)) {
            Response::error("Payment ID and status are required", 400);
        }

        $screenshot = $input['screenshot'] ?? ($input['payment_proof'] ?? null);
        if (!empty($screenshot) && str_starts_with($screenshot, 'data:')) {
            $uploadedUrl = \Kpl\Utils\FileUploader::uploadBase64($screenshot, 'payments');
            $screenshot = $uploadedUrl ?: $screenshot;
        }

        $success = Payment::updateStatus($id, $status, $screenshot);
        if (!$success) {
            Response::error("Failed to update payment status", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Payment status updated to {$status}"
        ]);
    }
}

