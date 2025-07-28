-- Migration: Seed Device Data
-- Description: Populate device database with popular models from 2016-2025
-- Created: 2025-07-13

-- Helper function to generate device slug
CREATE OR REPLACE FUNCTION generate_device_slug(brand_name TEXT, model_name TEXT, year_val INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REPLACE(brand_name || '-' || model_name || '-' || year_val::TEXT, ' ', '-'));
END;
$$ LANGUAGE plpgsql;

-- Insert Apple iPhones (2016-2025)
DO $$
DECLARE
    apple_id UUID;
    smartphone_id UUID;
    screen_issue_id UUID;
    battery_issue_id UUID;
    charging_issue_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO apple_id FROM device_brands WHERE slug = 'apple';
    SELECT id INTO smartphone_id FROM device_categories WHERE slug = 'smartphones';
    SELECT id INTO screen_issue_id FROM device_issues WHERE slug = 'cracked-screen';
    SELECT id INTO battery_issue_id FROM device_issues WHERE slug = 'battery-drain';
    SELECT id INTO charging_issue_id FROM device_issues WHERE slug = 'charging-port';
    
    -- iPhone 7 Series (2016)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 7', 'A1660', 2016, 'Apple iPhone 7', 'apple-iphone-7-2016', 
     '{"screen": "4.7 inch", "storage": ["32GB", "128GB", "256GB"], "cpu": "A10 Bionic", "camera": "12MP", "battery": "1960 mAh"}', 7, 45),
    (smartphone_id, apple_id, 'iPhone 7 Plus', 'A1661', 2016, 'Apple iPhone 7 Plus', 'apple-iphone-7-plus-2016',
     '{"screen": "5.5 inch", "storage": ["32GB", "128GB", "256GB"], "cpu": "A10 Bionic", "camera": "Dual 12MP", "battery": "2900 mAh"}', 7, 60);

    -- iPhone 8 Series (2017)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 8', 'A1863', 2017, 'Apple iPhone 8', 'apple-iphone-8-2017',
     '{"screen": "4.7 inch", "storage": ["64GB", "256GB"], "cpu": "A11 Bionic", "camera": "12MP", "battery": "1821 mAh"}', 6, 45),
    (smartphone_id, apple_id, 'iPhone 8 Plus', 'A1864', 2017, 'Apple iPhone 8 Plus', 'apple-iphone-8-plus-2017',
     '{"screen": "5.5 inch", "storage": ["64GB", "256GB"], "cpu": "A11 Bionic", "camera": "Dual 12MP", "battery": "2691 mAh"}', 6, 60),
    (smartphone_id, apple_id, 'iPhone X', 'A1865', 2017, 'Apple iPhone X', 'apple-iphone-x-2017',
     '{"screen": "5.8 inch OLED", "storage": ["64GB", "256GB"], "cpu": "A11 Bionic", "camera": "Dual 12MP", "battery": "2716 mAh"}', 6, 75);

    -- iPhone XS Series (2018)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone XS', 'A1920', 2018, 'Apple iPhone XS', 'apple-iphone-xs-2018',
     '{"screen": "5.8 inch OLED", "storage": ["64GB", "256GB", "512GB"], "cpu": "A12 Bionic", "camera": "Dual 12MP", "battery": "2658 mAh"}', 6, 75),
    (smartphone_id, apple_id, 'iPhone XS Max', 'A1921', 2018, 'Apple iPhone XS Max', 'apple-iphone-xs-max-2018',
     '{"screen": "6.5 inch OLED", "storage": ["64GB", "256GB", "512GB"], "cpu": "A12 Bionic", "camera": "Dual 12MP", "battery": "3174 mAh"}', 6, 90),
    (smartphone_id, apple_id, 'iPhone XR', 'A1984', 2018, 'Apple iPhone XR', 'apple-iphone-xr-2018',
     '{"screen": "6.1 inch LCD", "storage": ["64GB", "128GB", "256GB"], "cpu": "A12 Bionic", "camera": "12MP", "battery": "2942 mAh"}', 6, 60);

    -- iPhone 11 Series (2019)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 11', 'A2111', 2019, 'Apple iPhone 11', 'apple-iphone-11-2019',
     '{"screen": "6.1 inch LCD", "storage": ["64GB", "128GB", "256GB"], "cpu": "A13 Bionic", "camera": "Dual 12MP", "battery": "3110 mAh"}', 6, 60),
    (smartphone_id, apple_id, 'iPhone 11 Pro', 'A2160', 2019, 'Apple iPhone 11 Pro', 'apple-iphone-11-pro-2019',
     '{"screen": "5.8 inch OLED", "storage": ["64GB", "256GB", "512GB"], "cpu": "A13 Bionic", "camera": "Triple 12MP", "battery": "3046 mAh"}', 4, 90),
    (smartphone_id, apple_id, 'iPhone 11 Pro Max', 'A2161', 2019, 'Apple iPhone 11 Pro Max', 'apple-iphone-11-pro-max-2019',
     '{"screen": "6.5 inch OLED", "storage": ["64GB", "256GB", "512GB"], "cpu": "A13 Bionic", "camera": "Triple 12MP", "battery": "3969 mAh"}', 4, 90);

    -- iPhone 12 Series (2020)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 12 mini', 'A2172', 2020, 'Apple iPhone 12 mini', 'apple-iphone-12-mini-2020',
     '{"screen": "5.4 inch OLED", "storage": ["64GB", "128GB", "256GB"], "cpu": "A14 Bionic", "camera": "Dual 12MP", "battery": "2227 mAh", "5G": true}', 6, 60),
    (smartphone_id, apple_id, 'iPhone 12', 'A2172', 2020, 'Apple iPhone 12', 'apple-iphone-12-2020',
     '{"screen": "6.1 inch OLED", "storage": ["64GB", "128GB", "256GB"], "cpu": "A14 Bionic", "camera": "Dual 12MP", "battery": "2815 mAh", "5G": true}', 6, 60),
    (smartphone_id, apple_id, 'iPhone 12 Pro', 'A2341', 2020, 'Apple iPhone 12 Pro', 'apple-iphone-12-pro-2020',
     '{"screen": "6.1 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A14 Bionic", "camera": "Triple 12MP + LiDAR", "battery": "2815 mAh", "5G": true}', 6, 90),
    (smartphone_id, apple_id, 'iPhone 12 Pro Max', 'A2342', 2020, 'Apple iPhone 12 Pro Max', 'apple-iphone-12-pro-max-2020',
     '{"screen": "6.7 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A14 Bionic", "camera": "Triple 12MP + LiDAR", "battery": "3687 mAh", "5G": true}', 6, 90);

    -- iPhone 13 Series (2021)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 13 mini', 'A2481', 2021, 'Apple iPhone 13 mini', 'apple-iphone-13-mini-2021',
     '{"screen": "5.4 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A15 Bionic", "camera": "Dual 12MP", "battery": "2438 mAh", "5G": true}', 5, 75),
    (smartphone_id, apple_id, 'iPhone 13', 'A2482', 2021, 'Apple iPhone 13', 'apple-iphone-13-2021',
     '{"screen": "6.1 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A15 Bionic", "camera": "Dual 12MP", "battery": "3240 mAh", "5G": true}', 5, 75),
    (smartphone_id, apple_id, 'iPhone 13 Pro', 'A2483', 2021, 'Apple iPhone 13 Pro', 'apple-iphone-13-pro-2021',
     '{"screen": "6.1 inch OLED ProMotion", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "A15 Bionic", "camera": "Triple 12MP + LiDAR", "battery": "3095 mAh", "5G": true}', 5, 90),
    (smartphone_id, apple_id, 'iPhone 13 Pro Max', 'A2484', 2021, 'Apple iPhone 13 Pro Max', 'apple-iphone-13-pro-max-2021',
     '{"screen": "6.7 inch OLED ProMotion", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "A15 Bionic", "camera": "Triple 12MP + LiDAR", "battery": "4352 mAh", "5G": true}', 5, 90);

    -- iPhone 14 Series (2022)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 14', 'A2649', 2022, 'Apple iPhone 14', 'apple-iphone-14-2022',
     '{"screen": "6.1 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A15 Bionic", "camera": "Dual 12MP", "battery": "3279 mAh", "5G": true}', 7, 60),
    (smartphone_id, apple_id, 'iPhone 14 Plus', 'A2632', 2022, 'Apple iPhone 14 Plus', 'apple-iphone-14-plus-2022',
     '{"screen": "6.7 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A15 Bionic", "camera": "Dual 12MP", "battery": "4325 mAh", "5G": true}', 7, 75),
    (smartphone_id, apple_id, 'iPhone 14 Pro', 'A2650', 2022, 'Apple iPhone 14 Pro', 'apple-iphone-14-pro-2022',
     '{"screen": "6.1 inch OLED ProMotion", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "A16 Bionic", "camera": "Triple 48MP + LiDAR", "battery": "3200 mAh", "5G": true, "dynamicIsland": true}', 7, 90),
    (smartphone_id, apple_id, 'iPhone 14 Pro Max', 'A2651', 2022, 'Apple iPhone 14 Pro Max', 'apple-iphone-14-pro-max-2022',
     '{"screen": "6.7 inch OLED ProMotion", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "A16 Bionic", "camera": "Triple 48MP + LiDAR", "battery": "4323 mAh", "5G": true, "dynamicIsland": true}', 7, 90);

    -- iPhone 15 Series (2023)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (smartphone_id, apple_id, 'iPhone 15', 'A2846', 2023, 'Apple iPhone 15', 'apple-iphone-15-2023',
     '{"screen": "6.1 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A16 Bionic", "camera": "Dual 48MP", "battery": "3349 mAh", "5G": true, "usbc": true, "dynamicIsland": true}', 8, 60, 95),
    (smartphone_id, apple_id, 'iPhone 15 Plus', 'A2847', 2023, 'Apple iPhone 15 Plus', 'apple-iphone-15-plus-2023',
     '{"screen": "6.7 inch OLED", "storage": ["128GB", "256GB", "512GB"], "cpu": "A16 Bionic", "camera": "Dual 48MP", "battery": "4383 mAh", "5G": true, "usbc": true, "dynamicIsland": true}', 8, 75, 85),
    (smartphone_id, apple_id, 'iPhone 15 Pro', 'A2848', 2023, 'Apple iPhone 15 Pro', 'apple-iphone-15-pro-2023',
     '{"screen": "6.1 inch OLED ProMotion", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "A17 Pro", "camera": "Triple 48MP + LiDAR", "battery": "3274 mAh", "5G": true, "usbc": true, "titanium": true, "dynamicIsland": true}', 8, 90, 100),
    (smartphone_id, apple_id, 'iPhone 15 Pro Max', 'A2849', 2023, 'Apple iPhone 15 Pro Max', 'apple-iphone-15-pro-max-2023',
     '{"screen": "6.7 inch OLED ProMotion", "storage": ["256GB", "512GB", "1TB"], "cpu": "A17 Pro", "camera": "Triple 48MP + LiDAR", "battery": "4422 mAh", "5G": true, "usbc": true, "titanium": true, "dynamicIsland": true}', 8, 90, 100);

