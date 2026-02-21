-- 022_ensure_store_products.sql
-- Ensure store_products table exists with all required columns

CREATE TABLE IF NOT EXISTS store_products (
    id CHAR(36) PRIMARY KEY,
    ingredient_id CHAR(36),
    store_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10,2),
    sale_end_date DATE DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    url VARCHAR(500),
    INDEX idx_store_products_store (store_name),
    INDEX idx_store_products_sale (on_sale),
    INDEX idx_store_products_scraped (last_scraped),
    INDEX idx_store_products_name (product_name)
);
