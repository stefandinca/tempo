/**
 * js/uiService.js
 *
 * Gestionează toate interacțiunile cu interfața de utilizator (UI),
 * în special modalele, alertele și popularea listelor.
 * Depinde de 'calendarState' pentru a obține datele necesare.
 */

import { calendarState } from './calendarState.js';

// --- Helpers pentru a găsi elemente DOM ---
// Acest lucru previne erorile dacă un element nu este găsit
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

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

        const okBtn = $('alertModalOk');
        const closeBtn = $('closeAlertModal');
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

        const okBtn = $('confirmModalOk');
        const cancelBtn = $('confirmModalCancel');
        const closeBtn = $('closeConfirmModal');

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

        const handle = (result) => {
            modal.style.display = 'none';
            cleanup();
            resolve(result);
        };
        const handleBackdrop = (e) => { if (e.target === modal) handle('cancel'); };
        
        const cleanup = () => {
            cancelBtn.removeEventListener('click', () => handle('cancel'));
            singleBtn.removeEventListener('click', () => handle('single'));
            allBtn.removeEventListener('click', () => handle('all'));
            closeBtn.removeEventListener('click', () => handle('cancel'));
            modal.removeEventListener('click', handleBackdrop);
        };

        const cancelBtn = $('recurringDeleteCancel');
        const singleBtn = $('recurringDeleteSingle');
        const allBtn = $('recurringDeleteAll');
        const closeBtn = $('closeRecurringDeleteModal');

        cancelBtn.addEventListener('click', () => handle('cancel'));
        singleBtn.addEventListener('click', () => handle('single'));
        allBtn.addEventListener('click', () => handle('all'));
        closeBtn.addEventListener('click', () => handle('cancel'));
        modal.addEventListener('click', handleBackdrop);
    });
}

// --- Management Modal Evenimente ---

/**
 * Deschide modalul de adăugare/editare eveniment.
 * @param {string | null} eventId - ID-ul evenimentului de editat sau null pentru unul nou
 */
export function openEventModal(eventId) {
    const { isAdminView, currentDate } = calendarState.getState();
    if (!isAdminView) return;

    const modal = $('eventModal');
    const form = $('eventForm');
    
    // 1. Setează starea de editare în 'calendarState'
    // Acest lucru pre-populează selectedClientIds și selectedProgramIds
    calendarState.openEventModal(eventId);
    
    // 2. Populează listele de checkbox-uri
    populateTeamMemberCheckboxes();
    populateClientCheckboxes('');
    populateProgramCheckboxes('');
    
    // Resetează zilele de recurență
    ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach(id => {
        if ($(id)) $(id).checked = false;
    });

    if (eventId) {
        // --- Mod Editare ---
        const event = calendarState.getEventById(eventId);
        if (event) {
            $('eventName').value = event.name;
            $('eventDetails').value = event.details || '';
            $('eventType').value = event.type;
            $('eventDate').value = event.date;
            $('startTime').value = event.startTime;
            $('duration').value = event.duration;
            if ($('isPublic')) $('isPublic').checked = event.isPublic || false;
            if ($('isBillable')) $('isBillable').checked = event.isBillable !== false; // Default true

            // Bifează membrii echipei
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            teamMemberIds.forEach(id => {
                const checkbox = $(`team_${id}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Bifează zilele de recurență
            if (event.repeating && event.repeating.length > 0) {
                const checkboxIds = ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'];
                event.repeating.forEach(day => {
                    if (day >= 1 && day <= 5) $(checkboxIds[day - 1]).checked = true;
                });
            }
            
            $('deleteBtn').style.display = 'block';
        }
    } else {
        // --- Mod Adăugare Nouă ---
        form.reset();
        $('eventDate').value = formatDateISO(currentDate);
        $('eventType').value = 'therapy';
        $('duration').value = '60';
        $('isBillable').checked = true; // Default
        $('deleteBtn').style.display = 'none';
        
        // Repopulează checkbox-urile care au fost resetate de form.reset()
        populateTeamMemberCheckboxes();
        populateClientCheckboxes('');
        populateProgramCheckboxes('');
    }

    if ($('clientSearch')) $('clientSearch').value = '';
    if ($('programSearch')) $('programSearch').value = '';
    
    updateEventTypeDependencies($('eventType').value); // Setează câmpurile obligatorii
    modal.classList.add('active');
}

/**
 * Închide modalul de evenimente și resetează starea.
 */
export function closeEventModal() {
    $('eventModal').classList.remove('active');
    calendarState.closeEventModal(); // Resetează ID-ul de editare și selecțiile
}

/**
 * Populează checkbox-urile cu membrii echipei din 'calendarState'.
 */
function populateTeamMemberCheckboxes() {
    const { teamMembers } = calendarState.getState();
    const container = $('teamMemberCheckboxes');
    container.innerHTML = '';
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu exista membri ai echipei</p>';
        return;
    }
    
    teamMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="team_${member.id}" value="${member.id}">
            <label for="team_${member.id}" class="checkbox-label-with-dot">
                <span class="color-dot" style="background-color: ${member.color};"></span>
                ${member.name}
            </label>
        `;
        container.appendChild(div);
    });
}

/**
 * Populează checkbox-urile cu clienții din 'calendarState'.
 * Bifează pe cei din 'selectedClientIds'.
 * @param {string} searchTerm - Termenul de filtrare
 */
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
    
    // Adaugă event listeners pentru a actualiza 'selectedClientIds' la click
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            // Obține starea curentă (din nou)
            const { selectedClientIds } = calendarState.getState();
            const idStr = e.target.value;
            
            if (e.target.checked) {
                selectedClientIds.add(idStr);
            } else {
                selectedClientIds.delete(idStr);
            }
            // Nu actualizăm starea aici, lăsăm 'main.js' să facă asta
            // ci doar actualizăm UI-ul (titlul evenimentului)
            updateEventTitle();
        });
    });
}

