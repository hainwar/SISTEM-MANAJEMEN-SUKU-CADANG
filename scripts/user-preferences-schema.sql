-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'light',
  language ENUM('id', 'en') DEFAULT 'id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_preferences (user_id)
);

-- Insert default preferences for existing users
INSERT IGNORE INTO user_preferences (user_id, theme_mode, language, created_at, updated_at)
SELECT 
  CAST(id AS CHAR) as user_id,
  'light' as theme_mode,
  'id' as language,
  NOW() as created_at,
  NOW() as updated_at
FROM users 
WHERE is_active = 1;

-- Also add for demo token users
INSERT IGNORE INTO user_preferences (user_id, theme_mode, language, created_at, updated_at)
VALUES 
  ('1', 'light', 'id', NOW(), NOW()),
  ('2', 'light', 'id', NOW(), NOW()),
  ('3', 'light', 'id', NOW(), NOW());
