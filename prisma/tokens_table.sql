-- JWT Tokens Table for storing user authentication tokens
CREATE TABLE `tokens` (
  `s_no` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT NULL,
  `token_type` VARCHAR(20) DEFAULT 'Bearer',
  `expires_at` DATETIME NOT NULL,
  `refresh_expires_at` DATETIME NULL,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `revoked_at` DATETIME NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `device_info` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_used_at` DATETIME NULL,
  PRIMARY KEY (`s_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_access_token` (`access_token`(255)),
  INDEX `idx_refresh_token` (`refresh_token`(255)),
  INDEX `idx_is_revoked` (`is_revoked`),
  INDEX `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`s_no`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE `tokens` COMMENT = 'Stores JWT authentication tokens for users';
