-- RevivaTech Knowledge Base Seed Data - Phase 3
-- Initial repair procedures for common devices and problems

-- ====================================================================
-- CORE REPAIR PROCEDURES
-- ====================================================================

-- iPhone 15 Pro Screen Replacement
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'iPhone 15 Pro Screen Replacement',
    'Complete step-by-step guide for replacing a cracked or damaged iPhone 15 Pro screen assembly with OEM or high-quality aftermarket parts.',
    4, 90, 'screen_replacement',
    '{"brands": ["Apple"], "models": ["iPhone 15 Pro", "iPhone 15 Pro Max"], "types": ["smartphone"], "years": [2023, 2024]}',
    '[
        {"name": "Phillips #00 Screwdriver", "required": true},
        {"name": "Plastic Spudger Set", "required": true},
        {"name": "Heat Gun", "required": true},
        {"name": "Suction Cup", "required": true},
        {"name": "Adhesive Strips", "required": true}
    ]',
    '[
        {"name": "iPhone 15 Pro Screen Assembly", "part_number": "A2848-SCREEN", "quantity": 1, "cost_estimate": 179.99},
        {"name": "Adhesive Gasket", "part_number": "A2848-GASKET", "quantity": 1, "cost_estimate": 8.99}
    ]',
    'This procedure involves carefully removing the damaged screen assembly and installing a replacement. Critical steps include heat application for adhesive removal, careful disconnection of flex cables, and proper alignment during reassembly.',
    '["Turn off device completely before starting", "Remove all power sources", "Use heat carefully to avoid battery damage", "Handle flex cables with extreme care"]',
    'Test touch sensitivity, Face ID functionality, and True Tone display before final assembly. Ensure all adhesive seals are properly applied for water resistance.',
    'published', 4.7, 94.2,
    '{"iPhone", "15", "Pro", "screen", "cracked", "broken", "display", "touch", "replacement"}',
    '{"screen_damage", "display_issues", "touch_malfunction"}',
    '{"smartphone_repair", "apple_device", "screen_replacement", "advanced_repair"}'
);

-- Samsung Galaxy S24 Battery Replacement
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'Samsung Galaxy S24 Battery Replacement',
    'Professional battery replacement for Samsung Galaxy S24 experiencing battery drain, swelling, or charging issues.',
    3, 60, 'battery_replacement',
    '{"brands": ["Samsung"], "models": ["Galaxy S24", "Galaxy S24+"], "types": ["smartphone"], "years": [2024]}',
    '[
        {"name": "Phillips #00 Screwdriver", "required": true},
        {"name": "Plastic Prying Tools", "required": true},
        {"name": "Heat Gun", "required": true},
        {"name": "Adhesive Removal Tool", "required": true}
    ]',
    '[
        {"name": "Galaxy S24 Battery", "part_number": "SM-S921-BATT", "quantity": 1, "cost_estimate": 69.99},
        {"name": "Battery Adhesive Strips", "part_number": "SM-S921-ADH", "quantity": 1, "cost_estimate": 5.99}
    ]',
    'This procedure involves safe removal of the old battery and installation of a new one. Key focus areas include proper heat application, careful adhesive removal, and secure connection of the new battery.',
    '["Ensure device is completely powered off", "Handle battery with care to avoid puncture", "Use proper heat levels to avoid damage", "Never force removal of adhesive strips"]',
    'Calibrate the new battery by allowing full discharge and recharge cycle. Verify charging functionality and battery health reporting.',
    'published', 4.5, 96.8,
    '{"Samsung", "Galaxy", "S24", "battery", "drain", "charging", "replacement", "swelling"}',
    '{"battery_issues", "charging_problems", "power_problems"}',
    '{"smartphone_repair", "samsung_device", "battery_replacement", "intermediate_repair"}'
);

