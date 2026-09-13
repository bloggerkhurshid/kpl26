<?php
namespace Kpl\Controllers;

use Kpl\Models\Team;
use Kpl\Models\Player;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;

/**
 * Controller handling team endpoints
 */
class TeamController {

    public function index(): void {
        $status = $_GET['status'] ?? null;
        $teams = Team::all($status);
        Response::json($teams);
    }

    public function show(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Team ID is required", 400);
        }

        $team = Team::findById($id);
        if (!$team) {
            Response::error("Team not found", 404);
        }

        // Fetch team players
        $players = Player::all(['team_id' => $id]);
        $team['players'] = $players;

        Response::json($team);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        if (empty($input['name']) || empty($input['short_code'])) {
            Response::error("Team name and short code are required", 400);
        }

        if (!empty($input['logo_base64'])) {
            $input['logo_url'] = FileUploader::uploadBase64($input['logo_base64'], 'logo_');
        }

        $id = Team::create($input);
        $team = Team::findById($id);

        Response::json([
            "status" => "success",
            "message" => "Team registered successfully",
            "data" => $team,
            "id" => $id
        ], 201);
    }

    public function update(): void {
        $input = Validator::getJsonInput();
        $id = $_GET['id'] ?? ($input['id'] ?? null);

        if (empty($id)) {
            Response::error("Team ID is required for update", 400);
        }

        if (!empty($input['logo_base64'])) {
            $input['logo_url'] = FileUploader::uploadBase64($input['logo_base64'], 'logo_');
        }

        $updated = Team::update($id, $input);
        if (!$updated) {
            Response::error("Failed to update team or no changes made", 400);
        }

        $team = Team::findById($id);
        Response::json([
            "status" => "success",
            "message" => "Team updated successfully",
            "data" => $team
        ]);
    }

    public function destroy(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Team ID is required for deletion", 400);
        }

        $deleted = Team::delete($id);
        if (!$deleted) {
            Response::error("Failed to delete team", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Team deleted successfully"
        ]);
    }
}
