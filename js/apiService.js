/**
 * js/apiService.js
 *
 * Modul centralizat pentru comunicarea cu backend-ul (api.php).
 * Acesta extrage toată logica 'fetch' din calendar.js.
 */

// --- Global Loader Functions ---
const $loader = () => document.getElementById('globalLoader');

/**
 * Afișează indicatorul de încărcare global.
 */
function showLoader() {
    const loader = $loader();
    if (loader) loader.classList.add('active');
}

/**
 * Ascunde indicatorul de încărcare global.
 */
function hideLoader() {
    const loader = $loader();
    if (loader) loader.classList.remove('active');
}
// --- End Global Loader ---


/**
 * O funcție helper de bază pentru toate apelurile API.
 * Se ocupă de calea API și de încercarea unei căi de fallback
 * (bazat pe logica originală din calendar.js).
 */
async function apiFetch(path, options = {}) {
    showLoader(); // <-- ARATĂ LOADER-UL
    
    let response;
    // Calea principală, relativă
    const url = `api.php?path=${path}`;

    try {
        try {
            // 1. Încearcă calea relativă
            response = await fetch(url, options);
        } catch (networkError) {
            console.error(`Eroare rețea la apelarea ${url}:`, networkError);
            
            // 2. Încercare fallback (cale absolută, conform logicii din calendar.js)
            const fallbackUrl = `/calendar-app/${url.replace('api.php', 'api.php')}`; // Asigură calea corectă
            console.warn(`Încercare cale fallback: ${fallbackUrl}`);
            
            try {
                response = await fetch(fallbackUrl, options);
            } catch (fallbackError) {
                console.error(`Eroare rețea la calea fallback ${fallbackUrl}:`, fallbackError);
                // Aruncă eroarea originală dacă și fallback-ul eșuează
                throw new Error(`Eroare de rețea: ${networkError.message}`);
            }
        }

        // Verifică dacă răspunsul este OK (ex. 200)
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Eroare API (${response.status}) pentru ${url}:`, errorText);
            throw new Error(`Eroare server: ${response.status}`);
        }

        // Returnează răspunsul ca JSON
        return await response.json();

    } catch (error) {
        // Prinde orice eroare (network, fallback, server status, or json parsing)
        console.error('apiFetch a eșuat:', error);
        throw error; // Aruncă eroarea mai departe pentru a fi prinsă de funcția apelantă
    } finally {
        // Indiferent de succes or eroare, ascunde loader-ul
        hideLoader(); // <-- ASCUNDE LOADER-UL
    }
}

// --- Metode API Publice (Exportate) ---

/**
 * Încarcă datele principale (teamMembers, clients, events).
 * Apel GET la api.php?path=data
 */
export async function loadData() {
    // Folosim endpoint-ul 'data' din api.php
    return apiFetch('data');
}

/**
 * Create a new event
 * @param {object|array} eventData - Single event or array of events
 */
export async function createEvent(eventData) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    };
    return apiFetch('events', options);
}

/**
 * Update an existing event
 * @param {object} eventData - Event data with id
 */
export async function updateEvent(eventData) {
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    };
    return apiFetch(`events/${eventData.id}`, options);
}

/**
 * Delete an event
 * @param {string} eventId - ID of the event
 */
export async function deleteEvent(eventId) {
    const options = { method: 'DELETE' };
    return apiFetch(`events/${eventId}`, options);
}

/**
 * Create a new client
 */
export async function createClient(clientData) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
    };
    return apiFetch('clients', options);
}

/**
 * Update a client
 */
export async function updateClient(clientData) {
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
    };
    return apiFetch(`clients/${clientData.id}`, options);
}

/**
 * Delete a client
 */
export async function deleteClient(clientId) {
    const options = { method: 'DELETE' };
    return apiFetch(`clients/${clientId}`, options);
}

/**
 * Încarcă programele terapeutice.
 * Apel GET la api.php?path=programs
 */
export async function loadPrograms() {
    // api.php are o regulă care încarcă fișiere .json
    return apiFetch('programs');
}

/**
 * Încarcă datele de evoluție (din evolution.json).
 * Apel GET la api.php?path=evolution
 */
export async function loadEvolutionData() {
    // Folosim api.php pentru a-l încărca
    return apiFetch('evolution');
}

/**
 * Salvează datele de evoluție.
 * Apel POST la api.php?path=evolution
 * @param {object} data - Obiectul cu datele de evoluție
 */
export async function saveEvolutionData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    // Folosim endpoint-ul 'evolution' din api.php
    return apiFetch('evolution', options);
}

/**
 * Încarcă datele Portrige (din portrige.json).
 * Apel GET la api.php?path=portrige.json
 */
export async function loadPortrigeData() {
    // Logica din calendar.js (linia ~2548) încarcă prin api.php
    return apiFetch('portrige.json');
}

/**
 * Încarcă datele de facturare (din billings.json).
 * Apel GET la api.php?path=billings
 */
export async function loadBillingsData() {
    return apiFetch('billings');
}

/**
 * Salvează datele de facturare.
 * Apel POST la api.php?path=billings
 * @param {object} data - Obiectul cu datele de facturare
 */
export async function saveBillingsData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    return apiFetch('billings', options);
}

/**
 * Încarcă pragurile de discount pentru facturare.
 * Apel GET la api.php?path=discount-thresholds
 */
export async function loadDiscountThresholds() {
    return apiFetch('discount-thresholds');
}

/**
 * Salvează pragurile de discount pentru facturare.
 * Apel POST la api.php?path=discount-thresholds
 * @param {array} thresholds - Array de obiecte {hours, discount}
 */
export async function saveDiscountThresholds(thresholds) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds)
    };
    return apiFetch('discount-thresholds', options);
}

/**
 * Încarcă tipurile de evenimente din baza de date.
 * Apel GET la api.php?path=event_types
 */
export async function loadEventTypes() {
    return apiFetch('event_types');
}

/**
 * Creează un tip nou de eveniment.
 * Apel POST la api.php?path=event_types
 * @param {object} eventType - Obiectul cu datele tipului {id, label, isBillable, requiresTime}
 */
export async function createEventType(eventType) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventType)
    };
    return apiFetch('event_types', options);
}

/**
 * Actualizează un tip de eveniment existent.
 * Apel PUT la api.php?path=event_types
 * @param {object} eventType - Obiectul cu datele tipului {id, label, isBillable, requiresTime}
 */
export async function updateEventType(eventType) {
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventType)
    };
    return apiFetch('event_types', options);
}

/**
 * Șterge un tip de eveniment.
 * Apel DELETE la api.php?path=event_types&id=...
 * @param {string} id - ID-ul tipului de eveniment
 */
export async function deleteEventType(id) {
    const options = {
        method: 'DELETE'
    };
    return apiFetch(`event_types&id=${id}`, options);
}

/**
 * Creează un program nou.
 * @param {object} program - Obiectul cu datele programului {id, title, description}
 */
export async function createProgram(program) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(program)
    };
    return apiFetch('programs', options);
}

/**
 * Actualizează un program existent.
 * @param {object} program - Obiectul cu datele programului {id, title, description}
 */
export async function updateProgram(program) {
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(program)
    };
    return apiFetch('programs', options);
}

/**
 * Șterge un program.
 * @param {string} id - ID-ul programului
 */
export async function deleteProgram(id) {
    const options = {
        method: 'DELETE'
    };
    return apiFetch(`programs&id=${id}`, options);
}

/**
 * Salvează datele generale (teams, clients, events).
 * Apel POST la api.php?path=data
 * @param {object} data - Obiectul cu datele de salvat
 */
export async function saveData(data) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    return apiFetch('data', options);
}

/**
 * Clonează programul unei luni în alta.
 * Apel POST la api.php?path=clone-schedule
 * @param {string} sourceMonth - Luna sursă (format: YYYY-MM)
 * @param {string} targetMonth - Luna țintă (format: YYYY-MM)
 */
export async function cloneMonthSchedule(sourceMonth, targetMonth) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceMonth, targetMonth })
    };
    return apiFetch('clone-schedule', options);
}

/**
 * Șterge toate evenimentele dintr-o lună.
 * Apel POST la api.php?path=clear-month
 * @param {string} month - Luna de șters (format: YYYY-MM)
 */
export async function clearMonth(month) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
    };
    return apiFetch('clear-month', options);
}