-- MacBook Pro 14" Keyboard Replacement
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'MacBook Pro 14" Keyboard Replacement',
    'Complete keyboard assembly replacement for MacBook Pro 14" (2021-2023) models experiencing key sticking, non-responsive keys, or butterfly mechanism failures.',
    5, 180, 'keyboard_replacement',
    '{"brands": ["Apple"], "models": ["MacBook Pro 14\""], "types": ["laptop"], "years": [2021, 2022, 2023]}',
    '[
        {"name": "Phillips #00 Screwdriver", "required": true},
        {"name": "Torx T5 Screwdriver", "required": true},
        {"name": "Plastic Spudger Set", "required": true},
        {"name": "Anti-static Wrist Strap", "required": true},
        {"name": "Magnetic Screw Mat", "required": true}
    ]',
    '[
        {"name": "MacBook Pro 14\" Keyboard Assembly", "part_number": "A2442-KB", "quantity": 1, "cost_estimate": 299.99},
        {"name": "Thermal Pads", "part_number": "A2442-THERMAL", "quantity": 1, "cost_estimate": 12.99}
    ]',
    'This is an advanced repair requiring complete disassembly of the MacBook Pro. The procedure involves removing the logic board, display assembly, and carefully installing the new keyboard with proper thermal management.',
    '["Remove battery completely before starting", "Use anti-static protection throughout", "Handle logic board with extreme care", "Keep track of screw locations"]',
    'Test all keys for proper function, backlight operation, and Touch ID functionality. Run Apple Diagnostics to verify all components are properly connected.',
    'published', 4.3, 87.5,
    '{"MacBook", "Pro", "14", "keyboard", "keys", "sticky", "replacement", "butterfly", "mechanism"}',
    '{"keyboard_malfunction", "input_problems", "hardware_failure"}',
    '{"laptop_repair", "apple_device", "keyboard_replacement", "expert_repair"}'
);

-- Generic Smartphone Charging Port Cleaning
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'Smartphone Charging Port Cleaning and Repair',
    'Professional cleaning and minor repair of charging ports for various smartphone models experiencing charging issues due to debris, corrosion, or loose connections.',
    2, 30, 'charging_port_maintenance',
    '{"brands": ["Apple", "Samsung", "Google", "OnePlus"], "models": ["*"], "types": ["smartphone"], "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024]}',
    '[
        {"name": "Plastic Picks", "required": true},
        {"name": "Soft Brush", "required": true},
        {"name": "Compressed Air", "required": true},
        {"name": "Isopropyl Alcohol 99%", "required": true},
        {"name": "Magnifying Glass", "required": false}
    ]',
    '[
        {"name": "Cleaning Supplies", "part_number": "CLEAN-KIT", "quantity": 1, "cost_estimate": 15.99}
    ]',
    'This maintenance procedure involves careful cleaning of the charging port to remove debris, lint, and corrosion that may prevent proper charging connection.',
    '["Ensure device is powered off", "Never use metal tools in charging port", "Use minimal liquid", "Allow complete drying before testing"]',
    'Test charging with multiple cables and power sources. Verify data transfer functionality if applicable. Document any hardware damage found during cleaning.',
    'published', 4.8, 98.5,
    '{"charging", "port", "cleaning", "debris", "lint", "connection", "power", "cable"}',
    '{"charging_problems", "connection_issues", "maintenance"}',
    '{"smartphone_repair", "maintenance", "charging_port", "basic_repair"}'
);