END $$;

-- Insert Samsung Galaxy S Series (Popular Models)
DO $$
DECLARE
    samsung_id UUID;
    smartphone_id UUID;
BEGIN
    SELECT id INTO samsung_id FROM device_brands WHERE slug = 'samsung';
    SELECT id INTO smartphone_id FROM device_categories WHERE slug = 'smartphones';
    
    -- Galaxy S20 Series (2020)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, samsung_id, 'Galaxy S20', 'SM-G980F', 2020, 'Samsung Galaxy S20', 'samsung-galaxy-s20-2020',
     '{"screen": "6.2 inch AMOLED 120Hz", "storage": ["128GB"], "cpu": "Snapdragon 865", "camera": "Triple 12MP", "battery": "4000 mAh", "5G": true}', 4, 90),
    (smartphone_id, samsung_id, 'Galaxy S20+', 'SM-G985F', 2020, 'Samsung Galaxy S20+', 'samsung-galaxy-s20-plus-2020',
     '{"screen": "6.7 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 865", "camera": "Quad 12MP", "battery": "4500 mAh", "5G": true}', 4, 90),
    (smartphone_id, samsung_id, 'Galaxy S20 Ultra', 'SM-G988B', 2020, 'Samsung Galaxy S20 Ultra', 'samsung-galaxy-s20-ultra-2020',
     '{"screen": "6.9 inch AMOLED 120Hz", "storage": ["128GB", "256GB", "512GB"], "cpu": "Snapdragon 865", "camera": "108MP + 48MP", "battery": "5000 mAh", "5G": true}', 3, 120);

    -- Galaxy S21 Series (2021)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, samsung_id, 'Galaxy S21', 'SM-G991B', 2021, 'Samsung Galaxy S21', 'samsung-galaxy-s21-2021',
     '{"screen": "6.2 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 888", "camera": "Triple 12MP", "battery": "4000 mAh", "5G": true}', 4, 90),
    (smartphone_id, samsung_id, 'Galaxy S21+', 'SM-G996B', 2021, 'Samsung Galaxy S21+', 'samsung-galaxy-s21-plus-2021',
     '{"screen": "6.7 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 888", "camera": "Triple 12MP", "battery": "4800 mAh", "5G": true}', 4, 90),
    (smartphone_id, samsung_id, 'Galaxy S21 Ultra', 'SM-G998B', 2021, 'Samsung Galaxy S21 Ultra', 'samsung-galaxy-s21-ultra-2021',
     '{"screen": "6.8 inch AMOLED 120Hz", "storage": ["128GB", "256GB", "512GB"], "cpu": "Snapdragon 888", "camera": "108MP + Quad", "battery": "5000 mAh", "5G": true, "spen": true}', 4, 120);

    -- Galaxy S22 Series (2022)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (smartphone_id, samsung_id, 'Galaxy S22', 'SM-S901B', 2022, 'Samsung Galaxy S22', 'samsung-galaxy-s22-2022',
     '{"screen": "6.1 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 8 Gen 1", "camera": "Triple 50MP", "battery": "3700 mAh", "5G": true}', 5, 75),
    (smartphone_id, samsung_id, 'Galaxy S22+', 'SM-S906B', 2022, 'Samsung Galaxy S22+', 'samsung-galaxy-s22-plus-2022',
     '{"screen": "6.6 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 8 Gen 1", "camera": "Triple 50MP", "battery": "4500 mAh", "5G": true}', 5, 90),
    (smartphone_id, samsung_id, 'Galaxy S22 Ultra', 'SM-S908B', 2022, 'Samsung Galaxy S22 Ultra', 'samsung-galaxy-s22-ultra-2022',
     '{"screen": "6.8 inch AMOLED 120Hz", "storage": ["128GB", "256GB", "512GB", "1TB"], "cpu": "Snapdragon 8 Gen 1", "camera": "108MP + Quad", "battery": "5000 mAh", "5G": true, "spen": true}', 5, 120);

    -- Galaxy S23 Series (2023)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (smartphone_id, samsung_id, 'Galaxy S23', 'SM-S911B', 2023, 'Samsung Galaxy S23', 'samsung-galaxy-s23-2023',
     '{"screen": "6.1 inch AMOLED 120Hz", "storage": ["128GB", "256GB"], "cpu": "Snapdragon 8 Gen 2", "camera": "Triple 50MP", "battery": "3900 mAh", "5G": true}', 5, 75, 90),
    (smartphone_id, samsung_id, 'Galaxy S23+', 'SM-S916B', 2023, 'Samsung Galaxy S23+', 'samsung-galaxy-s23-plus-2023',
     '{"screen": "6.6 inch AMOLED 120Hz", "storage": ["256GB", "512GB"], "cpu": "Snapdragon 8 Gen 2", "camera": "Triple 50MP", "battery": "4700 mAh", "5G": true}', 5, 90, 85),
    (smartphone_id, samsung_id, 'Galaxy S23 Ultra', 'SM-S918B', 2023, 'Samsung Galaxy S23 Ultra', 'samsung-galaxy-s23-ultra-2023',
     '{"screen": "6.8 inch AMOLED 120Hz", "storage": ["256GB", "512GB", "1TB"], "cpu": "Snapdragon 8 Gen 2", "camera": "200MP + Quad", "battery": "5000 mAh", "5G": true, "spen": true}', 5, 120, 95);

