<?php
namespace Kpl\Controllers;

use Kpl\Models\Gallery;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;
use Throwable;

/**
 * Controller handling Photo Gallery (Supports single & multi photo upload)
 */
class GalleryController {

    public function index(): void {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
            $photos = Gallery::all($limit);
            Response::json($photos);
        } catch (Throwable $e) {
            Response::error("Database query failed: " . $e->getMessage(), 500);
        }
    }

    public function store(): void {
        try {
            $input = Validator::getJsonInput();

            // Support array of photos or single photo
            $photosToProcess = [];

            if (isset($input['photos']) && is_array($input['photos'])) {
                $photosToProcess = $input['photos'];
            } elseif (!empty($input['photo_url'])) {
                $photosToProcess[] = $input['photo_url'];
            } elseif (!empty($input['photo_base64'])) {
                $photosToProcess[] = $input['photo_base64'];
            } elseif (!empty($input['image_url'])) {
                $photosToProcess[] = $input['image_url'];
            } elseif (!empty($input['photo'])) {
                $photosToProcess[] = $input['photo'];
            }

            if (empty($photosToProcess)) {
                Response::error("No photo data provided", 400);
            }

            $createdIds = [];
            foreach ($photosToProcess as $item) {
                $rawPhoto = '';
                if (is_array($item)) {
                    $rawPhoto = $item['photo_base64'] ?? $item['photo_url'] ?? $item['image_url'] ?? $item['photo'] ?? '';
                } elseif (is_string($item)) {
                    $rawPhoto = $item;
                }

                if (!empty($rawPhoto)) {
                    $photoUrl = FileUploader::uploadBase64($rawPhoto, 'gallery');
                    if (!empty($photoUrl)) {
                        $createdIds[] = Gallery::create($photoUrl);
                    }
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
        } catch (Throwable $e) {
            Response::error("Gallery upload failed: " . $e->getMessage(), 500);
        }
    }

    public function destroy(): void {
        try {
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
        } catch (Throwable $e) {
            Response::error("Gallery deletion error: " . $e->getMessage(), 500);
        }
    }
}