-- iPad Screen Replacement
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'iPad Pro/Air Screen Replacement',
    'Complete screen digitizer replacement for iPad Pro and iPad Air models with cracked glass or touch sensitivity issues.',
    4, 120, 'screen_replacement',
    '{"brands": ["Apple"], "models": ["iPad Pro 11\"", "iPad Pro 12.9\"", "iPad Air"], "types": ["tablet"], "years": [2020, 2021, 2022, 2023, 2024]}',
    '[
        {"name": "Heat Gun", "required": true},
        {"name": "Plastic Prying Tools", "required": true},
        {"name": "Suction Cups", "required": true},
        {"name": "Phillips #00 Screwdriver", "required": true},
        {"name": "Adhesive Strips", "required": true}
    ]',
    '[
        {"name": "iPad Screen Digitizer", "part_number": "IPAD-SCREEN", "quantity": 1, "cost_estimate": 129.99},
        {"name": "Adhesive Kit", "part_number": "IPAD-ADH", "quantity": 1, "cost_estimate": 18.99}
    ]',
    'This procedure involves carefully removing the damaged screen digitizer while preserving the LCD panel underneath, then installing a new digitizer with proper adhesive application.',
    '["Work slowly with heat application", "Protect LCD panel from damage", "Handle flex cables with extreme care", "Ensure proper sealing for protection"]',
    'Test multi-touch functionality, Apple Pencil compatibility (if applicable), and edge touch sensitivity. Verify Face ID or Touch ID functionality depending on model.',
    'published', 4.4, 91.7,
    '{"iPad", "Pro", "Air", "screen", "digitizer", "touch", "cracked", "glass", "replacement"}',
    '{"screen_damage", "touch_malfunction", "display_issues"}',
    '{"tablet_repair", "apple_device", "screen_replacement", "advanced_repair"}'
);

-- ====================================================================
-- DIAGNOSTIC PROCEDURES
-- ====================================================================

-- General Smartphone Diagnostic
INSERT INTO repair_procedures (
    title, description, difficulty_level, estimated_time_minutes, repair_type,
    device_compatibility, tools_required, parts_required, overview,
    safety_warnings, completion_tips, status, quality_score, success_rate,
    ai_keywords, problem_categories, diagnostic_tags
) VALUES (
    'Comprehensive Smartphone Diagnostic',
    'Systematic diagnostic procedure to identify hardware and software issues in smartphones across all major brands.',
    1, 20, 'diagnostic',
    '{"brands": ["*"], "models": ["*"], "types": ["smartphone"], "years": [2018, 2019, 2020, 2021, 2022, 2023, 2024]}',
    '[
        {"name": "Multimeter", "required": true},
        {"name": "Diagnostic Cables", "required": true},
        {"name": "Testing Software", "required": true}
    ]',
    '[]',
    'This diagnostic procedure provides a systematic approach to identifying common smartphone issues including battery, charging, display, audio, and connectivity problems.',
    '["Ensure device safety before testing", "Use proper testing procedures", "Document all findings"]',
    'Provide clear diagnosis report with recommended repairs and cost estimates. Include urgency level and repair complexity assessment.',
    'published', 4.9, 99.1,
    '{"diagnostic", "testing", "troubleshooting", "assessment", "smartphone", "problem", "identification"}',
    '{"diagnostic", "assessment", "troubleshooting"}',
    '{"smartphone_repair", "diagnostic", "assessment", "basic_procedure"}'
);

-- ====================================================================
-- DETAILED PROCEDURE STEPS
-- ====================================================================

