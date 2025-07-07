-- Database Schema untuk Al-Amin Raoe Motor
-- Sistem Manajemen Suku Cadang

-- Tabel Users (Admin, Gudang, Pimpinan)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'gudang', 'pimpinan') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Suku Cadang
CREATE TABLE spare_parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    lead_time INT NOT NULL DEFAULT 7, -- dalam hari
    rop INT NOT NULL DEFAULT 0, -- Reorder Point
    daily_demand DECIMAL(8,2) DEFAULT 0, -- rata-rata permintaan harian
    location VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Log Permintaan Harian
CREATE TABLE daily_demand_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    spare_part_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jumlah INT NOT NULL,
    keterangan VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_demand_per_day (spare_part_id, tanggal)
);

-- Tabel Pergerakan Stok
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    spare_part_id INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    quantity INT NOT NULL,
    reason ENUM('purchase', 'service', 'correction', 'damaged', 'lost', 'return') NOT NULL,
    reference_number VARCHAR(100),
    supplier VARCHAR(100),
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabel Notifikasi
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('low_stock', 'reorder_point', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    spare_part_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel Pengaturan Sistem
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Tabel Audit Log
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default admin user
INSERT INTO users (username, email, password, role, full_name) VALUES 
('admin', 'admin@alaminaroe.com', '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu', 'admin', 'Administrator');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES 
('default_lead_time', '7', 'Default lead time dalam hari'),
('rop_calculation_days', '30', 'Jumlah hari untuk perhitungan ROP'),
('low_stock_threshold', '5', 'Threshold minimum stok'),
('company_name', 'Al-Amin Raoe Motor', 'Nama perusahaan'),
('theme_mode', 'light', 'Mode tampilan aplikasi');
