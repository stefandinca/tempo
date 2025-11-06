<?php
// check_database.php - See what's in your users table

// CONFIGURE YOUR DATABASE CONNECTION HERE:
$host = 'localhost';
$dbname = 'stefand1_tempo_db'; // CHANGE THIS
$db_username = 'stefand1_tempo'; // CHANGE THIS
$db_password = 'livebetterlife'; // CHANGE THIS

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $db_username, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Database connection successful!\n\n";
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() === 0) {
        echo "✗ ERROR: 'users' table does NOT exist!\n";
        echo "You need to create it first:\n\n";
        echo "CREATE TABLE users (\n";
        echo "    id VARCHAR(50) PRIMARY KEY,\n";
        echo "    username VARCHAR(50) UNIQUE NOT NULL,\n";
        echo "    password_hash VARCHAR(255) NOT NULL,\n";
        echo "    role VARCHAR(50),\n";
        echo "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n";
        echo ");\n";
        exit;
    }
    
    echo "✓ 'users' table exists!\n\n";
    
    // Get all users
    echo "=== USERS IN DATABASE ===\n\n";
    $stmt = $pdo->query("SELECT id, username, password_hash, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) === 0) {
        echo "✗ No users found in database!\n";
        echo "You need to insert users with hashed passwords.\n";
        exit;
    }
    
    foreach ($users as $user) {
        echo "User ID: " . $user['id'] . "\n";
        echo "Username: " . $user['username'] . "\n";
        echo "Role: " . $user['role'] . "\n";
        echo "Password Hash: " . substr($user['password_hash'], 0, 50) . "...\n";
        echo "Hash Length: " . strlen($user['password_hash']) . " characters\n";
        echo "Hash starts with: " . substr($user['password_hash'], 0, 7) . "\n";
        echo "\n";
    }
    
    echo "\n=== PASSWORD VERIFICATION TEST ===\n\n";
    
    // Test passwords
    $test_passwords = [
        'corina' => '$C0r1n4',
        'dana' => '#D4n4G',
        'daniela' => '@D4n4P',
        'alexandra' => '!Al3x4',
        'stefan' => '&St3f'
    ];
    
    foreach ($test_passwords as $username => $password) {
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $verify = password_verify($password, $user['password_hash']);
            echo "User: $username\n";
            echo "Password: $password\n";
            echo "Result: " . ($verify ? "✓ PASSWORD CORRECT" : "✗ PASSWORD INCORRECT") . "\n";
            
            if (!$verify) {
                echo "  → The hash in database does NOT match this password!\n";
                echo "  → You may need to regenerate and update the hash.\n";
            }
            echo "\n";
        } else {
            echo "User: $username - ✗ NOT FOUND in database\n\n";
        }
    }
    
} catch (PDOException $e) {
    echo "✗ Database connection FAILED: " . $e->getMessage() . "\n";
}
?>