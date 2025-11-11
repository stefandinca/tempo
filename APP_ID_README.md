# Tempo App ID & License Management System

This document explains the unique App ID feature that enables license validation and user/client limit enforcement for Tempo installations.

## Overview

Each Tempo installation now has a **unique App ID** that identifies it and allows for remote validation against a licensing server. This enables:

- **Installation tracking**: Each deployment gets a unique identifier
- **User limits**: Enforce maximum number of team members
- **Client limits**: Enforce maximum number of clients/patients
- **Remote validation**: Check limits against a central licensing database

## Architecture

### Components

1. **Database Table** (`app_config`)
   - Stores the unique App ID in the local database
   - Auto-creates on first run

2. **PHP Service** (`appIdService.php`)
   - Generates unique App IDs
   - Validates against remote database
   - Checks user/client limits

3. **JavaScript Service** (`js/appIdService.js`)
   - Frontend interface for App ID features
   - Performs validation on app startup
   - Validates before adding users/clients

4. **API Endpoints** (in `api.php`)
   - `GET /api.php?path=app-id` - Get current App ID
   - `GET /api.php?path=validate-app` - Validate installation
   - `GET /api.php?path=check-user-limit` - Check if user can be added
   - `GET /api.php?path=check-client-limit` - Check if client can be added

5. **Remote Database Configuration** (`remote_config.php`)
   - Configures connection to licensing server
   - Can use direct database connection or REST API

## Setup

### 1. Run Database Migration

First, create the `app_config` table in your local database:

```bash
mysql -u your_user -p your_database < app_config_migration.sql
```

Or run this SQL directly:

```sql
CREATE TABLE IF NOT EXISTS `app_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `config_key` varchar(255) NOT NULL UNIQUE,
  `config_value` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. Set Up Remote Licensing Database

On your licensing/management server, create a table to track Tempo installations:

```sql
CREATE TABLE `tempo_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tempo_client_id` varchar(255) NOT NULL UNIQUE,
  `max_users` int(11) NOT NULL DEFAULT 5,
  `max_clients` int(11) NOT NULL DEFAULT 50,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `client_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `plan_type` varchar(50) DEFAULT 'basic',
  `status` enum('active','suspended','expired') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tempo_client_id` (`tempo_client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. Configure Remote Connection

Edit `remote_config.php` to set up the connection to your licensing database:

```php
// Option 1: Direct Database Connection
define('REMOTE_DB_HOST', 'your-licensing-server.com');
define('REMOTE_DB_NAME', 'licensing_database');
define('REMOTE_DB_USER', 'licensing_user');
define('REMOTE_DB_PASS', 'your_secure_password');

// Option 2: REST API (alternative)
// define('REMOTE_API_URL', 'https://your-licensing-api.com/validate');

// Enable/disable validation
define('ENABLE_REMOTE_VALIDATION', true);

// Validation mode: 'database' or 'api'
define('VALIDATION_MODE', 'database');
```

**Security Note**: For production, use environment variables instead of hardcoded credentials:

```php
define('REMOTE_DB_HOST', getenv('REMOTE_DB_HOST'));
define('REMOTE_DB_PASS', getenv('REMOTE_DB_PASS'));
```

### 4. Register Installation

After deployment, get the App ID from the installation:

1. Open the Tempo dashboard
2. Look at the "License Info" card
3. Copy the App ID

Then register it in your licensing database:

```sql
INSERT INTO tempo_clients (tempo_client_id, max_users, max_clients, client_name, plan_type)
VALUES ('TEMPO-12345678-1234-1234-1234-123456789012', 10, 100, 'Client Name', 'professional');
```

## How It Works

### On App Startup

