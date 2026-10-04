<?php
/**
 * Application Constants & Configuration
 * Khoraghat Premier League (KPL) Enterprise PHP Backend
 */

return [
    'app_name' => 'KPL Khoraghat Premier League API',
    'app_env' => getenv('APP_ENV') ?: 'production',
    'app_version' => '2.0.0',
    'base_url' => getenv('APP_URL') ?: 'http://localhost:8000',
    'upload_dir' => __DIR__ . '/../uploads',
    'max_upload_size' => 10 * 1024 * 1024, // 10MB
    'jwt_secret' => getenv('JWT_SECRET') ?: 'kpl_secret_key_2026_sports_league',
];