-- Add steps for iPhone 15 Pro Screen Replacement
INSERT INTO procedure_steps (procedure_id, step_number, title, description, estimated_duration_minutes, difficulty_rating, caution_level, step_group, tips_and_tricks, common_mistakes) VALUES
(1, 1, 'Power Down and Remove SIM', 'Completely power off the iPhone and remove the SIM card tray using the ejection tool.', 2, 1, 'low', 'preparation', 'Take a photo of the SIM tray orientation for reference.', 'Never attempt repair on a powered device.'),
(1, 2, 'Remove Pentalobe Screws', 'Remove the two pentalobe screws at the bottom of the device using a P2 screwdriver.', 3, 2, 'medium', 'disassembly', 'Keep screws organized - they are different lengths.', 'Using wrong screwdriver size can strip screws.'),
(1, 3, 'Apply Heat to Soften Adhesive', 'Use heat gun on low setting to warm the edges of the screen for 90 seconds.', 5, 2, 'high', 'disassembly', 'Move heat gun constantly to avoid hot spots.', 'Too much heat can damage battery or internal components.'),
(1, 4, 'Create Initial Opening', 'Use suction cup and plastic picks to create opening at bottom edge of screen.', 8, 3, 'high', 'disassembly', 'Work slowly and apply consistent pressure.', 'Forcing too quickly can crack the screen further.'),
(1, 5, 'Disconnect Display Cables', 'Carefully disconnect the display flex cables after removing cable covers.', 10, 4, 'critical', 'disassembly', 'Use plastic spudger only - never metal tools.', 'Damaged flex cables require logic board repair.'),
(1, 6, 'Remove Damaged Screen', 'Lift away the damaged screen assembly completely.', 2, 2, 'low', 'disassembly', 'Check for any remaining adhesive on frame.', 'Save any reusable components like brackets.'),
(1, 7, 'Prepare New Screen', 'Remove protective films and prepare new screen assembly for installation.', 5, 2, 'medium', 'reassembly', 'Handle new screen with clean hands only.', 'Fingerprints under screen are permanent.'),
(1, 8, 'Connect Display Cables', 'Reconnect all display flex cables in reverse order of removal.', 8, 4, 'critical', 'reassembly', 'Ensure cables are fully seated before closing.', 'Partially connected cables cause intermittent issues.'),
(1, 9, 'Test Functionality', 'Power on device and test all screen functions before final assembly.', 10, 3, 'medium', 'testing', 'Test touch, Face ID, True Tone, and brightness.', 'Skipping testing leads to repeat repairs.'),
(1, 10, 'Apply New Adhesive', 'Install new adhesive gaskets around the perimeter of the device.', 8, 3, 'medium', 'reassembly', 'Clean all old adhesive residue first.', 'Poor adhesive seal compromises water resistance.'),
(1, 11, 'Final Assembly', 'Carefully press screen into place and reinstall pentalobe screws.', 5, 2, 'low', 'reassembly', 'Apply even pressure around entire perimeter.', 'Overtightening screws can crack the frame.');

-- Add steps for Samsung Galaxy S24 Battery Replacement
INSERT INTO procedure_steps (procedure_id, step_number, title, description, estimated_duration_minutes, difficulty_rating, caution_level, step_group, tips_and_tricks, common_mistakes) VALUES
(2, 1, 'Power Down Device', 'Completely shut down the Galaxy S24 and remove any attached accessories.', 2, 1, 'low', 'preparation', 'Ensure battery is below 50% charge for safety.', 'Never work on device with full battery.'),
(2, 2, 'Remove Back Cover', 'Use heat gun and plastic tools to carefully remove the back glass panel.', 15, 3, 'high', 'disassembly', 'Work from corners where adhesive is weakest.', 'Cracking back glass makes reassembly difficult.'),
(2, 3, 'Disconnect Battery Connector', 'Locate and disconnect the main battery connector using plastic spudger.', 3, 2, 'critical', 'disassembly', 'This is the first step after opening - critical for safety.', 'Skipping this step can cause electrical damage.'),
(2, 4, 'Remove Battery Adhesive', 'Carefully pull adhesive tabs to release battery from housing.', 12, 3, 'medium', 'disassembly', 'Pull tabs slowly and steadily - avoid breaking.', 'Broken tabs require careful prying with risk of puncture.'),
(2, 5, 'Lift Out Old Battery', 'Remove the old battery completely from device housing.', 3, 2, 'medium', 'disassembly', 'Support battery evenly to avoid bending.', 'Bent batteries can be dangerous - handle carefully.'),
(2, 6, 'Install New Battery', 'Place new battery in housing ensuring proper alignment.', 5, 2, 'medium', 'reassembly', 'Verify battery orientation matches original.', 'Wrong orientation can damage charging circuit.'),
(2, 7, 'Apply New Adhesive', 'Install new adhesive strips to secure battery in place.', 8, 2, 'low', 'reassembly', 'Remove backing from adhesive just before installation.', 'Old adhesive residue prevents proper bonding.'),
(2, 8, 'Reconnect Battery', 'Carefully reconnect the main battery connector.', 3, 2, 'medium', 'reassembly', 'Ensure connection is fully seated and secure.', 'Loose connection causes charging issues.'),
(2, 9, 'Test Charging', 'Connect charger and verify proper charging function before closing.', 5, 1, 'low', 'testing', 'Test both wired and wireless charging if applicable.', 'Skipping test can result in non-functional device.'),
(2, 10, 'Reinstall Back Cover', 'Apply new adhesive and carefully reinstall back glass panel.', 10, 3, 'medium', 'reassembly', 'Ensure all edges are properly sealed.', 'Poor seal compromises water resistance.');

