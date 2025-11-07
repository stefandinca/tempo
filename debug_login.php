<?php
// Debug login script - add this temporarily to your api.php to see what's happening

if ($_GET['action'] === 'login') {
    // Log everything for debugging
    error_log("=== LOGIN ATTEMPT DEBUG ===");
    error_log("POST data: " . print_r($_POST, true));
    
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    error_log("Username: " . $username);
    error_log("Password: " . $password);
    error_log("Password length: " . strlen($password));
    
    // Your database connection - adjust as needed
    // $pdo = new PDO('mysql:host=localhost;dbname=your_db', 'username', 'password');
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        error_log("User found in database");
        error_log("Stored hash: " . $user['password']);
        error_log("Hash length: " . strlen($user['password']));
        
        $verify_result = password_verify($password, $user['password']);
        error_log("Password verify result: " . ($verify_result ? "TRUE" : "FALSE"));
        
        if ($verify_result) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            
            error_log("Login successful for: " . $username);
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            error_log("Password verification FAILED for: " . $username);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } else {
        error_log("User NOT FOUND: " . $username);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    exit;
}
?>