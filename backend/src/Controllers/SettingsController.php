<?php
namespace Kpl\Controllers;

use Kpl\Models\ContentSetting;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;

/**
 * Controller handling system & payment fee settings
 */
class SettingsController {

    public function index(): void {
        $settings = ContentSetting::getFeeSettings();
        Response::json($settings);
    }

    public function store(): void {
        $input = Validator::getJsonInput();

        if (empty($input)) {
            Response::error("No settings provided", 400);
        }

        ContentSetting::saveMultiple($input);

        Response::json([
            "status" => "success",
            "message" => "Settings saved successfully"
        ]);
    }
}