END $$;

-- Insert MacBooks
DO $$
DECLARE
    apple_id UUID;
    laptop_id UUID;
    screen_issue_id UUID;
    battery_issue_id UUID;
    keyboard_issue_id UUID;
BEGIN
    SELECT id INTO apple_id FROM device_brands WHERE slug = 'apple';
    SELECT id INTO laptop_id FROM device_categories WHERE slug = 'laptops';
    
    -- Create keyboard issue if not exists
    INSERT INTO device_issues (name, slug, category, description, symptoms, difficulty_level)
    VALUES ('Keyboard Issues', 'keyboard-issues', 'hardware', 'Keyboard malfunction or sticky keys', ARRAY['Keys not working', 'Sticky keys', 'Repeated keystrokes'], 'medium')
    ON CONFLICT (slug) DO NOTHING;
    
    SELECT id INTO keyboard_issue_id FROM device_issues WHERE slug = 'keyboard-issues';
    SELECT id INTO screen_issue_id FROM device_issues WHERE slug = 'cracked-screen';
    SELECT id INTO battery_issue_id FROM device_issues WHERE slug = 'battery-drain';
    
    -- MacBook Pro 13" (2016-2023)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (laptop_id, apple_id, 'MacBook Pro 13"', 'A1706', 2016, 'Apple MacBook Pro 13" (2016)', 'apple-macbook-pro-13-2016',
     '{"screen": "13.3 inch Retina", "cpu": "Intel Core i5/i7", "ram": ["8GB", "16GB"], "storage": ["256GB", "512GB", "1TB"], "ports": "USB-C x4"}', 2, 180),
    (laptop_id, apple_id, 'MacBook Pro 13"', 'A1989', 2018, 'Apple MacBook Pro 13" (2018)', 'apple-macbook-pro-13-2018',
     '{"screen": "13.3 inch Retina", "cpu": "Intel Core i5/i7", "ram": ["8GB", "16GB"], "storage": ["256GB", "512GB", "1TB"], "ports": "USB-C x4", "touchbar": true}', 1, 180),
    (laptop_id, apple_id, 'MacBook Pro 13" M1', 'A2338', 2020, 'Apple MacBook Pro 13" M1 (2020)', 'apple-macbook-pro-13-m1-2020',
     '{"screen": "13.3 inch Retina", "cpu": "Apple M1", "ram": ["8GB", "16GB"], "storage": ["256GB", "512GB", "1TB", "2TB"], "battery": "20 hours"}', 1, 240),
    (laptop_id, apple_id, 'MacBook Pro 13" M2', 'A2338', 2022, 'Apple MacBook Pro 13" M2 (2022)', 'apple-macbook-pro-13-m2-2022',
     '{"screen": "13.3 inch Retina", "cpu": "Apple M2", "ram": ["8GB", "16GB", "24GB"], "storage": ["256GB", "512GB", "1TB", "2TB"], "battery": "20 hours"}', 1, 240);

    -- MacBook Pro 16" (2019-2023)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time)
    VALUES 
    (laptop_id, apple_id, 'MacBook Pro 16"', 'A2141', 2019, 'Apple MacBook Pro 16" (2019)', 'apple-macbook-pro-16-2019',
     '{"screen": "16 inch Retina", "cpu": "Intel Core i7/i9", "ram": ["16GB", "32GB", "64GB"], "storage": ["512GB", "1TB", "2TB", "4TB", "8TB"], "gpu": "AMD Radeon Pro"}', 1, 300),
    (laptop_id, apple_id, 'MacBook Pro 16" M1 Pro/Max', 'A2485', 2021, 'Apple MacBook Pro 16" M1 Pro/Max (2021)', 'apple-macbook-pro-16-m1-2021',
     '{"screen": "16.2 inch Liquid Retina XDR", "cpu": "Apple M1 Pro/Max", "ram": ["16GB", "32GB", "64GB"], "storage": ["512GB", "1TB", "2TB", "4TB", "8TB"], "battery": "21 hours"}', 3, 300),
    (laptop_id, apple_id, 'MacBook Pro 16" M2 Pro/Max', 'A2780', 2023, 'Apple MacBook Pro 16" M2 Pro/Max (2023)', 'apple-macbook-pro-16-m2-2023',
     '{"screen": "16.2 inch Liquid Retina XDR", "cpu": "Apple M2 Pro/Max", "ram": ["16GB", "32GB", "64GB", "96GB"], "storage": ["512GB", "1TB", "2TB", "4TB", "8TB"], "battery": "22 hours"}', 4, 300);

    -- MacBook Air (2018-2023)
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (laptop_id, apple_id, 'MacBook Air', 'A1932', 2018, 'Apple MacBook Air (2018)', 'apple-macbook-air-2018',
     '{"screen": "13.3 inch Retina", "cpu": "Intel Core i5", "ram": ["8GB", "16GB"], "storage": ["128GB", "256GB", "512GB", "1.5TB"], "weight": "1.25kg"}', 3, 120),
    (laptop_id, apple_id, 'MacBook Air M1', 'A2337', 2020, 'Apple MacBook Air M1 (2020)', 'apple-macbook-air-m1-2020',
     '{"screen": "13.3 inch Retina", "cpu": "Apple M1", "ram": ["8GB", "16GB"], "storage": ["256GB", "512GB", "1TB", "2TB"], "battery": "18 hours", "fanless": true}', 6, 150, 95),
    (laptop_id, apple_id, 'MacBook Air M2', 'A2681', 2022, 'Apple MacBook Air M2 (2022)', 'apple-macbook-air-m2-2022',
     '{"screen": "13.6 inch Liquid Retina", "cpu": "Apple M2", "ram": ["8GB", "16GB", "24GB"], "storage": ["256GB", "512GB", "1TB", "2TB"], "battery": "18 hours", "magsafe": true}', 7, 150, 100),
    (laptop_id, apple_id, 'MacBook Air 15" M2', 'A2941', 2023, 'Apple MacBook Air 15" M2 (2023)', 'apple-macbook-air-15-m2-2023',
     '{"screen": "15.3 inch Liquid Retina", "cpu": "Apple M2", "ram": ["8GB", "16GB", "24GB"], "storage": ["256GB", "512GB", "1TB", "2TB"], "battery": "18 hours", "speakers": "6-speaker"}', 7, 180, 90);

