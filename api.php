<?php
/**
 * Therapy Calendar API - PHP Backend (MySQL Version)
 * Provides RESTful API for calendar data management
 */

// Erori (dezactivează 'display_errors' în producție)
error_reporting(E_ALL);
ini_set('display_errors', 0); // IMPORTANT: 0 pentru a preveni output-ul HTML în JSON
ini_set('log_errors', 1);

// --- START DEBUG LOGGING ---
/**
 * Scrie un mesaj în fișierul debug.log
 * Asigură-te că fișierul debug.log există și are permisiuni de scriere (ex: 644 sau 666)
 */
function debugLog($message) {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] " . $message . "\n";
    // Folosim error_log pentru o compatibilitate mai bună
    error_log($logEntry, 3, __DIR__ . '/debug.log'); 
}
// --- END DEBUG LOGGING ---


// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Include conexiunea la baza de date
// @ in caz că $pdo este definit deja (deși nu ar trebui)
@include 'db.php'; 

// ---------- Cache control helpers ----------
function setNoCacheHeaders() {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: application/json; charset=utf-8');
}

// Handle preflight requests early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setNoCacheHeaders();
    http_response_code(200);
    exit();
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    setNoCacheHeaders();
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 500) {
    debugLog("EROARE TRIMISĂ CLIENTULUI: " . $message); // Loghează eroarea
    sendResponse(['error' => $message], $statusCode);
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path   = isset($_GET['path']) ? $_GET['path'] : '';
$input  = json_decode(file_get_contents('php://input'), true);

// Loghează cererea (cu excepția GET-urilor simple)
if ($method === 'POST') {
    debugLog("--- Cerere $method pentru $path ---");
    if (json_last_error() !== JSON_ERROR_NONE) {
        debugLog("Eroare la decodarea JSON: " . json_last_error_msg());
    }
}


// Asigură-te că $pdo există
if (!isset($pdo)) {
    sendError('Database connection object is not available.', 500);
}

// Handle login action BEFORE routing
if (isset($_GET['action']) && $_GET['action'] === 'login') {
    try {
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            sendResponse(['success' => false, 'message' => 'Username and password required'], 400);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && $password === $user['password']) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'] ?? 'therapist';
            
            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $_SESSION['role']
                ]
            ]);
        } else {
            sendResponse(['success' => false, 'message' => 'Invalid credentials'], 401);
        }
    } catch (Exception $e) {
        debugLog("Login error: " . $e->getMessage());
        sendError('Login error: ' . $e->getMessage(), 500);
    }
}

