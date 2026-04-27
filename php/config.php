<?php
// ============================================
// DATABASE CONFIGURATION
// crop-disease-detector/php/config.php
// ============================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Change for production
define('DB_PASS', '');            // Change for production
define('DB_NAME', 'crop_disease_db');

// Upload settings
define('UPLOAD_DIR', '../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// Plant.id API (Free tier — get key at plant.id)
define('PLANT_ID_API_KEY', 'YOUR_API_KEY_HERE');
define('PLANT_ID_API_URL', 'https://api.plant.id/v2/health_assessment');

// OpenWeather API (Free — get key at openweathermap.org)
define('WEATHER_API_KEY', 'YOUR_OPENWEATHER_KEY_HERE');

// Session start
session_start();

// Database connection
function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// JSON response helper
function jsonResponse($success, $message, $data = []) {
    header('Content-Type: application/json');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

// Sanitize input
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

// Auth check
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, 'Please login to continue', ['redirect' => 'login']);
    }
}
?>