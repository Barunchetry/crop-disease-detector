<?php
// ============================================
// AUTH HANDLER
// crop-disease-detector/php/auth.php
// ============================================

require_once 'config.php';

$action = $_POST['action'] ?? '';

switch ($action) {

    // ---- REGISTER ----
    case 'register':
        $name     = sanitize($_POST['name'] ?? '');
        $email    = sanitize($_POST['email'] ?? '');
        $phone    = sanitize($_POST['phone'] ?? '');
        $location = sanitize($_POST['location'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$name || !$email || !$password) {
            jsonResponse(false, 'Name, email and password are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, 'Invalid email address.');
        }
        if (strlen($password) < 6) {
            jsonResponse(false, 'Password must be at least 6 characters.');
        }

        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            jsonResponse(false, 'This email is already registered.');
        }

        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (name, email, phone, password, location) VALUES (?,?,?,?,?)");
        $stmt->bind_param("sssss", $name, $email, $phone, $hashed, $location);

        if ($stmt->execute()) {
            $_SESSION['user_id']   = $db->insert_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;
            jsonResponse(true, 'Registration successful! Welcome, ' . $name, ['name' => $name]);
        } else {
            jsonResponse(false, 'Registration failed. Try again.');
        }
        break;

    // ---- LOGIN ----
    case 'login':
        $email    = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
            jsonResponse(false, 'Email and password are required.');
        }

        $db = getDB();
        $stmt = $db->prepare("SELECT id, name, password FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        if ($result && password_verify($password, $result['password'])) {
            $_SESSION['user_id']   = $result['id'];
            $_SESSION['user_name'] = $result['name'];
            $_SESSION['user_email'] = $email;
            jsonResponse(true, 'Welcome back, ' . $result['name'], ['name' => $result['name']]);
        } else {
            jsonResponse(false, 'Invalid email or password.');
        }
        break;

    // ---- LOGOUT ----
    case 'logout':
        session_destroy();
        jsonResponse(true, 'Logged out successfully.');
        break;

    // ---- CHECK SESSION ----
    case 'check':
        if (isset($_SESSION['user_id'])) {
            jsonResponse(true, 'Logged in', [
                'user_id' => $_SESSION['user_id'],
                'name'    => $_SESSION['user_name'],
                'email'   => $_SESSION['user_email']
            ]);
        } else {
            jsonResponse(false, 'Not logged in');
        }
        break;

    default:
        jsonResponse(false, 'Invalid action.');
}
?>