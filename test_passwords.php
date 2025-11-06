<?php
// Test script to verify password hashing

// Your original passwords
$passwords = [
    'corina' => '$C0r1n4',
    'dana' => '#D4n4G',
    'daniela' => '@D4n4P',
    'alexandra' => '!Al3x4',
    'stefan' => '&St3f'
];

echo "=== GENERATED HASHES ===\n\n";
foreach ($passwords as $user => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "User: $user\n";
    echo "Password: $password\n";
    echo "Hash: $hash\n";
    echo "SQL: INSERT INTO users (id, username, password_hash, role) VALUES ('$user', '$user', '$hash', 'therapist');\n";
    echo "\n";
}

echo "\n=== VERIFICATION TEST ===\n\n";
// Test verification
foreach ($passwords as $user => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $verify = password_verify($password, $hash);
    echo "User: $user - Password: $password - Verify: " . ($verify ? "✓ SUCCESS" : "✗ FAILED") . "\n";
}

echo "\n=== TEST WITH EXISTING HASH ===\n";
echo "If you have a hash from your database, test it here:\n";
echo "Example: Test if password '\$C0r1n4' matches a specific hash\n\n";

// Example test - replace with your actual hash from database
$test_hash = '$2y$10$example...'; // Replace with actual hash from your database
$test_password = '$C0r1n4';
echo "Testing password: $test_password\n";
echo "Against hash: $test_hash\n";
echo "Result: " . (password_verify($test_password, $test_hash) ? "✓ MATCH" : "✗ NO MATCH") . "\n";
?>