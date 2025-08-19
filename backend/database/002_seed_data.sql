-- RevivaTech Seed Data
-- Complete Device Database (2016-2025) and Initial Configuration
-- Session 1: Backend Foundation Implementation

-- Device Categories
INSERT INTO device_categories (name, slug, description, icon, sort_order, active) VALUES
('MacBook', 'macbook', 'Apple MacBook laptops (2016-2025)', 'laptop', 1, TRUE),
('MacBook Pro', 'macbook-pro', 'Apple MacBook Pro (2016-2025)', 'laptop', 2, TRUE),
('MacBook Air', 'macbook-air', 'Apple MacBook Air (2018-2025)', 'laptop', 3, TRUE),
('iMac', 'imac', 'Apple iMac desktop computers (2017-2025)', 'monitor', 4, TRUE),
('iMac Pro', 'imac-pro', 'Apple iMac Pro (2017-2021)', 'monitor', 5, TRUE),
('Mac Studio', 'mac-studio', 'Apple Mac Studio (2022-2025)', 'pc', 6, TRUE),
('Mac Pro', 'mac-pro', 'Apple Mac Pro (2019-2025)', 'pc', 7, TRUE),
('Mac Mini', 'mac-mini', 'Apple Mac Mini (2018-2025)', 'pc', 8, TRUE),
('iPad Pro', 'ipad-pro', 'Apple iPad Pro (2016-2025)', 'tablet', 9, TRUE),
('iPad Air', 'ipad-air', 'Apple iPad Air (2019-2025)', 'tablet', 10, TRUE),
('iPad', 'ipad', 'Apple iPad (2017-2025)', 'tablet', 11, TRUE),
('iPad Mini', 'ipad-mini', 'Apple iPad Mini (2019-2025)', 'tablet', 12, TRUE),
('iPhone 15', 'iphone-15', 'iPhone 15 series (2023)', 'smartphone', 13, TRUE),
('iPhone 14', 'iphone-14', 'iPhone 14 series (2022)', 'smartphone', 14, TRUE),
('iPhone 13', 'iphone-13', 'iPhone 13 series (2021)', 'smartphone', 15, TRUE),
('iPhone 12', 'iphone-12', 'iPhone 12 series (2020)', 'smartphone', 16, TRUE),
('iPhone 11', 'iphone-11', 'iPhone 11 series (2019)', 'smartphone', 17, TRUE),
('iPhone X/XS', 'iphone-x-xs', 'iPhone X and XS series (2017-2018)', 'smartphone', 18, TRUE),
('iPhone 8', 'iphone-8', 'iPhone 8 and 8 Plus (2017)', 'smartphone', 19, TRUE),
('iPhone 7', 'iphone-7', 'iPhone 7 and 7 Plus (2016)', 'smartphone', 20, TRUE),
('Windows Laptop', 'windows-laptop', 'Windows laptops (2016-2025)', 'laptop', 21, TRUE),
('Gaming Laptop', 'gaming-laptop', 'Gaming laptops (2016-2025)', 'laptop', 22, TRUE),
('Desktop PC', 'desktop-pc', 'Desktop computers (2016-2025)', 'pc', 23, TRUE),
('Gaming PC', 'gaming-pc', 'Gaming desktop computers (2016-2025)', 'pc', 24, TRUE),
('PlayStation', 'playstation', 'PlayStation consoles (PS4/PS5)', 'gamepad2', 25, TRUE),
('Xbox', 'xbox', 'Xbox consoles (One/Series)', 'gamepad2', 26, TRUE),
('Nintendo Switch', 'nintendo-switch', 'Nintendo Switch console (2017-2025)', 'gamepad2', 27, TRUE),
('Samsung Galaxy', 'samsung-galaxy', 'Samsung Galaxy smartphones (2016-2025)', 'smartphone', 28, TRUE),
('Google Pixel', 'google-pixel', 'Google Pixel smartphones (2016-2025)', 'smartphone', 29, TRUE),
('OnePlus', 'oneplus', 'OnePlus smartphones (2016-2025)', 'smartphone', 30, TRUE);

