/**
 * js/main.js
 * Punctul principal de intrare (entry point) al aplicației.
 */

// --- Importarea Modulelor ---
import * as auth from './authService.js';
import * as api from './apiService.js';
import { calendarState } from './calendarState.js';
import * as ui from './uiService.js';
import * as view from './calendarView.js';
import * as reportService from './reportService.js';
import * as evolutionService from './evolutionService.js';
import * as billing from './billingService.js';
import * as eventTypesService from './eventTypesService.js';

// --- Variabile DOM Globale ---
const $ = (id) => document.getElementById(id);
const dom = {
    // Container principal
    appContainer: $('appContainer'),

    // Navigare Sidebar
    sidebarLinks: document.querySelectorAll('.sidebar-menu .menu-item'),
    
    
    // Secțiuni Principale
    calendarSection: $('calendarSection'),
    clientSection: $('clientSection'),
    teamSection: $('teamSection'),
    dashboardSection: $('dashboardSection'),
    billingSection: $('billingSection'),
    eventTypesSection: $('eventTypesSection'),
    
    // Calendar
    currentPeriod: $('currentPeriod'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    todayBtn: $('todayBtn'),
    viewBtns: document.querySelectorAll('.view-btn'),
    filtersContainer: $('filters'),
    addEventBtn: $('addEventBtn'),
    addEventBtnCalendar: $('addEventBtnCalendar'),
    calendarClientFilter: $('calendarClientFilter'), // Filtru client
    cloneMonthBtn: $('cloneMonthBtn'),

    // Clone Month Modal
    cloneMonthModal: $('cloneMonthModal'),
    closeCloneMonthModal: $('closeCloneMonthModal'),
    cloneSourceMonth: $('cloneSourceMonth'),
    cloneTargetMonth: $('cloneTargetMonth'),
    cloneMonthCancel: $('cloneMonthCancel'),
    cloneMonthConfirm: $('cloneMonthConfirm'),
    clearMonth: $('clearMonth'),
    clearMonthBtn: $('clearMonthBtn'),
    
    // Modal Evenimente (Adăugare/Editare)
    closeModalBtn: $('closeModal'),
    cancelModalBtn: $('cancelBtn'),
    eventForm: $('eventForm'),
    deleteEventBtn: $('deleteBtn'),
    eventTypeSelect: $('eventType'),
    clientSearch: $('clientSearch'),
    programSearch: $('programSearch'),
    
    // Modal Detalii Eveniment
    closeEventDetailsModalBtn: $('closeEventDetailsModal'),
    closeEventDetailsBtn: $('closeEventDetails'),
    editEventFromDetailsBtn: $('editEventFromDetails'),
    deleteEventFromDetailsBtn: $('deleteEventFromDetails'),
    
    // Secțiune Echipă
    teamMemberForm: $('teamMemberForm'),
    // NOU: Adăugat pentru a ascunde opțiunile de rol
    memberRoleSelect: $('memberRole'),
    adminRoleOption: document.querySelector('#memberRole option[value="admin"]'),
    coordinatorRoleOption: document.querySelector('#memberRole option[value="coordinator"]'),
    // SFÂRȘIT NOU
    deleteMemberBtn: $('deleteMemberBtn'),
    cancelMemberBtn: $('cancelMemberBtn'),
    teamMembersList: $('teamMembersList'),
    addNewTeamMemberBtn: $('addNewTeamMemberBtn'),
    
    // Secțiune Client
    clientForm: $('clientForm'),
    deleteClientBtn: $('deleteClientBtn'),
    cancelClientBtn: $('cancelClientBtn'),
    addNewClientBtn: $('addNewClientBtn'),
    clientsList: $('clientsList'),
    clientSearchBar: $('clientSearchBar'),

    
    

    // Butoane UI
    themeToggle: $('themeToggle'),
    fullscreenToggle: $('fullscreenToggle'),
    sidebarLogoutBtn: $('sidebarLogoutBtn'),
    mobileMenuToggles: document.querySelectorAll('.mobile-menu-toggle'),
    mobileMenuBackdrop: $('mobileMenuBackdrop'),
    sidebar: document.querySelector('.sidebar'),
    

    
    
};

//useri
let currentUser = null;

/**
 * Generate a client ID from first name + birthday (DDMM format)
 * Format: firstname_ddmm (e.g., cezar_2102, tudor_1503)
 * If birthday is not provided, falls back to 4 random digits
 */
function generateClientId(fullName, birthDate) {
    // Clean and format the first name
    const firstName = fullName.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z\s]/g, '') // Keep only letters and spaces
        .split(/\s+/)[0]; // Take first name only
    
    // Generate date suffix
    let dateSuffix;
    if (birthDate) {
        const date = new Date(birthDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        dateSuffix = `${day}${month}`;
    } else {
        // Fallback to 4 random digits if no birthday
        dateSuffix = String(Math.floor(1000 + Math.random() * 9000));
    }
    
    return `${firstName}${dateSuffix}`;
}

/**
 * Populează dropdown-ul de tipuri de evenimente cu date din baza de date
 * @param {Array} eventTypes - Array de obiecte cu id, label, isBillable, requiresTime
 */
function populateEventTypeDropdown(eventTypes) {
    const eventTypeSelect = dom.eventTypeSelect;
    if (!eventTypeSelect) return;
    
    // Curăță opțiunile existente
    eventTypeSelect.innerHTML = '';
    
    // Adaugă opțiunile din baza de date
    eventTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.label;
        // Stochează proprietățile suplimentare ca atribute data pentru a le putea accesa mai târziu
        option.dataset.isBillable = type.isBillable;
        option.dataset.requiresTime = type.requiresTime;
        eventTypeSelect.appendChild(option);
    });
}

// Make it globally accessible for eventTypesService
window.populateEventTypeDropdown = populateEventTypeDropdown;

// --- Navigare Principală (Tab-uri) ---

/**
 * Gestionează comutarea între secțiunile principale: Dashboard, Calendar, Clienti, Echipa.
 * @param {Event} e Evenimentul de click de la link-ul din sidebar.
 */
function handleMainViewNavigation(e) {
    e.preventDefault();
    const menuItem = e.currentTarget.closest('.menu-item');
    if (!menuItem) return;

    const viewName = menuItem.dataset.view;
    if (!viewName) return;

    // 1. Ascunde toate secțiunile și butoanele
    document.querySelectorAll('.main-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Explicitly hide
    });
    dom.sidebarLinks.forEach(link => link.classList.remove('active'));

    // 2. Arată secțiunea și butonul corect
    const section = $(`${viewName}Section`);
    if (section) {
        section.classList.add('active');
        section.style.display = 'flex'; // Explicitly show
        menuItem.classList.add('active');
        
        // 3. Render calendar if switching to calendar view
        if (viewName === 'calendar') {
            setTimeout(() => {
                render();
                renderFilters();
            }, 50); // Small delay to ensure DOM is ready
        }

        if (viewName === 'billing') {
    if (auth.isAdmin()) {
        billing.renderBillingView();
    } else {
        // Dacă un non-admin (ex: Terapeut) încearcă să acceseze
        console.warn('Acces restricționat la secțiunea Facturare.');
        e.preventDefault(); // Oprește navigarea

        // Asigură-te că secțiunea curentă rămâne vizibilă
        const currentActiveSection = document.querySelector('.main-section.active');
        if (currentActiveSection) {
            currentActiveSection.style.display = 'flex';
        }
        // Resetează link-ul din meniu
        menuItem.classList.remove('active');
        const currentActiveLink = document.querySelector('.sidebar-menu .menu-item.active');
        if (currentActiveLink) {
            currentActiveLink.classList.add('active');
        }
        return; // Oprește execuția funcției
    }
}
    }
}

