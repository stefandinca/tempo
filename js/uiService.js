/**
 * js/uiService.js
 *
 * Gestionează toate interacțiunile cu interfața de utilizator (UI),
 * în special modalele, alertele și popularea listelor.
 * Depinde de 'calendarState' pentru a obține datele necesare.
 */
import * as auth from './authService.js';
import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
import { saveData } from './apiService.js';
import * as evolutionService from './evolutionService.js';
import * as reportService from './reportService.js';

// --- Helpers pentru a găsi elemente DOM ---
const $ = (id) => document.getElementById(id);

// --- Stocare ID Eveniment Curent (pentru detalii) ---
export let currentDetailsEventId = null;

// --- Modale de Alertă/Confirmare ---

export function showCustomAlert(message, title = 'Notificare') {
    return new Promise((resolve) => {
        const modal = $('alertModal');
        if (!modal) {
            alert(message);
            return resolve();
        }
        
        $('alertModalTitle').textContent = title;
        $('alertModalMessage').textContent = message;
        modal.style.display = 'flex';

        const okBtn = $('alertModalOk');
        const closeBtn = $('closeAlertModal');

        const handleClose = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleClose);
            closeBtn.removeEventListener('click', handleClose);
            modal.removeEventListener('click', handleBackdrop);
            resolve();
        };
        const handleBackdrop = (e) => {
            if (e.target === modal) handleClose();
        };

        okBtn.addEventListener('click', handleClose);
        closeBtn.addEventListener('click', handleClose);
        modal.addEventListener('click', handleBackdrop);
    });
}

export function showCustomConfirm(message, title = 'Confirma actiunea') {
    return new Promise((resolve) => {
        const modal = $('confirmModal');
        if (!modal) {
            resolve(confirm(message));
            return;
        }

        $('confirmModalTitle').textContent = title;
        $('confirmModalMessage').textContent = message;
        modal.style.display = 'flex';

        const okBtn = $('confirmModalOk');
        const cancelBtn = $('confirmModalCancel');
        const closeBtn = $('closeConfirmModal');

        const handleOk = () => cleanup(true);
        const handleCancel = () => cleanup(false);
        const handleBackdrop = (e) => { if (e.target === modal) handleCancel(); };

        const cleanup = (result) => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
            resolve(result);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
    });
}

export function showRecurringDeleteModal(message = 'Acesta este un eveniment recurent. Ce doresti sa stergi?') {
    return new Promise((resolve) => {
        const modal = $('recurringDeleteModal');
        if (!modal) {
            resolve('cancel');
            return;
        }
        
        $('recurringDeleteModalMessage').textContent = message;
        modal.style.display = 'flex';

        const cancelBtn = $('recurringDeleteCancel');
        const singleBtn = $('recurringDeleteSingle');
        const allBtn = $('recurringDeleteAll');
        const closeBtn = $('closeRecurringDeleteModal');

        const handle = (result) => {
            modal.style.display = 'none';
            cleanup();
            resolve(result);
        };
        const handleBackdrop = (e) => { if (e.target === modal) handle('cancel'); };
        
        const cleanup = () => {
            cancelBtn.removeEventListener('click', cancelHandler);
            singleBtn.removeEventListener('click', singleHandler);
            allBtn.removeEventListener('click', allHandler);
            closeBtn.removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', handleBackdrop);
        };
        
        const cancelHandler = () => handle('cancel');
        const singleHandler = () => handle('single');
        const allHandler = () => handle('all');

        cancelBtn.addEventListener('click', cancelHandler);
        singleBtn.addEventListener('click', singleHandler);
        allBtn.addEventListener('click', allHandler);
        closeBtn.addEventListener('click', cancelHandler);
        modal.addEventListener('click', handleBackdrop);
    });
}

export function showRecurringEditModal(message = 'Acesta este un eveniment recurent. Ce dorești să editezi?') {
    return new Promise((resolve) => {
        const modal = $('recurringEditModal');
        if (!modal) {
            console.error('recurringEditModal not found in DOM');
            resolve('cancel'); // Failsafe
            return;
        }
        
        $('recurringEditModalMessage').textContent = message;
        modal.style.display = 'flex';

        const cancelBtn = $('recurringEditCancel');
        const singleBtn = $('recurringEditSingle');
        const allBtn = $('recurringEditAll');
        const closeBtn = $('closeRecurringEditModal');

        const handle = (result) => {
            modal.style.display = 'none';
            cleanup();
            resolve(result);
        };
        const handleBackdrop = (e) => { if (e.target === modal) handle('cancel'); };
        
        const cleanup = () => {
            cancelBtn.removeEventListener('click', cancelHandler);
            singleBtn.removeEventListener('click', singleHandler);
            allBtn.removeEventListener('click', allHandler);
            closeBtn.removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', handleBackdrop);
        };
        
        const cancelHandler = () => handle('cancel');
        const singleHandler = () => handle('single');
        const allHandler = () => handle('all');

        cancelBtn.addEventListener('click', cancelHandler);
        singleBtn.addEventListener('click', singleHandler);
        allBtn.addEventListener('click', allHandler);
        closeBtn.addEventListener('click', cancelHandler);
        modal.addEventListener('click', handleBackdrop);
    });
}

