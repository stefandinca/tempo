<?php
// Activează raportarea erorilor pentru a vedea problemele
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = '127.0.0.1'; // sau 'localhost'
$db   = 'incjzljm_tempo_demo'; // Numele bazei de date create în cPanel
$user = 'incjzljm_tempo_demo'; // Utilizatorul creat în cPanel
$pass = 'tempodemopass'; // Parola pe care ai salvat-o
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Trimite un răspuns de eroare JSON dacă conexiunea eșuează
     http_response_code(500);
     header('Content-Type: application/json');
     echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
     exit;
}
?>