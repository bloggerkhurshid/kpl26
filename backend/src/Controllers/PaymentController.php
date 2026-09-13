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

        $success = Payment::updateStatus($id, $status);
        if (!$success) {
            Response::error("Failed to update payment status", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Payment status updated to {$status}"
        ]);
    }
}

