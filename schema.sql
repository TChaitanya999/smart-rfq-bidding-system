CREATE DATABASE IF NOT EXISTS british_auction;
USE british_auction;

CREATE TABLE IF NOT EXISTS rfqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    bid_start_time DATETIME NOT NULL,
    bid_close_time DATETIME NOT NULL,
    forced_close_time DATETIME NOT NULL,
    pickup_date DATE NOT NULL,
    status ENUM('Active', 'Closed', 'Force Closed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    supplier_id INT NOT NULL,
    freight_charges DECIMAL(15, 2) NOT NULL,
    origin_charges DECIMAL(15, 2) NOT NULL,
    destination_charges DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    transit_time VARCHAR(50),
    quote_validity DATETIME,
    bid_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    INDEX idx_rfq_price (rfq_id, total_amount)
);

CREATE TABLE IF NOT EXISTS auction_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT UNIQUE NOT NULL,
    trigger_window_mins INT DEFAULT 5,
    extension_duration_mins INT DEFAULT 10,
    trigger_bid_received BOOLEAN DEFAULT TRUE,
    trigger_rank_change BOOLEAN DEFAULT TRUE,
    trigger_l1_change BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    supplier_id INT NULL,
    action VARCHAR(100) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

INSERT INTO suppliers (name, email) VALUES 
('Supplier A', 'supplierA@example.com'),
('Supplier B', 'supplierB@example.com'),
('Supplier C', 'supplierC@example.com');
