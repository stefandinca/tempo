/**
 * js/uiService.js
 *
 * Gestionează toate interacțiunile cu interfața de utilizator (UI),
 * în special modalele, alertele și popularea listelor.
 * Depinde de 'calendarState' pentru a obține datele necesare.
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';

// --- Helpers pentru a găsi elemente DOM ---
const $ = (id) => document.getElementById(id);

// --- Stocare ID Eveniment Curent (pentru detalii) ---
let currentDetailsEventId = null;

// --- Modale de Alertă/Confirmare (luate direct din calendar.js) ---

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

/**
 * Deschide modalul de DETALII pentru un eveniment.
 * @param {string} eventId
 */
export function showEventDetails(eventId) {
    const { isAdminView } = calendarState.getState();
    const event = calendarState.getEventById(eventId);
    if (!event) return;

    currentDetailsEventId = eventId; // Salvează ID-ul curent
    const modal = $('eventDetailsModal');
    const content = $('eventDetailsContent');
    const commentsArea = $('eventComments');

    commentsArea.value = event.comments || '';

    // Populează conținutul
    content.innerHTML = buildEventDetailsHTML(event);
    
    // Ascunde/arată butoanele admin
    const editBtn = $('editEventFromDetails');
    const deleteBtn = $('deleteEventFromDetails');
    const commentsSection = commentsArea.closest('.event-details-section');

    if (isAdminView) {
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        commentsSection.style.display = 'block';
        commentsArea.disabled = false;
        // Adaugă listeners pentru butoanele de prezență și scor
        addAttendanceListeners(event.id);
        addProgramScoreListeners(event.id);
    } else {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        commentsSection.style.display = 'none';
        commentsArea.disabled = true;
    }

    modal.classList.add('active');
}

/**
 * Închide modalul de detalii și salvează comentariile.
 */
export function closeEventDetailsModal() {
    const { isAdminView } = calendarState.getState();
    if (isAdminView && currentDetailsEventId) {
        saveEventComments(); // Salvează comentariile la închidere
    }
    $('eventDetailsModal').classList.remove('active');
    currentDetailsEventId = null;
}

/**
 * Construiește HTML-ul intern pentru modalul de detalii.
 */
