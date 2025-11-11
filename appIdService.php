<?php
/**
 * App ID Service
 * Manages unique app ID for this Tempo installation
 * Validates against remote server for client/user limits
 */

require_once 'db.php';

class AppIdService {
    private $pdo;
    private $remoteApiUrl;

    public function __construct($pdo, $remoteApiUrl = null) {
        $this->pdo = $pdo;
        // Set your remote API URL here
        $this->remoteApiUrl = $remoteApiUrl ?? getenv('TEMPO_REMOTE_API_URL');
    }

    /**
     * Get or create the unique app ID for this installation
     */
    public function getAppId() {
        try {
            // Check if app_config table exists, create if not
            $this->ensureAppConfigTable();

            // Try to get existing app ID
            $stmt = $this->pdo->prepare("SELECT config_value FROM app_config WHERE config_key = 'tempo_client_id'");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return $result['config_value'];
            }

            // Generate new unique app ID
            $appId = $this->generateUniqueId();

            // Store it in database
            $stmt = $this->pdo->prepare("INSERT INTO app_config (config_key, config_value) VALUES ('tempo_client_id', ?)");
            $stmt->execute([$appId]);

            return $appId;
        } catch (PDOException $e) {
            error_log("Error getting/creating app ID: " . $e->getMessage());
            throw new Exception("Failed to initialize app ID");
        }
    }

    /**
     * Generate a unique identifier for this installation
     */
    private function generateUniqueId() {
        // Create a unique ID using various server characteristics
        $serverInfo = [
            $_SERVER['SERVER_NAME'] ?? '',
            $_SERVER['SERVER_ADDR'] ?? '',
            $_SERVER['DOCUMENT_ROOT'] ?? '',
            php_uname('n'), // hostname
            time(),
            mt_rand()
        ];

        $uniqueString = implode('|', $serverInfo);
        $hash = hash('sha256', $uniqueString);

        // Format as: TEMPO-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
        return sprintf(
            'TEMPO-%s-%s-%s-%s-%s',
            substr($hash, 0, 8),
            substr($hash, 8, 4),
            substr($hash, 12, 4),
            substr($hash, 16, 4),
            substr($hash, 20, 12)
        );
    }

    /**
     * Ensure app_config table exists
     */
    private function ensureAppConfigTable() {
        $sql = "CREATE TABLE IF NOT EXISTS `app_config` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `config_key` varchar(255) NOT NULL,
            `config_value` text NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `config_key` (`config_key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

        $this->pdo->exec($sql);
    }

    /**
     * Get current counts from local database
     */
    public function getCurrentCounts() {
        try {
            // Count active clients
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM clients");
            $clientCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Count team members (users)
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM team_members");
            $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            return [
                'clients' => $clientCount,
                'users' => $userCount
            ];
        } catch (PDOException $e) {
            error_log("Error getting current counts: " . $e->getMessage());
            return ['clients' => 0, 'users' => 0];
        }
    }

    /**
     * Validate against remote server
     * Checks if the app ID is registered and within limits
     *
     * @param string $remoteDbHost Remote database host
     * @param string $remoteDbName Remote database name
     * @param string $remoteDbUser Remote database username
     * @param string $remoteDbPass Remote database password
     * @return array Validation result with status and limits
     */
    public function validateWithRemoteDb($remoteDbHost, $remoteDbName, $remoteDbUser, $remoteDbPass) {
        try {
            $appId = $this->getAppId();
            $currentCounts = $this->getCurrentCounts();

            // Connect to remote database
            $remoteDsn = "mysql:host={$remoteDbHost};dbname={$remoteDbName};charset=utf8mb4";
            $remotePdo = new PDO($remoteDsn, $remoteDbUser, $remoteDbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // Query tempo_clients table
            $stmt = $remotePdo->prepare("
                SELECT tempo_client_id, max_users, max_clients, date_created
                FROM tempo_clients
                WHERE tempo_client_id = ?
            ");
            $stmt->execute([$appId]);
            $clientInfo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$clientInfo) {
                return [
                    'valid' => false,
                    'error' => 'APP_ID_NOT_REGISTERED',
                    'message' => 'This installation is not registered. Please contact support.',
                    'app_id' => $appId
                ];
            }

            // Check limits
            $exceededLimits = [];

            if ($currentCounts['users'] > $clientInfo['max_users']) {
                $exceededLimits[] = sprintf(
                    'Users: %d/%d exceeded',
                    $currentCounts['users'],
                    $clientInfo['max_users']
                );
            }

            if ($currentCounts['clients'] > $clientInfo['max_clients']) {
                $exceededLimits[] = sprintf(
                    'Clients: %d/%d exceeded',
                    $currentCounts['clients'],
                    $clientInfo['max_clients']
                );
            }

            if (!empty($exceededLimits)) {
                return [
                    'valid' => false,
                    'error' => 'LIMITS_EXCEEDED',
                    'message' => 'You have exceeded your plan limits: ' . implode(', ', $exceededLimits),
                    'app_id' => $appId,
                    'limits' => $clientInfo,
                    'current' => $currentCounts,
                    'exceeded' => $exceededLimits
                ];
            }

            // All checks passed
            return [
                'valid' => true,
                'app_id' => $appId,
                'limits' => $clientInfo,
                'current' => $currentCounts,
                'message' => 'Installation validated successfully'
            ];

        } catch (PDOException $e) {
            error_log("Remote validation error: " . $e->getMessage());
            return [
                'valid' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => 'Unable to validate installation. Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Alternative: Validate via REST API instead of direct database connection
     * Use this if you prefer API-based validation
     *
     * @param string $apiEndpoint Remote API endpoint URL
     * @return array Validation result
     */
    public function validateWithRemoteApi($apiEndpoint = null) {
        $apiEndpoint = $apiEndpoint ?? $this->remoteApiUrl;

        if (!$apiEndpoint) {
            return [
                'valid' => false,
                'error' => 'NO_REMOTE_API',
                'message' => 'Remote validation API not configured'
            ];
        }

        try {
            $appId = $this->getAppId();
            $currentCounts = $this->getCurrentCounts();

            // Prepare request data
            $postData = [
                'app_id' => $appId,
                'current_users' => $currentCounts['users'],
                'current_clients' => $currentCounts['clients']
            ];

            // Make API request
            $ch = curl_init($apiEndpoint);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($postData),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Accept: application/json'
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                throw new Exception("API request failed: " . $error);
            }

            $result = json_decode($response, true);

            if ($httpCode !== 200 || !$result) {
                throw new Exception("Invalid API response");
            }

            return $result;

        } catch (Exception $e) {
            error_log("Remote API validation error: " . $e->getMessage());
            return [
                'valid' => false,
                'error' => 'API_ERROR',
                'message' => 'Validation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if adding a new user would exceed limits
     */
    public function canAddUser($remoteDbConfig = null) {
        if (!$remoteDbConfig) {
            return true; // If no remote validation configured, allow
        }

        $validation = $this->validateWithRemoteDb(
            $remoteDbConfig['host'],
            $remoteDbConfig['name'],
            $remoteDbConfig['user'],
            $remoteDbConfig['pass']
        );

        if (!$validation['valid']) {
            return false;
        }

        $currentCounts = $this->getCurrentCounts();
        return ($currentCounts['users'] + 1) <= $validation['limits']['max_users'];
    }

    /**
     * Check if adding a new client would exceed limits
     */
    public function canAddClient($remoteDbConfig = null) {
        if (!$remoteDbConfig) {
            return true; // If no remote validation configured, allow
        }

        $validation = $this->validateWithRemoteDb(
            $remoteDbConfig['host'],
            $remoteDbConfig['name'],
            $remoteDbConfig['user'],
            $remoteDbConfig['pass']
        );

        if (!$validation['valid']) {
            return false;
        }

        $currentCounts = $this->getCurrentCounts();
        return ($currentCounts['clients'] + 1) <= $validation['limits']['max_clients'];
    }
}
?>