/**
 * NOU: Setează permisiunile la nivel de UI în funcție de rol
 */
function setupRolePermissions() {
    // Restricții specifice pentru non-admini
    if (!auth.isAdmin()) {
        // Hide clone month button for non-admin users
        if (dom.cloneMonthBtn) {
            dom.cloneMonthBtn.style.display = 'none';
        }
    }

    // Dacă utilizatorul este Admin sau Coordonator, nu se aplică restricții
    if (auth.isAdmin() || auth.isCoordinator()) {
        return;
    }

    // Restricții pentru Terapeut
    if (auth.isTherapist()) {
        // 1. Ascunde butonul de "Adaugă Membru Nou"
        // CORECȚIE: Utilizatorul a spus că poate adăuga ALȚI terapeuți. Lăsăm butonul.
        // $('addNewTeamMemberBtn').style.display = 'none';

        // 2. Restricționează dropdown-ul de roluri în formularul de echipă
        if (dom.memberRoleSelect) {
            // Ascunde opțiunile pe care un terapeut nu le poate atribui
            if (dom.adminRoleOption) dom.adminRoleOption.style.display = 'none';
            if (dom.coordinatorRoleOption) dom.coordinatorRoleOption.style.display = 'none';
            // Setează valoarea implicită la 'therapist'
            dom.memberRoleSelect.value = 'therapist';
        }
    }
}


// --- Funcția Principală de Randare (Calendar) ---

function render() {
    const { currentDate, currentView } = calendarState.getState();
    updateCurrentPeriodLabel(currentDate, currentView);

    if (currentView === 'month') {
        // Stop the timer on month view
        view.stopTimeIndicatorUpdates(); 
        view.renderMonthView(handleDayClick);
    } else if (currentView === 'week') {
        view.renderWeekView(handleEventClick);
        // Start the timer *after* rendering week view
        view.startTimeIndicatorUpdates(); 
    } else if (currentView === 'day') {
        view.renderDayView(handleEventClick);
        // Start the timer *after* rendering day view
        view.startTimeIndicatorUpdates(); 
    }
}

