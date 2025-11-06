<?php
// generate_inserts.php - Generate proper INSERT statements

$passwords = [
    'corina' => '$C0r1n4',
    'dana' => '#D4n4G',
    'daniela' => '@D4n4P',
    'alexandra' => '!Al3x4',
    'stefan' => '&St3f'
];

echo "=== SQL INSERT STATEMENTS ===\n";
echo "Copy and run these in your MySQL database:\n\n";
echo "-- First, clear any existing users (OPTIONAL - only if you want to start fresh)\n";
echo "-- TRUNCATE TABLE users;\n\n";

foreach ($passwords as $user => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $role = ($user === 'stefan') ? 'admin' : 'therapist';
    
    // Escape single quotes in hash if any
    $hash_escaped = str_replace("'", "''", $hash);
    
    echo "INSERT INTO users (id, username, password_hash, role) VALUES ('$user', '$user', '$hash_escaped', '$role');\n";
}

echo "\n\n=== OR Use this single statement: ===\n\n";
echo "INSERT INTO users (id, username, password_hash, role) VALUES\n";

$inserts = [];
foreach ($passwords as $user => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $role = ($user === 'stefan') ? 'admin' : 'therapist';
    $hash_escaped = str_replace("'", "''", $hash);
    $inserts[] = "('$user', '$user', '$hash_escaped', '$role')";
}

echo implode(",\n", $inserts) . ";\n";

echo "\n\n=== VERIFICATION ===\n";
echo "After running the above SQL, verify with this PHP code:\n\n";

foreach ($passwords as $user => $password) {
    echo "// Test $user\n";
    echo "\$hash = password_hash('$password', PASSWORD_DEFAULT);\n";
    echo "\$verify = password_verify('$password', \$hash);\n";
    echo "echo '$user: ' . (\$verify ? 'OK' : 'FAILED') . \"\\n\";\n\n";
}
?>