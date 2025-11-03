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

// --- Variabile DOM Globale ---
const $ = (id) => document.getElementById(id);
const dom = {
    // Container principal
    appContainer: $('appContainer'),

    // Navigare Sidebar
    sidebarLinks: document.querySelectorAll('.sidebar-menu .menu-item'),
    sidebarToggle: $('sidebarToggle'),
    
    // Secțiuni Principale
    calendarSection: $('calendarSection'),
    clientSection: $('clientSection'),
    teamSection: $('teamSection'),
    dashboardSection: $('dashboardSection'),
    
    // Calendar
    currentPeriod: $('currentPeriod'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    todayBtn: $('todayBtn'),
    viewBtns: document.querySelectorAll('.view-btn'),
    filtersContainer: $('filters'),
    addEventBtn: $('addEventBtn'),
    addEventBtnCalendar: $('addEventBtnCalendar'),
    
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
    
    return `${firstName}_${dateSuffix}`;
}

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
    }
}


// --- Funcția Principală de Randare (Calendar) ---

function render() {
    const { currentDate, currentView } = calendarState.getState();
    updateCurrentPeriodLabel(currentDate, currentView);

    if (currentView === 'month') {
        view.renderMonthView(handleDayClick);
    } else if (currentView === 'week') {
        view.renderWeekView(handleEventClick);
    } else if (currentView === 'day') {
        view.renderDayView(handleEventClick);
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

     // === ADD PERMISSION CHECK FOR EDITING ===
    if (editingEventId) {
        const existingEvent = calendarState.getEventById(editingEventId);
        if (!auth.canModifyEvent(existingEvent)) {
            auth.showPermissionDenied('editați acest eveniment');
            return;
        }
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
        if (formData.has(id)) repeatingDays.push(index + 1);
    });
    
    const eventType = formData.get('eventType');
    let startTime = formData.get('startTime');
    let duration = parseInt(formData.get('duration'));

    if (eventType === 'day-off' || eventType === 'pauza-masa' || eventType === 'sedinta') {
        if (!startTime) startTime = '08:00';
        if (!duration || isNaN(duration)) duration = 60;
    }
    if ((eventType !== 'day-off') && (!startTime || isNaN(duration))) {
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
        repeating: repeatingDays
    };

    if (editingEventId) {
        const existingEvent = calendarState.getEventById(editingEventId);
        const updatedEvent = { ...existingEvent, ...eventBase, id: editingEventId };
        calendarState.saveEvent(updatedEvent);
    } else {
        if (repeatingDays.length > 0) {
            const newEvents = createRecurringEvents(eventBase);
            calendarState.saveEvent(newEvents);
        } else {
            const newEvent = { ...eventBase, id: generateEventId() };
            calendarState.saveEvent(newEvent);
        }
    }
    
    await api.saveData(calendarState.getState());
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
        const criteria = {
            name: event.name,
            teamMemberIds: event.teamMemberIds || [event.teamMemberId],
            startTime: event.startTime,
            duration: event.duration,
            repeating: event.repeating
        };
        calendarState.deleteRecurringEvents(criteria);
    } else {
        calendarState.deleteEvent(editingEventId);
    }

    await api.saveData(calendarState.getState());
    
    ui.closeEventModal();
    ui.closeEventDetailsModal();
    render();
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
        birthDate: formData.get('clientBirthdayInput') || null
    };

    calendarState.saveClient(clientData);
    await api.saveData(calendarState.getState());

    // logs saving activity
    window.logActivity(editingClientId ? "Client actualizat" : "Client adăugat", clientData.name, 'generic', clientData.id);
    
    ui.renderClientsList(dom.clientSearchBar.value);
    ui.resetClientForm();
}

async function handleDeleteClient() {
    const { editingClientId } = calendarState.getState();
    if (!editingClientId) return;

    const confirmed = await ui.showCustomConfirm('Ești sigur că vrei să ștergi acest client? Acțiunile sunt ireversibile.', 'Șterge Client');
    if (confirmed) {
        calendarState.deleteClient(editingClientId);
        await api.saveData(calendarState.getState());
        ui.renderClientsList(dom.clientSearchBar.value);
        ui.resetClientForm();
    }
}

async function handleSaveTeamMember(e) {
    e.preventDefault();
    const { editingMemberId } = calendarState.getState();
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

function createRecurringEvents(eventBase) {
    const events = [];
    const parts = eventBase.date.split('-');
    const startDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    let currentDate = new Date(startDate);
    while (currentDate <= endOfMonth) {
        const dayOfWeek = currentDate.getDay();
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        if (eventBase.repeating.includes(adjustedDay)) {
            events.push({ ...eventBase, id: generateEventId(), date: formatDate(currentDate, 'iso') });
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
function updateDashboardSchedule() {
    const container = $('dashboardTodaySchedule');
    if (!container) return;
    
    const schedule = auth.getTodaysSchedule();
    
    if (schedule.length === 0) {
        container.innerHTML = '<div class="empty-schedule">Nicio sesiune programată pentru astăzi.</div>';
        return;
    }
    
    container.innerHTML = schedule.map(event => {
        const endTime = calculateEndTime(event.startTime, event.duration);
        const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
        const clientNames = clientIds.map(id => {
            const client = calendarState.getClientById(id);
            return client ? client.name : 'Client necunoscut';
        }).join(', ');
        
        return `
            <div class="schedule-item">
                <div class="schedule-time">${event.startTime} - ${endTime}</div>
                <div class="schedule-details">
                    <div class="schedule-title">${event.name}</div>
                    <div class="schedule-client">cu ${clientNames || 'Fără client'}</div>
                </div>
            </div>
        `;
    }).join('');
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
 * Add user info to header
 */
function addUserInfoToHeader() {
    const headers = document.querySelectorAll('.section-header, .main-header');
    headers.forEach(header => {
        const existing = header.querySelector('.user-info-badge');
        if (existing) existing.remove();
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info-badge';
        userInfo.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; background: var(--bg-hover); border-radius: 0.5rem; border: 1px solid var(--border-color);';
        userInfo.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${currentUser.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem;">
                ${currentUser.initials}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${currentUser.name}</span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${getRoleLabel(currentUser.role)}</span>
            </div>
        `;
        
        const actionsDiv = header.querySelector('.header-actions');
        if (actionsDiv) {
            actionsDiv.insertBefore(userInfo, actionsDiv.firstChild);
        }
    });
    
   
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
    const totalMinutes = (hours * 60) + minutes + durationMinutes;
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
        
    } catch (error) {
        console.error('Eroare critică la încărcarea datelor:', error);
        ui.showCustomAlert('Nu s-au putut încărca datele.', 'Eroare fatală');
        return;
    }
    // === END AUTHENTICATION BLOCK ===
    
    calendarState.setIsAdminView(true);

    try {
        const data = await api.loadData();
        calendarState.initializeData(data);
        const programsData = await api.loadPrograms();
        calendarState.setPrograms(programsData.programs);
        const evolutionData = await api.loadEvolutionData();
        calendarState.setEvolutionData(evolutionData);
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

    if (dom.sidebarToggle && dom.appContainer) {
        dom.sidebarToggle.addEventListener('click', () => {
            dom.appContainer.classList.toggle('sidebar-collapsed');
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
    
    // --- Randare Inițială ---
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