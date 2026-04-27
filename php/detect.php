<?php
// ============================================
// CROP DISEASE DETECTION ENGINE
// crop-disease-detector/php/detect.php
// ============================================

require_once 'config.php';

header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    // ---- ANALYZE IMAGE ----
    case 'analyze':
        // Accept guest scans too — no login required for demo
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(false, 'No image uploaded or upload error.');
        }

        $file     = $_FILES['image'];
        $cropName = sanitize($_POST['crop'] ?? 'Unknown');
        $location = sanitize($_POST['location'] ?? '');

        // Validate file
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, ALLOWED_TYPES)) {
            jsonResponse(false, 'Only JPG, PNG and WebP images are allowed.');
        }
        if ($file['size'] > MAX_FILE_SIZE) {
            jsonResponse(false, 'Image too large. Maximum size is 5MB.');
        }

        // Save image
        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'scan_' . time() . '_' . uniqid() . '.' . $ext;
        $savePath = UPLOAD_DIR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $savePath)) {
            jsonResponse(false, 'Failed to save image.');
        }

        // --- Try Plant.id API first ---
        $apiResult = callPlantIdAPI($savePath);

        if ($apiResult['success']) {
            $detected  = $apiResult['disease'];
            $confidence = $apiResult['confidence'];
        } else {
            // Fallback: match from local database by crop name
            $apiResult  = localDatabaseMatch($cropName);
            $detected   = $apiResult['disease'];
            $confidence = $apiResult['confidence'];
        }

        // Fetch full disease details from DB
        $db = getDB();
        $diseaseData = getDiseaseFromDB($db, $detected, $cropName);

        // Save detection record
        $userId = $_SESSION['user_id'] ?? null;
        $stmt = $db->prepare("INSERT INTO detections (user_id, crop_name, image_path, detected_disease, confidence_score, severity, treatment_given, location) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->bind_param(
            "isssdsss",
            $userId, $cropName, $filename, $detected,
            $confidence, $diseaseData['severity'],
            $diseaseData['treatment'], $location
        );
        $stmt->execute();
        $detectionId = $db->insert_id;

        jsonResponse(true, 'Analysis complete', [
            'detection_id' => $detectionId,
            'image'        => 'uploads/' . $filename,
            'crop'         => $cropName,
            'disease'      => $diseaseData,
            'confidence'   => $confidence,
            'tips'         => getRandomTips($db)
        ]);
        break;

    // ---- GET HISTORY ----
    case 'history':
        requireLogin();
        $db   = getDB();
        $uid  = $_SESSION['user_id'];
        $stmt = $db->prepare("SELECT * FROM detections WHERE user_id = ? ORDER BY detected_at DESC LIMIT 20");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse(true, 'History fetched', ['history' => $rows]);
        break;

    // ---- GET ALL CROPS ----
    case 'crops':
        $db   = getDB();
        $res  = $db->query("SELECT * FROM crops ORDER BY name");
        $data = $res->fetch_all(MYSQLI_ASSOC);
        jsonResponse(true, 'Crops fetched', ['crops' => $data]);
        break;

    // ---- GET DISEASES BY CROP ----
    case 'diseases':
        $cropId = intval($_GET['crop_id'] ?? 0);
        $db     = getDB();
        $stmt   = $db->prepare("SELECT d.*, c.name as crop_name FROM diseases d JOIN crops c ON d.crop_id = c.id WHERE d.crop_id = ?");
        $stmt->bind_param("i", $cropId);
        $stmt->execute();
        $data = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse(true, 'Diseases fetched', ['diseases' => $data]);
        break;

    // ---- SUBMIT FEEDBACK ----
    case 'feedback':
        $detId    = intval($_POST['detection_id'] ?? 0);
        $rating   = intval($_POST['rating'] ?? 0);
        $accurate = intval($_POST['accurate'] ?? 0);
        $comment  = sanitize($_POST['comment'] ?? '');
        $userId   = $_SESSION['user_id'] ?? null;

        $db   = getDB();
        $stmt = $db->prepare("INSERT INTO feedback (detection_id, user_id, rating, comment, was_accurate) VALUES (?,?,?,?,?)");
        $stmt->bind_param("iiisi", $detId, $userId, $rating, $comment, $accurate);
        $stmt->execute();
        jsonResponse(true, 'Thank you for your feedback!');
        break;

    // ---- STATS ----
    case 'stats':
        $db = getDB();
        $total     = $db->query("SELECT COUNT(*) as c FROM detections")->fetch_assoc()['c'];
        $users     = $db->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
        $diseases  = $db->query("SELECT COUNT(*) as c FROM diseases")->fetch_assoc()['c'];
        $topDisease = $db->query("SELECT detected_disease, COUNT(*) as cnt FROM detections GROUP BY detected_disease ORDER BY cnt DESC LIMIT 1")->fetch_assoc();
        jsonResponse(true, 'Stats', [
            'total_scans'   => $total,
            'total_users'   => $users,
            'diseases_in_db'=> $diseases,
            'top_disease'   => $topDisease
        ]);
        break;

    default:
        jsonResponse(false, 'Invalid action.');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function callPlantIdAPI($imagePath) {
    if (PLANT_ID_API_KEY === 'YOUR_API_KEY_HERE') {
        return ['success' => false];
    }
    $imageData = base64_encode(file_get_contents($imagePath));
    $payload   = json_encode([
        'images'     => [$imageData],
        'modifiers'  => ['crops_fast'],
        'disease_details' => ['description', 'treatment']
    ]);
    $ch = curl_init(PLANT_ID_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Api-Key: ' . PLANT_ID_API_KEY
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (isset($data['health_assessment']['diseases'][0])) {
        $top = $data['health_assessment']['diseases'][0];
        return [
            'success'    => true,
            'disease'    => $top['name'],
            'confidence' => round($top['probability'] * 100, 1)
        ];
    }
    return ['success' => false];
}

function localDatabaseMatch($cropName) {
    // Demo fallback when API key not set
    $demoResults = [
        'Rice'   => ['disease' => 'Rice Blast',         'confidence' => 87.4],
        'Tomato' => ['disease' => 'Tomato Early Blight', 'confidence' => 82.1],
        'Potato' => ['disease' => 'Potato Late Blight',  'confidence' => 79.6],
        'Wheat'  => ['disease' => 'Wheat Rust',          'confidence' => 85.3],
    ];
    return $demoResults[$cropName] ?? ['disease' => 'Unknown Disease', 'confidence' => 60.0];
}

function getDiseaseFromDB($db, $diseaseName, $cropName) {
    $stmt = $db->prepare("SELECT d.*, c.name as crop_name FROM diseases d JOIN crops c ON d.crop_id = c.id WHERE d.disease_name LIKE ? OR c.name LIKE ? LIMIT 1");
    $like = "%$diseaseName%";
    $cropLike = "%$cropName%";
    $stmt->bind_param("ss", $like, $cropLike);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result) return $result;

    // Default if no match
    return [
        'disease_name'   => $diseaseName,
        'symptoms'       => 'Unusual spots, discoloration, or wilting observed on the plant.',
        'cause'          => 'Fungal, bacterial, or environmental stress.',
        'severity'       => 'Medium',
        'treatment'      => 'Consult a local agricultural extension officer for accurate diagnosis.',
        'prevention'     => 'Practice crop rotation and use certified seeds.',
        'organic_remedy' => 'Neem oil spray (2%) as general preventive.',
        'chemical_remedy'=> 'Consult a licensed agrochemical dealer.',
        'crop_name'      => $cropName
    ];
}

function getRandomTips($db) {
    $res  = $db->query("SELECT * FROM expert_tips ORDER BY RAND() LIMIT 2");
    return $res->fetch_all(MYSQLI_ASSOC);
}
?>