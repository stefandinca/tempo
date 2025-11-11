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

                // 3. Obține events și legăturile lor (folosind GROUP_CONCAT)
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
                    $event['repeating'] = $event['repeating'] ? array_map('intval', json_decode($event['repeating'])) : [];                    // Convertim 'isPublic' și 'isBillable' înapoi în boolean pentru JS
                    // --- START FIX ---
                    // Robustly decode attendance, ensuring it's always an object
                    $attendanceData = $event['attendance'] ? json_decode($event['attendance'], true) : null;
                    if (is_array($attendanceData)) {
                        // This converts PHP associative arrays ({"a":1}) AND
                        // empty arrays ([]) into objects.
                        $event['attendance'] = (object)$attendanceData;
                    } elseif (is_object($attendanceData)) {
                        $event['attendance'] = $attendanceData;
                    } else {
                        // Default to an empty object if null or invalid
                        $event['attendance'] = new stdClass();
                    }
                    // --- END FIX ---
                    $event['isPublic'] = (bool)$event['isPublic'];
                    $event['isBillable'] = (bool)$event['isBillable'];

                    // === IMPROVED TIME FORMAT CORRECTION ===
                    // MySQL returns TIME as hh:mm:ss, but JavaScript expects hh:mm
                    // We MUST trim the seconds to ensure proper event positioning
                    if (!empty($event['startTime'])) {
                        // Check if the time has seconds (length > 5 means it's hh:mm:ss format)
                        if (strlen($event['startTime']) > 5) {
                            $event['startTime'] = substr($event['startTime'], 0, 5);
                        }
                    }
                    // === END TIME FORMAT CORRECTION ===
                }

                $data['events'] = $events;
                sendResponse($data);

            // ==========================================================
            // CAZUL 'data' (POST) - Salvează totul în DB (Metoda Truncate)
            // ==========================================================
            } elseif ($method === 'POST') {
                if ($input === null) {
                    sendError('Invalid JSON data', 400);
                }
                debugLog("Salvare 'data'. Se salvează " . count($input['clients']) . " clienți și " . count($input['events']) . " evenimente.");

                try {
                    $pdo->beginTransaction();

                    // 1. Șterge datele vechi
                    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

                    // --- START MODIFICATION ---
                    // Logica de ștergere a istoricului
                    // Colectează toate ID-urile evenimentelor care vor fi salvate
                    $newEventIds = [];
                    if (isset($input['events']) && is_array($input['events'])) {
                        foreach ($input['events'] as $e) {
                            if (isset($e['id'])) {
                                $newEventIds[] = $e['id'];
                            }
                        }
                    }

                    if (count($newEventIds) > 0) {
                        // Creează placeholdere (?) pentru clauza IN
                        $placeholders = rtrim(str_repeat('?,', count($newEventIds)), ',');
                        // Șterge din program_history DOAR intrările ale căror event_id NU SUNT în noua listă de evenimente
                        $stmt_delete_history = $pdo->prepare("DELETE FROM program_history WHERE event_id IS NOT NULL AND event_id NOT IN ($placeholders)");
                        $stmt_delete_history->execute($newEventIds);
                        debugLog("Curățat " . $stmt_delete_history->rowCount() . " înregistrări vechi din program_history.");
                    } else {
                        // Dacă nu se trimit evenimente, șterge tot istoricul asociat evenimentelor
                        $pdo->exec("DELETE FROM program_history WHERE event_id IS NOT NULL");
                        debugLog("Niciun eveniment primit. Se șterge tot istoricul programelor asociat evenimentelor.");
                    }
                    // --- END MODIFICATION ---

                    // Continuă cu ștergerea normală a datelor
                    $pdo->exec("DELETE FROM event_team_members;");
                    $pdo->exec("DELETE FROM event_clients;");
                    $pdo->exec("DELETE FROM event_programs;");
                    $pdo->exec("DELETE FROM events;");
                    $pdo->exec("DELETE FROM clients;");
                    $pdo->exec("DELETE FROM team_members;");
                    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

                    // 2. Inserează team_members
                    $stmt_team = $pdo->prepare("INSERT INTO team_members (id, name, color, initials, role) VALUES (?, ?, ?, ?, ?)");
                    foreach ($input['teamMembers'] as $m) {
                        $stmt_team->execute([$m['id'], $m['name'], $m['color'], $m['initials'], $m['role']]);
                    }

                    // 3. Inserează clients
                    $stmt_client = $pdo->prepare("INSERT INTO clients (id, name, email, phone, birthDate, medical) VALUES (?, ?, ?, ?, ?, ?)");
                    foreach ($input['clients'] as $c) {
                        // Asigură-te că data este null dacă e goală
                        $birthDate = !empty($c['birthDate']) ? $c['birthDate'] : null;
                        $stmt_client->execute([$c['id'], $c['name'], $c['email'], $c['phone'], $birthDate, $c['medical'] ?? '']);
                    }

                    // 4. Inserează events și joncțiunile
                    $stmt_evt = $pdo->prepare("INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt_evt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
                    $stmt_evt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
                    $stmt_evt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");

                    foreach ($input['events'] as $e) {
                        // === ENSURE TIME FORMAT IS hh:mm BEFORE SAVING ===
                        $startTime = $e['startTime'] ?? null;
                        if ($startTime && strlen($startTime) > 5) {
                            $startTime = substr($startTime, 0, 5);
                        }
                        // === END TIME FORMAT CHECK ===
                        
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
            // CAZUL 'events/:id' - Operații CRUD granulare pentru evenimente
            // ==========================================================
            case (preg_match('/^events\/(.+)$/', $path, $matches) ? true : false):
                $eventId = $matches[1];
                
                if ($method === 'PUT') {
                    // Update single event
                    try {
                        if ($input === null) {
                            sendError('Invalid JSON data', 400);
                        }
                        
                        // Update event in database
                        $stmt = $pdo->prepare("UPDATE events SET name=?, details=?, type=?, date=?, startTime=?, duration=?, isPublic=?, isBillable=?, repeating_json=?, comments=?, attendance=? WHERE id=?");
                        $stmt->execute([
                            $input['name'] ?? null,
                            $input['details'] ?? null,
                            $input['type'] ?? 'therapy',
                            $input['date'],
                            $input['startTime'],
                            $input['duration'] ?? null,
                            isset($input['isPublic']) ? (int)$input['isPublic'] : 0,
                            isset($input['isBillable']) ? (int)$input['isBillable'] : 1,
                            json_encode($input['repeating'] ?? []),
                            $input['comments'] ?? null,
                            json_encode($input['attendance'] ?? new stdClass()),
                            $eventId
                        ]);
                        
                        // Update team members (delete old, insert new)
                        $pdo->prepare("DELETE FROM event_team_members WHERE event_id=?")->execute([$eventId]);
                        $stmt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
                        foreach ($input['teamMemberIds'] ?? [] as $id) {
                            $stmt_team->execute([$eventId, $id]);
                        }
                        
                        // Update clients
                        $pdo->prepare("DELETE FROM event_clients WHERE event_id=?")->execute([$eventId]);
                        $stmt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
                        foreach ($input['clientIds'] ?? [] as $id) {
                            $stmt_client->execute([$eventId, $id]);
                        }
                        
                        // Update programs
                        $pdo->prepare("DELETE FROM event_programs WHERE event_id=?")->execute([$eventId]);
                        $stmt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");
                        foreach ($input['programIds'] ?? [] as $id) {
                            $stmt_prog->execute([$eventId, $id]);
                        }
                        
                        debugLog("Eveniment actualizat: $eventId");
                        sendResponse(['success' => true, 'message' => 'Event updated successfully']);
                        
                    } catch (Exception $e) {
                        debugLog("Eroare la actualizarea evenimentului: " . $e->getMessage());
                        sendError('Failed to update event: ' . $e->getMessage());
                    }
                    
                } elseif ($method === 'DELETE') {
                    // Delete single event
                    try {
                        $stmt = $pdo->prepare("DELETE FROM events WHERE id=?");
                        $stmt->execute([$eventId]);
                        
                        if ($stmt->rowCount() === 0) {
                            sendError('Event not found', 404);
                        }
                        
                        debugLog("Eveniment șters: $eventId");
                        sendResponse(['success' => true, 'message' => 'Event deleted successfully']);
                        
                    } catch (Exception $e) {
                        debugLog("Eroare la ștergerea evenimentului: " . $e->getMessage());
                        sendError('Failed to delete event: ' . $e->getMessage());
                    }
                } else {
                    sendError('Unsupported method for events/:id', 405);
                }
                break;

            case 'events':
                if ($method === 'POST') {
                    // Create new event(s)
                    try {
                        if ($input === null) {
                            sendError('Invalid JSON data', 400);
                        }
                        
                        // Support both single event and array of events
                        $events = isset($input[0]) ? $input : [$input];
                        
                        $stmt_evt = $pdo->prepare("INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments, attendance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmt_evt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
                        $stmt_evt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
                        $stmt_evt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");
                        
                        $pdo->beginTransaction();
                        
                        foreach ($events as $e) {
                            $startTime = $e['startTime'] ?? null;
                            if ($startTime && strlen($startTime) > 5) {
                                $startTime = substr($startTime, 0, 5);
                            }
                            
                            $stmt_evt->execute([
                                $e['id'],
                                $e['name'] ?? null,
                                $e['details'] ?? null,
                                $e['type'] ?? 'therapy',
                                $e['date'],
                                $startTime,
                                $e['duration'] ?? null,
                                isset($e['isPublic']) ? (int)$e['isPublic'] : 0,
                                isset($e['isBillable']) ? (int)$e['isBillable'] : 1,
                                json_encode($e['repeating'] ?? []),
                                $e['comments'] ?? null,
                                json_encode($e['attendance'] ?? new stdClass())
                            ]);
                            
                            foreach ($e['teamMemberIds'] ?? [] as $id) { $stmt_evt_team->execute([$e['id'], $id]); }
                            foreach ($e['clientIds'] ?? [] as $id) { $stmt_evt_client->execute([$e['id'], $id]); }
                            foreach ($e['programIds'] ?? [] as $id) { $stmt_evt_prog->execute([$e['id'], $id]); }
                        }
                        
                        $pdo->commit();
                        debugLog("Eveniment(e) creat(e): " . count($events));
                        sendResponse(['success' => true, 'message' => 'Event(s) created successfully']);
                        
                    } catch (Exception $e) {
                        $pdo->rollBack();
                        debugLog("Eroare la crearea evenimentului: " . $e->getMessage());
                        sendError('Failed to create event: ' . $e->getMessage());
                    }
                } else {
                    sendError('Unsupported method for events', 405);
                }
                break;

        // ==========================================================
        // CAZUL 'event_types' - Gestionează tipurile de evenimente din DB
        // ==========================================================
        case 'event_types':
            if ($method === 'GET') {
                try {
                    // FIX 1: Add base_price to the SELECT query
                    $stmt = $pdo->query("SELECT id, label, isBillable, requiresTime, base_price FROM event_types ORDER BY label");
                    $eventTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Convertim valorile boolean/float pentru JavaScript
                    foreach ($eventTypes as &$type) {
                        $type['isBillable'] = (bool)$type['isBillable'];
                        $type['requiresTime'] = (bool)$type['requiresTime'];
                        $type['base_price'] = (float)($type['base_price'] ?? 0); // <-- FIX 2: Process the price
                    }
                    
                    sendResponse($eventTypes);
                } catch (Exception $e) {
                    debugLog("Eroare la încărcarea tipurilor de evenimente: " . $e->getMessage());
                    sendError('Failed to load event types: ' . $e->getMessage());
                }

            } elseif ($method === 'POST') {
                // Create new event type
                try {
                    if ($input === null) {
                        sendError('Invalid JSON data', 400);
                    }
                    
                    $id = $input['id'] ?? null;
                    $label = $input['label'] ?? null;
                    $isBillable = isset($input['isBillable']) ? (int)$input['isBillable'] : 1;
                    $requiresTime = isset($input['requiresTime']) ? (int)$input['requiresTime'] : 1;
                    $base_price = $input['base_price'] ?? 0; // <-- ADD: Get base_price
                    
                    if (!$id || !$label) {
                        sendError('ID and label are required', 400);
                    }
                    
                    // Validate ID format (lowercase, numbers, hyphens only)
                    if (!preg_match('/^[a-z0-9-]+$/', $id)) {
                        sendError('ID must contain only lowercase letters, numbers', 400);
                    }
                    
                    // FIX 3: Add base_price to the INSERT query
                    $stmt = $pdo->prepare("INSERT INTO event_types (id, label, isBillable, requiresTime, base_price) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$id, $label, $isBillable, $requiresTime, $base_price]);
                    
                    debugLog("Tip eveniment creat: $id - $label - Pret: $base_price");
                    sendResponse(['success' => true, 'message' => 'Event type created successfully', 'id' => $id]);
                    
                } catch (PDOException $e) {
                    if ($e->getCode() == 23000) { // Duplicate entry
                        sendError('Un tip de eveniment cu acest ID există deja', 409);
                    } else {
                        debugLog("Eroare la crearea tipului: " . $e->getMessage());
                        sendError('Failed to create event type: ' . $e->getMessage());
                    }
                }
            } elseif ($method === 'PUT') {
                // Update existing event type
                try {
                    if ($input === null) {
                        sendError('Invalid JSON data', 400);
                    }
                    
                    $id = $input['id'] ?? null;
                    $label = $input['label'] ?? null;
                    $isBillable = isset($input['isBillable']) ? (int)$input['isBillable'] : 1;
                    $requiresTime = isset($input['requiresTime']) ? (int)$input['requiresTime'] : 1;
                    $base_price = $input['base_price'] ?? 0; // <-- ADD: Get base_price
                    
                    if (!$id || !$label) {
                        sendError('ID and label are required', 400);
                    }
                    
                    // FIX 4: This must be an UPDATE, not an INSERT
                    $stmt = $pdo->prepare("UPDATE event_types SET label = ?, isBillable = ?, requiresTime = ?, base_price = ? WHERE id = ?");
                    $affected = $stmt->execute([$label, $isBillable, $requiresTime, $base_price, $id]);
                    
                    if ($stmt->rowCount() === 0) {
                        sendError('Event type not found', 404);
                    }
                    
                    debugLog("Tip eveniment actualizat: $id - $label - Pret: $base_price");
                    sendResponse(['success' => true, 'message' => 'Event type updated successfully']);
                    
                } catch (Exception $e) {
                    debugLog("Eroare la actualizarea tipului: " . $e->getMessage());
                    sendError('Failed to update event type: ' . $e->getMessage());
                }
            } elseif ($method === 'DELETE') {
                // Delete event type
                try {
                    // Get ID from query string for DELETE
                    $id = $_GET['id'] ?? null;
                    
                    if (!$id) {
                        sendError('ID is required', 400);
                    }
                    
                    // Check if any events use this type
                    $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM events WHERE type = ?");
                    $checkStmt->execute([$id]);
                    $result = $checkStmt->fetch();
                    
                    if ($result['count'] > 0) {
                        sendError("Nu poți șterge acest tip. Există {$result['count']} evenimente care îl folosesc.", 409);
                    }
                    
                    $stmt = $pdo->prepare("DELETE FROM event_types WHERE id = ?");
                    $stmt->execute([$id]);
                    
                    if ($stmt->rowCount() === 0) {
                        sendError('Event type not found', 404);
                    }
                    
                    debugLog("Tip eveniment șters: $id");
                    sendResponse(['success' => true, 'message' => 'Event type deleted successfully']);
                    
                } catch (Exception $e) {
                    debugLog("Eroare la ștergerea tipului: " . $e->getMessage());
                    sendError('Failed to delete event type: ' . $e->getMessage());
                }
            } else {
                sendError('Unsupported method for event_types', 405);
            }
            break; // <-- Make sure to copy down to the break;

            // ==========================================================
            // CAZUL 'clients/:id' - Operații CRUD pentru clienți
            // ==========================================================
            case (preg_match('/^clients\/(.+)$/', $path, $matches) ? true : false):
                $clientId = $matches[1];
                
                if ($method === 'PUT') {
                    try {
                        if ($input === null) {
                            sendError('Invalid JSON data', 400);
                        }
                        
                        $stmt = $pdo->prepare("UPDATE clients SET name=?, email=?, phone=?, birthDate=?, medical=? WHERE id=?");
                        $stmt->execute([
                            $input['name'],
                            $input['email'],
                            $input['phone'],
                            $input['birthDate'] ?: null,
                            $input['medical'] ?? '',
                            $clientId
                        ]);
                        
                        if ($stmt->rowCount() === 0) {
                            sendError('Client not found', 404);
                        }
                        
                        debugLog("Client actualizat: $clientId");
                        sendResponse(['success' => true, 'message' => 'Client updated successfully']);
                        
                    } catch (Exception $e) {
                        debugLog("Eroare la actualizarea clientului: " . $e->getMessage());
                        sendError('Failed to update client: ' . $e->getMessage());
                    }
                    
                } elseif ($method === 'DELETE') {
                    try {
                        $stmt = $pdo->prepare("DELETE FROM clients WHERE id=?");
                        $stmt->execute([$clientId]);
                        
                        if ($stmt->rowCount() === 0) {
                            sendError('Client not found', 404);
                        }
                        
                        debugLog("Client șters: $clientId");
                        sendResponse(['success' => true, 'message' => 'Client deleted successfully']);
                        
                    } catch (Exception $e) {
                        debugLog("Eroare la ștergerea clientului: " . $e->getMessage());
                        sendError('Failed to delete client: ' . $e->getMessage());
                    }
                } else {
                    sendError('Unsupported method for clients/:id', 405);
                }
                break;

            case 'clients':
                if ($method === 'POST') {
                    try {
                        if ($input === null) {
                            sendError('Invalid JSON data', 400);
                        }
                        
                        $stmt = $pdo->prepare("INSERT INTO clients (id, name, email, phone, birthDate, medical) VALUES (?, ?, ?, ?, ?, ?)");
                        $stmt->execute([
                            $input['id'],
                            $input['name'],
                            $input['email'],
                            $input['phone'],
                            $input['birthDate'] ?: null,
                            $input['medical'] ?? ''
                        ]);
                        
                        debugLog("Client creat: " . $input['id']);
                        sendResponse(['success' => true, 'message' => 'Client created successfully', 'id' => $input['id']]);
                        
                    } catch (PDOException $e) {
                        if ($e->getCode() == 23000) {
                            sendError('Un client cu acest ID există deja', 409);
                        } else {
                            debugLog("Eroare la crearea clientului: " . $e->getMessage());
                            sendError('Failed to create client: ' . $e->getMessage());
                        }
                    }
                } else {
                    sendError('Unsupported method for clients', 405);
                }
                break;

        // ==========================================================
        // CAZUL 'programs'
        // ==========================================================
        
        case 'programs':
    if ($method === 'GET') {
        // Already handled - returns programs from database
        $programs = $pdo->query("SELECT * FROM programs ORDER BY title")->fetchAll();
        sendResponse(['programs' => $programs]);
        
    } elseif ($method === 'POST') {
        // Create new program
        try {
            if ($input === null) {
                sendError('Invalid JSON data', 400);
            }
            
            $id = $input['id'] ?? null;
            $title = $input['title'] ?? null;
            $description = $input['description'] ?? '';
            
            if (!$id || !$title) {
                sendError('ID și titlul sunt obligatorii', 400);
            }
            
            // Validate ID format
            if (!preg_match('/^prog_[a-z0-9_]+$/', $id)) {
                sendError('ID-ul trebuie să înceapă cu "prog_" și să conțină doar litere mici, cifre și underscore', 400);
            }
            
            $stmt = $pdo->prepare("INSERT INTO programs (id, title, description) VALUES (?, ?, ?)");
            $stmt->execute([$id, $title, $description]);
            
            debugLog("Program creat: $id - $title");
            sendResponse(['success' => true, 'message' => 'Program creat cu succes', 'id' => $id]);
            
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                sendError('Un program cu acest ID există deja', 409);
            } else {
                debugLog("Eroare la crearea programului: " . $e->getMessage());
                sendError('Nu s-a putut crea programul: ' . $e->getMessage());
            }
        }
        
    } elseif ($method === 'PUT') {
        // Update program
        try {
            if ($input === null) {
                sendError('Invalid JSON data', 400);
            }
            
            $id = $input['id'] ?? null;
            $title = $input['title'] ?? null;
            $description = $input['description'] ?? '';
            
            if (!$id || !$title) {
                sendError('ID și titlul sunt obligatorii', 400);
            }
            
            $stmt = $pdo->prepare("UPDATE programs SET title = ?, description = ? WHERE id = ?");
            $stmt->execute([$title, $description, $id]);
            
            if ($stmt->rowCount() === 0) {
                sendError('Programul nu a fost găsit', 404);
            }
            
            debugLog("Program actualizat: $id - $title");
            sendResponse(['success' => true, 'message' => 'Program actualizat cu succes']);
            
        } catch (Exception $e) {
            debugLog("Eroare la actualizarea programului: " . $e->getMessage());
            sendError('Nu s-a putut actualiza programul: ' . $e->getMessage());
        }
        
    } elseif ($method === 'DELETE') {
        // Delete program
        try {
            $id = $_GET['id'] ?? null;
            
            if (!$id) {
                sendError('ID-ul este obligatoriu', 400);
            }
            
            // Check if any events use this program
            $checkStmt = $pdo->prepare("SELECT COUNT(*) as count FROM event_programs WHERE program_id = ?");
            $checkStmt->execute([$id]);
            $result = $checkStmt->fetch();
            
            if ($result['count'] > 0) {
                sendError("Nu poți șterge acest program. Există {$result['count']} evenimente care îl folosesc.", 409);
            }
            
            // Check if any program history uses this program
            $checkHistoryStmt = $pdo->prepare("SELECT COUNT(*) as count FROM program_history WHERE program_id = ?");
            $checkHistoryStmt->execute([$id]);
            $historyResult = $checkHistoryStmt->fetch();
            
            if ($historyResult['count'] > 0) {
                sendError("Nu poți șterge acest program. Există {$historyResult['count']} înregistrări în istoricul programelor.", 409);
            }
            
            $stmt = $pdo->prepare("DELETE FROM programs WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                sendError('Programul nu a fost găsit', 404);
            }
            
            debugLog("Program șters: $id");
            sendResponse(['success' => true, 'message' => 'Program șters cu succes']);
            
        } catch (Exception $e) {
            debugLog("Eroare la ștergerea programului: " . $e->getMessage());
            sendError('Nu s-a putut șterge programul: ' . $e->getMessage());
        }
    } else {
        sendError('Metodă nepermisă pentru programs', 405);
    }
    break;
        
        // ==========================================================
        // CAZUL 'evolution'
        // ==========================================================
        case 'evolution':
            if ($method === 'GET') {
                $evolutionData = new stdClass(); // Inițializează ca obiect gol

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
                    // 1. Obține ID-uri valide DOAR pentru programe (necesar pentru program_history)
                    $valid_program_ids = $pdo->query("SELECT id FROM programs")->fetchAll(PDO::FETCH_COLUMN, 0);

                    $pdo->beginTransaction();
                    
                    // 2. Șterge datele vechi
                    $pdo->exec("DELETE FROM portage_evaluations;");
                    $pdo->exec("DELETE FROM program_history;");
                    $pdo->exec("DELETE FROM logopedic_evaluations;");
                    $pdo->exec("DELETE FROM monthly_themes;");
                    debugLog("Tabelele de evoluție au fost golite.");

                    // 3. Pregătește statement-urile
                    $stmt_portage = $pdo->prepare("INSERT INTO portage_evaluations (client_id, domain, eval_date, score) VALUES (?, ?, ?, ?)");
                    $stmt_history = $pdo->prepare("INSERT INTO program_history (client_id, event_id, program_id, score, eval_date) VALUES (?, ?, ?, ?, ?)");
                    $stmt_logo = $pdo->prepare("INSERT INTO logopedic_evaluations (client_id, eval_date, scores_json, comments) VALUES (?, ?, ?, ?)");
                    $stmt_theme = $pdo->prepare("INSERT INTO monthly_themes (client_id, month_key, theme_text) VALUES (?, ?, ?)");

                    // 4. Inserează datele noi (fără validare client_id)
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
        // CAZUL 'billings'
        // ==========================================================
        case 'billings':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM payments ORDER BY payment_date ASC");
                // (MODIFICAT) Inițializează ca obiect
                $billingsData = new stdClass(); 
                while ($row = $stmt->fetch()) {
                    $clientId = $row['client_id'];
                    $monthKey = $row['month_key'];
                    // (MODIFICAT) Folosește sintaxa de obiect
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

        case 'discount-thresholds':
            $file = __DIR__ . '/discount-thresholds.json';

            if ($method === 'GET') {
                if (file_exists($file)) {
                    $content = file_get_contents($file);
                    $data = json_decode($content, true);
                    sendResponse($data);
                } else {
                    // Return default thresholds if file doesn't exist
                    $defaultThresholds = [
                        ['hours' => 10, 'discount' => 10],
                        ['hours' => 20, 'discount' => 15],
                        ['hours' => 30, 'discount' => 20]
                    ];
                    sendResponse($defaultThresholds);
                }
            } elseif ($method === 'POST') {
                if ($input === null) {
                    sendError('Invalid JSON data for discount thresholds', 400);
                }

                try {
                    // Validate thresholds
                    if (!is_array($input)) {
                        sendError('Discount thresholds must be an array', 400);
                    }

                    foreach ($input as $threshold) {
                        if (!isset($threshold['hours']) || !isset($threshold['discount'])) {
                            sendError('Each threshold must have hours and discount properties', 400);
                        }
                        if (!is_numeric($threshold['hours']) || !is_numeric($threshold['discount'])) {
                            sendError('Hours and discount must be numeric values', 400);
                        }
                    }

                    // Save to file
                    file_put_contents($file, json_encode($input, JSON_PRETTY_PRINT));
                    debugLog("Discount thresholds saved successfully.");
                    sendResponse(['success' => true, 'message' => 'Discount thresholds saved']);
                } catch (Exception $e) {
                    debugLog("ERROR saving discount thresholds: " . $e->getMessage());
                    sendError('Failed to save discount thresholds: ' . $e->getMessage());
                }
            }
            break;

        // ==========================================================
        // CAZURILE .json (programs, portrige)
        // ==========================================================
        case 'programs':
            $programs = $pdo->query("SELECT * FROM programs")->fetchAll();
            // Recreează formatul JSON original
            sendResponse(['programs' => $programs]);
            break;

        case 'portrige.json':
            // portrige.json este static, îl citim direct din fișier ca înainte
            $file = __DIR__ . '/portrige.json';
            if (file_exists($file)) {
                setNoCacheHeaders(); // Simplu, fără validare ETag
                header('Content-Type: application/json; charset=utf-8');
                readfile($file);
                exit();
            } else {
                sendError('JSON file not found: ' . $path, 404);
            }
            break;

        // ==========================================================
        // ENDPOINT-URI VECHI (Dezactivate, acum gestionate de 'POST /data')
        // ==========================================================
        case 'events':
        case 'clients':
        case 'team':
            sendError('This endpoint is deprecated. Use GET/POST on "data" endpoint.', 404);
            break;

        // ==========================================================
        // CAZUL 'clone-schedule' - Clonează programul unei luni în alta
        // ==========================================================
        case 'clone-schedule':
            if ($method === 'POST') {
                try {
                    if ($input === null) {
                        sendError('Invalid JSON data', 400);
                    }

                    $sourceMonth = $input['sourceMonth'] ?? null; // Format: YYYY-MM
                    $targetMonth = $input['targetMonth'] ?? null; // Format: YYYY-MM

                    if (!$sourceMonth || !$targetMonth) {
                        sendError('Source month and target month are required (format: YYYY-MM)', 400);
                    }

                    // Validare format lună
                    if (!preg_match('/^\d{4}-\d{2}$/', $sourceMonth) || !preg_match('/^\d{4}-\d{2}$/', $targetMonth)) {
                        sendError('Invalid month format. Use YYYY-MM', 400);
                    }

                    debugLog("Clonare program: $sourceMonth -> $targetMonth");

                    // Obține toate evenimentele din luna sursă
                    $stmt = $pdo->prepare("
                        SELECT
                            e.*,
                            GROUP_CONCAT(DISTINCT etm.team_member_id) as teamMemberIds,
                            GROUP_CONCAT(DISTINCT ec.client_id) as clientIds,
                            GROUP_CONCAT(DISTINCT ep.program_id) as programIds
                        FROM events e
                        LEFT JOIN event_team_members etm ON e.id = etm.event_id
                        LEFT JOIN event_clients ec ON e.id = ec.event_id
                        LEFT JOIN event_programs ep ON e.id = ep.event_id
                        WHERE DATE_FORMAT(e.date, '%Y-%m') = ?
                        GROUP BY e.id
                    ");
                    $stmt->execute([$sourceMonth]);
                    $sourceEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    if (count($sourceEvents) === 0) {
                        sendError("No events found in source month: $sourceMonth", 404);
                    }

                    debugLog("Găsite " . count($sourceEvents) . " evenimente în luna sursă");

                    // DEDUPLICATE RECURRING EVENTS
                    // Recurring events are stored as multiple database entries (one per occurrence)
                    // We need to keep only ONE representative from each recurring series
                    $recurringSignatures = [];
                    $deduplicatedEvents = [];

                    foreach ($sourceEvents as $event) {
                        $repeatingData = null;
                        if (!empty($event['repeating_json'])) {
                            $repeatingData = json_decode($event['repeating_json'], true);
                        }

                        if (!empty($repeatingData) && is_array($repeatingData)) {
                            // This is a recurring event - create a signature to identify the series
                            $signature = md5(
                                $event['name'] . '|' .
                                $event['type'] . '|' .
                                $event['startTime'] . '|' .
                                $event['duration'] . '|' .
                                $event['teamMemberIds'] . '|' .
                                $event['clientIds'] . '|' .
                                $event['programIds'] . '|' .
                                $event['repeating_json']
                            );

                            // Only keep the first occurrence of each recurring series
                            if (!isset($recurringSignatures[$signature])) {
                                $recurringSignatures[$signature] = true;
                                $deduplicatedEvents[] = $event;
                                debugLog("Păstrez eveniment recurent: " . $event['name'] . " (first occurrence)");
                            } else {
                                debugLog("Omit duplicat recurent: " . $event['name']);
                            }
                        } else {
                            // Non-recurring event - keep it
                            $deduplicatedEvents[] = $event;
                        }
                    }

                    debugLog("După deduplicare: " . count($deduplicatedEvents) . " evenimente unice din " . count($sourceEvents) . " originale");

                    // Calculează diferența în luni
                    $sourceDate = new DateTime($sourceMonth . '-01');
                    $targetDate = new DateTime($targetMonth . '-01');
                    $monthDiff = ($targetDate->format('Y') - $sourceDate->format('Y')) * 12 +
                                 ($targetDate->format('m') - $sourceDate->format('m'));

                    debugLog("Diferență în luni: $monthDiff");

                    // Pregătește statement-urile pentru inserare
                    $pdo->beginTransaction();

                    $stmt_evt = $pdo->prepare("
                        INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments, attendance)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt_evt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
                    $stmt_evt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
                    $stmt_evt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");

                    $clonedCount = 0;

                    // Clonează fiecare eveniment (now using deduplicated list)
                    foreach ($deduplicatedEvents as $event) {
                        // Check if this is a recurring event
                        $repeatingData = null;
                        if (!empty($event['repeating_json'])) {
                            $repeatingData = json_decode($event['repeating_json'], true);
                        }

                        // Array to store all target dates for this event
                        $targetDates = [];

                        if (!empty($repeatingData) && is_array($repeatingData)) {
                            // This is a recurring event - clone it to ALL occurrences of the repeating days in target month
                            debugLog("Eveniment recurent găsit: " . $event['name'] . " cu zile: " . implode(',', $repeatingData));

                            foreach ($repeatingData as $dayOfWeek) {
                                // dayOfWeek: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
                                // Convert to PHP's w format: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
                                $phpDayOfWeek = $dayOfWeek % 7; // 7 becomes 0 (Sunday)

                                // Find all occurrences of this day in the target month
                                $currentDate = clone $targetDate;
                                $currentDate->setDate(
                                    (int)$targetDate->format('Y'),
                                    (int)$targetDate->format('m'),
                                    1
                                );

                                // Move to the first occurrence of this day of week
                                $currentDayOfWeek = (int)$currentDate->format('w');
                                $daysToAdd = ($phpDayOfWeek - $currentDayOfWeek + 7) % 7;
                                $currentDate->modify("+$daysToAdd days");

                                // Add all occurrences of this day in the target month
                                while ((int)$currentDate->format('m') == (int)$targetDate->format('m')) {
                                    $targetDates[] = $currentDate->format('Y-m-d');
                                    $currentDate->modify("+1 week");
                                }
                            }
                        } else {
                            // Non-recurring event - use the original logic (map by week occurrence)
                            $oldDate = new DateTime($event['date']);

                            // Obține ziua săptămânii (0=Duminică, 1=Luni, etc.)
                            $dayOfWeek = (int)$oldDate->format('w');

                            // Calculează a câta apariție a acestei zile este în lună (1=prima, 2=a doua, etc.)
                            $dayOfMonth = (int)$oldDate->format('d');
                            $weekOccurrence = ceil($dayOfMonth / 7);

                            // Găsește aceeași zi a săptămânii în luna țintă
                            $newDate = clone $targetDate;
                            $newDate->setDate(
                                (int)$targetDate->format('Y'),
                                (int)$targetDate->format('m'),
                                1
                            );

                            // Găsește prima apariție a aceleiași zile din săptămână
                            $targetDayOfWeek = (int)$newDate->format('w');
                            $daysToAdd = ($dayOfWeek - $targetDayOfWeek + 7) % 7;
                            $newDate->modify("+$daysToAdd days");

                            // Adaugă săptămâni pentru a ajunge la aceeași apariție (1=prima, 2=a doua, etc.)
                            $newDate->modify("+" . ($weekOccurrence - 1) . " weeks");

                            // Verifică dacă data calculată este încă în luna țintă
                            if ((int)$newDate->format('m') != (int)$targetDate->format('m')) {
                                // Dacă am depășit luna (ex: a 5-a luni nu există), folosește ultima apariție
                                $newDate->modify("-1 week");
                            }

                            $targetDates[] = $newDate->format('Y-m-d');
                        }

                        // Clone the event to all target dates
                        foreach ($targetDates as $newDateStr) {
                            // Generează un nou ID unic pentru fiecare clonă
                            $newId = 'evt' . (int)(microtime(true) * 1000) . substr(md5(uniqid()), 0, 9);

                            // Inserează evenimentul
                            $stmt_evt->execute([
                                $newId,
                                $event['name'],
                                $event['details'],
                                $event['type'],
                                $newDateStr,
                                $event['startTime'],
                                $event['duration'],
                                $event['isPublic'],
                                $event['isBillable'],
                                $event['repeating_json'], // Păstrează setările de recurență
                                '', // Reset comments pentru evenimentele clonate
                                '{}' // Reset attendance pentru evenimentele clonate
                            ]);

                            // Clonează legăturile cu membrii echipei
                            if (!empty($event['teamMemberIds'])) {
                                $teamMemberIds = explode(',', $event['teamMemberIds']);
                                foreach ($teamMemberIds as $teamMemberId) {
                                    $stmt_evt_team->execute([$newId, trim($teamMemberId)]);
                                }
                            }

                            // Clonează legăturile cu clienții
                            if (!empty($event['clientIds'])) {
                                $clientIds = explode(',', $event['clientIds']);
                                foreach ($clientIds as $clientId) {
                                    $stmt_evt_client->execute([$newId, trim($clientId)]);
                                }
                            }

                            // Clonează legăturile cu programele
                            if (!empty($event['programIds'])) {
                                $programIds = explode(',', $event['programIds']);
                                foreach ($programIds as $programId) {
                                    $stmt_evt_prog->execute([$newId, trim($programId)]);
                                }
                            }

                            $clonedCount++;
                        }
                    }

                    $pdo->commit();

                    debugLog("Clonare reușită: $clonedCount evenimente");

                    sendResponse([
                        'success' => true,
                        'message' => "Successfully cloned $clonedCount events from $sourceMonth to $targetMonth",
                        'clonedCount' => $clonedCount
                    ]);

                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    debugLog("Eroare la clonarea programului: " . $e->getMessage());
                    sendError('Failed to clone schedule: ' . $e->getMessage());
                }
            } else {
                sendError('Only POST method is supported for clone-schedule', 405);
            }
            break;

        // ==========================================================
        // CAZUL 'clear-month' - Șterge toate evenimentele dintr-o lună
        // ==========================================================
        case 'clear-month':
            if ($method === 'POST') {
                try {
                    if ($input === null) {
                        sendError('Invalid JSON data', 400);
                    }

                    $month = $input['month'] ?? null; // Format: YYYY-MM

                    if (!$month) {
                        sendError('Month is required (format: YYYY-MM)', 400);
                    }

                    // Validare format lună
                    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
                        sendError('Invalid month format. Use YYYY-MM', 400);
                    }

                    debugLog("Ștergere evenimente pentru luna: $month");

                    // Obține toate evenimentele din luna specificată
                    $stmt = $pdo->prepare("
                        SELECT id
                        FROM events
                        WHERE DATE_FORMAT(date, '%Y-%m') = ?
                    ");
                    $stmt->execute([$month]);
                    $eventIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

                    if (count($eventIds) === 0) {
                        sendError("No events found in month: $month", 404);
                    }

                    debugLog("Găsite " . count($eventIds) . " evenimente pentru ștergere");

                    // Începe tranzacția
                    $pdo->beginTransaction();

                    // Șterge relațiile pentru fiecare eveniment
                    foreach ($eventIds as $eventId) {
                        $pdo->prepare("DELETE FROM event_team_members WHERE event_id = ?")->execute([$eventId]);
                        $pdo->prepare("DELETE FROM event_clients WHERE event_id = ?")->execute([$eventId]);
                        $pdo->prepare("DELETE FROM event_programs WHERE event_id = ?")->execute([$eventId]);
                    }

                    // Șterge evenimentele
                    $stmt = $pdo->prepare("DELETE FROM events WHERE DATE_FORMAT(date, '%Y-%m') = ?");
                    $stmt->execute([$month]);
                    $deletedCount = $stmt->rowCount();

                    $pdo->commit();

                    debugLog("Ștergere reușită: $deletedCount evenimente");

                    sendResponse([
                        'success' => true,
                        'message' => "Successfully deleted $deletedCount events from $month",
                        'deletedCount' => $deletedCount
                    ]);

                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    debugLog("Eroare la ștergerea evenimentelor: " . $e->getMessage());
                    sendError('Failed to clear month: ' . $e->getMessage());
                }
            } else {
                sendError('Only POST method is supported for clear-month', 405);
            }
            break;

        // ==========================================================
        // DEFAULT
        // ==========================================================
        default:
            sendError('Invalid endpoint: ' . $path, 404);
    }

} catch (Exception $e) {
            // Verifică dacă tranzacția e activă înainte de rollback
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            debugLog("EROARE PHP GLOBALĂ: " . $e->getMessage());
            sendError('Failed to write data (transaction failed): ' . $e->getMessage());
        }
?>