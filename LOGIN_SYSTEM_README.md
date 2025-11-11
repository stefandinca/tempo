# Login System Documentation

## Overview

This document describes the login/register system implemented for the Tempo Calendar application.

## Features

- User registration with validation
- Secure login authentication
- Session management
- Protected admin area
- Logout functionality
- Password strength requirements
- Clean, responsive UI

## Files Added/Modified

### New Files

1. **login.html** - Login and registration page
   - Beautiful gradient design
   - Tab interface for login/register
   - Form validation
   - Responsive layout

2. **js/login.js** - Client-side authentication logic
   - Form handling
   - Input validation
   - API communication
   - Error handling

3. **auth.php** - Authentication API backend
   - User registration endpoint
   - Login endpoint
   - Logout endpoint
   - Session check endpoint
   - Secure password hashing (bcrypt)

4. **users.json** - User data storage
   - Stores user accounts
   - Passwords are hashed using PHP's password_hash()

### Modified Files

1. **admin.html**
   - Added authentication check script
   - Added logout button in sidebar
   - Redirects to login if not authenticated

2. **js/main.js**
   - Added logout button reference
   - Added logout event listener
   - Added handleLogout function

## Usage

### First Time Setup

1. Navigate to `login.html` in your browser
2. Click the "Inregistrare" (Register) tab
3. Fill in your details:
   - Full name
   - Email address
   - Password (min 8 chars, 1 uppercase, 1 number)
   - Confirm password
4. Click "Inregistrare" to create account
5. You'll be automatically switched to the login tab

### Logging In

1. Navigate to `login.html`
2. Enter your email and password
3. Click "Autentificare"
4. You'll be redirected to the admin interface

### Logging Out

1. In the admin interface, find the logout button in the sidebar footer (last icon)
2. Click the logout button
3. You'll be redirected to the login page

## Security Features

- **Password Hashing**: Uses PHP's `password_hash()` with bcrypt
- **Password Validation**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
- **Session Management**: PHP sessions for authentication state
- **Protected Routes**: Admin page checks authentication on load
- **Input Sanitization**: Email and name validation
- **HTTPS Ready**: Works with HTTPS for production

## API Endpoints

### POST /auth.php?action=register
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inregistrare reusita"
}
```

### POST /auth.php?action=login
Authenticate a user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Autentificare reusita",
  "user": {
    "id": "user_...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### POST /auth.php?action=logout
Log out current user

**Response:**
```json
{
  "success": true,
  "message": "Deconectare reusita"
}
```

### GET /auth.php?action=check
Check if user is authenticated

**Response:**
```json
{
  "success": true,
  "logged_in": true,
  "user": {
    "id": "user_...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters long
- At least one uppercase letter (A-Z)
- At least one number (0-9)

Example valid passwords:
- `Password123`
- `Secure2024`
- `MyPass99`

## Troubleshooting

### Cannot Login
- Ensure your email and password are correct
- Check that `users.json` has write permissions
- Verify PHP sessions are working on your server

### Session Lost After Page Refresh
- Check that PHP sessions are properly configured
- Ensure cookies are enabled in your browser
- Verify session.save_path is writable

### Registration Fails
- Check that `users.json` exists and is writable
- Ensure your password meets all requirements
- Verify the email format is valid

## File Permissions

Ensure the following files have write permissions:
- `users.json` - 0644 or 0666
- Session directory (typically `/tmp` or configured in php.ini)

## Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Session Security**: Configure secure session settings in php.ini
3. **File Permissions**: Restrict `users.json` permissions
4. **Backup**: Regularly backup `users.json`
5. **Rate Limiting**: Consider adding rate limiting to prevent brute force attacks
6. **Email Verification**: Consider adding email verification for new accounts
7. **Password Reset**: Consider adding password reset functionality

## Future Enhancements

- Password reset via email
- Email verification for new accounts
- Two-factor authentication
- Remember me functionality
- User role management
- Account settings page
- Activity logs
- Rate limiting for login attempts

## Support

For issues or questions, please contact the development team.
