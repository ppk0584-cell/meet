-- Database Schema for Smart Butchery System

CREATE DATABASE IF NOT EXISTS meat_shop;
USE meat_shop;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- Beef, Pork, etc.
    part VARCHAR(100), -- Sirloin, Rib, etc.
    grade VARCHAR(50), -- 1++, 1+, etc.
    origin VARCHAR(100) DEFAULT '국내산',
    price_per_100g INT NOT NULL,
    price_regular INT,
    price_basic_member INT,
    price_prepaid_member INT,
    price_subscription_member INT,
    stock_quantity DECIMAL(10, 2) DEFAULT 0, -- Store in kg
    slaughter_date DATE,
    trace_number VARCHAR(50), -- 이력번호
    usage_category VARCHAR(100), -- boss_pick, home_party, kid, fitness, etc.
    tags TEXT, -- JSON or Comma separated tags
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Custom Options (e.g., thickness in mm)
CREATE TABLE IF NOT EXISTS product_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    option_name VARCHAR(100), -- 예: 두께
    option_value VARCHAR(50), -- 예: 2mm, 5mm
    extra_price INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product display/category mapping.
-- One product can belong to multiple menus and multiple category groups.
CREATE TABLE IF NOT EXISTS product_display_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    group_code VARCHAR(80) NOT NULL, -- menu_section, boss_pick_type, meat_type, situation, cooking_use, family_table
    category_code VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_product_display_category (product_id, group_code, category_code),
    INDEX idx_display_group_category (group_code, category_code),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    recipe_title VARCHAR(255) NOT NULL,
    ingredients TEXT,
    cooking_steps TEXT,
    video_url VARCHAR(500),
    plating_image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_recipes_product_id (product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(255),
    name VARCHAR(100),
    phone VARCHAR(20),
    telegram_id VARCHAR(100),
    membership_type ENUM('basic', 'prepaid', 'subscription') DEFAULT 'basic',
    preferred_meat VARCHAR(50),
    shopping_style VARCHAR(50),
    visit_time VARCHAR(50),
    marketing_agree BOOLEAN DEFAULT FALSE,
    memo TEXT,
    balance INT DEFAULT 0, -- For Prepaid
    subscription_status VARCHAR(20), -- For Subscription
    tier VARCHAR(50) DEFAULT '입석', -- 입석, ..., 채끝
    points INT DEFAULT 0,
    telegram_benefit_applied BOOLEAN DEFAULT FALSE, -- 텔레그램 가입 혜택 부여 여부
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Benefits Settings
CREATE TABLE IF NOT EXISTS membership_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'prepaid', 'subscription'
    benefit_description TEXT,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    reward_rate DECIMAL(5,2) DEFAULT 0,
    monthly_fee INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO membership_settings (type, benefit_description, discount_rate, reward_rate) 
VALUES ('prepaid', '충전 금액의 5% 추가 적립, 전 상품 3% 할인', 3.0, 5.0);

INSERT INTO membership_settings (type, benefit_description, discount_rate, monthly_fee) 
VALUES ('subscription', '월 9,900원 멤버십: 전 상품 10% 파격 할인', 10.0, 9900);
