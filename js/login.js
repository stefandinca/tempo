/**
 * Login/Register Page JavaScript
 * Handles authentication forms and tab switching
 */

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.login-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Clear messages when switching tabs
            clearMessages();
        });
    });

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
});

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('loginBtn');

    // Validation
    if (!email || !password) {
        showMessage('loginMessage', 'Va rugam completati toate campurile', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('loginMessage', 'Va rugam introduceti un email valid', 'error');
        return;
    }

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se autentifica...';

    try {
        const response = await fetch('auth.php?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('loginMessage', 'Autentificare reusita! Redirectionare...', 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            showMessage('loginMessage', data.message || 'Email sau parola incorecte', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Autentificare';
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Eroare la conectare. Va rugam incercati din nou.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Autentificare';
    }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = document.getElementById('registerBtn');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage('registerMessage', 'Va rugam completati toate campurile', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('registerMessage', 'Va rugam introduceti un email valid', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showMessage('registerMessage', 'Parola trebuie sa contina minim 8 caractere, o litera mare si o cifra', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('registerMessage', 'Parolele nu coincid', 'error');
        return;
    }

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se inregistreaza...';

    try {
        const response = await fetch('auth.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('registerMessage', 'Inregistrare reusita! Va puteti autentifica acum.', 'success');
            // Clear form
            document.getElementById('registerForm').reset();
            // Switch to login tab after 2 seconds
            setTimeout(() => {
                document.querySelector('.login-tab[data-tab="login"]').click();
            }, 2000);
        } else {
            showMessage('registerMessage', data.message || 'Eroare la inregistrare', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Inregistrare';
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('registerMessage', 'Eroare la inregistrare. Va rugam incercati din nou.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Inregistrare';
    }
}

/**
 * Display message to user
 */
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    messageEl.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
}

/**
 * Clear all messages
 */
function clearMessages() {
    document.getElementById('loginMessage').innerHTML = '';
    document.getElementById('registerMessage').innerHTML = '';
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, one uppercase letter, one number
 */
function validatePassword(password) {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}