// --- Management Modal Evenimente (Adăugare/Editare) ---

export function openEventModal(eventId) {
    const { isAdminView, currentDate } = calendarState.getState();
    if (!isAdminView) return;

    const modal = $('eventModal');
    const form = $('eventForm');
    
    calendarState.openEventModal(eventId);
    
    populateTeamMemberCheckboxes();
    populateClientCheckboxes('');
    populateProgramCheckboxes('');
    
    ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach(id => {
        if ($(id)) $(id).checked = false;
    });

    if (eventId) {
        // Mod Editare
        const event = calendarState.getEventById(eventId);
        if (event) {
            $('eventName').value = event.name;
            $('eventDetails').value = event.details || '';
            $('eventType').value = event.type;
            $('eventDate').value = event.date;
            $('startTime').value = event.startTime;
            $('duration').value = event.duration;
            if ($('isPublic')) $('isPublic').checked = event.isPublic || false;
            if ($('isBillable')) $('isBillable').checked = event.isBillable !== false;

            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            teamMemberIds.forEach(id => {
                const checkbox = $(`team_${id}`);
                if (checkbox) checkbox.checked = true;
            });
            
            if (event.repeating && event.repeating.length > 0) {
                const checkboxIds = ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'];
                event.repeating.forEach(day => {
                    if (day >= 1 && day <= 5) $(checkboxIds[day - 1]).checked = true;
                });
            }
            
            $('deleteBtn').style.display = 'block';
        }
    } else {
        // Mod Adăugare Nouă
        form.reset();
        $('eventDate').value = formatDateISO(currentDate);
        $('eventType').value = 'therapy';
        $('duration').value = '60';
        $('isBillable').checked = true;
        $('deleteBtn').style.display = 'none';
        
        populateTeamMemberCheckboxes();
        populateClientCheckboxes('');
        populateProgramCheckboxes('');
    }

    if ($('clientSearch')) $('clientSearch').value = '';
    if ($('programSearch')) $('programSearch').value = '';
    
    updateEventTypeDependencies($('eventType').value);
    modal.classList.add('active');
}

export function closeEventModal() {
    $('eventModal').classList.remove('active');
    calendarState.closeEventModal();
}

// --- Management Modal Detalii Eveniment ---

export function showEventDetails(eventId) {
    const { isAdminView } = calendarState.getState();
    const event = calendarState.getEventById(eventId);
    if (!event) return;

    currentDetailsEventId = eventId;
    const modal = $('eventDetailsModal');
    const content = $('eventDetailsContent');
    const commentsArea = $('eventComments');

    commentsArea.value = event.comments || '';
    content.innerHTML = buildEventDetailsHTML(event);
    
    const editBtn = $('editEventFromDetails');
    const deleteBtn = $('deleteEventFromDetails');
    const commentsSection = commentsArea.closest('.event-details-section');

    // === ADD PERMISSION CHECKS ===
    const canModify = auth.canModifyEvent(event);
    
    if (isAdminView) {
        // Show/hide edit and delete buttons based on permissions
        if (canModify) {
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            commentsSection.style.display = 'block';
            commentsArea.disabled = false;
        } else {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            commentsSection.style.display = 'none';
            commentsArea.disabled = true;
        }
        addAttendanceListeners(event.id, canModify);
        addProgramScoreListeners(event.id, canModify);
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        commentsSection.style.display = 'none';
        commentsArea.disabled = true;
    }
    // === END PERMISSION CHECKS ===

    modal.classList.add('active');
}


export function closeEventDetailsModal() {
    const { isAdminView } = calendarState.getState();
    if (isAdminView && currentDetailsEventId) {
        saveEventComments();
    }
    $('eventDetailsModal').classList.remove('active');
    currentDetailsEventId = null;
}

/**
 * Functii apelate de main.js la click pe butoanele din modalul de detalii
 */
export function editEventFromDetails() {
    // Salvează ID-ul într-o variabilă locală ÎNAINTE de a închide modalul.
    const eventIdToEdit = currentDetailsEventId;

    if(eventIdToEdit) {
        // Acum închide modalul de detalii (care va seta currentDetailsEventId la null)
        closeEventDetailsModal();
        
        // Deschide modalul de editare folosind variabila locală salvată.
        openEventModal(eventIdToEdit);
    }
}

export function deleteEventFromDetails() {
    if(currentDetailsEventId) {
        // Setează ID-ul în state pentru ca main.js să știe ce să șteargă
        calendarState.openEventModal(currentDetailsEventId);
        
        // CORECȚIE: ID-ul corect este 'deleteBtn', nu 'deleteEventBtn'
        $('deleteBtn').click(); // Simulează click pe butonul de ștergere
    }
}


// În fișierul: js/uiService.js
// ÎNLOCUIEȘTE această funcție

