<?php
namespace Kpl\Controllers;

use Kpl\Models\ContentSetting;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;

/**
 * Controller handling website content settings
 */
class ContentController {

    public function index(): void {
        $settings = ContentSetting::getContentSettings();
        Response::json($settings);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        if (empty($input)) {
            Response::error("No content settings provided", 400);
        }

        ContentSetting::saveMultiple($input);

        Response::json([
            "status" => "success",
            "message" => "Content settings updated successfully"
        ]);
    }
}