END $$;

-- Insert iPads
DO $$
DECLARE
    apple_id UUID;
    tablet_id UUID;
BEGIN
    SELECT id INTO apple_id FROM device_brands WHERE slug = 'apple';
    SELECT id INTO tablet_id FROM device_categories WHERE slug = 'tablets';
    
    -- iPad Pro Series
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (tablet_id, apple_id, 'iPad Pro 12.9" Gen 5', 'A2378', 2021, 'Apple iPad Pro 12.9" (5th Gen)', 'apple-ipad-pro-12-9-gen5-2021',
     '{"screen": "12.9 inch Liquid Retina XDR", "cpu": "Apple M1", "ram": ["8GB", "16GB"], "storage": ["128GB", "256GB", "512GB", "1TB", "2TB"], "5G": true}', 2, 120, 85),
    (tablet_id, apple_id, 'iPad Pro 11" Gen 3', 'A2377', 2021, 'Apple iPad Pro 11" (3rd Gen)', 'apple-ipad-pro-11-gen3-2021',
     '{"screen": "11 inch Liquid Retina", "cpu": "Apple M1", "ram": ["8GB", "16GB"], "storage": ["128GB", "256GB", "512GB", "1TB", "2TB"], "5G": true}', 2, 90, 80),
    (tablet_id, apple_id, 'iPad Pro 12.9" Gen 6', 'A2436', 2022, 'Apple iPad Pro 12.9" (6th Gen)', 'apple-ipad-pro-12-9-gen6-2022',
     '{"screen": "12.9 inch Liquid Retina XDR", "cpu": "Apple M2", "ram": ["8GB", "16GB"], "storage": ["128GB", "256GB", "512GB", "1TB", "2TB"], "wifi6e": true}', 2, 120, 90),
    (tablet_id, apple_id, 'iPad Pro 11" Gen 4', 'A2435', 2022, 'Apple iPad Pro 11" (4th Gen)', 'apple-ipad-pro-11-gen4-2022',
     '{"screen": "11 inch Liquid Retina", "cpu": "Apple M2", "ram": ["8GB", "16GB"], "storage": ["128GB", "256GB", "512GB", "1TB", "2TB"], "wifi6e": true}', 2, 90, 85);

    -- iPad Air Series
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (tablet_id, apple_id, 'iPad Air 4', 'A2316', 2020, 'Apple iPad Air (4th Gen)', 'apple-ipad-air-4-2020',
     '{"screen": "10.9 inch Liquid Retina", "cpu": "Apple A14 Bionic", "storage": ["64GB", "256GB"], "usbc": true, "touchid": "power button"}', 2, 90, 85),
    (tablet_id, apple_id, 'iPad Air 5', 'A2588', 2022, 'Apple iPad Air (5th Gen)', 'apple-ipad-air-5-2022',
     '{"screen": "10.9 inch Liquid Retina", "cpu": "Apple M1", "storage": ["64GB", "256GB"], "5G": true, "colors": ["Space Gray", "Pink", "Purple", "Blue", "Starlight"]}', 2, 90, 95);

    -- Standard iPad Series
    INSERT INTO devices (category_id, brand_id, model, model_number, year, display_name, slug, specifications, repairability_score, average_repair_time, popularity_score)
    VALUES 
    (tablet_id, apple_id, 'iPad 9', 'A2602', 2021, 'Apple iPad (9th Gen)', 'apple-ipad-9-2021',
     '{"screen": "10.2 inch Retina", "cpu": "Apple A13 Bionic", "storage": ["64GB", "256GB"], "frontcamera": "12MP Center Stage", "pencil": "1st gen"}', 6, 60, 90),
    (tablet_id, apple_id, 'iPad 10', 'A2696', 2022, 'Apple iPad (10th Gen)', 'apple-ipad-10-2022',
     '{"screen": "10.9 inch Liquid Retina", "cpu": "Apple A14 Bionic", "storage": ["64GB", "256GB"], "usbc": true, "colors": ["Blue", "Pink", "Yellow", "Silver"]}', 6, 75, 85);

