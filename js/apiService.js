/**
 * js/apiService.js
 *
 * Modul centralizat pentru comunicarea cu backend-ul (api.php).
 * 
 * UPDATED: Added loadEventTypes() and saveEventTypes() methods
 */

async function apiFetch(path, options = {}) {
    let response;
    const url = `api.php?path=${path}`;

    try {
        response = await fetch(url, options);
    } catch (networkError) {
        console.error(`Eroare rețea la apelarea ${url}:`, networkError);
        
        const fallbackUrl = `/calendar-app/${url.replace('api.php', 'api.php')}`;
        console.warn(`Încercare cale fallback: ${fallbackUrl}`);
        
        try {
            response = await fetch(fallbackUrl, options);
        } catch (fallbackError) {
            console.error(`Eroare rețea la calea fallback ${fallbackUrl}:`, fallbackError);
            throw new Error(`Eroare de rețea: ${networkError.message}`);
        }
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Eroare API (${response.status}) pentru ${url}:`, errorText);
        throw new Error(`Eroare server: ${response.status}`);
    }

    return await response.json();
}

// --- Metode API Publice (Exportate) ---

export async function loadData() {
    return apiFetch('data');
}

export async function saveData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    return apiFetch('data', options);
}

export async function loadPrograms() {
    return apiFetch('programs');
}

export async function loadEvolutionData() {
    return apiFetch('evolution');
}

export async function saveEvolutionData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    return apiFetch('evolution', options);
}

export async function loadPortrigeData() {
    return apiFetch('portrige.json');
}

export async function loadBillingsData() {
    return apiFetch('billings');
}

export async function saveBillingsData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    return apiFetch('billings', options);
}

/**
 * NEW: Încarcă tipurile de evenimente cu prețurile lor din baza de date.
 * Apel GET la api.php?path=event-types
 * @returns {Promise<Array>} - Un array de obiecte event type
 * Exemplu: [{ id: "therapy", label: "Terapie", isBillable: true, requiresTime: true, basePrice: 100 }]
 */
export async function loadEventTypes() {
    return apiFetch('event-types');
}

/**
 * NEW: Salvează tipurile de evenimente cu prețurile lor în baza de date.
 * Apel POST la api.php?path=event-types
 * @param {Array} eventTypes - Array de obiecte event type
 * Exemplu: [{ id: "therapy", label: "Terapie", isBillable: true, requiresTime: true, basePrice: 100 }]
 */
export async function saveEventTypes(eventTypes) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventTypes)
    };
    return apiFetch('event-types', options);
}