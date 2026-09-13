<?php
namespace Kpl\Controllers;

use Kpl\Models\User;
use Kpl\Utils\Response;
use Kpl\Utils\Validator;

/**
 * Controller handling authentication
 */
class AuthController {

    public function login(): void {
        $input = Validator::getJsonInput();
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            Response::error("Username and password are required", 400);
        }

        if (User::authenticate($username, $password)) {
            $token = bin2hex(random_bytes(32));
            Response::json([
                "status" => "success",
                "message" => "Authentication successful",
                "token" => $token,
                "user" => [
                    "username" => $username,
                    "role" => "admin"
                ]
            ]);
        } else {
            Response::error("Invalid username or password", 401);
        }
    }
}