-- ====================================================================
-- DIAGNOSTIC RULES FOR AI INTEGRATION
-- ====================================================================

INSERT INTO diagnostic_rules (rule_name, device_types, symptom_keywords, problem_category, confidence_threshold, condition_logic, recommended_procedures, priority_score, success_rate) VALUES
('iPhone Screen Damage Detection', '{"smartphone"}', '{"cracked", "broken", "shattered", "display", "screen", "touch", "black"}', 'screen_damage', 0.8, '{"conditions": [{"type": "keyword_match", "patterns": ["crack", "break", "shatter"]}, {"type": "device_match", "brands": ["Apple"]}]}', '{1}', 90, 94.2),
('Samsung Battery Issues', '{"smartphone"}', '{"battery", "drain", "charging", "power", "dead", "swelling"}', 'battery_issues', 0.75, '{"conditions": [{"type": "keyword_match", "patterns": ["battery", "charging", "power"]}, {"type": "device_match", "brands": ["Samsung"]}]}', '{2}', 85, 96.8),
('Laptop Keyboard Problems', '{"laptop"}', '{"keyboard", "keys", "sticky", "typing", "input", "letters"}', 'keyboard_malfunction', 0.7, '{"conditions": [{"type": "keyword_match", "patterns": ["keyboard", "keys", "typing"]}, {"type": "device_match", "types": ["laptop"]}]}', '{3}', 75, 87.5),
('Charging Port Issues', '{"smartphone", "tablet"}', '{"charging", "cable", "port", "connection", "loose", "not charging"}', 'charging_problems', 0.8, '{"conditions": [{"type": "keyword_match", "patterns": ["charging", "port", "cable"]}, {"type": "device_match", "types": ["smartphone", "tablet"]}]}', '{4}', 95, 98.5);

-- ====================================================================
-- SAMPLE FEEDBACK DATA
-- ====================================================================

INSERT INTO procedure_feedback (procedure_id, rating, was_successful, actual_time_minutes, difficulty_rating, feedback_text, feedback_source, technician_level) VALUES
(1, 5, true, 85, 4, 'Excellent procedure. Clear steps and accurate time estimate. Face ID worked perfectly after repair.', 'technician', 'expert'),
(1, 4, true, 95, 4, 'Good procedure but needed more detail on adhesive removal. Otherwise successful repair.', 'technician', 'intermediate'),
(2, 5, true, 55, 3, 'Battery replacement went smoothly. Customer reported excellent battery life afterward.', 'technician', 'intermediate'),
(4, 5, true, 25, 2, 'Simple cleaning procedure that solved charging issues immediately. Great success rate.', 'technician', 'beginner');

-- Update procedure quality scores based on feedback
UPDATE repair_procedures SET 
    quality_score = (SELECT AVG(rating) FROM procedure_feedback WHERE procedure_feedback.procedure_id = repair_procedures.id),
    view_count = FLOOR(RANDOM() * 100) + 10
WHERE id IN (1, 2, 3, 4, 5, 6);

COMMENT ON TABLE repair_procedures IS 'Phase 3 Knowledge Base: Comprehensive repair procedures with AI integration';