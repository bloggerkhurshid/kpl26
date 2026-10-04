<?php
namespace Kpl\Controllers;

use Kpl\Models\Management;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;

/**
 * Controller handling Management personnel CRUD
 */
class ManagementController {

    public function index(): void {
        $status = $_GET['status'] ?? null;
        $members = Management::all($status);
        Response::json($members);
    }

    public function show(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Management member ID is required", 400);
        }

        $member = Management::findById($id);
        if (!$member) {
            Response::error("Management member not found", 404);
        }

        Response::json($member);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        if (empty($input['name']) || empty($input['designation'])) {
            Response::error("Name and designation are required", 400);
        }

        if (!empty($input['photo_base64'])) {
            $input['photo_url'] = FileUploader::uploadBase64($input['photo_base64'], 'mgmt_');
        }

        $id = Management::create($input);
        $member = Management::findById($id);

        Response::json([
            "status" => "success",
            "message" => "Management member created successfully",
            "data" => $member,
            "id" => $id
        ], 201);
    }

    public function update(): void {
        $input = Validator::getJsonInput();
        $id = $_GET['id'] ?? ($input['id'] ?? null);

        if (empty($id)) {
            Response::error("Management member ID is required for update", 400);
        }

        if (!empty($input['photo_base64'])) {
            $input['photo_url'] = FileUploader::uploadBase64($input['photo_base64'], 'mgmt_');
        }

        $updated = Management::update($id, $input);
        if (!$updated) {
            Response::error("Failed to update management member or no change made", 400);
        }

        $member = Management::findById($id);
        Response::json([
            "status" => "success",
            "message" => "Management member updated successfully",
            "data" => $member
        ]);
    }

    public function destroy(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Management member ID is required for deletion", 400);
        }

        $deleted = Management::delete($id);
        if (!$deleted) {
            Response::error("Failed to delete management member", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Management member deleted successfully"
        ]);
    }
}