-- Device Models - MacBook Pro (comprehensive 2016-2025)
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
-- MacBook Pro 13" Intel (2016-2020)
(2, 'Apple', 'MacBook Pro 13" Mid 2016', 2016, '{"chip": "Intel Core i5", "ram": "8GB", "storage": "256GB-1TB", "ports": "4x Thunderbolt 3", "touchbar": true}', '/images/macbook-pro-13-2016.jpg', 'hard', ARRAY['Keyboard failure', 'Flexgate display issue', 'Touch Bar problems', 'Battery swelling'], TRUE),
(2, 'Apple', 'MacBook Pro 13" Mid 2017', 2017, '{"chip": "Intel Core i5/i7", "ram": "8GB-16GB", "storage": "256GB-1TB", "ports": "4x Thunderbolt 3", "touchbar": true}', '/images/macbook-pro-13-2017.jpg', 'hard', ARRAY['Keyboard failure', 'Flexgate display issue', 'Touch Bar problems', 'SSD failure'], TRUE),
(2, 'Apple', 'MacBook Pro 13" Mid 2018', 2018, '{"chip": "Intel Core i5/i7", "ram": "8GB-16GB", "storage": "256GB-2TB", "ports": "4x Thunderbolt 3", "touchbar": true}', '/images/macbook-pro-13-2018.jpg', 'hard', ARRAY['Keyboard failure', 'Flexgate display issue', 'T2 chip issues', 'Thermal throttling'], TRUE),
(2, 'Apple', 'MacBook Pro 13" Mid 2019', 2019, '{"chip": "Intel Core i5/i7", "ram": "8GB-16GB", "storage": "256GB-2TB", "ports": "4x Thunderbolt 3", "touchbar": true}', '/images/macbook-pro-13-2019.jpg', 'hard', ARRAY['Keyboard failure', 'Flexgate display issue', 'T2 chip issues', 'SSD failure'], TRUE),
(2, 'Apple', 'MacBook Pro 13" Mid 2020', 2020, '{"chip": "Intel Core i5/i7", "ram": "16GB-32GB", "storage": "512GB-4TB", "ports": "4x Thunderbolt 3", "touchbar": true}', '/images/macbook-pro-13-2020.jpg', 'medium', ARRAY['Keyboard issues', 'Battery drain', 'USB-C port damage'], TRUE),

-- MacBook Pro 13" Apple Silicon (2020-2024)
(2, 'Apple', 'MacBook Pro 13" M1', 2020, '{"chip": "Apple M1", "ram": "8GB-16GB", "storage": "256GB-2TB", "ports": "2x Thunderbolt 4", "touchbar": true}', '/images/macbook-pro-13-m1.jpg', 'medium', ARRAY['Battery drain', 'USB-C port issues', 'Screen backlight problems'], TRUE),
(2, 'Apple', 'MacBook Pro 13" M2', 2022, '{"chip": "Apple M2", "ram": "8GB-24GB", "storage": "256GB-2TB", "ports": "2x Thunderbolt 4", "touchbar": true}', '/images/macbook-pro-13-m2.jpg', 'medium', ARRAY['Battery drain', 'USB-C port issues', 'Thermal management'], TRUE),

