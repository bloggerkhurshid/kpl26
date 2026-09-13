<?php
namespace Kpl\Controllers;

use Kpl\Models\ContentSetting;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;
use Throwable;

/**
 * Controller handling website content settings
 */
class ContentController {

    public function index(): void {
        try {
            $settings = ContentSetting::getContentSettings();
            Response::json($settings);
        } catch (Throwable $e) {
            Response::error("Failed to load content settings: " . $e->getMessage(), 500);
        }
    }

    public function store(): void {
        try {
            $input = Validator::getJsonInput();

            if (empty($input)) {
                Response::error("No content settings provided", 400);
            }

            // Extract nested 'content' key if present
            if (isset($input['content']) && is_array($input['content'])) {
                $input = $input['content'];
            }

            ContentSetting::saveMultiple($input);

            Response::json([
                "status" => "success",
                "message" => "Content settings updated successfully"
            ]);
        } catch (Throwable $e) {
            Response::error("Failed to save content settings: " . $e->getMessage(), 500);
        }
    }
}
