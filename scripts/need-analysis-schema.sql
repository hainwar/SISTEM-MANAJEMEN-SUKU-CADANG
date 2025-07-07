-- Create daily_demand_logs table for historical tracking
CREATE TABLE IF NOT EXISTS daily_demand_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  spare_part_id INT NOT NULL,
  tanggal DATE NOT NULL,
  jumlah INT NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE,
  INDEX idx_spare_part_date (spare_part_id, tanggal),
  INDEX idx_tanggal (tanggal)
);

-- Add missing columns to spare_parts table if they don't exist
ALTER TABLE spare_parts 
ADD COLUMN IF NOT EXISTS daily_demand DECIMAL(10,2) DEFAULT 1.0 COMMENT 'Average daily demand',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether the spare part is active';

-- Update existing records to have default values
UPDATE spare_parts 
SET daily_demand = 1.0 
WHERE daily_demand IS NULL OR daily_demand = 0;

UPDATE spare_parts 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Insert sample daily demand logs for testing (last 30 days)
INSERT IGNORE INTO daily_demand_logs (spare_part_id, tanggal, jumlah, keterangan) VALUES
-- Oli Mesin (assuming spare_part_id = 1)
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 5, 'Permintaan harian oli mesin'),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 3, 'Permintaan harian oli mesin'),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 7, 'Permintaan harian oli mesin'),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 4, 'Permintaan harian oli mesin'),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 6, 'Permintaan harian oli mesin'),

-- Kampas Rem (assuming spare_part_id = 2)
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 'Permintaan kampas rem'),
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 'Permintaan kampas rem'),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 3, 'Permintaan kampas rem'),
(2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 2, 'Permintaan kampas rem'),

-- Busi (assuming spare_part_id = 3)
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 8, 'Permintaan busi'),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 6, 'Permintaan busi'),
(3, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 10, 'Permintaan busi'),
(3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 7, 'Permintaan busi'),
(3, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 9, 'Permintaan busi');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock ON spare_parts(current_stock, minimum_stock, rop);
CREATE INDEX IF NOT EXISTS idx_spare_parts_active ON spare_parts(is_active);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);

-- Create a view for easy need analysis reporting
CREATE OR REPLACE VIEW need_analysis_view AS
SELECT 
  sp.id,
  sp.code,
  sp.name,
  sp.category,
  sp.brand,
  sp.current_stock,
  sp.minimum_stock,
  sp.rop,
  sp.price,
  sp.location,
  sp.daily_demand,
  sp.lead_time,
  sp.minimum_stock as safety_stock,
  GREATEST(0, (COALESCE(sp.rop, sp.minimum_stock * 2) + sp.minimum_stock) - sp.current_stock) as recommended_quantity,
  CASE 
    WHEN sp.current_stock <= sp.minimum_stock THEN 'tinggi'
    WHEN sp.current_stock <= COALESCE(sp.rop, sp.minimum_stock * 2) THEN 'sedang'
    ELSE 'rendah'
  END as priority,
  (GREATEST(0, (COALESCE(sp.rop, sp.minimum_stock * 2) + sp.minimum_stock) - sp.current_stock) * sp.price) as estimated_cost,
  COALESCE(
    (SELECT AVG(ddl.jumlah) 
     FROM daily_demand_logs ddl 
     WHERE ddl.spare_part_id = sp.id 
     AND ddl.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ), 
    sp.daily_demand
  ) as avg_daily_demand
FROM spare_parts sp
WHERE sp.is_active = 1
HAVING recommended_quantity > 0
ORDER BY 
  CASE priority 
    WHEN 'tinggi' THEN 1 
    WHEN 'sedang' THEN 2 
    ELSE 3 
  END,
  recommended_quantity DESC;

-- Update daily_demand values based on historical data where available
UPDATE spare_parts sp
SET daily_demand = (
  SELECT COALESCE(AVG(ddl.jumlah), sp.daily_demand)
  FROM daily_demand_logs ddl
  WHERE ddl.spare_part_id = sp.id
  AND ddl.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  GROUP BY ddl.spare_part_id
)
WHERE EXISTS (
  SELECT 1 FROM daily_demand_logs ddl 
  WHERE ddl.spare_part_id = sp.id
);
