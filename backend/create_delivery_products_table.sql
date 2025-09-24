-- SQL script to create delivery_products table with extended fields
-- This needs to be run by someone with DDL permissions on the PlanetScale database

CREATE TABLE IF NOT EXISTS delivery_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  delivery_id INT NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  product_weight VARCHAR(20),  -- 제품무게 (예: "50kg")
  total_weight VARCHAR(20),    -- 전체무게 (예: "100kg") 
  product_size VARCHAR(50),    -- 제품크기 (예: "1200x800x600mm")
  box_size VARCHAR(50),        -- 박스크기 (예: "1300x900x700mm")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_delivery_id (delivery_id),
  INDEX idx_product_code (product_code)
);

-- Add some test data for verification
INSERT INTO delivery_products (delivery_id, product_code, product_weight, total_weight, product_size, box_size) VALUES
(1, 'PROD001', '50kg', '100kg', '1200x800x600mm', '1300x900x700mm'),
(1, 'PROD002', '30kg', '60kg', '800x600x400mm', '900x700x500mm'),
(2, 'PROD003', '75kg', '150kg', '1500x1000x800mm', '1600x1100x900mm');

-- Verify table creation
DESCRIBE delivery_products;
SELECT COUNT(*) as total_records FROM delivery_products;