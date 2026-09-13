-- ============================================================
-- KPL (Khoraghat Premier League) - MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: teams
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teams` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `short_code` VARCHAR(20) NOT NULL,
  `owner_name` VARCHAR(255) DEFAULT '',
  `owner_contact` VARCHAR(50) DEFAULT '',
  `accent_color` VARCHAR(30) DEFAULT '#22c55e',
  `logo_url` LONGTEXT DEFAULT NULL,
  `squad_limit` INT DEFAULT 15,
  `budget` DECIMAL(12, 2) DEFAULT 100000.00,
  `spent` DECIMAL(12, 2) DEFAULT 0.00,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: players
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `players` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `player_name` VARCHAR(255) NOT NULL,
  `father_name` VARCHAR(255) DEFAULT '',
  `date_of_birth` DATE DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `present_address` TEXT DEFAULT NULL,
  `address_proof` LONGTEXT DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'Batsman',
  `contact_number` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `photo` LONGTEXT DEFAULT NULL,
  `batsman` TINYINT(1) DEFAULT 0,
  `batting_hand` VARCHAR(50) DEFAULT NULL,
  `wicket_keeper` TINYINT(1) DEFAULT 0,
  `player_category` VARCHAR(50) DEFAULT 'local',
  `previously_played` TINYINT(1) DEFAULT 0,
  `all_rounder` TINYINT(1) DEFAULT 0,
  `bowler` TINYINT(1) DEFAULT 0,
  `bowling_type` VARCHAR(100) DEFAULT NULL,
  `player_signature` LONGTEXT DEFAULT NULL,
  `declaration_accepted` TINYINT(1) DEFAULT 0,
  `approval` VARCHAR(20) DEFAULT 'pending',
  `registration_number` VARCHAR(100) DEFAULT NULL,
  `registered_by` VARCHAR(50) DEFAULT 'self',
  `team_id` VARCHAR(36) DEFAULT NULL,
  `auction_eligible` TINYINT(1) DEFAULT 1,
  `base_price` DECIMAL(10, 2) DEFAULT 500.00,
  `sold_price` DECIMAL(10, 2) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_players_status` (`status`),
  INDEX `idx_players_team` (`team_id`),
  CONSTRAINT `fk_players_teams` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: highlights (Gallery items)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `highlights` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image_url` LONGTEXT NOT NULL,
  `size` VARCHAR(50) DEFAULT 'normal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: content_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `content_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `registration_type` VARCHAR(50) NOT NULL,
  `registration_id` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_gateway` VARCHAR(50) DEFAULT 'razorpay',
  `payment_id` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: team_registrations (Pending self registrations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `team_registrations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `team_name` VARCHAR(255) NOT NULL,
  `owner_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `city` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(20) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: player_registrations (Pending self registrations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `player_registrations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `player_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'local',
  `status` VARCHAR(20) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: admin_users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: management (Executive Committee / Management Board)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `management` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `designation` VARCHAR(255) NOT NULL,
  `contact` VARCHAR(100) DEFAULT '',
  `photo_url` LONGTEXT DEFAULT NULL,
  `display_order` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: gallery (Photo Gallery without captions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gallery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `photo_url` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Default Seed Data
-- ------------------------------------------------------------

-- Default Admin User (username: admin, password: password123)
INSERT INTO `admin_users` (`username`, `password_hash`)
VALUES ('admin', '$2y$10$4.vM4z7o5x9h4G7s.9g4uOa7eN8mK7e5G4e5G4e5G4e5G4e5G4e5G')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Default Content Settings
INSERT INTO `content_settings` (`key`, `value`) VALUES
('show_hero', 'true'),
('show_stats', 'true'),
('show_about', 'true'),
('show_format', 'true'),
('show_champions', 'true'),
('show_teams', 'true'),
('show_players', 'true'),
('show_register', 'true'),
('show_highlights', 'true'),
('show_management', 'true'),
('show_gallery', 'true'),
('hero_title', 'Where local legends become <em>champions.</em>'),
('hero_subtitle', 'Assam\'s premier hard tennis ball cricket championship. Eight franchises. One unforgettable summer.'),
('about_title', 'A different kind of cricket.'),
('about_text', 'KPL is more than a tournament. It is where the region\'s fearless players find their stage, where rivalries become traditions, and every over writes a new story.\n\nBringing together Khoraghat\'s finest talent in a franchise-based format, the league delivers fast, competitive hard tennis ball cricket with the energy of a packed stadium and the heart of Assam.'),
('format_title', 'The format'),
('format_subtitle', 'Short, intense and built for heroes.\nEvery match carries the weight of a season.'),
('deadline_date', ''),
('deadline_text', 'Secure your franchise or player spot before the registration closes.'),
('fee_player', '500'),
('fee_foreign_player', '1000'),
('fee_team', '5000'),
('active_gateway', 'razorpay')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

SET FOREIGN_KEY_CHECKS = 1;

