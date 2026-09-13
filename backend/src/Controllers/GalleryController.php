<?php
namespace Kpl\Controllers;

use Kpl\Models\Gallery;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;

/**
 * Controller handling Photo Gallery (Supports single & multi photo upload)
 */
class GalleryController {

    public function index(): void {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
        $photos = Gallery::all($limit);
        Response::json($photos);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        // Support array of photos or single photo
        $photosToProcess = [];

        if (isset($input['photos']) && is_array($input['photos'])) {
            $photosToProcess = $input['photos'];
        } elseif (!empty($input['photo_url'])) {
            $photosToProcess[] = ['photo_url' => $input['photo_url']];
        } elseif (!empty($input['photo_base64'])) {
            $photosToProcess[] = ['photo_base64' => $input['photo_base64']];
        }

        if (empty($photosToProcess)) {
            Response::error("No photo data provided", 400);
        }

        $createdIds = [];
        foreach ($photosToProcess as $item) {
            $photoUrl = null;
            if (is_array($item)) {
                if (!empty($item['photo_base64'])) {
                    $photoUrl = FileUploader::uploadBase64($item['photo_base64'], 'gallery_');
                } elseif (!empty($item['photo_url'])) {
                    $photoUrl = trim($item['photo_url']);
                }
            } elseif (is_string($item)) {
                if (strpos($item, 'data:image/') === 0) {
                    $photoUrl = FileUploader::uploadBase64($item, 'gallery_');
                } else {
                    $photoUrl = trim($item);
                }
            }

            if (!empty($photoUrl)) {
                $createdIds[] = Gallery::create($photoUrl);
            }
        }

        if (empty($createdIds)) {
            Response::error("Failed to process photo uploads", 400);
        }

        Response::json([
            "status" => "success",
            "message" => count($createdIds) . " photo(s) uploaded successfully",
            "ids" => $createdIds
        ], 201);
    }

    public function destroy(): void {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if (empty($id)) {
            Response::error("Gallery photo ID is required for deletion", 400);
        }

        $deleted = Gallery::delete($id);
        if (!$deleted) {
            Response::error("Failed to delete gallery photo", 400);
        }

        Response::json([
            "status" => "success",
            "message" => "Gallery photo deleted successfully"
        ]);
    }
}