1. **App ID Generation** (first run only)
   - Generates unique ID based on server characteristics
   - Format: `TEMPO-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
   - Stores in `app_config` table

2. **Validation**
   - Connects to remote licensing database
   - Checks if App ID is registered
   - Retrieves max_users and max_clients limits
   - Compares with current counts

3. **Display Status**
   - Shows App ID in dashboard
   - Displays validation status (Valid/Invalid/Disabled)
   - Shows current usage vs limits

### When Adding Users/Clients

Before allowing a new user or client to be created:

1. Checks current count vs limit from licensing server
2. If limit exceeded, shows error and prevents creation
3. If within limit, allows creation

## Validation Modes

### Mode 1: Direct Database Connection

The app connects directly to the licensing database to validate.

**Pros**:
- Fast validation
- No additional API needed

**Cons**:
- Requires database access from Tempo server
- Firewall rules needed

### Mode 2: REST API

The app calls a REST API endpoint that handles validation.

**Pros**:
- More secure (no direct DB access)
- Can add custom logic/logging
- Better for SaaS deployments

**Cons**:
- Requires building an API
- Additional network hop

To use API mode:

```php
define('VALIDATION_MODE', 'api');
define('REMOTE_API_URL', 'https://api.example.com/tempo/validate');
```

Your API should accept:

```json
POST /tempo/validate
{
  "app_id": "TEMPO-...",
  "current_users": 5,
  "current_clients": 23
}
```

And return:

```json
{
  "valid": true,
  "app_id": "TEMPO-...",
  "limits": {
    "max_users": 10,
    "max_clients": 100
  },
  "current": {
    "users": 5,
    "clients": 23
  }
}
```

## Disabling Validation

For development or if you don't want to enforce limits:

```php
define('ENABLE_REMOTE_VALIDATION', false);
```

When disabled:
- App ID is still generated
- No limits are enforced
- Dashboard shows "Disabled" status

## Testing

### Test the App ID API

```bash
# Get App ID
curl http://your-tempo-install/api.php?path=app-id

# Validate installation
curl http://your-tempo-install/api.php?path=validate-app

# Check if user can be added
curl http://your-tempo-install/api.php?path=check-user-limit

# Check if client can be added
curl http://your-tempo-install/api.php?path=check-client-limit
```

### Test Limit Enforcement

1. Set low limits in licensing database (e.g., max_users=2, max_clients=3)
2. Try adding users/clients beyond the limit
3. Verify error message is shown

## Troubleshooting

### App ID not showing in dashboard

- Check browser console for errors
- Verify `app_config` table exists
- Check that `appIdService.php` file is present

### Validation always fails

- Check `remote_config.php` credentials
- Test database connection from server
- Check firewall rules
- Look at PHP error logs

### Limits not enforced

- Verify `ENABLE_REMOTE_VALIDATION` is `true`
- Check that App ID is registered in licensing database
- Verify the `tempo_client_id` matches exactly

### "Installation Not Registered" error

The App ID needs to be added to the licensing database. Copy the App ID from the dashboard and run:

```sql
INSERT INTO tempo_clients (tempo_client_id, max_users, max_clients)
VALUES ('your-app-id-here', 10, 100);
```

## Security Considerations

1. **Credentials**: Use environment variables for database credentials
2. **API Authentication**: If using API mode, add authentication
3. **HTTPS**: Always use HTTPS for remote connections
4. **Firewall**: Restrict database access to specific IPs
5. **Read-only Access**: Give Tempo installations read-only access to licensing DB

## License Plans Example

You can define different plans:

```sql
-- Basic Plan
INSERT INTO tempo_clients (tempo_client_id, max_users, max_clients, plan_type)
VALUES ('TEMPO-...', 3, 25, 'basic');

-- Professional Plan
INSERT INTO tempo_clients (tempo_client_id, max_users, max_clients, plan_type)
VALUES ('TEMPO-...', 10, 100, 'professional');

-- Enterprise Plan
INSERT INTO tempo_clients (tempo_client_id, max_users, max_clients, plan_type)
VALUES ('TEMPO-...', 999, 999, 'enterprise');
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Check PHP error logs
3. Review this documentation
4. Contact system administrator

---

**Created**: 2025-11-11
**Version**: 1.0