END $$;

-- Add common issue mappings for devices
DO $$
DECLARE
    device_record RECORD;
    issue_record RECORD;
    device_age INTEGER;
BEGIN
    -- For each device
    FOR device_record IN SELECT id, year, category_id FROM devices LOOP
        device_age := 2025 - device_record.year;
        
        -- Map common issues based on device age and type
        FOR issue_record IN SELECT id, slug FROM device_issues LOOP
            -- Screen issues are common for all devices
            IF issue_record.slug = 'cracked-screen' THEN
                INSERT INTO device_issue_mappings (device_id, issue_id, frequency, typical_age_months, 
                    estimated_cost_min, estimated_cost_max, repair_time_minutes, success_rate)
                VALUES (device_record.id, issue_record.id, 
                    CASE WHEN device_age > 3 THEN 'very_common' ELSE 'common' END,
                    18, 150.00, 450.00, 60, 95.00)
                ON CONFLICT (device_id, issue_id) DO NOTHING;
            
            -- Battery issues for devices older than 2 years
            ELSIF issue_record.slug = 'battery-drain' AND device_age >= 2 THEN
                INSERT INTO device_issue_mappings (device_id, issue_id, frequency, typical_age_months,
                    estimated_cost_min, estimated_cost_max, repair_time_minutes, success_rate)
                VALUES (device_record.id, issue_record.id, 
                    CASE WHEN device_age > 3 THEN 'very_common' ELSE 'common' END,
                    24, 80.00, 200.00, 45, 98.00)
                ON CONFLICT (device_id, issue_id) DO NOTHING;
            
            -- Charging port issues for devices older than 1 year
            ELSIF issue_record.slug = 'charging-port' AND device_age >= 1 THEN
                INSERT INTO device_issue_mappings (device_id, issue_id, frequency, typical_age_months,
                    estimated_cost_min, estimated_cost_max, repair_time_minutes, success_rate)
                VALUES (device_record.id, issue_record.id, 'common',
                    12, 60.00, 150.00, 30, 90.00)
                ON CONFLICT (device_id, issue_id) DO NOTHING;
            
            -- Water damage (random occurrence)
            ELSIF issue_record.slug = 'water-damage' THEN
                INSERT INTO device_issue_mappings (device_id, issue_id, frequency, typical_age_months,
                    estimated_cost_min, estimated_cost_max, repair_time_minutes, success_rate)
                VALUES (device_record.id, issue_record.id, 'uncommon',
                    0, 150.00, 500.00, 120, 60.00)
                ON CONFLICT (device_id, issue_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create initial pricing rules
INSERT INTO repair_pricing_rules (name, rule_type, conditions, base_amount, percentage, calculation_method, priority, is_active)
VALUES 
-- Base pricing by category
('Smartphone Base Price', 'base_price', '{"category": "smartphones"}', 50.00, NULL, 'fixed', 100, true),
('Tablet Base Price', 'base_price', '{"category": "tablets"}', 75.00, NULL, 'fixed', 100, true),
('Laptop Base Price', 'base_price', '{"category": "laptops"}', 100.00, NULL, 'fixed', 100, true),

-- Brand premiums
('Apple Premium', 'complexity_multiplier', '{"brand": "apple"}', NULL, 20.00, 'percentage', 90, true),
('Samsung Premium', 'complexity_multiplier', '{"brand": "samsung"}', NULL, 10.00, 'percentage', 90, true),

-- Urgency surcharges
('Same Day Service', 'urgency_surcharge', '{"service_type": "same_day"}', 50.00, NULL, 'fixed', 80, true),
('Express Service (24h)', 'urgency_surcharge', '{"service_type": "express"}', 25.00, NULL, 'fixed', 80, true),

-- Age discounts
('Older Device Discount', 'age_discount', '{"min_age_years": 4}', NULL, -10.00, 'percentage', 70, true),
('Vintage Device Surcharge', 'age_surcharge', '{"min_age_years": 6}', NULL, 15.00, 'percentage', 70, true)
ON CONFLICT DO NOTHING;

-- Refresh the search index
REFRESH MATERIALIZED VIEW device_search_index;

-- Clean up helper function
DROP FUNCTION IF EXISTS generate_device_slug(TEXT, TEXT, INTEGER);