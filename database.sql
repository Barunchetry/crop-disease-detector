-- ============================================
-- CROP DISEASE DETECTOR - DATABASE SCHEMA
-- Created for BCA Final Year Project
-- ============================================

CREATE DATABASE IF NOT EXISTS crop_disease_db;
USE crop_disease_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crops Table
CREATE TABLE IF NOT EXISTS crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    local_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    icon VARCHAR(10)
);

-- Diseases Table
CREATE TABLE IF NOT EXISTS diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT,
    disease_name VARCHAR(150) NOT NULL,
    symptoms TEXT NOT NULL,
    cause TEXT,
    severity ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    treatment TEXT NOT NULL,
    prevention TEXT,
    organic_remedy TEXT,
    chemical_remedy TEXT,
    image_example VARCHAR(255),
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Detections Table (scan history)
CREATE TABLE IF NOT EXISTS detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    crop_name VARCHAR(100),
    image_path VARCHAR(255),
    detected_disease VARCHAR(150),
    confidence_score DECIMAL(5,2),
    severity VARCHAR(20),
    treatment_given TEXT,
    location VARCHAR(100),
    weather_condition VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detection_id INT,
    user_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    was_accurate TINYINT(1),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detection_id) REFERENCES detections(id) ON DELETE CASCADE
);

-- Expert Tips Table
CREATE TABLE IF NOT EXISTS expert_tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    season VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO crops (name, local_name, category, icon) VALUES
('Rice', 'Dhan', 'Cereal', '🌾'),
('Wheat', 'Gom', 'Cereal', '🌿'),
('Tomato', 'Tamatar', 'Vegetable', '🍅'),
('Potato', 'Aloo', 'Vegetable', '🥔'),
('Maize', 'Bhutta', 'Cereal', '🌽'),
('Mustard', 'Sarson', 'Oilseed', '🌼'),
('Jute', 'Pat', 'Fiber', '🪴'),
('Tea', 'Cha', 'Plantation', '🍃');

INSERT INTO diseases (crop_id, disease_name, symptoms, cause, severity, treatment, prevention, organic_remedy, chemical_remedy) VALUES
(1, 'Rice Blast', 'Diamond-shaped lesions on leaves, white to gray centers with brown borders, neck rot causing panicle to fall', 'Fungus: Magnaporthe oryzae', 'High', 'Apply Tricyclazole or Isoprothiolane fungicide. Remove and burn infected plants immediately.', 'Use resistant varieties. Avoid excess nitrogen fertilizer. Maintain proper water management.', 'Spray neem oil solution (2%) every 7 days. Apply wood ash around plants.', 'Tricyclazole 75WP @ 0.6g/L or Carbendazim 50WP @ 1g/L'),
(1, 'Brown Plant Hopper', 'Yellowing and browning of plants (hopperburn), plants dry out in circular patches', 'Insect: Nilaparvata lugens', 'Critical', 'Drain field for 3-4 days. Apply Buprofezin or Imidacloprid. Avoid over-use of nitrogen.', 'Use resistant varieties. Avoid flooding seedbeds. Conserve natural enemies.', 'Mix 5g tobacco leaves in 1L water, spray on base of plant.', 'Imidacloprid 17.8SL @ 0.25ml/L or Buprofezin 25SC @ 1ml/L'),
(3, 'Tomato Early Blight', 'Dark brown spots with concentric rings (target pattern) on older leaves, yellowing around spots', 'Fungus: Alternaria solani', 'Medium', 'Remove infected leaves. Apply Mancozeb or Chlorothalonil fungicide every 7-10 days.', 'Crop rotation. Stake plants for air circulation. Water at base, not on leaves.', 'Baking soda spray (1 tsp per liter). Compost tea spray.', 'Mancozeb 75WP @ 2g/L or Chlorothalonil 75WP @ 2g/L'),
(3, 'Tomato Late Blight', 'Water-soaked lesions on leaves turning brown-black, white mold under leaves in humid conditions, fruit rot', 'Fungus: Phytophthora infestans', 'Critical', 'Remove all infected parts immediately. Apply Metalaxyl + Mancozeb. Avoid overhead irrigation.', 'Plant resistant varieties. Ensure good drainage. Avoid planting near potato fields.', 'Spray copper sulfate solution (0.5%). Remove affected plants promptly.', 'Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L'),
(4, 'Potato Late Blight', 'Brown-black lesions on leaves and stems, tuber rot with reddish-brown discoloration inside', 'Fungus: Phytophthora infestans', 'Critical', 'Destroy infected plants. Apply Metalaxyl-based fungicide. Harvest early if disease is spreading.', 'Certified disease-free seed. Hill up soil around plants. Avoid waterlogging.', 'Spray Bordeaux mixture (1%). Remove volunteer potato plants.', 'Metalaxyl + Mancozeb @ 2.5g/L or Cymoxanil 8% + Mancozeb 64%'),
(2, 'Wheat Rust', 'Orange-red powdery pustules on leaves and stems (stem rust), yellow stripes (yellow rust)', 'Fungus: Puccinia species', 'High', 'Apply Propiconazole or Tebuconazole at first sign. Repeat after 15 days if needed.', 'Use rust-resistant varieties. Early sowing. Remove alternate hosts (barberry).', 'Sulfur dust application. Garlic extract spray.', 'Propiconazole 25EC @ 0.1% or Tebuconazole 25WG @ 1g/L');

INSERT INTO expert_tips (title, content, category, season) VALUES
('Early Morning Inspection', 'Walk your fields every morning. Diseases spread fastest at night when humidity is high. Early detection can save 80% of your crop.', 'Prevention', 'All Season'),
('The 5-Plant Rule', 'Check at least 5 random plants in different areas of your field. One sick plant in a corner means many more are affected nearby.', 'Detection', 'All Season'),
('Monsoon Spray Schedule', 'During monsoon, preventive fungicide spray every 10-12 days is crucial for rice and vegetables. Do not skip even if plants look healthy.', 'Treatment', 'Kharif'),
('Neem Oil Solution', 'Mix 5ml neem oil + 2ml liquid soap + 1L water. Spray in evening. Works against 200+ pests and fungal diseases organically.', 'Organic', 'All Season');