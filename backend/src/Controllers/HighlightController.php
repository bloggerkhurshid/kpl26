<?php
namespace Kpl\Controllers;

use Kpl\Models\Highlight;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;

/**
 * Controller handling highlight endpoints
 */
class HighlightController {

    public function index(): void {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $items = Highlight::all($limit);
        Response::json($items);
    }

    public function store(): void {
        $input = Validator::getJsonInput();
        $title = trim($input['title'] ?? '');
        $imageUrl = $input['image_url'] ?? ($input['image'] ?? '');

        if (empty($title) || empty($imageUrl)) {
            Response::error("Title and image URL are required", 400);
        }

        $id = Highlight::create($input);

        Response::json([
            "status" => "success",
            "message" => "Highlight created successfully",
            "id" => $id
        ], 201);
    }

    public function update(): void {
        $input = Validator::getJsonInput();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);

        if (empty($id)) {
            Response::error("Highlight ID is required for update", 400);
        }

        $updated = Highlight::update($id, $input);
        if (!$updated) {
            Response::error("Failed to update highlight", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Highlight updated successfully"
        ]);
    }

    public function destroy(): void {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if (empty($id)) {
            Response::error("Highlight ID is required for deletion", 400);
        }

        $deleted = Highlight::delete($id);
        if (!$deleted) {
            Response::error("Failed to delete highlight", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Highlight deleted successfully"
        ]);
    }
}