// În: js/uiService.js
// ROL: Afișează butoanele cu contoare la deschiderea modalului

function buildEventDetailsHTML(event) {
    const canModify = auth.canModifyEvent(event);

    // ... (restul codului funcției rămâne neschimbat)
    const memberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
    const eventMembers = memberIds.map(id => calendarState.getTeamMemberById(id)).filter(Boolean);
    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
    const eventClients = clientIds.map(id => calendarState.getClientById(id)).filter(Boolean);
    const eventPrograms = (event.programIds || []).map(id => calendarState.getProgramById(id)).filter(Boolean);
    const eventDate = new Date(event.date + 'T00:00:00');
    const formattedDate = eventDate.toLocaleDateString('ro-RO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const endTime = calculateEndTime(event.startTime, event.duration);
    let permissionNotice = '';
    if (!canModify) {
        permissionNotice = `
            <div class="event-details-section" style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem; border: 1px solid #fbbf24;">
                <p style="color: #92400e; font-weight: 500; margin: 0;">
                    ℹ️ Acest eveniment este în modul doar vizualizare. Nu aveți permisiunea să îl modificați.
                </p>
            </div>
        `;
    }
    
    let html = permissionNotice + `
        <div class="event-details-section">
            <h3>Informații generale</h3>
            <div class="event-details-grid">
                <div class="event-detail-item"><div class="event-detail-label">Nume</div><div class="event-detail-value">${event.name}</div></div>
                <div class="event-detail-item"><div class="event-detail-label">Tip</div><div class="event-detail-value">${getEventTypeLabel(event.type)}</div></div>
                <div class="event-detail-item"><div class="event-detail-label">Data</div><div class="event-detail-value">${formattedDate}</div></div>
                <div class="event-detail-item"><div class="event-detail-label">Ora</div><div class="event-detail-value">${event.startTime} - ${endTime}</div></div>
            </div>
        </div>
    `;

    if (eventMembers.length > 0) {
        html += `
            <div class="event-details-section">
                <h3>Terapeuți</h3>
                <div class="event-therapists-list">
                    ${eventMembers.map(m => `<div class="therapist-badge" style="background-color: ${m.color};">${m.name}</div>`).join('')}
                </div>
            </div>
        `;
    }

    if (eventClients.length > 0) {
        html += `
            <div class="event-details-section">
                <h3>Clienți & Prezență</h3>
                <div class="attendance-list">
                    ${eventClients.map(c => {
                        const attendance = (event.attendance && event.attendance[c.id]) || 'present';
                        return `
                            <div class="attendance-item">
                                <div class="client-name-attendance">${c.name}</div>
                                <div class="attendance-toggle" data-event-id="${event.id}" data-client-id="${c.id}">
                                    <button class="attendance-btn ${attendance === 'present' ? 'active' : ''}" data-status="present">Prezent</button>
                                    <button class="attendance-btn ${attendance === 'absent' ? 'active' : ''}" data-status="absent">Absent</button>
                                    <button class="attendance-btn ${attendance === 'absent-motivated' ? 'active' : ''}" data-status="absent-motivated">Absent Motivat</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // --- AICI SE GENEREAZĂ HTML-UL PENTRU STILUL NOU ---
    if (eventPrograms.length > 0) {
        html += `
            <div class="event-details-section">
                <h3>Programe terapeutice & Evaluare</h3>
                <div id="programScoresContainer">
                    ${eventPrograms.map(p => {
                        // Obține obiectul de scoruri
                        const scores = (event.programScores && event.programScores[p.id] && typeof event.programScores[p.id] === 'object') 
                                        ? event.programScores[p.id] 
                                        : { "0": 0, "-": 0, "P": 0, "+": 0 }; 

                        // Construiește HTML-ul butonului cu noul format
                        return `
                            <div class="program-score-item">
                                <div class="program-score-name">${p.title}</div>
                                <div class="program-score-buttons" data-event-id="${event.id}" data-program-id="${p.id}">
                                    <button class="score-btn" data-score="0">
                                        <span class="score-badge">${scores['0'] || 0}</span>
                                        <span class="score-label">0</span>
                                    </button>
                                    <button class="score-btn" data-score="-">
                                        <span class="score-badge">${scores['-'] || 0}</span>
                                        <span class="score-label">-</span>
                                    </button>
                                    <button class="score-btn" data-score="P">
                                        <span class="score-badge">${scores['P'] || 0}</span>
                                        <span class="score-label">P</span>
                                    </button>
                                    <button class="score-btn" data-score="+">
                                        <span class="score-badge">${scores['+'] || 0}</span>
                                        <span class="score-label">+</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    // --- SFÂRȘIT MODIFICARE HTML VIZUAL ---
    
    // ... (restul funcției rămâne neschimbat)
    const additionalInfo = [];
    if (event.isPublic && event.details) additionalInfo.push(`<b>Detalii:</b> ${event.details}`);
    else if (event.details) additionalInfo.push(`<b>Detalii (private):</b> ${event.details}`);
    if (event.isPublic) additionalInfo.push('Eveniment public');
    if (event.isBillABLE === false) additionalInfo.push('Non-facturabil'); // Am corectat typo 'isBillable'
    if (event.repeating && event.repeating.length > 0) {
        const days = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
        additionalInfo.push(`Se repetă: ${event.repeating.map(d => days[d-1]).join(', ')}`);
    }

    if (additionalInfo.length > 0) {
        html += `
            <div class="event-details-section">
                <h3>Informații suplimentare</h3>
                <div class="event-detail-value">${additionalInfo.join(' ⦁ ')}</div>
            </div>
        `;
    }
    return html;
}

// --- Handlers pentru Modalul de Detalii ---

function addAttendanceListeners(eventId, canModify = true) {
    $('eventDetailsContent').querySelectorAll('.attendance-toggle').forEach(toggle => {
        toggle.addEventListener('click', async (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            
            // === ADD PERMISSION CHECK ===
            if (!canModify) {
                auth.showPermissionDenied('modificați prezența');
                return;
            }
            // === END PERMISSION CHECK ===
            
            const button = e.target;
            const status = button.dataset.status;
            const clientId = toggle.dataset.clientId;
            
            const event = calendarState.getEventById(eventId);
            
            // --- START BUG FIX ---
            // 1. Get the current attendance object (or an empty one)
            //    Make sure to handle the old array bug as well.
            const currentAttendance = (event.attendance && !Array.isArray(event.attendance)) 
                ? event.attendance 
                : {};

            // 2. Create a NEW object by copying the old one
            const newAttendance = { ...currentAttendance };
            
            // 3. Modify the NEW object
            newAttendance[clientId] = status;
            
            // 4. Assign the NEW object back to the event
            // This breaks the shared reference.
            event.attendance = newAttendance;
            // --- END BUG FIX ---
            
            calendarState.saveEvent(event);
            await api.updateEvent(event);

            toggle.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });
}


// În: js/uiService.js
// ROL: Logica de click care actualizează NOUL HTML (badge-ul)

function addProgramScoreListeners(eventId, canModify = true) {
    $('eventDetailsContent').querySelectorAll('.program-score-buttons').forEach(container => {
        container.addEventListener('click', async (e) => {
            // Click-ul poate fi pe <span>, deci căutăm butonul părinte
            const button = e.target.closest('.score-btn'); 
            if (!button) return; // Nu am dat click pe un buton

            if (!canModify) {
                auth.showPermissionDenied('modificați scorurile');
                return;
            }
            
            container.style.pointerEvents = 'none';
            
            try {
                const score = button.dataset.score; // "0", "-", "P", sau "+"
                const programId = container.dataset.programId;
                
                const event = calendarState.getEventById(eventId);
                
                // 1. Inițializează structurile
                if (!event.programScores) event.programScores = {};
                
                // 2. Verifică/Convertește formatul vechi (string) la cel nou (obiect)
                const oldScoreData = event.programScores[programId];
                if (!oldScoreData || typeof oldScoreData !== 'object') {
                    event.programScores[programId] = { "0": 0, "-": 0, "P": 0, "+": 0 };
                    
                    if (typeof oldScoreData === 'string' && oldScoreData.length > 0) {
                        if(oldScoreData in event.programScores[programId]) {
                            event.programScores[programId][oldScoreData] = 1;
                        }
                    }
                }

                // 3. Incrementează contorul
                const newCount = (event.programScores[programId][score] || 0) + 1;
                event.programScores[programId][score] = newCount;
                
                // 4. Salvează evenimentul local
                calendarState.saveEvent(event);
                
                // 5. Salvează pe server (doar datele principale)
                await api.saveData(calendarState.getState());
                
                // --- MODIFICARE AICI: Actualizăm badge-ul, NU textul butonului ---
                // 6. Actualizează badge-ul butonului imediat
                const badge = button.querySelector('.score-badge');
                if (badge) {
                    badge.textContent = newCount;
                }
                // --- SFÂRȘIT MODIFICARE VIZUALĂ ---
                
                // 7. Resetează clasele 'active' (nu mai sunt necesare)
                container.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));

                // 8. Creează string-ul sumar pentru history (ex: "P (1), + (3)")
                const scoreString = Object.entries(event.programScores[programId])
                    .filter(([key, value]) => value > 0) // Păstrează doar cele cu contor > 0
                    .map(([key, value]) => `${key} (${value})`)
                    .join(', ');

                // 9. Trimite STRING-ul la funcția de istoric (acest lucru este corect)
                await updateProgramHistory(event, programId, scoreString || null);
                
            } catch (err) {
                console.error("Eroare la salvarea scorului:", err);
                const errMsg = err.message.includes("istoricul programului") 
                    ? "Eroare la salvarea istoricului (verifică consola pentru detalii API)."
                    : "A apărut o eroare la salvarea scorului.";
                showCustomAlert(errMsg, "Eroare");
            } finally {
                container.style.pointerEvents = 'auto';
            }
        });
    });
}
/**
 * Actualizează (adaugă/modifică/șterge) o intrare în programHistory
 * pentru toți clienții din eveniment și o salvează în evolution.json.
 */
// În: js/uiService.js
// ROL: Salvează STRING-ul de scor în istoric

async function updateProgramHistory(event, programId, newScore) { // newScore este acum un STRING (ex: "P (1), + (3)")
    const { evolutionData } = calendarState.getState();
    
    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
    if (clientIds.length === 0) return; 

    const program = calendarState.getProgramById(programId);
    if (!program) {
        console.error(`Programul cu ID ${programId} nu a fost găsit.`);
        return; 
    }

    let dataWasChanged = false;

    clientIds.forEach(clientId => {
        if (!evolutionData[clientId]) {
            const client = calendarState.getClientById(clientId);
            evolutionData[clientId] = {
                name: client ? client.name : "Client Necunoscut",
                evaluations: {},
                programHistory: []
            };
        }

        if (!Array.isArray(evolutionData[clientId].programHistory)) {
            evolutionData[clientId].programHistory = [];
        }
        
        const history = evolutionData[clientId].programHistory;
        
        const existingEntryIndex = history.findIndex(entry => 
            entry.eventId === event.id && entry.programId === programId
        );

        // --- MODIFICARE AICI ---
        // Verificăm dacă noul scor (string-ul) are conținut
        if (newScore) {
            // Adaugă sau actualizează
            const historyEntry = {
                date: event.date,
                programId: programId,
                programTitle: program.title,
                score: newScore, // Salvează STRING-ul
                eventId: event.id
            };
            
            if (existingEntryIndex > -1) {
                // Verifică dacă datele s-au schimbat înainte de a suprascrie
                if (history[existingEntryIndex].score !== newScore) {
                    history[existingEntryIndex] = historyEntry;
                    dataWasChanged = true;
                }
            } else {
                history.push(historyEntry);
                dataWasChanged = true;
            }

        } else if (existingEntryIndex > -1) {
            // Șterge (dacă newScore e null sau string gol)
            history.splice(existingEntryIndex, 1);
            dataWasChanged = true;
        }
        // --- SFÂRȘIT MODIFICARE ---
    });

    if (dataWasChanged) {
        calendarState.setEvolutionData(evolutionData);
        try {
            await api.saveEvolutionData(evolutionData);
        } catch (err) {
            console.error("Eroare la salvarea istoricului de programe:", err);
            // Propagă eroarea pentru a fi prinsă în 'addProgramScoreListeners'
            throw new Error("Nu s-a putut salva istoricul programului.");
        }
    }
}

function saveEventComments() {
    if (!currentDetailsEventId) return;
    const event = calendarState.getEventById(currentDetailsEventId);
    if (!event) return;
    
    const comments = $('eventComments').value;
    if (event.comments !== comments) {
        event.comments = comments;
        calendarState.saveEvent(event);
        api.saveData(calendarState.getState());
    }
}

// --- Management Secțiuni Admin (Client/Echipă) ---

export function renderClientsList(searchTerm = '') {
    const { clients, events, currentDate } = calendarState.getState();
    const container = $('clientsList');
    container.innerHTML = '<h3>Clienți existenți</h3>';

    const term = searchTerm.toLowerCase();
    const filteredClients = term
        ? clients.filter(c => c.name.toLowerCase().includes(term) || (c.email && c.email.toLowerCase().includes(term)))
        : clients;

    if (filteredClients.length === 0) {
        container.innerHTML += '<p class="empty-list-message">Nu s-au găsit clienți.</p>';
        return;
    }

    filteredClients.forEach(client => {
        const monthHours = calculateClientHours(client.id, events, currentDate);
        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
                <div class="client-card-content">
                    <div class="client-info">
                        <div class="client-avatar">${client.name.substring(0, 2).toUpperCase()}</div>
                        <div class="client-details">
                            <div class="client-name">${client.name}</div>
                            <div class="client-contact">
                                ${client.email ? `<span class="client-info-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>${client.email}
                                </span>` : ''}
                                ${client.phone ? `<span class="client-info-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>${client.phone}
                                </span>` : ''}
                                ${client.birthDate ? `<span class="client-info-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cake2-fill" viewBox="0 0 16 16">
                                    <path d="m2.899.804.595-.792.598.79A.747.747 0 0 1 4 1.806v4.886q-.532-.09-1-.201V1.813a.747.747 0 0 1-.1-1.01ZM13 1.806v4.685a15 15 0 0 1-1 .201v-4.88a.747.747 0 0 1-.1-1.007l.595-.792.598.79A.746.746 0 0 1 13 1.806m-3 0a.746.746 0 0 0 .092-1.004l-.598-.79-.595.792A.747.747 0 0 0 9 1.813v5.17q.512-.02 1-.055zm-3 0v5.176q-.512-.018-1-.054V1.813a.747.747 0 0 1-.1-1.01l.595-.79.598.789A.747.747 0 0 1 7 1.806"/>
                                    <path d="M4.5 6.988V4.226a23 23 0 0 1 1-.114V7.16c0 .131.101.24.232.25l.231.017q.498.037 1.02.055l.258.01a.25.25 0 0 0 .26-.25V4.003a29 29 0 0 1 1 0V7.24a.25.25 0 0 0 .258.25l.259-.009q.52-.018 1.019-.055l.231-.017a.25.25 0 0 0 .232-.25V4.112q.518.047 1 .114v2.762a.25.25 0 0 0 .292.246l.291-.049q.547-.091 1.033-.208l.192-.046a.25.25 0 0 0 .192-.243V4.621c.672.184 1.251.409 1.677.678.415.261.823.655.823 1.2V13.5c0 .546-.408.94-.823 1.201-.44.278-1.043.51-1.745.696-1.41.376-3.33.603-5.432.603s-4.022-.227-5.432-.603c-.702-.187-1.305-.418-1.745-.696C.408 14.44 0 14.046 0 13.5v-7c0-.546.408-.94.823-1.201.426-.269 1.005-.494 1.677-.678v2.067c0 .116.08.216.192.243l.192.046q.486.116 1.033.208l.292.05a.25.25 0 0 0 .291-.247M1 8.82v1.659a1.935 1.935 0 0 0 2.298.43.935.935 0 0 1 1.08.175l.348.349a2 2 0 0 0 2.615.185l.059-.044a1 1 0 0 1 1.2 0l.06.044a2 2 0 0 0 2.613-.185l.348-.348a.94.94 0 0 1 1.082-.175c.781.39 1.718.208 2.297-.426V8.833l-.68.907a.94.94 0 0 1-1.17.276 1.94 1.94 0 0 0-2.236.363l-.348.348a1 1 0 0 1-1.307.092l-.06-.044a2 2 0 0 0-2.399 0l-.06.044a1 1 0 0 1-1.306-.092l-.35-.35a1.935 1.935 0 0 0-2.233-.362.935.935 0 0 1-1.168-.277z"/>
                                    </svg>${new Date(client.birthDate).toLocaleDateString('ro-RO')}
                                </span>` : ''}
                                ${client.medical ? `<span class="client-info-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-capsule" viewBox="0 0 16 16">
                                <path d="M1.828 8.9 8.9 1.827a4 4 0 1 1 5.657 5.657l-7.07 7.071A4 4 0 1 1 1.827 8.9Zm9.128.771 2.893-2.893a3 3 0 1 0-4.243-4.242L6.713 5.429z"/>
                                </svg>
                                ${client.medical.substring(0, 40)}...
                            </span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="client-stats">
                        <div class="client-hours">${monthHours}</div>
                        <div class="client-hours-label">ore luna aceasta</div>
                    </div>
                </div>
                <div class="client-actions" data-client-id="${client.id}">
                    <button class="btn btn-action btn-action-text" data-action="evolutie" title="Evoluție">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 3v18h18"/>
                            <path d="M18 17V9l-5 5-4-4-6 6"/>
                        </svg>
                        <span>Evoluție</span>
                    </button>
                    <button class="btn btn-action btn-action-text" data-action="raport" title="Descarcă Raport">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Descarcă Raport</span>
                    </button>
                    <button class="btn btn-action btn-action-text" data-action="email" title="Trimite Raport">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>Trimite Raport</span>
                    </button>
                    <button class="btn btn-action btn-action-text" data-action="editeaza" title="Editează">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span>Editează</span>
                    </button>
                    <button class="btn btn-action btn-action-text btn-delete" data-action="sterge" title="Șterge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        <span>Șterge</span>
                    </button>
                </div>
            `;
        container.appendChild(card);
    });
}

export function resetClientForm() {
    $('clientForm').reset();
    $('clientFormTitle').textContent = 'Adaugă Client Nou';
    $('clientId').value = ''; // Clear the ID field
    $('deleteClientBtn').style.display = 'none';
    calendarState.setEditingId({ clientId: null });
}

export function editClientInModal(clientId) {
    const client = calendarState.getClientById(clientId);
    if (!client) return;
    
    calendarState.setEditingId({ clientId });
    $('clientFormTitle').textContent = 'Editează Client';
    $('clientId').value = client.id; // Populate the ID field
    if ($('clientMedical')) $('clientMedical').value = '';
    $('clientFullName').value = client.name;
    $('clientEmail').value = client.email || '';
    $('clientPhone').value = client.phone || '';
    $('clientBirthdayInput').value = client.birthDate || '';
    
    $('clientMedical').value = client.medical || '';
    $('deleteClientBtn').style.display = 'inline-block';
    
    $('clientForm').scrollIntoView({ behavior: 'smooth' });
}

export function renderTeamMembersList() {
    // NOU: Obține utilizatorul curent și permisiunile
    const { teamMembers } = calendarState.getState();
    const currentUser = auth.getCurrentUser();
    const canManage = auth.isAdmin() || auth.isCoordinator();

    const container = $('teamMembersList');
    container.innerHTML = '<h3>Echipa curentă</h3>';

    teamMembers.forEach(member => {
        const card = document.createElement('div');
        card.className = 'team-member-card';

        // NOU: Construiește HTML-ul pentru acțiuni în mod condiționat
        let actionsHtml = '';
        if (canManage) {
            // Adminii și Coordonatorii pot face tot
            actionsHtml = `
                <button class="btn-icon btn-action" data-action="raport" title="Descarcă Raport">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button class="btn-icon btn-action" data-action="editeaza" title="Editează">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon btn-action btn-delete" data-action="sterge" title="Șterge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            `;
        } else if (auth.isTherapist() && member.id === currentUser.id) {
            // Terapeutul își poate edita propriul profil (dar nu și rolul, vezi editTeamMemberInModal)
            actionsHtml = `
                <button class="btn-icon btn-action" data-action="raport" title="Descarcă Raport">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                <button class="btn-icon btn-action" data-action="editeaza" title="Editează">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            `;
        } else {
            // Terapeutul se uită la alți membri (doar raport)
            actionsHtml = `
                <button class="btn-icon btn-action" data-action="raport" title="Descarcă Raport">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
            `;
        }

        card.innerHTML = `
                <div class="team-member-card-content">
                    <div class="team-member-info">
                        <div class="team-member-avatar" style="background-color: ${member.color}">${member.initials}</div>
                        <div class="team-member-details">
                            <div class="team-member-name">${member.name}</div>
                            <div class="team-member-role">${getRoleLabel(member.role)}</div>
                        </div>
                    </div>
                    <div class="team-member-stats">
                        <div class="team-member-hours"></div>
                        <div class="team-member-hours-label"></div>
                    </div>
                </div>
                <div class="team-member-actions" data-member-id="${member.id}">${actionsHtml}</div>
            `;
        container.appendChild(card);
    });
}

export function resetTeamForm() {
    $('teamMemberForm').reset();
    $('teamFormTitle').textContent = 'Adaugă Membru Nou';
    $('memberColor').value = '#4f46e5';
    $('memberColorHex').value = '#4F46E5';

    // NOU: Verifică permisiunile la resetarea formularului
    const canChangeRole = auth.isAdmin() || auth.isCoordinator();
    const roleSelect = $('memberRole');
    roleSelect.disabled = !canChangeRole;
    if (!canChangeRole) {
        roleSelect.value = 'therapist'; // Setează implicit 'terapeut' dacă utilizatorul e terapeut
    }

    $('deleteMemberBtn').style.display = 'none'; // Butonul de ștergere e ascuns la adăugare
    calendarState.setEditingId({ memberId: null });
}

export function editTeamMemberInModal(memberId) {
    const member = calendarState.getTeamMemberById(memberId);
    if (!member) return;

    calendarState.setEditingId({ memberId });
    $('teamFormTitle').textContent = 'Editează Membru';
    $('memberName').value = member.name;
    $('memberInitials').value = member.initials;
    $('memberRole').value = member.role;
    $('memberColor').value = member.color;
    $('memberColorHex').value = member.color.toUpperCase();

    // NOU: Dezactivează dropdown-ul de ROL și butonul de ȘTERGERE dacă e terapeut
    const canChangeRole = auth.isAdmin() || auth.isCoordinator();
    $('memberRole').disabled = !canChangeRole;
    $('deleteMemberBtn').style.display = canChangeRole ? 'inline-block' : 'none';

    $('teamMemberForm').scrollIntoView({ behavior: 'smooth' });
}


// --- Helpers Populați/Filtrați (Modal Eveniment) ---

function populateTeamMemberCheckboxes() {
    const { teamMembers } = calendarState.getState();
    const container = $('teamMemberCheckboxes');
    container.innerHTML = '';
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu exista membri</p>';
        return;
    }
    
    teamMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="team_${member.id}" name="teamMemberCheckbox" value="${member.id}">
            <label for="team_${member.id}" class="checkbox-label-with-dot">
                <span class="color-dot" style="background-color: ${member.color};"></span>
                ${member.name}
            </label>
        `;
        container.appendChild(div);
    });
}

function populateClientCheckboxes(searchTerm = '') {
    const { clients, selectedClientIds } = calendarState.getState();
    const container = $('clientCheckboxes');
    if (!container) return;
    
    container.innerHTML = '';
    if (clients.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu exista clienti</p>';
        return;
    }

    const term = searchTerm.toLowerCase();
    const filteredClients = term
        ? clients.filter(c => c.name.toLowerCase().includes(term))
        : clients;
    
    if (filteredClients.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu s-au gasit clienti.</p>';
        return;
    }

    filteredClients.forEach(client => {
        const idStr = String(client.id);
        const isChecked = selectedClientIds.has(idStr);
        
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="client_${idStr}" value="${idStr}" ${isChecked ? 'checked' : ''}>
            <label for="client_${idStr}">${client.name}</label>
        `;
        container.appendChild(div);
    });
    
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const { selectedClientIds } = calendarState.getState();
            if (e.target.checked) selectedClientIds.add(e.target.value);
            else selectedClientIds.delete(e.target.value);
            updateEventTitle();
        });
    });
}

