<?php
/**
 * Authentication API
 * Handles user login, registration, and session management
 */

// Start session
session_start();

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
$usersFile = __DIR__ . '/users.json';

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Read users from file
 */
function readUsers($usersFile) {
    if (!file_exists($usersFile)) {
        return [];
    }

    $content = file_get_contents($usersFile);
    $users = json_decode($content, true);
    return is_array($users) ? $users : [];
}

/**
 * Write users to file
 */
function writeUsers($usersFile, $users) {
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($usersFile, $json) !== false;
}

/**
 * Validate email format
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password strength
 * At least 8 characters, one uppercase letter, one number
 */
function validatePassword($password) {
    if (strlen($password) < 8) {
        return false;
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return false;
    }
    if (!preg_match('/[0-9]/', $password)) {
        return false;
    }
    return true;
}

/**
 * Hash password securely
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password against hash
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Find user by email
 */
function findUserByEmail($users, $email) {
    foreach ($users as $user) {
        if (isset($user['email']) && strtolower($user['email']) === strtolower($email)) {
            return $user;
        }
    }
    return null;
}

/**
 * Generate unique user ID
 */
function generateUserId() {
    return 'user_' . uniqid() . '_' . bin2hex(random_bytes(4));
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$input = json_decode(file_get_contents('php://input'), true);

// Route requests
try {
    switch ($action) {
        case 'register':
            if ($method !== 'POST') {
                sendResponse(['success' => false, 'message' => 'Invalid method'], 405);
            }

            // Validate input
            if (!isset($input['name']) || !isset($input['email']) || !isset($input['password'])) {
                sendResponse(['success' => false, 'message' => 'Toate campurile sunt obligatorii']);
            }

            $name = trim($input['name']);
            $email = trim($input['email']);
            $password = $input['password'];

            // Validate name
            if (empty($name) || strlen($name) < 2) {
                sendResponse(['success' => false, 'message' => 'Numele trebuie sa contina minim 2 caractere']);
            }

            // Validate email
            if (!validateEmail($email)) {
                sendResponse(['success' => false, 'message' => 'Email invalid']);
            }

            // Validate password
            if (!validatePassword($password)) {
                sendResponse(['success' => false, 'message' => 'Parola trebuie sa contina minim 8 caractere, o litera mare si o cifra']);
            }

            // Check if user already exists
            $users = readUsers($usersFile);
            if (findUserByEmail($users, $email)) {
                sendResponse(['success' => false, 'message' => 'Un utilizator cu acest email exista deja']);
            }

            // Create new user
            $newUser = [
                'id' => generateUserId(),
                'name' => $name,
                'email' => $email,
                'password' => hashPassword($password),
                'role' => 'admin', // Default role
                'created_at' => date('Y-m-d H:i:s'),
                'last_login' => null
            ];

            $users[] = $newUser;

            // Save to file
            if (writeUsers($usersFile, $users)) {
                sendResponse(['success' => true, 'message' => 'Inregistrare reusita']);
            } else {
                sendResponse(['success' => false, 'message' => 'Eroare la salvarea datelor']);
            }
            break;

        case 'login':
            if ($method !== 'POST') {
                sendResponse(['success' => false, 'message' => 'Invalid method'], 405);
            }

            // Validate input
            if (!isset($input['email']) || !isset($input['password'])) {
                sendResponse(['success' => false, 'message' => 'Email si parola sunt obligatorii']);
            }

            $email = trim($input['email']);
            $password = $input['password'];

            // Validate email format
            if (!validateEmail($email)) {
                sendResponse(['success' => false, 'message' => 'Email invalid']);
            }

            // Find user
            $users = readUsers($usersFile);
            $user = findUserByEmail($users, $email);

            if (!$user) {
                sendResponse(['success' => false, 'message' => 'Email sau parola incorecte']);
            }

            // Verify password
            if (!verifyPassword($password, $user['password'])) {
                sendResponse(['success' => false, 'message' => 'Email sau parola incorecte']);
            }

            // Update last login
            for ($i = 0; $i < count($users); $i++) {
                if (isset($users[$i]['id']) && $users[$i]['id'] === $user['id']) {
                    $users[$i]['last_login'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            writeUsers($usersFile, $users);

            // Create session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['logged_in'] = true;

            sendResponse([
                'success' => true,
                'message' => 'Autentificare reusita',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]);
            break;

        case 'logout':
            // Destroy session
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            session_destroy();

            sendResponse(['success' => true, 'message' => 'Deconectare reusita']);
            break;

        case 'check':
            // Check if user is logged in
            if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
                sendResponse([
                    'success' => true,
                    'logged_in' => true,
                    'user' => [
                        'id' => $_SESSION['user_id'],
                        'name' => $_SESSION['user_name'],
                        'email' => $_SESSION['user_email'],
                        'role' => $_SESSION['user_role']
                    ]
                ]);
            } else {
                sendResponse(['success' => false, 'logged_in' => false]);
            }
            break;

        default:
            sendResponse(['success' => false, 'message' => 'Invalid action'], 404);
    }

} catch (Exception $e) {
    error_log('Auth error: ' . $e->getMessage());
    sendResponse(['success' => false, 'message' => 'Eroare server'], 500);
}
?>
