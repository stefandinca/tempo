/**
 * js/appIdService.js
 *
 * Manages app ID and validation with remote licensing server
 */

import { apiFetch } from './apiService.js';
import { showCustomAlert } from './uiService.js';

// Store app validation status
let appValidationStatus = null;
let appId = null;

/**
 * Initialize and validate app ID
 * Should be called on app startup
 */
export async function initializeAppId() {
    try {
        // Get app ID and current counts
        const appIdData = await apiFetch('app-id');

        if (appIdData.success) {
            appId = appIdData.app_id;
            console.log('App ID initialized:', appId);

            // Store in session for reference
            sessionStorage.setItem('tempo_app_id', appId);

            return appIdData;
        } else {
            throw new Error('Failed to get app ID');
        }
    } catch (error) {
        console.error('Error initializing app ID:', error);
        throw error;
    }
}

/**
 * Validate app against remote server
 * Checks if installation is registered and within limits
 */
export async function validateApp() {
    try {
        const result = await apiFetch('validate-app');
        appValidationStatus = result;

        // Store validation timestamp
        sessionStorage.setItem('tempo_last_validation', new Date().toISOString());
        sessionStorage.setItem('tempo_validation_status', JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error validating app:', error);

        // Return a default error response
        appValidationStatus = {
            valid: false,
            error: 'NETWORK_ERROR',
            message: 'Unable to validate installation: ' + error.message
        };

        return appValidationStatus;
    }
}

/**
 * Get current app ID
 */
export function getAppId() {
    return appId || sessionStorage.getItem('tempo_app_id');
}

/**
 * Get last validation status
 */
export function getValidationStatus() {
    if (appValidationStatus) {
        return appValidationStatus;
    }

    // Try to get from session storage
    const stored = sessionStorage.getItem('tempo_validation_status');
    if (stored) {
        try {
            appValidationStatus = JSON.parse(stored);
            return appValidationStatus;
        } catch (e) {
            return null;
        }
    }

    return null;
}

/**
 * Check if a new user can be added
 * Returns true if within limits, false otherwise
 */
export async function checkCanAddUser() {
    try {
        const result = await apiFetch('check-user-limit');
        return result.can_add;
    } catch (error) {
        console.error('Error checking user limit:', error);
        // Default to allowing if check fails (fail-open for better UX)
        return true;
    }
}

/**
 * Check if a new client can be added
 * Returns true if within limits, false otherwise
 */
export async function checkCanAddClient() {
    try {
        const result = await apiFetch('check-client-limit');
        return result.can_add;
    } catch (error) {
        console.error('Error checking client limit:', error);
        // Default to allowing if check fails (fail-open for better UX)
        return true;
    }
}

/**
 * Display validation status to user
 * Shows warning if limits are exceeded
 */
export function displayValidationStatus() {
    const status = getValidationStatus();

    if (!status) {
        return;
    }

    if (!status.validation_enabled) {
        console.log('App validation is disabled');
        return;
    }

    if (!status.valid) {
        let message = status.message || 'Installation validation failed';

        if (status.error === 'APP_ID_NOT_REGISTERED') {
            message = `
                <div class="p-4">
                    <h3 class="text-xl font-bold text-red-600 mb-2">Installation Not Registered</h3>
                    <p class="mb-4">${status.message}</p>
                    <p class="text-sm text-gray-600">App ID: <code class="bg-gray-100 px-2 py-1 rounded">${status.app_id}</code></p>
                    <p class="mt-2 text-sm">Please contact your system administrator to register this installation.</p>
                </div>
            `;
        } else if (status.error === 'LIMITS_EXCEEDED') {
            message = `
                <div class="p-4">
                    <h3 class="text-xl font-bold text-yellow-600 mb-2">License Limits Exceeded</h3>
                    <p class="mb-4">${status.message}</p>
                    <div class="text-sm space-y-2">
                        <p><strong>Current Usage:</strong></p>
                        <ul class="list-disc list-inside ml-4">
                            <li>Users: ${status.current?.users || 0} / ${status.limits?.max_users || 0}</li>
                            <li>Clients: ${status.current?.clients || 0} / ${status.limits?.max_clients || 0}</li>
                        </ul>
                        ${status.exceeded ? `<p class="text-red-600 mt-2"><strong>Exceeded:</strong> ${status.exceeded.join(', ')}</p>` : ''}
                    </div>
                    <p class="mt-4 text-sm">Please upgrade your plan or remove some users/clients to continue.</p>
                </div>
            `;
        }

        showCustomAlert(message, 'warning');
        return false;
    } else {
        console.log('✓ App validation passed', status);
        return true;
    }
}

/**
 * Perform full app validation on startup
 * Initializes app ID and validates against remote server
 */
export async function performStartupValidation() {
    try {
        console.log('Starting app validation...');

        // Step 1: Initialize app ID
        await initializeAppId();

        // Step 2: Validate against remote server
        const validationResult = await validateApp();

        // Step 3: Display status to user if there are issues
        displayValidationStatus();

        return validationResult;
    } catch (error) {
        console.error('Startup validation failed:', error);
        showCustomAlert(
            'Unable to validate application. Some features may be limited.',
            'error'
        );
        return null;
    }
}

/**
 * Get formatted app info for display
 */
export function getAppInfo() {
    const status = getValidationStatus();
    const id = getAppId();

    return {
        appId: id,
        status: status,
        isValid: status?.valid || false,
        validationEnabled: status?.validation_enabled || false,
        limits: status?.limits || null,
        current: status?.current || null
    };
}

/**
 * Hook into user creation to check limits
 */
export async function validateBeforeAddingUser() {
    const canAdd = await checkCanAddUser();

    if (!canAdd) {
        showCustomAlert(
            'Cannot add user: You have reached your maximum user limit. Please upgrade your plan or contact support.',
            'error'
        );
        return false;
    }

    return true;
}

/**
 * Hook into client creation to check limits
 */
export async function validateBeforeAddingClient() {
    const canAdd = await checkCanAddClient();

    if (!canAdd) {
        showCustomAlert(
            'Cannot add client: You have reached your maximum client limit. Please upgrade your plan or contact support.',
            'error'
        );
        return false;
    }

    return true;
}

export default {
    initializeAppId,
    validateApp,
    getAppId,
    getValidationStatus,
    checkCanAddUser,
    checkCanAddClient,
    displayValidationStatus,
    performStartupValidation,
    getAppInfo,
    validateBeforeAddingUser,
    validateBeforeAddingClient
};
