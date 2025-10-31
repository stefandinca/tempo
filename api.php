<?php
/**
 * Therapy Calendar API - PHP Backend
 * Provides RESTful API for calendar data management
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 in production
ini_set('log_errors', 1);

// CORS headers - adjust for production
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ---------- Cache control helpers ----------
function setNoCacheHeaders() {
    // Prevent browsers/CDNs from caching responses
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Content-Type: application/json; charset=utf-8');
}

/**
 * Send ETag/Last-Modified based on a file, and handle conditional GET.
 * If client validators match, responds 304 and exits.
 */
function setValidationHeadersFromFile($filePath) {
    if (!is_file($filePath)) {
        return;
    }
    clearstatcache(true, $filePath);
    $mtime = filemtime($filePath);
    $size  = filesize($filePath);
    $etag  = '"' . md5($filePath . '|' . $mtime . '|' . $size) . '"';

    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');

    $ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim($_SERVER['HTTP_IF_NONE_MATCH']) : null;
    $ifModified  = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) : null;

    if (($ifNoneMatch && $ifNoneMatch === $etag) || ($ifModified && $ifModified >= $mtime)) {
        setNoCacheHeaders();
        http_response_code(304);
        exit();
    }
}

// Handle preflight requests early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setNoCacheHeaders();
    http_response_code(200);
    exit();
}

// Data file path
$dataFile = __DIR__ . '/data.json';

/**
 * Read data from JSON file
 */
function readData($dataFile) {
    if (!file_exists($dataFile)) {
        return [
            'teamMembers' => [],
            'clients' => [],
            'events' => []
        ];
    }

    $content = file_get_contents($dataFile);
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [
        'teamMembers' => [],
        'clients' => [],
        'events' => []
    ];
}

/**
 * Write data to JSON file
 */