function buildEventDetailsHTML(event) {
    const { teamMembers, clients, programs } = calendarState.getState();

    // Obține membrii
    const memberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
    const eventMembers = memberIds.map(id => calendarState.getTeamMemberById(id)).filter(Boolean);

    // Obține clienții
    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
    const eventClients = clientIds.map(id => calendarState.getClientById(id)).filter(Boolean);

    // Obține programele
    const eventPrograms = (event.programIds || []).map(id => calendarState.getProgramById(id)).filter(Boolean);

    const eventDate = new Date(event.date + 'T00:00:00'); // Asigură data corectă
    const formattedDate = eventDate.toLocaleDateString('ro-RO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const endTime = calculateEndTime(event.startTime, event.duration);

    // Secțiunea Informații Generale
    let html = `
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

    // Secțiunea Terapeuți
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

    // Secțiunea Clienți și Prezență
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
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Secțiunea Programe și Scor
    if (eventPrograms.length > 0) {
        html += `
            <div class="event-details-section">
                <h3>Programe terapeutice & Evaluare</h3>
                <div id="programScoresContainer">
                    ${eventPrograms.map(p => {
                        const currentScore = (event.programScores && event.programScores[p.id]) || '';
                        return `
                            <div class="program-score-item">
                                <div class="program-score-name">${p.title}</div>
                                <div class="program-score-buttons" data-event-id="${event.id}" data-program-id="${p.id}">
                                    <button class="score-btn ${currentScore === '0' ? 'active' : ''}" data-score="0">0</button>
                                    <button class="score-btn ${currentScore === '-' ? 'active' : ''}" data-score="-">-</button>
                                    <button class="score-btn ${currentScore === 'P' ? 'active' : ''}" data-score="P">P</button>
                                    <button class="score-btn ${currentScore === '+' ? 'active' : ''}" data-score="+">+</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Secțiunea Detalii Suplimentare
    const additionalInfo = [];
    if (event.isPublic && event.details) additionalInfo.push(`<b>Detalii:</b> ${event.details}`);
    else if (event.details) additionalInfo.push(`<b>Detalii (private):</b> ${event.details}`);
    
    if (event.isPublic) additionalInfo.push('Eveniment public');
    if (event.isBillable === false) additionalInfo.push('Non-facturabil');
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

function addAttendanceListeners() {
    $('eventDetailsContent').querySelectorAll('.attendance-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            
            const button = e.target;
            const status = button.dataset.status;
            const clientId = toggle.dataset.clientId;
            const eventId = toggle.dataset.eventId;
            
            // Actualizează starea
            const event = calendarState.getEventById(eventId);
            if (!event.attendance) event.attendance = {};
            event.attendance[clientId] = status;
            calendarState.saveEvent(event); // Salvează în starea locală
            api.saveData(calendarState.getState()); // Salvează pe server (fără await)

            // Actualizează UI
            toggle.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function addProgramScoreListeners() {
    $('eventDetailsContent').querySelectorAll('.program-score-buttons').forEach(container => {
        container.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;

            const button = e.target;
            const score = button.dataset.score;
            const programId = container.dataset.programId;
            const eventId = container.dataset.eventId;
            
            const event = calendarState.getEventById(eventId);
            if (!event.programScores) event.programScores = {};

            let newScore = score;
            // Toggle: dacă se apasă pe același scor, se anulează
            if (event.programScores[programId] === score) {
                delete event.programScores[programId];
                newScore = null;
            } else {
                event.programScores[programId] = score;
            }
            
            // Salvare locală și pe server
            calendarState.saveEvent(event);
            api.saveData(calendarState.getState()); // Salvează evenimentul actualizat
            
            // Actualizează istoricul programului (fără await)
            api.saveEvolutionData(calendarState.getState().evolutionData); 

            // Actualizează UI
            container.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));
            if (newScore) button.classList.add('active');
        });
    });
}

function saveEventComments() {
    if (!currentDetailsEventId) return;
    const event = calendarState.getEventById(currentDetailsEventId);
    if (!event) return;
    
    const comments = $('eventComments').value;
    if (event.comments !== comments) {
        event.comments = comments;
        calendarState.saveEvent(event);
        api.saveData(calendarState.getState()); // Salvează pe server
    }
}

// --- Management Modale Admin (Client/Echipă) ---

// --- Client Management ---
export function openClientModal() {
    renderClientsList('');
    $('clientSearchBar').value = '';
    $('clientModal').style.display = 'flex';
    resetClientForm(); // Asigură-te că formularul e gol
}

export function closeClientModal() {
    $('clientModal').style.display = 'none';
}

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
            <div class="client-info">
                <div class="client-avatar">${client.name.substring(0, 2).toUpperCase()}</div>
                <div class="client-details">
                    <div class="client-name">${client.name}</div>
                    <div class="client-contact">${client.email || 'Fără email'} ⦁ ${client.phone || 'Fără telefon'}</div>
                </div>
            </div>
            <div class="client-stats">
                <div class="client-hours">${monthHours}</div>
                <div class="client-hours-label">ore luna aceasta</div>
            </div>
            <div class="client-actions" data-client-id="${client.id}">
                <button class="btn-icon btn-action" data-action="evolutie" title="Evoluție"><svg...></svg></button>
                <button class="btn-icon btn-action" data-action="raport" title="Descarcă Raport"><svg...></svg></button>
                <button class="btn-icon btn-action" data-action="email" title="Trimite Raport"><svg...></svg></button>
                <button class="btn-icon btn-action" data-action="editeaza" title="Editează"><svg...></svg></button>
                <button class="btn-icon btn-action btn-delete" data-action="sterge" title="Șterge"><svg...></svg></button>
            </div>
        `;
        container.appendChild(card);
    });
}

export function resetClientForm() {
    $('clientForm').reset();
    $('clientFormTitle').textContent = 'Adaugă Client Nou';
    $('deleteClientBtn').style.display = 'none';
    calendarState.setEditingId({ clientId: null });
}

export function editClientInModal(clientId) {
    const client = calendarState.getClientById(clientId);
    if (!client) return;
    
    calendarState.setEditingId({ clientId });
    $('clientFormTitle').textContent = 'Editează Client';
    $('clientFullName').value = client.name;
    $('clientEmail').value = client.email || '';
    $('clientPhone').value = client.phone || '';
    $('clientBirthdayInput').value = client.birthDate || '';
    $('deleteClientBtn').style.display = 'inline-block';
    
    $('clientForm').scrollIntoView({ behavior: 'smooth' });
}

// --- Team Management ---
export function openTeamModal() {
    renderTeamMembersList();
    $('teamModal').style.display = 'flex';
    resetTeamForm();
}

export function closeTeamModal() {
    $('teamModal').style.display = 'none';
}

export function renderTeamMembersList() {
    const { teamMembers } = calendarState.getState();
    const container = $('teamMembersList');
    container.innerHTML = '<h3>Echipa curentă</h3>';

    teamMembers.forEach(member => {
        const card = document.createElement('div');
        card.className = 'team-member-card';
        card.innerHTML = `
            <div class="team-member-info">
                <div class="team-member-avatar" style="background-color: ${member.color}">${member.initials}</div>
                <div class="team-member-details">
                    <div class="team-member-name">${member.name}</div>
                    <div class="team-member-role">${getRoleLabel(member.role)}</div>
                </div>
            </div>
            <div class="team-member-actions" data-member-id="${member.id}">
                <button class="btn-icon btn-action" data-action="raport" title="Descarcă Raport"><svg...></svg></button>
                <button class="btn-icon btn-action" data-action="editeaza" title="Editează"><svg...></svg></button>
                <button class="btn-icon btn-action btn-delete" data-action="sterge" title="Șterge"><svg...></svg></button>
            </div>
        `;
        container.appendChild(card);
    });
}

export function resetTeamForm() {
    $('teamMemberForm').reset();
    $('teamFormTitle').textContent = 'Adaugă Membru Nou';
    $('memberColor').value = '#4f46e5';
    $('memberColorHex').value = '#4F46E5';
    $('deleteMemberBtn').style.display = 'none';
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
    $('deleteMemberBtn').style.display = 'inline-block';

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
    const isDayOff = eventType === 'day-off';
    
    if (isDayOff) {
        startTimeField.removeAttribute('required');
        durationField.removeAttribute('required');
        startTimeField.style.opacity = '0.7';
        durationField.style.opacity = '0.7';
    } else {
        startTimeField.setAttribute('required', 'required');
        durationField.setAttribute('required', 'required');
        startTimeField.style.opacity = '1';
        durationField.style.opacity = '1';
    }
    
    const isBillableCheckbox = $('isBillable');
    if (eventType === 'pauza-masa' || eventType === 'sedinta' || eventType === 'day-off') {
        if (isBillableCheckbox) isBillableCheckbox.checked = false;
    } else {
        if (isBillableCheckbox) isBillableCheckbox.checked = true;
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
    
    const totalMinutes = monthEvents.reduce((sum, event) => sum + event.duration, 0);
    return (totalMinutes / 60).toFixed(1);
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function getEventTypeLabel(type) {
    const types = {
        'therapy': 'Terapie',
        'group-therapy': 'Terapie de grup',
        'coordination': 'Coordonare',
        'day-off': 'Zi liberă',
        'pauza-masa': 'Pauză de masă',
        'sedinta': 'Ședință'
    };
    return types[type] || type;
}

function getRoleLabel(role) {
    const roles = { 'therapist': 'Terapeut', 'coordinator': 'Coordonator', 'admin': 'Admin' };
    return roles[role] || role;
}