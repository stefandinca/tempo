<?php
$passwords = [
    'corina' => '$C0r1n4',
    'dana' => '#D4n4G',
    'daniela' => '@D4n4P',
    'alexandra' => '!Al3x4',
    'stefan' => '&St3f'
];

foreach ($passwords as $user => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "('$user', '$user', '$hash', 'therapist'),\n";
}
?>