<?php
/**
 * Therapy Calendar API - PHP Backend (MySQL Version)
 * 
 * UPDATED: Added /event-types endpoint for managing event types and pricing
 */

// Erori (dezactivează 'display_errors' în producție)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Include conexiunea la baza de date
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
    sendResponse(['error' => $message], $statusCode);
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path   = isset($_GET['path']) ? $_GET['path'] : '';
$input  = json_decode(file_get_contents('php://input'), true);

// Asigură-te că $pdo există
if (!isset($pdo)) {
    sendError('Database connection object is not available.', 500);
}

// Route requests
try {
    switch ($path) {
        
        // ==========================================================
        // NEW: CAZUL 'event-types' - Gestionează tipurile de evenimente și prețurile
        // ==========================================================
        case 'event-types':
            if ($method === 'GET') {
                // Fetch all event types with pricing
                $stmt = $pdo->query("SELECT * FROM event_types ORDER BY id");
                $eventTypes = [];
                while ($row = $stmt->fetch()) {
                    $eventTypes[] = [
                        'id' => $row['id'],
                        'label' => $row['label'],
                        'isBillable' => (bool)$row['isBillable'],
                        'requiresTime' => (bool)$row['requiresTime'],
                        'basePrice' => (float)$row['base_price'],
                        'createdAt' => $row['created_at'],
                        'updatedAt' => $row['updated_at']
                    ];
                }
                sendResponse($eventTypes);
                
            } elseif ($method === 'POST' || $method === 'PUT') {
                // Update event types (bulk update)
                if (!$input || !is_array($input)) {
                    sendError('Invalid JSON data. Expected an array of event types.', 400);
                }
                
                try {
                    $pdo->beginTransaction();
                    
                    $stmt = $pdo->prepare("
                        UPDATE event_types 
                        SET label = ?, 
                            isBillable = ?, 
                            requiresTime = ?, 
                            base_price = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ");
                    
                    foreach ($input as $eventType) {
                        if (!isset($eventType['id'])) {
                            throw new Exception('Event type ID is required');
                        }
                        
                        $stmt->execute([
                            $eventType['label'] ?? '',
                            isset($eventType['isBillable']) ? (int)$eventType['isBillable'] : 1,
                            isset($eventType['requiresTime']) ? (int)$eventType['requiresTime'] : 1,
                            isset($eventType['basePrice']) ? (float)$eventType['basePrice'] : 100.00,
                            $eventType['id']
                        ]);
                    }
                    
                    $pdo->commit();
                    sendResponse(['success' => true, 'message' => 'Event types updated successfully']);
                    
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    sendError('Failed to update event types: ' . $e->getMessage(), 500);
                }
                
            } else {
                sendError('Unsupported method', 405);
            }
            break;
        
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
                    $event['repeating'] = $event['repeating'] ? array_map('intval', json_decode($event['repeating'])) : [];
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

            } elseif ($method === 'POST') {
                if (!$input) {
                    sendError('Invalid JSON data', 400);
                }

                try {
                    $pdo->beginTransaction();

                    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
                    $pdo->exec("DELETE FROM event_team_members;");
                    $pdo->exec("DELETE FROM event_clients;");
                    $pdo->exec("DELETE FROM event_programs;");
                    $pdo->exec("DELETE FROM events;");
                    $pdo->exec("DELETE FROM clients;");
                    $pdo->exec("DELETE FROM team_members;");
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

                    $stmt_evt = $pdo->prepare("INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
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
                            json_encode($e['repeating'] ?? []), $e['comments'] ?? null
                        ]);
                        
                        foreach ($e['teamMemberIds'] ?? [] as $id) { $stmt_evt_team->execute([$e['id'], $id]); }
                        foreach ($e['clientIds'] ?? [] as $id) { $stmt_evt_client->execute([$e['id'], $id]); }
                        foreach ($e['programIds'] ?? [] as $id) { $stmt_evt_prog->execute([$e['id'], $id]); }
                    }

                    $pdo->commit();
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
        // CAZUL 'evolution'
        // ==========================================================
        case 'evolution':
            if ($method === 'GET') {
                $evolutionData = [];

                $stmt_portage = $pdo->query("SELECT * FROM portage_evaluations");
                while ($row = $stmt_portage->fetch()) {
                    $evolutionData[$row['client_id']]['evaluations'][$row['domain']][$row['eval_date']] = (int)$row['score'];
                }

                $stmt_history = $pdo->query("SELECT * FROM program_history ORDER BY eval_date DESC");
                while ($row = $stmt_history->fetch()) {
                    $evolutionData[$row['client_id']]['programHistory'][] = [
                        "date" => $row['eval_date'],
                        "programId" => $row['program_id'],
                        "score" => $row['score'],
                        "eventId" => $row['event_id']
                    ];
                }

                $stmt_logo = $pdo->query("SELECT * FROM logopedic_evaluations");
                while ($row = $stmt_logo->fetch()) {
                    $evolutionData[$row['client_id']]['evaluationsLogopedica'][$row['eval_date']] = [
                        'scores' => json_decode($row['scores_json'], true),
                        'comments' => $row['comments']
                    ];
                }

                $stmt_theme = $pdo->query("SELECT * FROM monthly_themes");
                while ($row = $stmt_theme->fetch()) {
                    $evolutionData[$row['client_id']]['monthlyThemes'][$row['month_key']] = $row['theme_text'];
                }
                
                sendResponse($evolutionData);

            } elseif ($method === 'POST') {
                try {
                    $pdo->beginTransaction();
                    
                    $pdo->exec("DELETE FROM portage_evaluations;");
                    $pdo->exec("DELETE FROM program_history;");
                    $pdo->exec("DELETE FROM logopedic_evaluations;");
                    $pdo->exec("DELETE FROM monthly_themes;");

                    $stmt_portage = $pdo->prepare("INSERT INTO portage_evaluations (client_id, domain, eval_date, score) VALUES (?, ?, ?, ?)");
                    $stmt_history = $pdo->prepare("INSERT INTO program_history (client_id, event_id, program_id, score, eval_date) VALUES (?, ?, ?, ?, ?)");
                    $stmt_logo = $pdo->prepare("INSERT INTO logopedic_evaluations (client_id, eval_date, scores_json, comments) VALUES (?, ?, ?, ?)");
                    $stmt_theme = $pdo->prepare("INSERT INTO monthly_themes (client_id, month_key, theme_text) VALUES (?, ?, ?)");

                    foreach ($input as $clientId => $data) {
                        foreach ($data['evaluations'] ?? [] as $domain => $dates) {
                            foreach ($dates as $date => $score) {
                                $stmt_portage->execute([$clientId, $domain, $date, $score]);
                            }
                        }
                        foreach ($data['programHistory'] ?? [] as $entry) {
                            $stmt_history->execute([$clientId, $entry['eventId'], $entry['programId'], $entry['score'], $entry['date']]);
                        }
                        foreach ($data['evaluationsLogopedica'] ?? [] as $date => $entry) {
                            $stmt_logo->execute([$clientId, $date, json_encode($entry['scores']), $entry['comments']]);
                        }
                        foreach ($data['monthlyThemes'] ?? [] as $monthKey => $text) {
                            $stmt_theme->execute([$clientId, $monthKey, $text]);
                        }
                    }
                    
                    $pdo->commit();
                    sendResponse(['success' => true, 'message' => 'Evolution data saved']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
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
                $billingsData = [];
                while ($row = $stmt->fetch()) {
                    $clientId = $row['client_id'];
                    $monthKey = $row['month_key'];
                    if (!isset($billingsData[$clientId])) $billingsData[$clientId] = [];
                    if (!isset($billingsData[$clientId][$monthKey])) $billingsData[$clientId][$monthKey] = [];
                    
                    $billingsData[$clientId][$monthKey][] = [
                        'id' => $row['id'],
                        'date' => $row['payment_date'],
                        'amount' => (float)$row['amount'],
                        'notes' => $row['notes']
                    ];
                }
                sendResponse($billingsData);

            } elseif ($method === 'POST') {
                try {
                    $pdo->beginTransaction();
                    $pdo->exec("DELETE FROM payments;");
                    $stmt = $pdo->prepare("INSERT INTO payments (id, client_id, month_key, payment_date, amount, notes) VALUES (?, ?, ?, ?, ?, ?)");
                    
                    foreach ($input as $clientId => $months) {
                        foreach ($months as $monthKey => $payments) {
                            foreach ($payments as $payment) {
                                $stmt->execute([
                                    $payment['id'], $clientId, $monthKey,
                                    $payment['date'], $payment['amount'], $payment['notes']
                                ]);
                            }
                        }
                    }
                    $pdo->commit();
                    sendResponse(['success' => true, 'message' => 'Billings data saved']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    sendError('Failed to write billings data: ' . $e->getMessage());
                }
            }
            break;

        // ==========================================================
        // CAZURILE .json (programs, portrige)
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
        // ENDPOINT-URI VECHI (Dezactivate)
        // ==========================================================
        case 'events':
        case 'clients':
        case 'team':
            sendError('This endpoint is deprecated. Use GET/POST on "data" endpoint.', 404);
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
    sendError('Failed to process request: ' . $e->getMessage());
}
?>