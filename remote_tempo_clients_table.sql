-- Remote Licensing Database Table
-- This table should be created on your REMOTE licensing/management server
-- It tracks all Tempo installations and their limits

CREATE TABLE IF NOT EXISTS `tempo_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tempo_client_id` varchar(255) NOT NULL,
  `max_users` int(11) NOT NULL DEFAULT 5 COMMENT 'Maximum number of team members allowed',
  `max_clients` int(11) NOT NULL DEFAULT 50 COMMENT 'Maximum number of clients/patients allowed',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `client_name` varchar(255) DEFAULT NULL COMMENT 'Name of organization using this installation',
  `contact_email` varchar(255) DEFAULT NULL COMMENT 'Primary contact email',
  `contact_phone` varchar(50) DEFAULT NULL COMMENT 'Primary contact phone',
  `plan_type` varchar(50) DEFAULT 'basic' COMMENT 'Plan type: basic, professional, enterprise',
  `status` enum('active','suspended','expired','trial') DEFAULT 'active' COMMENT 'License status',
  `notes` text DEFAULT NULL COMMENT 'Internal notes',
  `expiry_date` date DEFAULT NULL COMMENT 'License expiry date (NULL = no expiry)',
  `last_validated` timestamp NULL DEFAULT NULL COMMENT 'Last time this installation validated',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tempo_client_id` (`tempo_client_id`),
  KEY `status` (`status`),
  KEY `plan_type` (`plan_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example data for different plan types

-- Basic Plan Example
INSERT INTO tempo_clients
  (tempo_client_id, max_users, max_clients, client_name, plan_type, status)
VALUES
  ('TEMPO-EXAMPLE1-1111-1111-1111-111111111111', 3, 25, 'Example Clinic (Basic)', 'basic', 'active');

-- Professional Plan Example
INSERT INTO tempo_clients
  (tempo_client_id, max_users, max_clients, client_name, plan_type, status)
VALUES
  ('TEMPO-EXAMPLE2-2222-2222-2222-222222222222', 10, 100, 'Example Clinic (Pro)', 'professional', 'active');

-- Enterprise Plan Example
INSERT INTO tempo_clients
  (tempo_client_id, max_users, max_clients, client_name, plan_type, status)
VALUES
  ('TEMPO-EXAMPLE3-3333-3333-3333-333333333333', 50, 500, 'Example Clinic (Enterprise)', 'enterprise', 'active');

-- Trial Plan Example
INSERT INTO tempo_clients
  (tempo_client_id, max_users, max_clients, client_name, plan_type, status, expiry_date)
VALUES
  ('TEMPO-EXAMPLE4-4444-4444-4444-444444444444', 5, 50, 'Example Clinic (Trial)', 'trial', 'trial', DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- View to monitor active installations
CREATE OR REPLACE VIEW tempo_clients_active AS
SELECT
  tc.*,
  CASE
    WHEN tc.expiry_date IS NOT NULL AND tc.expiry_date < CURDATE() THEN 'EXPIRED'
    WHEN tc.status = 'suspended' THEN 'SUSPENDED'
    WHEN tc.status = 'trial' AND tc.expiry_date < DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'EXPIRING_SOON'
    ELSE 'ACTIVE'
  END as computed_status,
  DATEDIFF(tc.expiry_date, CURDATE()) as days_until_expiry
FROM tempo_clients tc
WHERE tc.status IN ('active', 'trial')
ORDER BY tc.date_created DESC;

-- Stored procedure to check if installation can add user
DELIMITER //
CREATE PROCEDURE check_can_add_user(
  IN p_tempo_client_id VARCHAR(255),
  IN p_current_user_count INT,
  OUT p_can_add BOOLEAN,
  OUT p_message VARCHAR(255)
)
BEGIN
  DECLARE v_max_users INT;
  DECLARE v_status VARCHAR(50);

  SELECT max_users, status INTO v_max_users, v_status
  FROM tempo_clients
  WHERE tempo_client_id = p_tempo_client_id;

  IF v_max_users IS NULL THEN
    SET p_can_add = FALSE;
    SET p_message = 'Installation not registered';
  ELSEIF v_status != 'active' AND v_status != 'trial' THEN
    SET p_can_add = FALSE;
    SET p_message = CONCAT('License status: ', v_status);
  ELSEIF p_current_user_count >= v_max_users THEN
    SET p_can_add = FALSE;
    SET p_message = CONCAT('User limit reached: ', p_current_user_count, '/', v_max_users);
  ELSE
    SET p_can_add = TRUE;
    SET p_message = 'OK';
  END IF;
END //
DELIMITER ;

-- Stored procedure to check if installation can add client
DELIMITER //
CREATE PROCEDURE check_can_add_client(
  IN p_tempo_client_id VARCHAR(255),
  IN p_current_client_count INT,
  OUT p_can_add BOOLEAN,
  OUT p_message VARCHAR(255)
)
BEGIN
  DECLARE v_max_clients INT;
  DECLARE v_status VARCHAR(50);

  SELECT max_clients, status INTO v_max_clients, v_status
  FROM tempo_clients
  WHERE tempo_client_id = p_tempo_client_id;

  IF v_max_clients IS NULL THEN
    SET p_can_add = FALSE;
    SET p_message = 'Installation not registered';
  ELSEIF v_status != 'active' AND v_status != 'trial' THEN
    SET p_can_add = FALSE;
    SET p_message = CONCAT('License status: ', v_status);
  ELSEIF p_current_client_count >= v_max_clients THEN
    SET p_can_add = FALSE;
    SET p_message = CONCAT('Client limit reached: ', p_current_client_count, '/', v_max_clients);
  ELSE
    SET p_can_add = TRUE;
    SET p_message = 'OK';
  END IF;
END //
DELIMITER ;

-- Trigger to update last_validated timestamp
DELIMITER //
CREATE TRIGGER update_last_validated
BEFORE UPDATE ON tempo_clients
FOR EACH ROW
BEGIN
  IF NEW.last_validated IS NOT NULL THEN
    SET NEW.last_validated = CURRENT_TIMESTAMP;
  END IF;
END //
DELIMITER ;