/**
 * Populează checkbox-urile cu programele din 'calendarState'.
 * Bifează pe cele din 'selectedProgramIds'.
 * @param {string} searchTerm - Termenul de filtrare
 */
function populateProgramCheckboxes(searchTerm = '') {
    const { programs, selectedProgramIds } = calendarState.getState();
    const container = $('programCheckboxes');
    if (!container) return;

    container.innerHTML = '';
    if (!Array.isArray(programs) || programs.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Nu exista programe disponibile.</p>';
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
        div.className = 'checkbox-item program-item'; // Stilare specială
        div.innerHTML = `
            <div class="program-item-header">
                <input type="checkbox" id="program_${idStr}" value="${idStr}" ${isChecked ? 'checked' : ''}>
                <label for="program_${idStr}">${program.title || 'Program'}</label>
            </div>
            ${program.description ? `<p class="program-item-desc">${program.description}</p>` : ''}
        `;
        container.appendChild(div);
    });

    // Adaugă event listeners pentru a actualiza 'selectedProgramIds'
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const { selectedProgramIds } = calendarState.getState(); // Obține starea curentă
            const idStr = e.target.value;
            if (e.target.checked) {
                selectedProgramIds.add(idStr);
            } else {
                selectedProgramIds.delete(idStr);
            }
        });
    });
}

/**
 * Actualizează titlul evenimentului pe baza clienților și tipului.
 */
function updateEventTitle() {
    const { clients, selectedClientIds } = calendarState.getState();
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
    } else if (eventType === 'day-off') {
        eventNameInput.value = typeLabel;
    }
}

/**
 * Marchează câmpurile de timp ca fiind opționale dacă tipul este 'day-off'.
 * @param {string} eventType - Valoarea din selectul 'eventType'
 */
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
    
    // Auto-uncheck billable pentru pauza-masa și sedinta
    const isBillableCheckbox = $('isBillable');
    if (eventType === 'pauza-masa' || eventType === 'sedinta') {
        if (isBillableCheckbox) isBillableCheckbox.checked = false;
    } else if (eventType !== 'day-off') {
        if (isBillableCheckbox) isBillableCheckbox.checked = true;
    }
}

// --- Filtrare UI (re-randează lista pe baza input-ului) ---

/**
 * Re-populează lista de clienți când utilizatorul tastează în căutare.
 * Salvează starea curentă a checkbox-urilor înainte de a re-randa.
 */
export function filterClientsInModal(searchTerm) {
    const { selectedClientIds } = calendarState.getState();
    // 1. Salvează starea curentă a checkbox-urilor vizibile
    $('clientCheckboxes').querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selectedClientIds.add(cb.value);
        else selectedClientIds.delete(cb.value);
    });
    // 2. Re-randează lista cu noul termen de căutare
    populateClientCheckboxes(searchTerm);
}

/**
 * Re-populează lista de programe când utilizatorul tastează în căutare.
 * Salvează starea curentă a checkbox-urilor înainte de a re-randa.
 */
export function filterProgramsInModal(searchTerm) {
    const { selectedProgramIds } = calendarState.getState();
    // 1. Salvează starea curentă
    $('programCheckboxes').querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selectedProgramIds.add(cb.value);
        else selectedProgramIds.delete(cb.value);
    });
    // 2. Re-randează lista
    populateProgramCheckboxes(searchTerm);
}

// --- Helpers ---

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getEventTypeLabel(type) {
    const types = {
        'therapy': 'Terapie',
        'group-therapy': 'Terapie de grup',
        'coordination': 'Coordonare',
        'day-off': 'Zi libera',
        'pauza-masa': 'Pauza de masa',
        'sedinta': 'Sedinta'
    };
    return types[type] || type;
}