// Route requests
try {
    switch ($path) {
        
        // ==========================================================
        // CAZUL 'data' (GET) - Citește totul din DB
        // ==========================================================
        case 'data':
            if ($method === 'GET') {
                $data = [];

                // 1. Obține teamMembers
                $data['teamMembers'] = $pdo->query("SELECT * FROM team_members")->fetchAll();

                // 2. Obține clients
                $data['clients'] = $pdo->query("SELECT * FROM clients")->fetchAll();

                // 3. (MODIFICAT) Obține event_types
                // Convertim TINYINT(1) în boolean pentru JS
                $data['event_types'] = $pdo->query("
                    SELECT id, label, 
                           CAST(isBillable AS UNSIGNED) as isBillable, 
                           CAST(requiresTime AS UNSIGNED) as requiresTime 
                    FROM event_types
                ")->fetchAll(PDO::FETCH_ASSOC);

                // Convertim valorile numerice în boolean
                foreach ($data['event_types'] as &$type) {
                    $type['isBillable'] = (bool)$type['isBillable'];
                    $type['requiresTime'] = (bool)$type['requiresTime'];
                }

                // 4. Obține events și legăturile lor
                $stmt = $pdo->query("
                    SELECT 
                        e.*,
                        e.repeating_json as repeating,
                        GROUP_CONCAT(DISTINCT etm.team_member_id) as teamMemberIds,
                        GROUP_CONCAT(DISTINCT ec.client_id) as clientIds,
                        GROUP_CONCAT(DISTINCT ep.program_id) as programIds
                    FROM events e
                    LEFT JOIN event_team_members etm ON e.id = etm.event_id
                    LEFT JOIN event_clients ec ON e.id = ec.event_id
                    LEFT JOIN event_programs ep ON e.id = ep.event_id
                    GROUP BY e.id
                ");
                
                $events = $stmt->fetchAll();
                
                // Procesează string-urile din GROUP_CONCAT în array-uri
                foreach ($events as &$event) {
                    $event['teamMemberIds'] = $event['teamMemberIds'] ? explode(',', $event['teamMemberIds']) : [];
                    $event['clientIds'] = $event['clientIds'] ? explode(',', $event['clientIds']) : [];
                    $event['programIds'] = $event['programIds'] ? explode(',', $event['programIds']) : [];
                    $event['repeating'] = $event['repeating'] ? array_map('intval', json_decode($event['repeating'])) : [];
                    $event['attendance'] = $event['attendance'] ? json_decode($event['attendance'], true) : new stdClass();
                    $event['isPublic'] = (bool)$event['isPublic'];
                    $event['isBillable'] = (bool)$event['isBillable'];
                    
                    if (!empty($event['startTime'])) {
                        if (strlen($event['startTime']) > 5) {
                            $event['startTime'] = substr($event['startTime'], 0, 5);
                        }
                    }
                }

                $data['events'] = $events;
                sendResponse($data);

            // ==========================================================
            // CAZUL 'data' (POST) - Salvează totul în DB (Metoda Truncate)
            // ==========================================================
            } elseif ($method === 'POST') {
                // (NEMODIFICAT - salvează clients, team_members, events)
                if ($input === null) {
                    sendError('Invalid JSON data', 400);
                }
                debugLog("Salvare 'data'. Se salvează " . count($input['clients']) . " clienți și " . count($input['events']) . " evenimente.");

                try {
                    $pdo->beginTransaction();

                    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
                    $pdo->exec("DELETE FROM event_team_members;");
                    $pdo->exec("DELETE FROM event_clients;");
                    $pdo->exec("DELETE FROM event_programs;");
                    $pdo->exec("DELETE FROM events;");
                    $pdo->exec("DELETE FROM clients;");
                    $pdo->exec("DELETE FROM team_members;");
                    // NOTĂ: NU ștergem event_types aici. Se gestionează separat.
                    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

                    $stmt_team = $pdo->prepare("INSERT INTO team_members (id, name, color, initials, role) VALUES (?, ?, ?, ?, ?)");
                    foreach ($input['teamMembers'] as $m) {
                        $stmt_team->execute([$m['id'], $m['name'], $m['color'], $m['initials'], $m['role']]);
                    }

                    $stmt_client = $pdo->prepare("INSERT INTO clients (id, name, email, phone, birthDate, medical) VALUES (?, ?, ?, ?, ?, ?)");
                    foreach ($input['clients'] as $c) {
                        $birthDate = !empty($c['birthDate']) ? $c['birthDate'] : null;
                        $stmt_client->execute([$c['id'], $c['name'], $c['email'], $c['phone'], $birthDate, $c['medical'] ?? '']);
                    }

                    $stmt_evt = $pdo->prepare("INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt_evt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
                    $stmt_evt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
                    $stmt_evt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");

                    foreach ($input['events'] as $e) {
                        $startTime = $e['startTime'] ?? null;
                        if ($startTime && strlen($startTime) > 5) {
                            $startTime = substr($startTime, 0, 5);
                        }
                        
                        $stmt_evt->execute([
                            $e['id'], $e['name'] ?? null, $e['details'] ?? null, $e['type'] ?? 'therapy', 
                            $e['date'], $startTime, $e['duration'] ?? null,
                            isset($e['isPublic']) ? (int)$e['isPublic'] : 0, 
                            isset($e['isBillable']) ? (int)$e['isBillable'] : 1, 
                            json_encode($e['repeating'] ?? []), $e['comments'] ?? null,
                            json_encode($e['attendance'] ?? new stdClass())
                        ]);
                        
                        foreach ($e['teamMemberIds'] ?? [] as $id) { $stmt_evt_team->execute([$e['id'], $id]); }
                        foreach ($e['clientIds'] ?? [] as $id) { $stmt_evt_client->execute([$e['id'], $id]); }
                        foreach ($e['programIds'] ?? [] as $id) { $stmt_evt_prog->execute([$e['id'], $id]); }
                    }

                    $pdo->commit();
                    debugLog("Salvare 'data' reușită.");
                    sendResponse(['success' => true, 'message' => 'Data saved successfully']);

                } catch (Exception $e) {
                    $pdo->rollBack();
                    sendError('Failed to write data (transaction failed): ' . $e->getMessage());
                }
            } else {
                sendError('Unsupported method', 405);
            }
            break;
            
       // ==========================================================
        // CAZUL 'event_types' (ACESTA ESTE BLOCUL NECESAR)
        // ==========================================================
        case 'event_types':
            if ($method === 'GET') {
                // Obține toate tipurile de evenimente
                $data = $pdo->query("SELECT * FROM event_types")->fetchAll();
                
                // Convertește valorile numerice în boolean pentru JS
                foreach ($data as &$type) {
                    $type['isBillable'] = (bool)$type['isBillable'];
                    $type['requiresTime'] = (bool)$type['requiresTime'];
                }
                sendResponse($data);

            } elseif ($method === 'POST') {
                if ($input === null) {
                    sendError('Invalid JSON data for event types', 400);
                }
                debugLog("Salvare 'event_types'. Se salvează " . count($input) . " tipuri.");

                try {
                    $pdo->beginTransaction();
                    
                    // Golește tabelul
                    $pdo->exec("DELETE FROM event_types;");
                    
                    // Pregătește statement-ul
                    $stmt = $pdo->prepare("INSERT INTO event_types (id, label, isBillable, requiresTime) VALUES (?, ?, ?, ?)");
                    
                    // Inserează datele noi
                    foreach ($input as $type) {
                        $stmt->execute([
                            $type['id'],
                            $type['label'],
                            (int)$type['isBillable'], // Convertește boolean înapoi în int
                            (int)$type['requiresTime']
                        ]);
                    }
                    
                    $pdo->commit();
                    debugLog("Salvare 'event_types' reușită.");
                    sendResponse(['success' => true, 'message' => 'Event types saved']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    debugLog("EROARE DB la salvarea 'event_types': " . $e->getMessage());
                    sendError('Failed to write event types data: ' . $e->getMessage());
                }
            } else {
                 // Adaugă acest 'else' pentru a prinde alte metode (cum ar fi PUT, DELETE etc.)
                 sendError('Unsupported method. Only GET and POST are allowed for event_types.', 405);
            }
            break; // Nu uita de 'break'!

        // ==========================================================
        // CAZUL 'evolution' (NEMODIFICAT)
        // ==========================================================
        case 'evolution':
            if ($method === 'GET') {
                $evolutionData = new stdClass(); 

                // 1. Portage
                $stmt_portage = $pdo->query("SELECT * FROM portage_evaluations");
                while ($row = $stmt_portage->fetch()) {
                    $clientId = $row['client_id'];
                    $domain = $row['domain'];
                    $date = $row['eval_date'];
                    if (!isset($evolutionData->$clientId)) $evolutionData->$clientId = new stdClass();
                    if (!isset($evolutionData->$clientId->evaluations)) $evolutionData->$clientId->evaluations = new stdClass();
                    if (!isset($evolutionData->$clientId->evaluations->$domain)) $evolutionData->$clientId->evaluations->$domain = new stdClass();
                    $evolutionData->$clientId->evaluations->$domain->$date = (int)$row['score'];
                }

                // 2. Program History
                $stmt_history = $pdo->query("
                    SELECT h.*, p.title as programTitle 
                    FROM program_history h
                    LEFT JOIN programs p ON h.program_id = p.id
                    ORDER BY h.eval_date DESC
                ");
                while ($row = $stmt_history->fetch()) {
                    $clientId = $row['client_id'];
                    if (!isset($evolutionData->$clientId)) $evolutionData->$clientId = new stdClass();
                    if (!isset($evolutionData->$clientId->programHistory)) $evolutionData->$clientId->programHistory = [];
                    $evolutionData->$clientId->programHistory[] = [
                        "date" => $row['eval_date'],
                        "programId" => $row['program_id'],
                        "programTitle" => $row['programTitle'],
                        "score" => $row['score'],
                        "eventId" => $row['event_id']
                    ];
                }

                // 3. Logopedic
                $stmt_logo = $pdo->query("SELECT * FROM logopedic_evaluations");
                while ($row = $stmt_logo->fetch()) {
                    $clientId = $row['client_id'];
                    $date = $row['eval_date'];
                    if (!isset($evolutionData->$clientId)) $evolutionData->$clientId = new stdClass();
                    if (!isset($evolutionData->$clientId->evaluationsLogopedica)) $evolutionData->$clientId->evaluationsLogopedica = new stdClass();
                    $evolutionData->$clientId->evaluationsLogopedica->$date = [
                        'scores' => json_decode($row['scores_json'], true),
                        'comments' => $row['comments']
                    ];
                }

                // 4. Monthly Themes
                $stmt_theme = $pdo->query("SELECT * FROM monthly_themes");
                while ($row = $stmt_theme->fetch()) {
                    $clientId = $row['client_id'];
                    $monthKey = $row['month_key'];
                    if (!isset($evolutionData->$clientId)) $evolutionData->$clientId = new stdClass();
                    if (!isset($evolutionData->$clientId->monthlyThemes)) $evolutionData->$clientId->monthlyThemes = new stdClass();
                    $evolutionData->$clientId->monthlyThemes->$monthKey = $row['theme_text'];
                }
                
                sendResponse($evolutionData);

            } elseif ($method === 'POST') {
                
                if ($input === null) {
                    sendError('Invalid JSON data for evolution', 400);
                }
                debugLog("Salvare 'evolution'. Se primesc date pentru " . count($input) . " clienți.");
                
                try {
                    $valid_program_ids = $pdo->query("SELECT id FROM programs")->fetchAll(PDO::FETCH_COLUMN, 0);
                    $pdo->beginTransaction();
                    $pdo->exec("DELETE FROM portage_evaluations;");
                    $pdo->exec("DELETE FROM program_history;");
                    $pdo->exec("DELETE FROM logopedic_evaluations;");
                    $pdo->exec("DELETE FROM monthly_themes;");
                    debugLog("Tabelele de evoluție au fost golite.");

                    $stmt_portage = $pdo->prepare("INSERT INTO portage_evaluations (client_id, domain, eval_date, score) VALUES (?, ?, ?, ?)");
                    $stmt_history = $pdo->prepare("INSERT INTO program_history (client_id, event_id, program_id, score, eval_date) VALUES (?, ?, ?, ?, ?)");
                    $stmt_logo = $pdo->prepare("INSERT INTO logopedic_evaluations (client_id, eval_date, scores_json, comments) VALUES (?, ?, ?, ?)");
                    $stmt_theme = $pdo->prepare("INSERT INTO monthly_themes (client_id, month_key, theme_text) VALUES (?, ?, ?)");

                    foreach ($input as $clientId => $data) {
                        debugLog("Se procesează evoluția pentru client: $clientId");
                        
                        foreach ($data['evaluations'] ?? [] as $domain => $dates) {
                            foreach ($dates as $date => $score) {
                                $stmt_portage->execute([$clientId, $domain, $date, $score]);
                            }
                        }
                        foreach ($data['programHistory'] ?? [] as $entry) {
                            if (in_array($entry['programId'], $valid_program_ids)) {
                                $stmt_history->execute([$clientId, $entry['eventId'] ?? null, $entry['programId'], $entry['score'], $entry['date']]);
                            } else {
                                debugLog("SKIPPED program history: programId invalid " . $entry['programId']);
                            }
                        }
                        foreach ($data['evaluationsLogopedica'] ?? [] as $date => $entry) {
                            $stmt_logo->execute([$clientId, $date, json_encode($entry['scores']), $entry['comments']]);
                        }
                        foreach ($data['monthlyThemes'] ?? [] as $monthKey => $text) {
                            $stmt_theme->execute([$clientId, $monthKey, $text]);
                        }
                    }
                    
                    $pdo->commit();
                    debugLog("Salvare 'evolution' reușită.");
                    sendResponse(['success' => true, 'message' => 'Evolution data saved']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    debugLog("EROARE DB la salvarea 'evolution': " . $e->getMessage());
                    sendError('Failed to write evolution data: ' . $e->getMessage());
                }
            }
            break;

        // ==========================================================
        // CAZUL 'billings' (NEMODIFICAT)
        // ==========================================================
        case 'billings':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM payments ORDER BY payment_date ASC");
                $billingsData = new stdClass(); 
                while ($row = $stmt->fetch()) {
                    $clientId = $row['client_id'];
                    $monthKey = $row['month_key'];
                    if (!isset($billingsData->$clientId)) $billingsData->$clientId = new stdClass();
                    if (!isset($billingsData->$clientId->$monthKey)) $billingsData->$clientId->$monthKey = [];
                    
                    $billingsData->$clientId->$monthKey[] = [
                        'id' => $row['id'],
                        'date' => $row['payment_date'],
                        'amount' => (float)$row['amount'],
                        'notes' => $row['notes']
                    ];
                }
                sendResponse($billingsData);

            } elseif ($method === 'POST') {
                
                if ($input === null) {
                    sendError('Invalid JSON data for billings', 400);
                }
                debugLog("Salvare 'billings'. Se primesc date pentru " . count($input) . " clienți.");
                
                try {
                    $pdo->beginTransaction();
                    $pdo->exec("DELETE FROM payments;");
                    debugLog("Tabelul 'payments' a fost golit.");

                    $stmt = $pdo->prepare("INSERT INTO payments (id, client_id, month_key, payment_date, amount, notes) VALUES (?, ?, ?, ?, ?, ?)");
                    
                    $insertCount = 0;
                    foreach ($input as $clientId => $months) {
                        debugLog("Se procesează plăți pentru client: $clientId");
                        foreach ($months as $monthKey => $payments) {
                            foreach ($payments as $payment) {
                                $stmt->execute([
                                    $payment['id'], $clientId, $monthKey,
                                    $payment['date'], $payment['amount'], $payment['notes']
                                ]);
                                $insertCount++;
                            }
                        }
                    }
                    
                    $pdo->commit();
                    debugLog("Salvare 'billings' reușită. $insertCount înregistrări adăugate.");
                    sendResponse(['success' => true, 'message' => 'Billings data saved']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    debugLog("EROARE DB la salvarea 'billings': " . $e->getMessage());
                    sendError('Failed to write billings data: ' . $e->getMessage());
                }
            }
            break;

        // ==========================================================
        // CAZURILE .json (programs, portrige) - (NEMODIFICATE)
        // ==========================================================
        case 'programs':
            $programs = $pdo->query("SELECT * FROM programs")->fetchAll();
            sendResponse(['programs' => $programs]);
            break;

        case 'portrige.json':
            $file = __DIR__ . '/portrige.json';
            if (file_exists($file)) {
                setNoCacheHeaders(); 
                header('Content-Type: application/json; charset=utf-8');
                readfile($file);
                exit();
            } else {
                sendError('JSON file not found: ' . $path, 404);
            }
            break;

        // ==========================================================
        // DEFAULT
        // ==========================================================
        default:
            sendError('Invalid endpoint: ' . $path, 404);
    }

} catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            debugLog("EROARE PHP GLOBALĂ: " . $e->getMessage());
            sendError('Failed to write data (transaction failed): ' . $e->getMessage());
        }
?>