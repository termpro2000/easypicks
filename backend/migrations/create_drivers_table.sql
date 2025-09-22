-- Create drivers table if not exists
CREATE TABLE IF NOT EXISTS drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(20),
  license_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_name (name),
  INDEX idx_phone (phone),
  INDEX idx_vehicle_number (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add some sample data (optional)
-- INSERT INTO drivers (username, password, name, phone, vehicle_type, vehicle_number) 
-- VALUES 
-- ('driver1', 'password123', '김기사', '010-1234-5678', '1톤 트럭', '12가3456'),
-- ('driver2', 'password123', '이기사', '010-2345-6789', '2.5톤 트럭', '23나4567'),
-- ('driver3', 'password123', '박기사', '010-3456-7890', '오토바이', '34다5678');