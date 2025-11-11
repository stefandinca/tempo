<?php
/**
 * Remote Database Configuration
 * Configure the remote database that stores tempo_clients table for validation
 *
 * IMPORTANT: Keep this file secure and never commit sensitive credentials to git
 * For production, use environment variables or a secure secrets manager
 */

// Remote database configuration
// This database should contain a table named "tempo_clients" with columns:
// - tempo_client_id (VARCHAR)
// - max_users (INT)
// - max_clients (INT)
// - date_created (DATETIME/TIMESTAMP)

define('REMOTE_DB_HOST', getenv('REMOTE_DB_HOST') ?: '127.0.0.1');
define('REMOTE_DB_NAME', getenv('REMOTE_DB_NAME') ?: 'remote_tempo_licensing');
define('REMOTE_DB_USER', getenv('REMOTE_DB_USER') ?: 'remote_user');
define('REMOTE_DB_PASS', getenv('REMOTE_DB_PASS') ?: 'your_password_here');

// Alternative: Use REST API for validation instead of direct database connection
// Uncomment and configure if you prefer API-based validation
// define('REMOTE_API_URL', 'https://your-remote-server.com/api/validate');

// Enable/disable remote validation
// Set to false during development or if you don't want to enforce limits yet
define('ENABLE_REMOTE_VALIDATION', getenv('ENABLE_REMOTE_VALIDATION') !== false ? true : false);

// Validation mode: 'database' or 'api'
define('VALIDATION_MODE', getenv('VALIDATION_MODE') ?: 'database');

/**
 * Get remote database configuration as array
 */
function getRemoteDbConfig() {
    return [
        'host' => REMOTE_DB_HOST,
        'name' => REMOTE_DB_NAME,
        'user' => REMOTE_DB_USER,
        'pass' => REMOTE_DB_PASS
    ];
}

/**
 * Check if remote validation is enabled
 */
function isRemoteValidationEnabled() {
    return ENABLE_REMOTE_VALIDATION === true;
}
?>
