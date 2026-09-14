<?php
namespace Kpl\Controllers;

use Kpl\Models\Player;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;

/**
 * Controller handling player endpoints
 */
class PlayerController {

    public function index(): void {
        $filters = [
            'status' => $_GET['status'] ?? null,
            'approval' => $_GET['approval'] ?? null,
            'registered_by' => $_GET['registered_by'] ?? null,
            'team_id' => $_GET['team_id'] ?? null,
            'auction_eligible' => $_GET['auction_eligible'] ?? null,
        ];

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
        $players = Player::all($filters, $limit);

        Response::json($players);
    }

    public function show(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Player ID is required", 400);
        }

        $player = Player::findById($id);
        if (!$player) {
            Response::error("Player not found", 404);
        }

        Response::json($player);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        if (empty($input['player_name']) || empty($input['contact_number'])) {
            Response::error("Player name and contact number are required", 400);
        }

        // Handle File uploads / Base64 conversions if provided
        if (!empty($input['photo_base64'])) {
            $input['photo'] = FileUploader::uploadBase64($input['photo_base64'], 'photo_');
        }

        if (!empty($input['address_proof_base64'])) {
            $input['address_proof'] = FileUploader::uploadBase64($input['address_proof_base64'], 'proof_');
        }

        if (!empty($input['player_signature_base64'])) {
            $input['player_signature'] = FileUploader::uploadBase64($input['player_signature_base64'], 'sig_');
        }

        $id = Player::create($input);
        $player = Player::findById($id);

        Response::json([
            "status" => "success",
            "message" => "Player registered successfully",
            "data" => $player,
            "id" => $id
        ], 201);
    }

    public function update(): void {
        $input = Validator::getJsonInput();
        $id = $_GET['id'] ?? ($input['id'] ?? null);

        if (empty($id)) {
            Response::error("Player ID is required for update", 400);
        }

        // Handle base64 uploads if present
        if (!empty($input['photo_base64'])) {
            $input['photo'] = FileUploader::uploadBase64($input['photo_base64'], 'photo_');
        }

        if (!empty($input['address_proof_base64'])) {
            $input['address_proof'] = FileUploader::uploadBase64($input['address_proof_base64'], 'proof_');
        }

        if (!empty($input['player_signature_base64'])) {
            $input['player_signature'] = FileUploader::uploadBase64($input['player_signature_base64'], 'sig_');
        }

        $updated = Player::update($id, $input);
        if (!$updated) {
            Response::error("Failed to update player or no change made", 400);
        }

        $player = Player::findById($id);
        Response::json([
            "status" => "success",
            "message" => "Player updated successfully",
            "data" => $player
        ]);
    }

    public function destroy(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Player ID is required for deletion", 400);
        }

        $deleted = Player::delete($id);
        if (!$deleted) {
            Response::error("Failed to delete player", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Player deleted successfully"
        ]);
    }
}