-- MacBook Pro 14" Apple Silicon (2021-2024)
(2, 'Apple', 'MacBook Pro 14" M1 Pro', 2021, '{"chip": "Apple M1 Pro", "ram": "16GB-32GB", "storage": "512GB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m1-pro.jpg', 'medium', ARRAY['MagSafe charging issues', 'HDMI port problems', 'Screen bleeding'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M1 Max', 2021, '{"chip": "Apple M1 Max", "ram": "32GB-64GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m1-max.jpg', 'medium', ARRAY['Thermal management', 'MagSafe issues', 'High power consumption'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M2 Pro', 2023, '{"chip": "Apple M2 Pro", "ram": "16GB-32GB", "storage": "512GB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m2-pro.jpg', 'medium', ARRAY['Battery optimization', 'Port connectivity', 'Software compatibility'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M2 Max', 2023, '{"chip": "Apple M2 Max", "ram": "32GB-96GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m2-max.jpg', 'medium', ARRAY['Thermal management', 'High performance mode issues', 'Memory pressure'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M3', 2023, '{"chip": "Apple M3", "ram": "8GB-24GB", "storage": "512GB-2TB", "ports": "2x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m3.jpg', 'medium', ARRAY['Battery optimization', 'USB-C compatibility', 'Display calibration'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M3 Pro', 2023, '{"chip": "Apple M3 Pro", "ram": "18GB-36GB", "storage": "512GB-4TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m3-pro.jpg', 'medium', ARRAY['Performance throttling', 'External display issues', 'Audio problems'], TRUE),
(2, 'Apple', 'MacBook Pro 14" M3 Max', 2023, '{"chip": "Apple M3 Max", "ram": "36GB-128GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-14-m3-max.jpg', 'medium', ARRAY['Thermal management', 'GPU performance', 'High-end workflow issues'], TRUE),

-- MacBook Pro 16" Intel (2019-2020)
(2, 'Apple', 'MacBook Pro 16" 2019', 2019, '{"chip": "Intel Core i7/i9", "ram": "16GB-64GB", "storage": "512GB-8TB", "ports": "4x Thunderbolt 3", "gpu": "AMD Radeon Pro"}', '/images/macbook-pro-16-2019.jpg', 'hard', ARRAY['Keyboard failure', 'GPU issues', 'Thermal problems', 'Speaker crackling'], TRUE),
(2, 'Apple', 'MacBook Pro 16" 2020', 2020, '{"chip": "Intel Core i7/i9", "ram": "16GB-64GB", "storage": "512GB-8TB", "ports": "4x Thunderbolt 3", "gpu": "AMD Radeon Pro"}', '/images/macbook-pro-16-2020.jpg', 'hard', ARRAY['Keyboard issues', 'GPU overheating', 'Battery swelling', 'Audio issues'], TRUE),

-- MacBook Pro 16" Apple Silicon (2021-2024)
(2, 'Apple', 'MacBook Pro 16" M1 Pro', 2021, '{"chip": "Apple M1 Pro", "ram": "16GB-32GB", "storage": "512GB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m1-pro.jpg', 'medium', ARRAY['Battery calibration', 'Display uniformity', 'Charging optimization'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M1 Max', 2021, '{"chip": "Apple M1 Max", "ram": "32GB-64GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m1-max.jpg', 'medium', ARRAY['Thermal management', 'High performance issues', 'External GPU compatibility'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M2 Pro', 2023, '{"chip": "Apple M2 Pro", "ram": "16GB-32GB", "storage": "512GB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m2-pro.jpg', 'medium', ARRAY['WiFi connectivity', 'Bluetooth issues', 'Memory management'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M2 Max', 2023, '{"chip": "Apple M2 Max", "ram": "32GB-96GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m2-max.jpg', 'medium', ARRAY['Performance optimization', 'Video editing issues', 'Rendering problems'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M3 Pro', 2023, '{"chip": "Apple M3 Pro", "ram": "18GB-36GB", "storage": "512GB-4TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m3-pro.jpg', 'medium', ARRAY['Battery optimization', 'Display scaling', 'Audio synchronization'], TRUE),
(2, 'Apple', 'MacBook Pro 16" M3 Max', 2023, '{"chip": "Apple M3 Max", "ram": "36GB-128GB", "storage": "1TB-8TB", "ports": "3x Thunderbolt 4, HDMI, SD", "display": "Liquid Retina XDR"}', '/images/macbook-pro-16-m3-max.jpg', 'medium', ARRAY['Thermal management', 'GPU acceleration', 'Professional workflow compatibility'], TRUE);

-- iPhone Models (iPhone 15 series - latest)
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
(13, 'Apple', 'iPhone 15', 2023, '{"chip": "A16 Bionic", "storage": "128GB-512GB", "display": "6.1 inch Super Retina XDR", "camera": "48MP main", "connectivity": "USB-C"}', '/images/iphone-15.jpg', 'medium', ARRAY['USB-C port damage', 'Battery degradation', 'Camera lens scratches', 'Screen protector compatibility'], TRUE),
(13, 'Apple', 'iPhone 15 Plus', 2023, '{"chip": "A16 Bionic", "storage": "128GB-512GB", "display": "6.7 inch Super Retina XDR", "camera": "48MP main", "connectivity": "USB-C"}', '/images/iphone-15-plus.jpg', 'medium', ARRAY['USB-C port issues', 'Large screen vulnerability', 'Battery optimization', 'Weight-related drops'], TRUE),
(13, 'Apple', 'iPhone 15 Pro', 2023, '{"chip": "A17 Pro", "storage": "128GB-1TB", "display": "6.1 inch Super Retina XDR", "camera": "48MP Pro camera system", "connectivity": "USB-C", "material": "Titanium"}', '/images/iphone-15-pro.jpg', 'medium', ARRAY['Titanium frame scratches', 'Action Button malfunction', 'Camera system alignment', 'USB-C data transfer issues'], TRUE),
(13, 'Apple', 'iPhone 15 Pro Max', 2023, '{"chip": "A17 Pro", "storage": "256GB-1TB", "display": "6.7 inch Super Retina XDR", "camera": "48MP Pro camera system", "connectivity": "USB-C", "material": "Titanium"}', '/images/iphone-15-pro-max.jpg', 'medium', ARRAY['Titanium durability', 'Large display damage', 'Advanced camera issues', 'Thermal management'], TRUE);

-- iPhone 14 series
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
(14, 'Apple', 'iPhone 14', 2022, '{"chip": "A15 Bionic", "storage": "128GB-512GB", "display": "6.1 inch Super Retina XDR", "camera": "12MP dual system", "connectivity": "Lightning"}', '/images/iphone-14.jpg', 'medium', ARRAY['Battery life', 'Camera focus issues', 'Lightning port wear', 'Screen burn-in'], TRUE),
(14, 'Apple', 'iPhone 14 Plus', 2022, '{"chip": "A15 Bionic", "storage": "128GB-512GB", "display": "6.7 inch Super Retina XDR", "camera": "12MP dual system", "connectivity": "Lightning"}', '/images/iphone-14-plus.jpg', 'medium', ARRAY['Screen size handling', 'Battery calibration', 'Camera stabilization', 'Case compatibility'], TRUE),
(14, 'Apple', 'iPhone 14 Pro', 2022, '{"chip": "A16 Bionic", "storage": "128GB-1TB", "display": "6.1 inch Super Retina XDR", "camera": "48MP Pro system", "features": "Dynamic Island"}', '/images/iphone-14-pro.jpg', 'medium', ARRAY['Dynamic Island sensor issues', 'ProRAW processing', 'Always-On display', 'Camera lens protection'], TRUE),
(14, 'Apple', 'iPhone 14 Pro Max', 2022, '{"chip": "A16 Bionic", "storage": "128GB-1TB", "display": "6.7 inch Super Retina XDR", "camera": "48MP Pro system", "features": "Dynamic Island"}', '/images/iphone-14-pro-max.jpg', 'medium', ARRAY['Large screen fragility', 'Camera bump protection', 'Always-On display burn', 'Dynamic Island responsiveness'], TRUE);

-- Windows Laptops (sample popular models)
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
(21, 'Dell', 'XPS 13 9310', 2021, '{"cpu": "Intel Core i7-1165G7", "ram": "16GB", "storage": "512GB SSD", "display": "13.4 inch 4K", "ports": "2x Thunderbolt 4"}', '/images/dell-xps-13-9310.jpg', 'medium', ARRAY['Keyboard backlight failure', 'USB-C charging issues', 'WiFi connectivity', 'Fan noise'], TRUE),
(21, 'HP', 'Spectre x360 14', 2022, '{"cpu": "Intel Core i7-1255U", "ram": "16GB", "storage": "1TB SSD", "display": "13.5 inch OLED", "form": "2-in-1 convertible"}', '/images/hp-spectre-x360-14.jpg', 'medium', ARRAY['Hinge mechanism wear', 'OLED burn-in', 'Stylus calibration', 'Battery swelling'], TRUE),
(21, 'Lenovo', 'ThinkPad X1 Carbon Gen 9', 2021, '{"cpu": "Intel Core i7-1165G7", "ram": "16GB", "storage": "1TB SSD", "display": "14 inch FHD", "features": "TrackPoint, fingerprint reader"}', '/images/lenovo-x1-carbon-gen9.jpg', 'easy', ARRAY['TrackPoint wear', 'Keyboard key replacement', 'LCD backlight', 'Dock connectivity'], TRUE),
(21, 'ASUS', 'ZenBook 14 UX425', 2021, '{"cpu": "Intel Core i7-1165G7", "ram": "16GB", "storage": "512GB SSD", "display": "14 inch FHD", "weight": "1.17kg"}', '/images/asus-zenbook-14-ux425.jpg', 'medium', ARRAY['Charging port damage', 'Screen hinge issues', 'Keyboard membrane', 'Overheating'], TRUE);

-- Gaming Laptops
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
(22, 'ASUS', 'ROG Strix G15', 2022, '{"cpu": "AMD Ryzen 7 6800H", "gpu": "NVIDIA RTX 3060", "ram": "16GB", "storage": "1TB SSD", "display": "15.6 inch 144Hz"}', '/images/asus-rog-strix-g15.jpg', 'medium', ARRAY['GPU overheating', 'Fan replacement', 'Keyboard lighting', 'Power adapter issues'], TRUE),
(22, 'MSI', 'GE76 Raider', 2021, '{"cpu": "Intel Core i7-11800H", "gpu": "NVIDIA RTX 3070", "ram": "32GB", "storage": "1TB SSD", "display": "17.3 inch 240Hz"}', '/images/msi-ge76-raider.jpg', 'hard', ARRAY['Thermal throttling', 'RGB lighting failure', 'Power consumption', 'Display panel replacement'], TRUE),
(22, 'Alienware', 'm15 R6', 2021, '{"cpu": "Intel Core i7-11800H", "gpu": "NVIDIA RTX 3080", "ram": "32GB", "storage": "1TB SSD", "display": "15.6 inch QHD 240Hz"}', '/images/alienware-m15-r6.jpg', 'hard', ARRAY['Cooling system maintenance', 'Alien FX lighting', 'High power draw', 'Premium part costs'], TRUE);

-- Gaming Consoles
INSERT INTO device_models (category_id, brand, model, year, specifications, image_url, repair_difficulty, common_issues, active) VALUES
(25, 'Sony', 'PlayStation 5', 2020, '{"cpu": "AMD Zen 2", "gpu": "AMD RDNA 2", "ram": "16GB", "storage": "825GB SSD", "features": "DualSense controller, 4K gaming"}', '/images/ps5.jpg', 'medium', ARRAY['Disc drive problems', 'HDMI port damage', 'Fan noise', 'Overheating', 'Controller drift'], TRUE),
(25, 'Sony', 'PlayStation 5 Digital', 2020, '{"cpu": "AMD Zen 2", "gpu": "AMD RDNA 2", "ram": "16GB", "storage": "825GB SSD", "features": "Digital only, DualSense controller"}', '/images/ps5-digital.jpg', 'medium', ARRAY['HDMI issues', 'SSD expansion problems', 'System software crashes', 'USB port failures'], TRUE),
(25, 'Sony', 'PlayStation 4 Pro', 2016, '{"cpu": "AMD Jaguar", "gpu": "AMD Radeon", "ram": "8GB", "storage": "1TB HDD", "features": "4K support, HDR gaming"}', '/images/ps4-pro.jpg', 'easy', ARRAY['Hard drive failure', 'Overheating', 'Blue light of death', 'Controller issues'], TRUE),
(26, 'Microsoft', 'Xbox Series X', 2020, '{"cpu": "AMD Zen 2", "gpu": "AMD RDNA 2", "ram": "16GB", "storage": "1TB SSD", "features": "4K gaming, Quick Resume"}', '/images/xbox-series-x.jpg', 'medium', ARRAY['Disc drive issues', 'Storage expansion problems', 'WiFi connectivity', 'Controller pairing'], TRUE),
(26, 'Microsoft', 'Xbox Series S', 2020, '{"cpu": "AMD Zen 2", "gpu": "AMD RDNA 2", "ram": "10GB", "storage": "512GB SSD", "features": "Digital only, 1440p gaming"}', '/images/xbox-series-s.jpg', 'medium', ARRAY['Storage limitations', 'HDMI output issues', 'System updates failing', 'Ventilation problems'], TRUE),
(27, 'Nintendo', 'Nintendo Switch OLED', 2021, '{"cpu": "NVIDIA Tegra X1", "display": "7 inch OLED", "storage": "64GB", "features": "Handheld/docked gaming, Joy-Con controllers"}', '/images/switch-oled.jpg', 'medium', ARRAY['Joy-Con drift', 'OLED burn-in', 'Charging port wear', 'Dock connectivity'], TRUE),
(27, 'Nintendo', 'Nintendo Switch Lite', 2019, '{"cpu": "NVIDIA Tegra X1", "display": "5.5 inch LCD", "storage": "32GB", "features": "Handheld only gaming"}', '/images/switch-lite.jpg', 'easy', ARRAY['Analog stick drift', 'Button responsiveness', 'Charging issues', 'Screen protector replacement'], TRUE);

-- Repair Types for different categories
INSERT INTO repair_types (name, description, category_id, base_price, estimated_time_hours, difficulty_level, parts_required, active) VALUES
-- MacBook Repairs
('MacBook Screen Replacement', 'Replace cracked or damaged MacBook LCD/OLED display', 2, 299.99, 2, 'medium', '{"display_assembly": true, "adhesive": true, "tools": ["pentalobe", "torx"]}', TRUE),
('MacBook Battery Replacement', 'Replace worn or swollen MacBook battery', 2, 149.99, 1, 'easy', '{"battery": true, "adhesive_strips": true, "screws": true}', TRUE),
('MacBook Keyboard Repair', 'Fix or replace MacBook keyboard and trackpad', 2, 199.99, 3, 'hard', '{"keyboard_assembly": true, "trackpad": "optional", "flex_cables": true}', TRUE),
('MacBook Logic Board Repair', 'Diagnose and repair MacBook motherboard issues', 2, 599.99, 8, 'hard', '{"microsoldering": true, "components": "variable", "diagnostic_tools": true}', TRUE),
('MacBook Charging Port Repair', 'Fix MagSafe or USB-C charging port', 2, 179.99, 2, 'medium', '{"charging_port": true, "flex_cable": true, "connector": true}', TRUE),
('MacBook Liquid Damage Repair', 'Clean and repair liquid damage', 2, 449.99, 12, 'hard', '{"cleaning_solution": true, "replacement_parts": "variable", "drying_time": 24}', TRUE),

-- iPhone Repairs  
('iPhone Screen Replacement', 'Replace cracked iPhone display with original quality parts', 13, 199.99, 1, 'medium', '{"screen_assembly": true, "adhesive": true, "screws": true}', TRUE),
('iPhone Battery Replacement', 'Replace degraded iPhone battery for improved performance', 13, 89.99, 1, 'easy', '{"battery": true, "adhesive_strips": true, "screws": true}', TRUE),
('iPhone Camera Repair', 'Fix or replace iPhone rear/front camera system', 13, 149.99, 2, 'medium', '{"camera_module": true, "flex_cable": true, "lens_cover": true}', TRUE),
('iPhone Charging Port Repair', 'Fix Lightning or USB-C charging port', 13, 119.99, 2, 'medium', '{"charging_port": true, "flex_cable": true, "dock_connector": true}', TRUE),
('iPhone Water Damage Repair', 'Professional water damage cleaning and restoration', 13, 249.99, 6, 'hard', '{"cleaning_solution": true, "replacement_parts": "variable", "drying_process": true}', TRUE),
('iPhone Speaker Repair', 'Fix earpiece, loudspeaker, or microphone issues', 13, 99.99, 1, 'easy', '{"speaker_assembly": true, "adhesive": true, "mesh_covers": true}', TRUE),

-- Windows Laptop Repairs
('Laptop Screen Replacement', 'Replace broken laptop LCD or LED display', 21, 249.99, 2, 'medium', '{"lcd_panel": true, "inverter": "optional", "hinges": "check"}', TRUE),
('Laptop Keyboard Replacement', 'Replace damaged or worn laptop keyboard', 21, 89.99, 1, 'easy', '{"keyboard": true, "ribbon_cable": true, "screws": true}', TRUE),
('Laptop Hard Drive Replacement', 'Replace failed HDD or upgrade to SSD', 21, 159.99, 1, 'easy', '{"storage_drive": true, "mounting_bracket": true, "data_transfer": "optional"}', TRUE),
('Laptop Fan Cleaning/Replacement', 'Clean or replace overheating laptop cooling system', 21, 129.99, 2, 'medium', '{"cooling_fan": true, "thermal_paste": true, "cleaning_materials": true}', TRUE),
('Laptop Power Jack Repair', 'Fix loose or broken laptop power connector', 21, 149.99, 3, 'hard', '{"power_jack": true, "soldering": true, "cable_harness": true}', TRUE),

-- Gaming Console Repairs
('Console Disc Drive Repair', 'Fix PlayStation/Xbox disc reading problems', 25, 179.99, 3, 'medium', '{"disc_drive": true, "laser_assembly": true, "drive_belt": true}', TRUE),
('Console HDMI Port Repair', 'Repair damaged HDMI output port', 25, 149.99, 2, 'hard', '{"hdmi_port": true, "soldering": true, "circuit_protection": true}', TRUE),
('Console Overheating Repair', 'Clean cooling system and replace thermal paste', 25, 99.99, 2, 'medium', '{"thermal_paste": true, "cleaning_materials": true, "thermal_pads": true}', TRUE),
('Joy-Con Drift Repair', 'Fix Nintendo Switch controller analog stick drift', 27, 59.99, 1, 'easy', '{"analog_stick": true, "contact_cleaner": true, "calibration": true}', TRUE),
('Console Software Recovery', 'Restore corrupted system software', 25, 89.99, 2, 'easy', '{"software_tools": true, "system_files": true, "backup_storage": true}', TRUE);

-- Create a default admin user (password: AdminPass123 - change in production!)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES
('admin@revivatech.co.uk', '$2b$10$rGZqhJk1ZMFqKfCYhFZkpeWxJwGhQoAqV8EuLZnFqx7YY6CgfJJYG', 'System', 'Administrator', 'admin', TRUE);

-- Create a demo customer (password: customer123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) VALUES
('demo@customer.com', '$2b$10$rGZqhJk1ZMFqKfCYhFZkpeWxJwGhQoAqV8EuLZnFqx7YY6CgfJJYG', 'Demo', 'Customer', '+44 20 1234 5678', 'customer', TRUE);

-- Create a demo technician (password: tech123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) VALUES
('tech@revivatech.co.uk', '$2b$10$rGZqhJk1ZMFqKfCYhFZkpeWxJwGhQoAqV8EuLZnFqx7YY6CgfJJYG', 'Demo', 'Technician', '+44 20 1234 5679', 'technician', TRUE);

-- Schema version update
INSERT INTO schema_versions (version, description) VALUES 
(2, 'Seed data - Complete device database and initial users');