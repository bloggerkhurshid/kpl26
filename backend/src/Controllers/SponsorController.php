<?php
namespace Kpl\Controllers;

use Kpl\Models\Sponsor;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Kpl\Utils\FileUploader;
use Throwable;

/**
 * Controller handling Sponsor CRUD endpoints
 */
class SponsorController {

    public function index(): void {
        try {
            $status = $_GET['status'] ?? null;
            $sponsors = Sponsor::all($status);

            // Format output for frontend compatibility
            $formatted = array_map(function($s) {
                return [
                    'id' => $s['id'],
                    'name' => $s['name'],
                    'tier' => $s['tier'],
                    'tierBadgeColor' => $s['tier_badge_color'] ?: '#22c55e',
                    'logo' => $s['logo_url'],
                    'description' => $s['description'],
                    'highlight' => $s['highlight'] ?: '',
                    'website' => $s['website'] ?: '',
                    'display_order' => (int)($s['display_order'] ?? 0),
                    'status' => $s['status'] ?? 'active',
                    'created_at' => $s['created_at'] ?? null,
                ];
            }, $sponsors);

            Response::json($formatted);
        } catch (Throwable $e) {
            Response::error("Failed to load sponsors: " . $e->getMessage(), 500);
        }
    }

    public function show(): void {
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            Response::error("Sponsor ID is required", 400);
        }

        $sponsor = Sponsor::findById($id);
        if (!$sponsor) {
            Response::error("Sponsor not found", 404);
        }

        Response::json([
            'id' => $sponsor['id'],
            'name' => $sponsor['name'],
            'tier' => $sponsor['tier'],
            'tierBadgeColor' => $sponsor['tier_badge_color'] ?: '#22c55e',
            'logo' => $sponsor['logo_url'],
            'description' => $sponsor['description'],
            'highlight' => $sponsor['highlight'] ?: '',
            'website' => $sponsor['website'] ?: '',
            'display_order' => (int)($sponsor['display_order'] ?? 0),
            'status' => $sponsor['status'] ?? 'active',
            'created_at' => $sponsor['created_at'] ?? null,
        ]);
    }

    public function store(): void {
        try {
            $input = Validator::getJsonInput();

            if (empty($input['name'])) {
                Response::error("Sponsor name is required", 400);
            }

            // Handle base64 logo upload if provided
            $logoInput = $input['logo_base64'] ?? ($input['logo'] ?? '');
            if (!empty($logoInput) && str_starts_with($logoInput, 'data:')) {
                $input['logo_url'] = FileUploader::uploadBase64($logoInput, 'photos');
            } else {
                $input['logo_url'] = $input['logo'] ?? '';
            }

            $id = Sponsor::create($input);
            $newSponsor = Sponsor::findById($id);

            Response::json([
                "status" => "success",
                "message" => "Sponsor added successfully",
                "data" => [
                    'id' => $newSponsor['id'],
                    'name' => $newSponsor['name'],
                    'tier' => $newSponsor['tier'],
                    'tierBadgeColor' => $newSponsor['tier_badge_color'] ?: '#22c55e',
                    'logo' => $newSponsor['logo_url'],
                    'description' => $newSponsor['description'],
                    'highlight' => $newSponsor['highlight'] ?: '',
                    'website' => $newSponsor['website'] ?: '',
                ]
            ], 201);
        } catch (Throwable $e) {
            Response::error("Failed to create sponsor: " . $e->getMessage(), 500);
        }
    }

    public function update(): void {
        try {
            $id = $_GET['id'] ?? null;
            if (empty($id)) {
                Response::error("Sponsor ID is required", 400);
            }

            $input = Validator::getJsonInput();

            // Handle base64 logo upload if updated
            $logoInput = $input['logo_base64'] ?? ($input['logo'] ?? '');
            if (!empty($logoInput) && str_starts_with($logoInput, 'data:')) {
                $input['logo_url'] = FileUploader::uploadBase64($logoInput, 'photos');
            }

            $success = Sponsor::update($id, $input);
            if (!$success) {
                Response::error("Failed to update sponsor or no changes made", 400);
            }

            $updated = Sponsor::findById($id);
            Response::json([
                "status" => "success",
                "message" => "Sponsor updated successfully",
                "data" => [
                    'id' => $updated['id'],
                    'name' => $updated['name'],
                    'tier' => $updated['tier'],
                    'tierBadgeColor' => $updated['tier_badge_color'] ?: '#22c55e',
                    'logo' => $updated['logo_url'],
                    'description' => $updated['description'],
                    'highlight' => $updated['highlight'] ?: '',
                    'website' => $updated['website'] ?: '',
                ]
            ]);
        } catch (Throwable $e) {
            Response::error("Failed to update sponsor: " . $e->getMessage(), 500);
        }
    }

    public function destroy(): void {
        try {
            $id = $_GET['id'] ?? null;
            if (empty($id)) {
                Response::error("Sponsor ID is required", 400);
            }

            $success = Sponsor::delete($id);
            if (!$success) {
                Response::error("Failed to delete sponsor", 500);
            }

            Response::json([
                "status" => "success",
                "message" => "Sponsor removed successfully"
            ]);
        } catch (Throwable $e) {
            Response::error("Failed to delete sponsor: " . $e->getMessage(), 500);
        }
    }
}