function updateCurrentPeriodLabel(date, view) {
    if (!dom.currentPeriod) return;
    
    let label = '';
    const ro = 'ro-RO';
    if (view === 'month') {
        label = date.toLocaleString(ro, { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
        const start = getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        label = `${start.toLocaleDateString(ro, {day: 'numeric', month: 'short'})} - ${end.toLocaleDateString(ro, {day: 'numeric', month: 'short', year: 'numeric'})}`;
    } else if (view === 'day') {
        label = date.toLocaleString(ro, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    dom.currentPeriod.textContent = label;
}

function renderFilters() {
    const { teamMembers, activeFilters } = calendarState.getState();
    if (!dom.filtersContainer) return;

    dom.filtersContainer.innerHTML = '';
    
    teamMembers.forEach(member => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        
        // Set text color to member color
        chip.style.color = member.color;
        
        // Check if this filter is active
        const isActive = activeFilters.includes(member.id);
        
        if (isActive) {
            chip.classList.add('active');
            // When active, set border color to member color
            chip.style.borderColor = member.color;
        }
        
        chip.innerHTML = `<span class="color-dot" style="background-color: ${member.color}"></span><span>${member.name}</span>`;
        
        chip.addEventListener('click', () => {
            calendarState.toggleFilter(member.id);
            // Re-render filters first to update visual state
            renderFilters();
            // Then re-render calendar to show/hide events
            render();
        });
        
        dom.filtersContainer.appendChild(chip);
    });
}

// --- Inițializare UI (Theme & Fullscreen) ---

function initThemeToggle() {
    if (!dom.themeToggle) return;
    const savedTheme = localStorage.getItem('calendar-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    dom.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('calendar-theme', newTheme);
    });
}

function initFullscreenToggle() {
    if (!dom.fullscreenToggle) return;
    dom.fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Eroare la activarea ecranului complet: ${err.message}`);
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });
}

// --- Handlers Navigare Calendar ---

function handleNavigation(direction) {
    const { currentDate, currentView } = calendarState.getState();
    const newDate = new Date(currentDate);
    if (currentView === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (currentView === 'week') newDate.setDate(newDate.getDate() + (7 * direction));
    else if (currentView === 'day') newDate.setDate(newDate.getDate() + direction);
    calendarState.setCurrentDate(newDate);
    render();
}

function navigateToToday() {
    calendarState.setCurrentDate(new Date());
    render();
}

function handleViewChange(e) {
    const newView = e.target.dataset.view;
    if (newView) {
        calendarState.setCurrentView(newView);
        dom.viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        render();
    }
}

function handleDayClick(date) {
    calendarState.setCurrentDate(date);
    calendarState.setCurrentView('day');
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    const dayBtn = document.querySelector('[data-view="day"]');
    if (dayBtn) dayBtn.classList.add('active');
    render();
}

function handleEventClick(eventId) {
    ui.showEventDetails(eventId);
}

// --- Handlers Modal Evenimente (Adăugare/Editare) ---

async function handleSaveEvent(e) {
    e.preventDefault();
    const { editingEventId } = calendarState.getState();
    const existingEvent = editingEventId ? calendarState.getEventById(editingEventId) : null;

     // === ADD PERMISSION CHECK FOR EDITING ===
    if (existingEvent && !auth.canModifyEvent(existingEvent)) {
        auth.showPermissionDenied('editați acest eveniment');
        return;
    }
    // === END PERMISSION CHECK ===

    const formData = new FormData(e.target);

    const teamMemberIds = formData.getAll('teamMemberCheckbox');
    if (teamMemberIds.length === 0) {
        ui.showCustomAlert('Te rog selectează cel puțin un membru al echipei.', 'Validare');
        return;
    }
    
    const clientIds = Array.from(calendarState.getState().selectedClientIds);
    const programIds = Array.from(calendarState.getState().selectedProgramIds);
    
    
    const repeatingDays = [];
['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach((id, index) => {
    const checkbox = document.getElementById(id);
    if (checkbox && checkbox.checked) {
        repeatingDays.push(index + 1); // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
    }
});

console.log('Repeating Days array:', repeatingDays);
console.log('Repeating Days types:', repeatingDays.map(d => typeof d));
console.log('Final repeatingDays array:', repeatingDays);

    
    const eventType = formData.get('eventType');
    let startTime = formData.get('startTime');
    let duration = parseInt(formData.get('duration'));

    console.log('=== REPEATING DAYS DEBUG ===');
console.log('Raw array:', repeatingDays);
console.log('Types:', repeatingDays.map(d => typeof d));
console.log('Values:', repeatingDays);
console.log('===========================');

    // Obține proprietățile tipului de eveniment din dropdown
    const eventTypeSelect = dom.eventTypeSelect;
    const selectedOption = eventTypeSelect ? eventTypeSelect.selectedOptions[0] : null;
    const requiresTime = selectedOption ? (selectedOption.dataset.requiresTime === 'true') : true;

    // Dacă tipul de eveniment nu necesită timp, folosește valori implicite
    if (!requiresTime) {
        if (!startTime) startTime = '08:00';
        if (!duration || isNaN(duration)) duration = 60;
    }
    
    // Validare: dacă tipul necesită timp, verifică că sunt completate
    if (requiresTime && (!startTime || isNaN(duration))) {
         ui.showCustomAlert('Te rog completează ora de început și durata.', 'Validare');
        return;
    }

    const eventBase = {
        name: formData.get('eventName'),
        details: formData.get('eventDetails') || undefined,
        type: eventType,
        date: formData.get('eventDate'),
        startTime: startTime,
        duration: duration,
        isPublic: formData.has('isPublic'),
        isBillable: formData.has('isBillable'),
        teamMemberIds,
        clientIds: clientIds.length > 0 ? clientIds : undefined,
        programIds: programIds.length > 0 ? programIds : undefined,
        repeating: repeatingDays.map(d => parseInt(d)) // Ensure integers
        
    };

    // --- START NEW RECURRENCE EDIT LOGIC ---
    if (existingEvent && existingEvent.repeating && existingEvent.repeating.length > 0) {
        // This is an edit of a recurring event, ask the user what to do
        const choice = await ui.showRecurringEditModal();

        if (choice === 'cancel') {
            return; // User cancelled, do nothing
        }

        if (choice === 'single') {
            // Update only this event and detach it from the series by removing 'repeating'
            const updatedEvent = { 
                ...existingEvent, 
                ...eventBase, 
                id: editingEventId, 
                repeating: [] // Detach from series
            };
            calendarState.saveEvent(updatedEvent);
        } else if (choice === 'all') {
            // Update all events in the series
            // Note: eventBase already contains the new 'repeating' days from the form
            calendarState.updateRecurringEvents(existingEvent, eventBase);
        }

    } else {
        // This is a simple edit OR a new event
        const defaultAttendance = {};
        if (clientIds.length > 0) {
            clientIds.forEach(clientId => {
                defaultAttendance[clientId] = 'present';
            });
        }

        if (eventBase.repeating.length > 0) {
            // New recurring event
            const newEvents = createRecurringEvents(eventBase, defaultAttendance);
            calendarState.saveEvent(newEvents);
            await api.createEvent(newEvents); // CREATE multiple
        } else if (editingEventId) {
            // Update existing single event
            const updatedEvent = { ...eventBase, id: editingEventId };
            calendarState.saveEvent(updatedEvent);
            await api.updateEvent(updatedEvent); // UPDATE
        } else {
            // Create new single event
            const newEvent = {
                ...eventBase,
                id: generateEventId(),
                attendance: defaultAttendance
            };
            calendarState.saveEvent(newEvent);
            await api.createEvent(newEvent); // CREATE
        }
    }
    // --- END NEW RECURRENCE EDIT LOGIC ---
    // logs saving activity
    window.logActivity(editingEventId ? "Eveniment actualizat" : "Eveniment adăugat", eventBase.name, 'event', eventBase.date);
    ui.closeEventModal();
    render();
}



async function handleDeleteEvent() {
    const { editingEventId } = calendarState.getState();
    if (!editingEventId) return;

    const event = calendarState.getEventById(editingEventId);

     // === ADD PERMISSION CHECK ===
    if (!auth.canModifyEvent(event)) {
        auth.showPermissionDenied('ștergeți acest eveniment');
        return;
    }

    let choice = 'single';

    if (event.repeating && event.repeating.length > 0) {
        choice = await ui.showRecurringDeleteModal();
    } else {
        const confirmed = await ui.showCustomConfirm('Ești sigur că vrei să ștergi acest eveniment?', 'Șterge eveniment');
        if (!confirmed) choice = 'cancel';
    }
    
    if (choice === 'cancel') return;

    if (choice === 'all') {
        // Delete all recurring events matching the criteria
        const criteria = {
            name: event.name,
            teamMemberIds: event.teamMemberIds || [event.teamMemberId],
            startTime: event.startTime,
            duration: event.duration,
            repeating: event.repeating,
            month: event.date ? event.date.substring(0, 7) : null // YYYY-MM - doar evenimentele din aceeași lună
        };

        // Get all matching event IDs before deleting (only from same month)
        const matchingEvents = calendarState.getState().events.filter(e => {
            const eventTeamIds = e.teamMemberIds || (e.teamMemberId ? [e.teamMemberId] : []);
            const eventRepeating = (e.repeating || []).map(d => parseInt(d));
            const criteriaTeamIds = JSON.stringify((criteria.teamMemberIds || []).sort());
            const criteriaRepeating = JSON.stringify((criteria.repeating || []).map(d => parseInt(d)).sort());
            const eventMonth = e.date ? e.date.substring(0, 7) : null;

            return e.name === criteria.name &&
                   JSON.stringify(eventTeamIds.sort()) === criteriaTeamIds &&
                   e.startTime === criteria.startTime &&
                   e.duration === criteria.duration &&
                   JSON.stringify(eventRepeating.sort()) === criteriaRepeating &&
                   eventMonth === criteria.month; // Doar evenimentele din aceeași lună
        });

        // Delete from state
        calendarState.deleteRecurringEvents(criteria);

        // Delete each event from the API
        for (const evt of matchingEvents) {
            try {
                await api.deleteEvent(evt.id);
            } catch (error) {
                console.error(`Failed to delete event ${evt.id}:`, error);
            }
        }
    } else {
        // Delete single event
        calendarState.deleteEvent(editingEventId);
        await api.deleteEvent(editingEventId);
    }

    ui.closeEventModal();
    ui.closeEventDetailsModal();
    render();
}

/**
 * Forțează reîncărcarea tuturor datelor de la API și re-randează UI-ul.
 */
async function forceRefreshData() {
    const refreshButtons = document.querySelectorAll('.btn-refresh-data');
    
    // Arată starea de încărcare pe butoane
    refreshButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('is-loading');
    });
    
    // Loader-ul global va fi afișat automat de prima funcție api.loadData()

    try {
        // 1. Reîncarcă toate datele în paralel
        const [data, programsData, evolutionData, billingsData, discountThresholds] = await Promise.all([
            api.loadData(),
            api.loadPrograms(),
            api.loadEvolutionData(),
            api.loadBillingsData(),
            api.loadDiscountThresholds()
        ]);

        // 2. Actualizează starea (state) cu noile date
        calendarState.initializeData(data); // Resetează events, clients, team
        calendarState.setPrograms(programsData.programs);
        calendarState.setEvolutionData(evolutionData);
        calendarState.setBillingsData(billingsData);
        calendarState.setDiscountThresholds(discountThresholds);

        // 3. Re-randează complet UI-ul
        
        // Actualizează dashboard-ul (program, statistici, header)
        updateUserInterface();

        // Actualizează filtrele din calendar
        renderFilters();

        // Actualizează listele din paginile Admin
        ui.renderClientsList(dom.clientSearchBar.value);
        ui.renderTeamMembersList();
        
        // Actualizează dropdown-ul de clienți din calendar
        populateClientFilterDropdown();
        
        // Re-randează vizualizarea curentă (calendar, clienți, etc.)
        const activeSection = document.querySelector('.main-section.active');
        if (activeSection) {
            const viewName = activeSection.id.replace('Section', '');
            if (viewName === 'calendar') {
                render(); // Re-randează calendarul
            } else if (viewName === 'billing') {
                if (auth.isAdmin()) {
                    billing.renderBillingView(); // Re-randează facturarea
                }
            }
            // Graficele din modalul de evoluție se vor actualiza automat
            // data viitoare când este deschis, deoarece `calendarState` este actualizat.
        }

        // Afișează un mesaj de succes
        ui.showCustomAlert('Datele au fost reîmprospătate cu succes.', 'Actualizare completă');

    } catch (error) {
        console.error('Eroare la reîmprospătarea datelor:', error);
        ui.showCustomAlert('A apărut o eroare la reîmprospătarea datelor. Vă rugăm verificați consola.', 'Eroare API');
    } finally {
        // Oprește starea de încărcare
        refreshButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('is-loading');
        });
        // Loader-ul global va fi ascuns automat de ultima funcție api
    }
}

// --- Handlers Secțiuni Admin (Client/Echipă) ---

async function handleSaveClient(e) {
    e.preventDefault();
    const { editingClientId } = calendarState.getState();
    const formData = new FormData(e.target);
    
    // Get manual ID or generate one
    let clientId;
    const manualId = formData.get('clientId')?.trim();
    
    if (editingClientId) {
        // When editing, keep existing ID unless manually changed
        clientId = manualId || editingClientId;
    } else {
        // When creating new, use manual ID or generate
        clientId = manualId || generateClientId(
            formData.get('clientFullName'), 
            formData.get('clientBirthdayInput')
        );
    }
    
    // Validate ID format
    if (!/^[a-z0-9_]+$/.test(clientId)) {
        ui.showCustomAlert('Codul clientului trebuie să conțină doar litere mici, cifre și underscore.', 'ID Invalid');
        return;
    }
    
    // (MODIFICAT) Verifică dacă ID-ul s-a schimbat
    const idHasChanged = editingClientId && editingClientId !== clientId;

    // Check for duplicate IDs (only when creating new or changing ID)
    if (clientId !== editingClientId) {
        const { clients } = calendarState.getState();
        if (clients.some(c => c.id === clientId)) {
            ui.showCustomAlert('Acest cod de client este deja folosit. Alege un cod diferit.', 'Cod Duplicat');
            return;
        }
    }
    
    const clientData = {
        id: clientId,
        name: formData.get('clientFullName'),
        email: formData.get('clientEmail'),
        phone: formData.get('clientPhone'),
        birthDate: formData.get('clientBirthdayInput') || null,
        medical: formData.get('clientMedical') || ''
    };

    // Salvează în starea locală (aici are loc migrarea ID-ului)
    calendarState.saveClient(clientData);
    
    // (MODIFICAT) Salvează TOATE datele dacă ID-ul s-a schimbat
    try {
        // Salvează datele principale (clients, events, etc.)
        if (editingClientId) {
    await api.updateClient(clientData);
} else {
    await api.createClient(clientData);
}

        // DACĂ ID-ul s-a schimbat, salvează și celelalte fișiere
        // care au fost migrate în state
        if (idHasChanged) {
            const { evolutionData, billingsData } = calendarState.getState();
            await api.saveEvolutionData(evolutionData);
            await api.saveBillingsData(billingsData);
            ui.showCustomAlert('Clientul și toate datele asociate (evoluție, plăți) au fost actualizate cu noul ID.', 'Migrare ID completă');
        }

        // logs saving activity
        window.logActivity(editingClientId ? "Client actualizat" : "Client adăugat", clientData.name, 'generic', clientData.id);
        
        ui.renderClientsList(dom.clientSearchBar.value);
        ui.resetClientForm();
        populateClientFilterDropdown(); // Actualizează dropdown-ul

    } catch (error) {
        console.error('Eroare la salvarea datelor clientului:', error);
        ui.showCustomAlert('A apărut o eroare la salvarea datelor clientului.', 'Eroare API');
    }
}

async function handleDeleteClient() {
    const { editingClientId } = calendarState.getState();
    if (!editingClientId) return;

    const confirmed = await ui.showCustomConfirm('Ești sigur că vrei să ștergi acest client? Toate datele (inclusiv evoluția și plățile) vor fi șterse ireversibil.', 'Șterge Client');
    if (confirmed) {
        // Starea locală este curățată (inclusiv evolution și billings)
        calendarState.deleteClient(editingClientId); 
        
        // (MODIFICAT) Salvăm toate cele 3 fișiere pentru a reflecta ștergerea
        try {
            const { evolutionData, billingsData } = calendarState.getState();
            await api.deleteClient(editingClientId); // Salvează clients/events
            await api.saveEvolutionData(evolutionData); // Salvează evolution
            await api.saveBillingsData(billingsData); // Salvează billings
            
            ui.renderClientsList(dom.clientSearchBar.value);
            ui.resetClientForm();
            populateClientFilterDropdown(); // Actualizează dropdown-ul
        } catch (error) {
            console.error('Eroare la ștergerea datelor clientului:', error);
            ui.showCustomAlert('A apărut o eroare la ștergerea datelor clientului.', 'Eroare API');
        }
    }
}

async function handleSaveTeamMember(e) {
    e.preventDefault();
    const { editingMemberId } = calendarState.getState();
    
    // NOU: Verificare permisiuni
    if (!auth.isAdmin() && !auth.isCoordinator()) { // Dacă e Terapeut
        const formData = new FormData(e.target);
        const newRole = formData.get('memberRole');

        if (editingMemberId && editingMemberId !== auth.getCurrentUser().id) {
            // Un terapeut încearcă să editeze datele altcuiva (nu ar trebui să ajungă aici dacă UI e corect)
            auth.showPermissionDenied('editați alți membri ai echipei');
            return;
        }
        if (newRole !== 'therapist') {
            // Un terapeut încearcă să-și schimbe rolul sau să adauge un non-terapeut
            auth.showPermissionDenied('adăugați sau setați roluri de Coordonator/Admin');
            return; // Oprește salvarea
        }
    }

    const formData = new FormData(e.target);

    const memberData = {
        id: editingMemberId || `member_${Date.now()}`,
        name: formData.get('memberName'),
        initials: formData.get('memberInitials'),
        role: formData.get('memberRole'),
        color: formData.get('memberColorHex')
    };
    
    calendarState.saveTeamMember(memberData);
    await api.saveData(calendarState.getState());

    // logs saving activity
    window.logActivity(editingMemberId ? "Membru actualizat" : "Membru adăugat", memberData.name, 'generic', memberData.id);
    
    ui.renderTeamMembersList();
    ui.resetTeamForm();
    renderFilters();
}

async function handleDeleteTeamMember() {
    const { editingMemberId } = calendarState.getState();
    
    // NOU: Verificare permisiuni
    if (!auth.isAdmin() && !auth.isCoordinator()) {
        auth.showPermissionDenied('ștergeți membri ai echipei');
        return;
    }

    if (!editingMemberId) return;

    const confirmed = await ui.showCustomConfirm('Ești sigur că vrei să ștergi acest membru? Toate evenimentele asociate vor fi de asemenea șterse.', 'Șterge Membru');
    if (confirmed) {
        calendarState.deleteTeamMember(editingMemberId);
        await api.saveData(calendarState.getState());
        ui.renderTeamMembersList();
        ui.resetTeamForm();
        renderFilters();
        render();
    }
}

// --- Handlers pentru Acțiuni pe Carduri (Event Delegation) ---

function setupAdminListeners() {
    // Secțiunea Client
    if (dom.clientsList) {
        dom.clientsList.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.btn-action');
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const clientId = actionBtn.closest('.client-actions').dataset.clientId;
            if (!clientId) return;

            switch (action) {
                case 'evolutie': evolutionService.showEvolutionModal(clientId); break;
                case 'raport': reportService.downloadClientReport(clientId); break;
                case 'email': reportService.emailClientReport(clientId); break;
                case 'editeaza': ui.editClientInModal(clientId); break;
                case 'sterge': 
                    calendarState.setEditingId({ clientId });
                    handleDeleteClient();
                    break;
            }
        });
    }
    
    // Secțiunea Echipă
    if (dom.teamMembersList) {
        dom.teamMembersList.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.btn-action');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const memberId = actionBtn.closest('.team-member-actions').dataset.memberId;
            if (!memberId) return;

            switch (action) {
                case 'raport': reportService.downloadTeamMemberReport(memberId); break;
                case 'editeaza': ui.editTeamMemberInModal(memberId); break;
                case 'sterge':
                    calendarState.setEditingId({ memberId });
                    handleDeleteTeamMember();
                    break;
            }
        });
    }
}


// --- Funcții Helper ---

/**
 * Helper function to create recurring events
 * @param {object} eventBase - The base event data from the form
 * @param {object} defaultAttendance - The pre-built attendance object
 */
function createRecurringEvents(eventBase, defaultAttendance = {}) { // 1. Accept new parameter
    const events = [];
    const parts = eventBase.date.split('-');
    const startDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endOfMonth) {
        const dayOfWeek = currentDate.getDay();
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        if (eventBase.repeating.includes(adjustedDay)) {
            // FIX: Use a timezone-safe date formatting method
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            // 2. Add attendance to each new event
            events.push({ 
                ...eventBase, 
                id: generateEventId(), 
                date: dateStr,
                // --- BUG FIX HERE ---
                // Original was: attendance: defaultAttendance
                // This creates a new copy for each event
                attendance: { ...defaultAttendance } 
                // --- END BUG FIX ---
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return events;
}

// --- Helper Functions ---

/**
 * Logs a recent activity to localStorage.
 * @param {string} action - The action performed (e.g., "Client adăugat").
 * @param {string} details - The name/details of the item (e.g., "Stefan Negru").
 * @param {string} actionType - 'event', 'report', 'evaluation', 'generic'
 * @param {string} relatedId - Client ID or Event Date
 */
window.logActivity = function(action, details, actionType = 'generic', relatedId = null) {
    let activityLog = [];
    try {
        activityLog = JSON.parse(localStorage.getItem('recentActivity')) || [];
    } catch (e) {
        activityLog = [];
    }

    const newEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        actionType: actionType,
        relatedId: relatedId
    };

    // Add new entry to the top
    activityLog.unshift(newEntry);

    // Keep the log to a reasonable size (e.g, last 15 items)
    if (activityLog.length > 15) {
        activityLog.pop();
    }

    // Save back to localStorage
    localStorage.setItem('recentActivity', JSON.stringify(activityLog));
}

/**
 * Populează dropdown-ul de filtrare a clienților din header-ul calendarului.
 */
function populateClientFilterDropdown() {
    if (!dom.calendarClientFilter) return;
    
    const { clients } = calendarState.getState();
    const currentValue = dom.calendarClientFilter.value; // Salvează valoarea curentă
    
    // Sortează clienții alfabetic
    const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    
    dom.calendarClientFilter.innerHTML = '<option value="">Toți Clienții</option>'; // Opțiunea default
    
    sortedClients.forEach(client => {
        // Nu adăuga clienți "speciali" în filtru
        if (!['Pauza de masa', 'Sedinta', 'Concediu'].some(name => client.name.includes(name))) {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            dom.calendarClientFilter.appendChild(option);
        }
    });

    // Restabilește valoarea selectată anterior, dacă mai există
    dom.calendarClientFilter.value = currentValue;
}

function generateEventId() {
    return 'evt' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date, format = 'short') {
    const ro = 'ro-RO';
    if (format === 'short') {
        return date.toLocaleDateString(ro, { month: 'short', day: 'numeric' });
    } else if (format === 'iso') {
        return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString(ro);
}


/**
 * Update UI based on current user
 */
function updateUserInterface() {
    // Update dashboard schedule
    updateDashboardSchedule();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Add user info to header
    addUserInfoToHeader();
    
    // Update permissions for buttons
    updatePermissions();
}

/**
 * Update dashboard schedule for current user
 */
/**
 * Update dashboard schedule for current user
 */
function updateDashboardSchedule() {
    const container = $('dashboardTodaySchedule');
    if (!container) return;
    
    // Obține programul zilei. Pentru admin, auth.getTodaysSchedule()
    // returnează TOATE evenimentele. Pentru terapeut, le returnează doar pe ale lui.
    const schedule = auth.getTodaysSchedule();
    
    if (auth.isAdmin()) {
        // --- LOGICĂ NOUĂ PENTRU ADMIN ---
        // Grupăm evenimentele pe terapeut
        container.innerHTML = '';
        const { teamMembers } = calendarState.getState();
        
        let hasAnyEvents = false;

        teamMembers.forEach(member => {
            // Găsește evenimentele pentru acest membru din programul zilei
            const memberEvents = schedule.filter(event => {
                const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
                return teamMemberIds.includes(member.id);
            });
            
            if (memberEvents.length > 0) {
                hasAnyEvents = true;
                
                // Adaugă header-ul terapeutului
                container.innerHTML += `<h3 class="therapist-group-header" style="color: ${member.color || '#4A90E2'}">${member.name}</h3>`;
                
                // Adaugă evenimentele pentru acest terapeut
                container.innerHTML += memberEvents.map(event => {
                    const endTime = calculateEndTime(event.startTime, event.duration);
                    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
                    const clientNames = clientIds.map(id => {
                        const client = calendarState.getClientById(id);
                        return client ? client.name : 'Fără client';
                    }).join(', ');
                    
                   return `
                        <div class="schedule-item clickable-schedule-item" data-event-id="${event.id}">
                            <div class="schedule-time">${event.startTime} - ${endTime}</div>
                            <div class="schedule-details">
                                <div class="schedule-title">${event.name}</div>
                                <div class="schedule-client">cu ${clientNames || 'Fără client'}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });

        if (!hasAnyEvents) {
            container.innerHTML = '<div class="empty-schedule">Nicio sesiune programată pentru astăzi.</div>';
        }

    } else {
        // --- LOGICA EXISTENTĂ (PENTRU NON-ADMINI) ---
        if (schedule.length === 0) {
            container.innerHTML = '<div class="empty-schedule">Nicio sesiune programată pentru astăzi.</div>';
            return;
        }
        
        container.innerHTML = schedule.map(event => {
            const endTime = calculateEndTime(event.startTime, event.duration);
            const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
            const clientNames = clientIds.map(id => {
                const client = calendarState.getClientById(id);
                return client ? client.name : 'Fără client';
            }).join(', ');
            
            return `
            <div class="schedule-item clickable-schedule-item" data-event-id="${event.id}">
                <div class="schedule-time">${event.startTime} - ${endTime}</div>
                    <div class="schedule-details">
                        <div class="schedule-title">${event.name}</div>
                        <div class="schedule-client">cu ${clientNames || 'Fără client'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Update dashboard stats for current user
 */
function updateDashboardStats() {
    const stats = auth.getUserStats();
    
    const totalSessionsEl = $('statTotalSessions');
    const attendanceEl = $('statAttendance');
    const pendingReportsEl = $('statPendingReports');
    
    if (totalSessionsEl) totalSessionsEl.textContent = stats.totalSessions;
    if (attendanceEl) attendanceEl.textContent = stats.attendance + '%';
    if (pendingReportsEl) pendingReportsEl.textContent = stats.pendingReports;
}


/**
 * Adaugă informațiile despre utilizator în sidebar.
 */
function addUserInfoToHeader() {
    // 1. Găsește containerul din sidebar
    const container = $('sidebarUserBadgeContainer');
    if (!container) return;

    // 2. Curăță containerul
    container.innerHTML = '';

    // 3. Creează elementul badge
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info-badge';

    // 4. Aplică stiluri flex (fără fundal/padding, preluate de containerul HTML)
    userInfo.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; width: 100%;';

    // 5. Setează conținutul HTML (cu clase speciale pentru colapsare)
    userInfo.innerHTML = `
        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${currentUser.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">
            ${currentUser.initials}
        </div>
        <div class="sidebar-user-details" style="display: flex; flex-direction: column; align-items: flex-start; min-width: 0;">
            <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${currentUser.name}</span>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${getRoleLabel(currentUser.role)}</span>
        </div>
    `;

    // 6. Adaugă badge-ul în container
    container.appendChild(userInfo);
}

/**
 * Update permissions for UI elements
 */
function updatePermissions() {
    // All roles can add events, so no changes needed for add buttons
    // Permission checks will be done when editing/deleting events
}

/**
 * Helper function to get role label
 */
function getRoleLabel(role) {
    const roles = { 'therapist': 'Terapeut', 'coordinator': 'Coordonator', 'admin': 'Admin' };
    return roles[role] || role;
}

/**
 * Helper function to calculate end time
 */
function calculateEndTime(startTime, durationMinutes) {
    if (!startTime) return "N/A";
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + parseInt(durationMinutes, 10);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}


// --- Funcția de Inițializare ---

async function init() {
    console.log('Inițializare aplicație Tempo (modular)...');

    // === AUTHENTICATION CHECK - ADD THIS BLOCK ===
    try {
        const data = await api.loadData();
        calendarState.initializeData(data);
        
        // Initialize authentication
        currentUser = auth.initAuth();
        if (!currentUser) {
            return; // Will redirect to select-user.html
        }
        
        console.log('User logged in:', currentUser.name, '-', currentUser.role);
        
        // Update UI with user info
        updateUserInterface();

        // NOU: Setează restricțiile de UI pe bază de rol
        setupRolePermissions();

        if (!auth.isAdmin()) {
        // Ascunde link-ul de Facturare din sidebar
        const billingLink = document.querySelector('.menu-item[data-view="billing"]');
        if (billingLink) {
            billingLink.style.display = 'none';
        }
        
        // Ascunde fizic secțiunea de Facturare
        if (dom.billingSection) {
            dom.billingSection.style.display = 'none';
        }
        
        // Ascunde link-ul de Tipuri Evenimente din sidebar
        const eventTypesLink = document.querySelector('.menu-item[data-view="eventTypes"]');
        if (eventTypesLink) {
            eventTypesLink.style.display = 'none';
        }
        
        // Ascunde fizic secțiunea de Tipuri Evenimente
        if (dom.eventTypesSection) {
            dom.eventTypesSection.style.display = 'none';
        }
    }
        
    } catch (error) {
        console.error('Eroare critică la încărcarea datelor:', error);
        ui.showCustomAlert('Nu s-au putut încărca datele.', 'Eroare fatală');
        return;
    }
    // === END AUTHENTICATION BLOCK ===
    
    calendarState.setIsAdminView(true);

    try {
        // const data = await api.loadData(); // Deja încărcat mai sus
        // calendarState.initializeData(data); // Deja inițializat mai sus
        const programsData = await api.loadPrograms();
        calendarState.setPrograms(programsData.programs);
        
        // Încărcare tipuri de evenimente
        const eventTypes = await api.loadEventTypes();
        calendarState.setEventTypes(eventTypes); // Salvează în state
        populateEventTypeDropdown(eventTypes); // Populează dropdown-ul
        
        const evolutionData = await api.loadEvolutionData();
        calendarState.setEvolutionData(evolutionData);

        // Încărcare date facturare
    try {
        const billingsData = await api.loadBillingsData();
        calendarState.setBillingsData(billingsData);
    } catch (e) {
        console.warn('Nu s-au putut încărca datele de facturare.', e);
        calendarState.setBillingsData({}); // Inițializează ca gol
    }

    // Încărcare praguri de discount
    try {
        const discountThresholds = await api.loadDiscountThresholds();
        calendarState.setDiscountThresholds(discountThresholds);
    } catch (e) {
        console.warn('Nu s-au putut încărca pragurile de discount.', e);
        calendarState.setDiscountThresholds([]); // Inițializează ca array gol
    }


    } catch (error) {
        console.error('Eroare critică la încărcarea datelor:', error);
        ui.showCustomAlert('Nu s-au putut încărca datele.', 'Eroare fatală');
        return;
    }

    // --- Atașare Listeners (with null checks) ---
    
    // Navigare Principală
    dom.sidebarLinks.forEach(link => link.addEventListener('click', handleMainViewNavigation));
    
    // UI (Temă & Fullscreen & Sidebar Toggle)
    initThemeToggle();
    initFullscreenToggle();

    const refreshButtons = document.querySelectorAll('.btn-refresh-data');
    if (refreshButtons.length > 0) {
        refreshButtons.forEach(btn => {
            btn.addEventListener('click', forceRefreshData);
        });
    }
    

    // Logout (with null checks)
    if (dom.sidebarLogoutBtn) {
        dom.sidebarLogoutBtn.addEventListener('click', auth.logout);
    }

    const toggleMobileMenu = () => {
        if (dom.sidebar) dom.sidebar.classList.toggle('mobile-active');
        if (dom.mobileMenuBackdrop) dom.mobileMenuBackdrop.classList.toggle('active');
    };

    if (dom.mobileMenuToggles.length > 0) {
        dom.mobileMenuToggles.forEach(btn => {
            btn.addEventListener('click', toggleMobileMenu);
        });
    }
    if (dom.mobileMenuBackdrop) {
        dom.mobileMenuBackdrop.addEventListener('click', toggleMobileMenu);
    }
    // Închide meniul și când se dă click pe un link din interior
    if (dom.sidebar) {
        dom.sidebar.addEventListener('click', (e) => {
            if (e.target.closest('a') && dom.sidebar.classList.contains('mobile-active')) {
                toggleMobileMenu();
            }
        });
    }

    // Navigare Calendar (with null checks)
    if (dom.prevBtn) dom.prevBtn.addEventListener('click', () => handleNavigation(-1));
    if (dom.nextBtn) dom.nextBtn.addEventListener('click', () => handleNavigation(1));
    if (dom.todayBtn) dom.todayBtn.addEventListener('click', navigateToToday);
    dom.viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    if (dom.addEventBtn) dom.addEventBtn.addEventListener('click', () => ui.openEventModal(null));
    if (dom.addEventBtnCalendar) dom.addEventBtnCalendar.addEventListener('click', () => ui.openEventModal(null));

    // Listener pentru noul filtru de client
    if (dom.calendarClientFilter) {
        dom.calendarClientFilter.addEventListener('change', (e) => {
            const clientId = e.target.value;
            calendarState.setClientFilter(clientId); // Setează filtrul în state
            render(); // Re-randează calendarul
        });
    }

    // Clone Month functionality
    if (dom.cloneMonthBtn) {
        dom.cloneMonthBtn.addEventListener('click', () => {
            // Check if user is admin
            if (!auth.isAdmin()) {
                ui.showCustomAlert('Doar administratorii pot clona programe lunare.', 'Acces Restricționat');
                return;
            }

            // Show the clone modal
            if (dom.cloneMonthModal) {
                // Set default values (current month as source)
                const { currentDate } = calendarState.getState();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                dom.cloneSourceMonth.value = `${year}-${month}`;

                dom.cloneMonthModal.classList.add('active');
            }
        });
    }

    // Close clone month modal
    if (dom.closeCloneMonthModal) {
        dom.closeCloneMonthModal.addEventListener('click', () => {
            if (dom.cloneMonthModal) dom.cloneMonthModal.classList.remove('active');
        });
    }

    // Cancel clone month
    if (dom.cloneMonthCancel) {
        dom.cloneMonthCancel.addEventListener('click', () => {
            if (dom.cloneMonthModal) dom.cloneMonthModal.classList.remove('active');
        });
    }

    // Confirm clone month
    if (dom.cloneMonthConfirm) {
        dom.cloneMonthConfirm.addEventListener('click', async () => {
            const sourceMonth = dom.cloneSourceMonth.value;
            const targetMonth = dom.cloneTargetMonth.value;

            // Validation
            if (!sourceMonth || !targetMonth) {
                ui.showCustomAlert('Te rog selectează ambele luni.', 'Date Incomplete');
                return;
            }

            if (sourceMonth === targetMonth) {
                ui.showCustomAlert('Luna sursă și luna țintă trebuie să fie diferite.', 'Date Invalide');
                return;
            }

            // Check for overlapping events using the same weekday-based logic
            const { events } = calendarState.getState();

            // Get source month events
            const sourceMonthEvents = events.filter(event => {
                return event.date && event.date.startsWith(sourceMonth + '-');
            });

            // Get target month events
            const targetMonthEvents = events.filter(event => {
                return event.date && event.date.startsWith(targetMonth + '-');
            });

            if (targetMonthEvents.length > 0 && sourceMonthEvents.length > 0) {
                // Calculate where source events would be copied to
                const [sourceYear, sourceMonthNum] = sourceMonth.split('-').map(Number);
                const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);

                const sourceDate = new Date(sourceYear, sourceMonthNum - 1, 1);
                const targetDate = new Date(targetYear, targetMonthNum - 1, 1);

                let overlappingCount = 0;
                const overlappingDetails = [];

                for (const sourceEvent of sourceMonthEvents) {
                    // Calculate target date using same logic as backend
                    const oldDate = new Date(sourceEvent.date);
                    const dayOfWeek = oldDate.getDay();
                    const dayOfMonth = oldDate.getDate();
                    const weekOccurrence = Math.ceil(dayOfMonth / 7);

                    // Find same weekday occurrence in target month
                    let newDate = new Date(targetYear, targetMonthNum - 1, 1);
                    const targetDayOfWeek = newDate.getDay();
                    const daysToAdd = (dayOfWeek - targetDayOfWeek + 7) % 7;
                    newDate.setDate(newDate.getDate() + daysToAdd);
                    newDate.setDate(newDate.getDate() + (weekOccurrence - 1) * 7);

                    // Check if we're still in target month
                    if (newDate.getMonth() !== targetMonthNum - 1) {
                        newDate.setDate(newDate.getDate() - 7);
                    }

                    const targetDateStr = newDate.toISOString().split('T')[0];

                    // Check if any event exists at this date/time in target month
                    const conflictingEvent = targetMonthEvents.find(e =>
                        e.date === targetDateStr &&
                        e.startTime === sourceEvent.startTime
                    );

                    if (conflictingEvent) {
                        overlappingCount++;
                        if (overlappingDetails.length < 5) { // Show max 5 examples
                            overlappingDetails.push({
                                date: targetDateStr,
                                time: sourceEvent.startTime,
                                sourceName: sourceEvent.name,
                                targetName: conflictingEvent.name
                            });
                        }
                    }
                }

                if (overlappingCount > 0) {
                    let warningMessage = `⚠️ ATENȚIE! Conflict de evenimente!\n\n`;
                    warningMessage += `Găsite ${overlappingCount} suprapuneri de evenimente între ${sourceMonth} și ${targetMonth}.\n\n`;
                    warningMessage += `Exemple de conflicte:\n`;

                    overlappingDetails.forEach(detail => {
                        warningMessage += `• ${detail.date} la ${detail.time}: "${detail.sourceName}" → "${detail.targetName}" (existent)\n`;
                    });

                    if (overlappingCount > overlappingDetails.length) {
                        warningMessage += `... și încă ${overlappingCount - overlappingDetails.length} suprapuneri.\n`;
                    }

                    warningMessage += `\nClonarea va adăuga evenimente duplicate.\n\nVrei să continui oricum?`;

                    const continueWithOverlap = await ui.showCustomConfirm(warningMessage, 'Conflict de Evenimente');
                    if (!continueWithOverlap) {
                        return;
                    }
                }
            }

            // Confirm action
            const confirmMessage = `Vrei să clonezi programul din ${sourceMonth} în ${targetMonth}?\n\nAceastă acțiune va copia toate evenimentele din luna sursă în luna țintă.`;

            const confirmed = await ui.showCustomConfirm(confirmMessage, 'Confirmare Clonare');
            if (!confirmed) {
                return;
            }

            try {
                // Call the API
                const result = await api.cloneMonthSchedule(sourceMonth, targetMonth);

                if (result.success) {
                    // Close modal
                    if (dom.cloneMonthModal) dom.cloneMonthModal.classList.remove('active');

                    // Show success message
                    ui.showCustomAlert(
                        `Programul a fost clonat cu succes!\n\n${result.clonedCount} evenimente au fost copiate din ${sourceMonth} în ${targetMonth}.`,
                        'Succes'
                    );

                    // Reload data and refresh view
                    const data = await api.loadData();
                    calendarState.initializeData(data);
                    render();
                } else {
                    ui.showCustomAlert('Eroare la clonarea programului: ' + (result.message || 'Eroare necunoscută'), 'Eroare');
                }
            } catch (error) {
                console.error('Eroare la clonarea programului:', error);
                ui.showCustomAlert(
                    'Eroare la clonarea programului: ' + (error.message || 'Eroare necunoscută'),
                    'Eroare'
                );
            }
        });
    }

    // Clear month button
    if (dom.clearMonthBtn) {
        dom.clearMonthBtn.addEventListener('click', async () => {
            const month = dom.clearMonth.value;

            // Validation
            if (!month) {
                ui.showCustomAlert('Te rog selectează o lună.', 'Date Incomplete');
                return;
            }

            // Check if user is admin
            if (!auth.isAdmin()) {
                ui.showCustomAlert('Doar administratorii pot șterge luni întregi.', 'Acces Restricționat');
                return;
            }

            // Count events in the month
            const { events } = calendarState.getState();
            const monthEvents = events.filter(event => {
                return event.date && event.date.startsWith(month + '-');
            });

            if (monthEvents.length === 0) {
                ui.showCustomAlert(`Luna ${month} nu conține evenimente.`, 'Informație');
                return;
            }

            // Double confirmation for destructive action
            const confirmMessage = `⚠️ ATENȚIE! ACȚIUNE IREVERSIBILĂ!\n\nEști pe cale să ștergi TOATE cele ${monthEvents.length} evenimente din ${month}.\n\nAceastă acțiune NU poate fi anulată!\n\nEști absolut sigur că vrei să continui?`;

            const firstConfirm = await ui.showCustomConfirm(confirmMessage, 'Atenție: Acțiune Ireversibilă');
            if (!firstConfirm) {
                return;
            }

            // Second confirmation
            const finalConfirm = await ui.showCustomConfirm('Ultima confirmare: Ștergi toate evenimentele?', 'Confirmare Finală');
            if (!finalConfirm) {
                return;
            }

            try {
                // Call the API
                const result = await api.clearMonth(month);

                if (result.success) {
                    // Close modal
                    if (dom.cloneMonthModal) dom.cloneMonthModal.classList.remove('active');

                    // Show success message
                    ui.showCustomAlert(
                        `Luna ${month} a fost ștearsă cu succes!\n\n${result.deletedCount} evenimente au fost eliminate.`,
                        'Succes'
                    );

                    // Reload data and refresh view
                    const data = await api.loadData();
                    calendarState.initializeData(data);
                    render();
                } else {
                    ui.showCustomAlert('Eroare la ștergerea lunii: ' + (result.message || 'Eroare necunoscută'), 'Eroare');
                }
            } catch (error) {
                console.error('Eroare la ștergerea lunii:', error);
                ui.showCustomAlert(
                    'Eroare la ștergerea lunii: ' + (error.message || 'Eroare necunoscută'),
                    'Eroare'
                );
            }
        });
    }

    // Modal Evenimente (Adăugare/Editare) (with null checks)
    if (dom.closeModalBtn) dom.closeModalBtn.addEventListener('click', ui.closeEventModal);
    if (dom.cancelModalBtn) dom.cancelModalBtn.addEventListener('click', ui.closeEventModal);
    if (dom.eventForm) dom.eventForm.addEventListener('submit', handleSaveEvent);
    if (dom.deleteEventBtn) dom.deleteEventBtn.addEventListener('click', handleDeleteEvent);

    // Modal Detalii Eveniment (with null checks)
    if (dom.closeEventDetailsModalBtn) dom.closeEventDetailsModalBtn.addEventListener('click', ui.closeEventDetailsModal);
    if (dom.closeEventDetailsBtn) dom.closeEventDetailsBtn.addEventListener('click', ui.closeEventDetailsModal);
    if (dom.editEventFromDetailsBtn) dom.editEventFromDetailsBtn.addEventListener('click', () => ui.editEventFromDetails());
    if (dom.deleteEventFromDetailsBtn) dom.deleteEventFromDetailsBtn.addEventListener('click', () => ui.deleteEventFromDetails());

    // Secțiunea Echipă (with null checks)
    if (dom.teamMemberForm) dom.teamMemberForm.addEventListener('submit', handleSaveTeamMember);
    if (dom.deleteMemberBtn) dom.deleteMemberBtn.addEventListener('click', handleDeleteTeamMember);
    if (dom.cancelMemberBtn) dom.cancelMemberBtn.addEventListener('click', ui.resetTeamForm);
    if (dom.addNewTeamMemberBtn) {
        dom.addNewTeamMemberBtn.addEventListener('click', () => {
            if (dom.teamMemberForm) dom.teamMemberForm.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Secțiunea Client (with null checks)
    if (dom.clientForm) dom.clientForm.addEventListener('submit', handleSaveClient);
    if (dom.deleteClientBtn) dom.deleteClientBtn.addEventListener('click', handleDeleteClient);
    if (dom.cancelClientBtn) dom.cancelClientBtn.addEventListener('click', ui.resetClientForm);
    if (dom.addNewClientBtn) {
        dom.addNewClientBtn.addEventListener('click', () => {
            if (dom.clientForm) dom.clientForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (dom.clientSearchBar) dom.clientSearchBar.addEventListener('input', (e) => ui.renderClientsList(e.target.value));

    // Câmpuri Modal Evenimente (with null checks)
    if (dom.clientSearch) dom.clientSearch.addEventListener('input', (e) => ui.filterClientsInModal(e.target.value));
    if (dom.programSearch) dom.programSearch.addEventListener('input', (e) => ui.filterProgramsInModal(e.target.value));
    if (dom.eventTypeSelect) {
        dom.eventTypeSelect.addEventListener('change', (e) => {
            ui.updateEventTypeDependencies(e.target.value);
            ui.updateEventTitle();
        });
    }
    
    // Acțiuni pe carduri (Clienti/Echipa)
    setupAdminListeners();

    // --- Adaugă listener pentru click pe programul zilei ---
    const dashboardScheduleContainer = $('dashboardTodaySchedule');
    if (dashboardScheduleContainer) {
        dashboardScheduleContainer.addEventListener('click', (e) => {
            const scheduleItem = e.target.closest('.clickable-schedule-item');
            if (scheduleItem && scheduleItem.dataset.eventId) {
                // Folosim funcția existentă care include deja verificările de permisiuni
                ui.showEventDetails(scheduleItem.dataset.eventId);
            }
        });
    }
    

    // Inițializează serviciul de facturare
    if (auth.isAdmin()) {
        billing.init();
        eventTypesService.init(); // Initialize event types management
    }
    // --- Randare Inițială ---
    populateClientFilterDropdown(); // Populează dropdown-ul de clienți
    renderFilters();
    render();
    
    // Randează listele o singură dată la încărcare
    ui.renderClientsList('');
    ui.renderTeamMembersList();

    // --- Adaugă ascultători pentru sincronizarea culorilor (with null checks) ---
    const memberColorPicker = $('memberColor');
    const memberColorHex = $('memberColorHex');

    if (memberColorPicker && memberColorHex) {
        // Sincronizează HEX când se schimbă culoarea din picker
        memberColorPicker.addEventListener('input', (e) => {
            memberColorHex.value = e.target.value.toUpperCase();
        });

        // Sincronizează picker-ul când se tastează în HEX
        memberColorHex.addEventListener('input', (e) => {
            // Verifică sumar dacă e un cod hex valid pentru a nu strica picker-ul
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                memberColorPicker.value = e.target.value;
            }
        });
    }
    
    console.log('Inițializare completă!');
}

// --- Pornirea Aplicației ---
document.addEventListener('DOMContentLoaded', init);