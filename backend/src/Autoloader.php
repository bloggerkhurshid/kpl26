<?php
namespace Kpl;

/**
 * PSR-4 Autoloader for KPL Backend Architecture
 */
class Autoloader {

    public static function register(): void {
        spl_autoload_register(function ($class) {
            $prefix = 'Kpl\\';
            $base_dir = __DIR__ . '/';

            $len = strlen($prefix);
            if (strncmp($prefix, $class, $len) !== 0) {
                return;
            }

            $relative_class = substr($class, $len);
            $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

            if (file_exists($file)) {
                require_once $file;
            }
        });
    }
}

// Register autoloader immediately upon inclusion
Autoloader::register();