function populateProgramCheckboxes(searchTerm = '') {
    const { programs, selectedProgramIds } = calendarState.getState();
    const container = $('programCheckboxes');
    if (!container) return;

    container.innerHTML = '';
    if (!Array.isArray(programs) || programs.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu exista programe.</p>';
        return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = term
        ? programs.filter(p => p.title.toLowerCase().includes(term))
        : programs;

    filtered.forEach(program => {
        const idStr = String(program.id);
        const isChecked = selectedProgramIds.has(idStr);

        const div = document.createElement('div');
        div.className = 'checkbox-item program-item';
        div.innerHTML = `
            <div class="program-item-header">
                <input type="checkbox" id="program_${idStr}" value="${idStr}" ${isChecked ? 'checked' : ''}>
                <label for="program_${idStr}">${program.title || 'Program'}</label>
            </div>
            ${program.description ? `<p class="program-item-desc">${program.description}</p>` : ''}
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const { selectedProgramIds } = calendarState.getState();
            if (e.target.checked) selectedProgramIds.add(e.target.value);
            else selectedProgramIds.delete(e.target.value);
        });
    });
}

export function filterClientsInModal(searchTerm) {
    const { selectedClientIds } = calendarState.getState();
    $('clientCheckboxes').querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selectedClientIds.add(cb.value);
        else selectedClientIds.delete(cb.value);
    });
    populateClientCheckboxes(searchTerm);
}

export function filterProgramsInModal(searchTerm) {
    const { selectedProgramIds } = calendarState.getState();
    $('programCheckboxes').querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selectedProgramIds.add(cb.value);
        else selectedProgramIds.delete(cb.value);
    });
    populateProgramCheckboxes(searchTerm);
}

// --- Helpers UI (Titlu, Dependențe) ---

export function updateEventTitle() {
    const { selectedClientIds } = calendarState.getState();
    const eventNameInput = $('eventName');
    const eventTypeSelect = $('eventType');
    if (!eventNameInput || !eventTypeSelect) return;

    const selectedClients = Array.from(selectedClientIds)
        .map(id => calendarState.getClientById(id))
        .filter(c => c);
    
    const eventType = eventTypeSelect.value;
    const typeLabel = getEventTypeLabel(eventType);
    
    if (selectedClients.length > 0 && eventType) {
        let title = '';
        if (selectedClients.length === 1) {
            title = `${typeLabel} - ${selectedClients[0].name}`;
        } else if (selectedClients.length === 2) {
            title = `${typeLabel} - ${selectedClients[0].name} si ${selectedClients[1].name}`;
        } else {
            title = `${typeLabel} - ${selectedClients[0].name} si ${selectedClients.length - 1} altii`;
        }
        eventNameInput.value = title;
    } else if (eventType === 'day-off' || eventType === 'pauza-masa' || eventType === 'sedinta') {
        eventNameInput.value = typeLabel;
    }
}

export function updateEventTypeDependencies(eventType) {
    const startTimeField = $('startTime');
    const durationField = $('duration');
    const eventTypeSelect = $('eventType');
    
    // Obține opțiunea selectată și atributele sale
    const selectedOption = eventTypeSelect ? eventTypeSelect.selectedOptions[0] : null;
    const requiresTime = selectedOption ? (selectedOption.dataset.requiresTime === 'true') : true;
    const isBillableByDefault = selectedOption ? (selectedOption.dataset.isBillable === 'true') : true;

    [startTimeField, durationField].forEach(field => {
        if(field) {
            if (requiresTime) {
                field.setAttribute('required', 'required');
                field.style.opacity = '1';
            } else {
                field.removeAttribute('required');
                field.style.opacity = '0.7';
            }
        }
    });
    
    const isBillableCheckbox = $('isBillable');
    if (isBillableCheckbox) {
        isBillableCheckbox.checked = isBillableByDefault;
    }
}

// --- Helpers Generali ---

function calculateClientHours(clientId, events, currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthEvents = events.filter(event => {
        const hasClient = event.clientId === clientId || (event.clientIds && event.clientIds.includes(clientId));
        if (!hasClient) return false;
        
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
const totalMinutes = monthEvents.reduce((sum, event) => sum + (Number(event.duration) || 0), 0);    return (totalMinutes / 60).toFixed(1);
}

function formatDateISO(date) {
    // Use local date methods to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateEndTime(startTime, durationMinutes) {
    if (!startTime) return "N/A";
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + parseInt(durationMinutes, 10);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function getEventTypeLabel(type) {
    // Folosește funcția din calendarState pentru a obține label-ul
    return calendarState.getEventTypeLabel(type);
}

function getRoleLabel(role) {
    const roles = { 'therapist': 'Terapeut', 'coordinator': 'Coordonator', 'admin': 'Admin' };
    return roles[role] || role;
}