function writeData($dataFile, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($dataFile, $json) !== false;
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

// Route requests
try {
    switch ($path) {
        case 'data':
            if ($method === 'GET') {
                // Validators derived from data.json
                setValidationHeadersFromFile($dataFile);
                $data = readData($dataFile);
                sendResponse($data);

            } elseif ($method === 'POST') {
                if (!$input) {
                    sendError('Invalid JSON data', 400);
                }

                if (writeData($dataFile, $input)) {
                    sendResponse(['success' => true, 'message' => 'Data saved successfully']);
                } else {
                    sendError('Failed to write data');
                }
            } else {
                sendError('Unsupported method', 405);
            }
            break;

        case 'events':
            $data = readData($dataFile);

            if ($method === 'POST') {
                // Add event
                if (!isset($input['id'])) {
                    sendError('Event ID is required', 400);
                }

                if (!isset($data['events']) || !is_array($data['events'])) {
                    $data['events'] = [];
                }

                $data['events'][] = $input;

                if (writeData($dataFile, $data)) {
                    sendResponse(['success' => true, 'event' => $input]);
                } else {
                    sendError('Failed to add event');
                }

            } elseif ($method === 'PUT' && isset($_GET['id'])) {
                // Update event
                $eventId = $_GET['id'];
                $found = false;

                if (!isset($data['events']) || !is_array($data['events'])) {
                    $data['events'] = [];
                }

                foreach ($data['events'] as &$event) {
                    if (isset($event['id']) && $event['id'] === $eventId) {
                        $event = array_merge($event, $input ?? []);
                        $found = true;
                        break;
                    }
                }
                unset($event);

                if ($found) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'event' => $eventId]);
                    } else {
                        sendError('Failed to update event');
                    }
                } else {
                    sendError('Event not found', 404);
                }

            } elseif ($method === 'DELETE' && isset($_GET['id'])) {
                // Delete event
                $eventId = $_GET['id'];
                $initialCount = isset($data['events']) && is_array($data['events']) ? count($data['events']) : 0;

                $data['events'] = array_values(array_filter($data['events'] ?? [], function($e) use ($eventId) {
                    return isset($e['id']) && $e['id'] !== $eventId;
                }));

                if (count($data['events']) < $initialCount) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'message' => 'Event deleted']);
                    } else {
                        sendError('Failed to delete event');
                    }
                } else {
                    sendError('Event not found', 404);
                }
            } else {
                sendError('Unsupported method', 405);
            }
            break;

        case 'clients':
            $data = readData($dataFile);

            if (!isset($data['clients']) || !is_array($data['clients'])) {
                $data['clients'] = [];
            }

            if ($method === 'POST') {
                // Add client
                if (!isset($input['id'])) {
                    sendError('Client ID is required', 400);
                }

                $data['clients'][] = $input;

                if (writeData($dataFile, $data)) {
                    sendResponse(['success' => true, 'client' => $input]);
                } else {
                    sendError('Failed to add client');
                }

            } elseif ($method === 'PUT' && isset($_GET['id'])) {
                // Update client
                $clientId = $_GET['id'];
                $found = false;

                foreach ($data['clients'] as &$client) {
                    if (isset($client['id']) && $client['id'] === $clientId) {
                        $client = array_merge($client, $input ?? []);
                        $found = true;
                        break;
                    }
                }
                unset($client);

                if ($found) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'client' => $clientId]);
                    } else {
                        sendError('Failed to update client');
                    }
                } else {
                    sendError('Client not found', 404);
                }

            } elseif ($method === 'DELETE' && isset($_GET['id'])) {
                // Delete client
                $clientId = $_GET['id'];
                $initialCount = count($data['clients']);

                $data['clients'] = array_values(array_filter($data['clients'], function($c) use ($clientId) {
                    return isset($c['id']) && $c['id'] !== $clientId;
                }));

                // Remove clientId from events
                if (!isset($data['events']) || !is_array($data['events'])) {
                    $data['events'] = [];
                }
                foreach ($data['events'] as &$event) {
                    if (isset($event['clientId']) && $event['clientId'] === $clientId) {
                        unset($event['clientId']);
                    }
                }
                unset($event);

                if (count($data['clients']) < $initialCount) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'message' => 'Client deleted']);
                    } else {
                        sendError('Failed to delete client');
                    }
                } else {
                    sendError('Client not found', 404);
                }
            } else {
                sendError('Unsupported method', 405);
            }
            break;

        case 'team':
            $data = readData($dataFile);

            if (!isset($data['teamMembers']) || !is_array($data['teamMembers'])) {
                $data['teamMembers'] = [];
            }

            if ($method === 'POST') {
                // Add team member
                if (!isset($input['id'])) {
                    sendError('Team member ID is required', 400);
                }

                $data['teamMembers'][] = $input;

                if (writeData($dataFile, $data)) {
                    sendResponse(['success' => true, 'member' => $input]);
                } else {
                    sendError('Failed to add team member');
                }

            } elseif ($method === 'PUT' && isset($_GET['id'])) {
                // Update team member
                $memberId = $_GET['id'];
                $found = false;

                foreach ($data['teamMembers'] as &$member) {
                    if (isset($member['id']) && $member['id'] === $memberId) {
                        $member = array_merge($member, $input ?? []);
                        $found = true;
                        break;
                    }
                }
                unset($member);

                if ($found) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'member' => $memberId]);
                    } else {
                        sendError('Failed to update team member');
                    }
                } else {
                    sendError('Team member not found', 404);
                }

            } elseif ($method === 'DELETE' && isset($_GET['id'])) {
                // Delete team member
                $memberId = $_GET['id'];
                $initialCount = count($data['teamMembers']);

                $data['teamMembers'] = array_values(array_filter($data['teamMembers'], function($m) use ($memberId) {
                    return isset($m['id']) && $m['id'] !== $memberId;
                }));

                // Remove their events
                if (!isset($data['events']) || !is_array($data['events'])) {
                    $data['events'] = [];
                }
                $data['events'] = array_values(array_filter($data['events'], function($e) use ($memberId) {
                    return !isset($e['teamMemberId']) || $e['teamMemberId'] !== $memberId;
                }));

                if (count($data['teamMembers']) < $initialCount) {
                    if (writeData($dataFile, $data)) {
                        sendResponse(['success' => true, 'message' => 'Team member deleted']);
                    } else {
                        sendError('Failed to delete team member');
                    }
                } else {
                    sendError('Team member not found', 404);
                }
            } else {
                sendError('Unsupported method', 405);
            }
            break;

        case 'evolution':
            $evolutionFile = __DIR__ . '/evolution.json';

            if ($method === 'GET') {
                setValidationHeadersFromFile($evolutionFile);
                if (file_exists($evolutionFile)) {
                    $content = file_get_contents($evolutionFile);
                    $decoded = json_decode($content, true);
                    sendResponse(is_array($decoded) ? $decoded : []);
                } else {
                    sendError('Evolution data not found', 404);
                }

            } elseif ($method === 'POST') {
                if (!$input) {
                    sendError('Invalid JSON data', 400);
                }

                $json = json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                if (file_put_contents($evolutionFile, $json) !== false) {
                    sendResponse(['success' => true, 'message' => 'Evolution data saved']);
                } else {
                    sendError('Failed to write evolution data');
                }

            } else {
                sendError('Unsupported method', 405);
            }
            break;

                    // --- Generic JSON file loader (for portrige.json, programs.json, etc.) ---
        case (preg_match('/\.json$/', $path) ? true : false):
            $file = __DIR__ . '/' . basename($path);
            if (file_exists($file)) {
                setValidationHeadersFromFile($file);
                $content = file_get_contents($file);
                $decoded = json_decode($content, true);
                sendResponse(is_array($decoded) ? $decoded : $content);
            } else {
                sendError('JSON file not found: ' . $path, 404);
            }
            break;

                error_log("API PATH: " . $path);
        default:
            sendError('Invalid endpoint', 404);
    }

} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage());
}
?>
