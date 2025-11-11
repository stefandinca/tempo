/**
 * js/main.js
 * Punctul principal de intrare (entry point) al aplicației.
 */

// --- Importarea Modulelor ---
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
    
    // Calendar
    currentPeriod: $('currentPeriod'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    todayBtn: $('todayBtn'),
    viewBtns: document.querySelectorAll('.view-btn'),
    filtersContainer: $('filters'),
    addEventBtn: $('addEventBtn'),
    
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
    logoutBtn: $('logoutBtn'),
};

// --- Navigare Principală (Tab-uri) ---

/**
 * Gestionează comutarea între secțiunile principale: Calendar, Clienti, Echipa.
 * @param {Event} e Evenimentul de click de la link-ul din sidebar.
 */
function handleMainViewNavigation(e) {
    e.preventDefault();
    const menuItem = e.currentTarget.closest('.menu-item');
    if (!menuItem) return;

    const viewName = menuItem.dataset.view;
    if (!viewName) return;

    // 1. Ascunde toate secțiunile și butoanele
    document.querySelectorAll('.main-section').forEach(s => s.classList.remove('active'));
    dom.sidebarLinks.forEach(link => link.classList.remove('active'));

    // 2. Arată secțiunea și butonul corect
    const section = $(`${viewName}Section`);
    if (section) {
        section.classList.add('active');
        menuItem.classList.add('active');
    }
    
    // 3. Logica de lazy-loading a fost eliminată. Listele sunt acum randate la inițializare.
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
    if (dom.currentPeriod) dom.currentPeriod.textContent = label;
}

function renderFilters() {
    const { teamMembers, activeFilters } = calendarState.getState();
    if (!dom.filtersContainer) return;

    dom.filtersContainer.innerHTML = '';
    teamMembers.forEach(member => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.style.color = member.color;
        if (activeFilters.includes(member.id)) chip.classList.add('active');
        
        chip.innerHTML = `<span class="color-dot" style="background-color: ${member.color}"></span><span>${member.name}</span>`;
        
        chip.addEventListener('click', () => {
            calendarState.toggleFilter(member.id);
            renderFilters();
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

// --- Logout Handler ---

async function handleLogout() {
    try {
        const response = await fetch('auth.php?action=logout', {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            window.location.href = 'login.html';
        } else {
            console.error('Logout failed:', data.message);
            // Redirect anyway for safety
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Redirect anyway for safety
        window.location.href = 'login.html';
    }
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
    document.querySelector('[data-view="day"]').classList.add('active');
    render();
}

function handleEventClick(eventId) {
    ui.showEventDetails(eventId);
}

// --- Handlers Modal Evenimente (Adăugare/Editare) ---

async function handleSaveEvent(e) {
    e.preventDefault();
    const { editingEventId } = calendarState.getState();
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
    ui.closeEventModal();
    render();
}

async function handleDeleteEvent() {
    const { editingEventId } = calendarState.getState();
    if (!editingEventId) return;

    const event = calendarState.getEventById(editingEventId);
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
    
    const clientData = {
        id: editingClientId || `client_${Date.now()}`,
        name: formData.get('clientFullName'),
        email: formData.get('clientEmail'),
        phone: formData.get('clientPhone'),
        birthDate: formData.get('clientBirthdayInput') || null
    };

    calendarState.saveClient(clientData);
    await api.saveData(calendarState.getState());
    
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
    
    // Secțiunea Echipă
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

// --- Funcția de Inițializare ---

async function init() {
    console.log('Inițializare aplicație Tempo (modular)...');
    
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

    // --- Atașare Listeners ---
    
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

    // Logout button
    if (dom.logoutBtn) {
        dom.logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigare Calendar
    dom.prevBtn.addEventListener('click', () => handleNavigation(-1));
    dom.nextBtn.addEventListener('click', () => handleNavigation(1));
    dom.todayBtn.addEventListener('click', navigateToToday);
    dom.viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    dom.addEventBtn.addEventListener('click', () => ui.openEventModal(null));

    // Modal Evenimente (Adăugare/Editare)
    dom.closeModalBtn.addEventListener('click', ui.closeEventModal);
    dom.cancelModalBtn.addEventListener('click', ui.closeEventModal);
    dom.eventForm.addEventListener('submit', handleSaveEvent);
    dom.deleteEventBtn.addEventListener('click', handleDeleteEvent);

    // Modal Detalii Eveniment
    dom.closeEventDetailsModalBtn.addEventListener('click', ui.closeEventDetailsModal);
    dom.closeEventDetailsBtn.addEventListener('click', ui.closeEventDetailsModal);
    dom.editEventFromDetailsBtn.addEventListener('click', () => ui.editEventFromDetails());
    dom.deleteEventFromDetailsBtn.addEventListener('click', () => ui.deleteEventFromDetails());

    // Secțiunea Echipă
    dom.teamMemberForm.addEventListener('submit', handleSaveTeamMember);
    dom.deleteMemberBtn.addEventListener('click', handleDeleteTeamMember);
    dom.cancelMemberBtn.addEventListener('click', ui.resetTeamForm);
    dom.addNewTeamMemberBtn.addEventListener('click', () => dom.teamMemberForm.scrollIntoView({ behavior: 'smooth' }));

    // Secțiunea Client
    dom.clientForm.addEventListener('submit', handleSaveClient);
    dom.deleteClientBtn.addEventListener('click', handleDeleteClient);
    dom.cancelClientBtn.addEventListener('click', ui.resetClientForm);
    dom.addNewClientBtn.addEventListener('click', () => dom.clientForm.scrollIntoView({ behavior: 'smooth' }));
    dom.clientSearchBar.addEventListener('input', (e) => ui.renderClientsList(e.target.value));

    // Câmpuri Modal Evenimente
    dom.clientSearch.addEventListener('input', (e) => ui.filterClientsInModal(e.target.value));
    dom.programSearch.addEventListener('input', (e) => ui.filterProgramsInModal(e.target.value));
    dom.eventTypeSelect.addEventListener('change', (e) => {
        ui.updateEventTypeDependencies(e.target.value);
        ui.updateEventTitle();
    });
    
    // Acțiuni pe carduri (Clienti/Echipa)
    setupAdminListeners();
    
    // --- Randare Inițială ---
    renderFilters();
    render();
    
    // **CORECTIA ESTE AICI:**
    // Randează listele o singură dată la încărcare
    ui.renderClientsList('');
    ui.renderTeamMembersList();
}

// --- Pornirea Aplicației ---
document.addEventListener('DOMContentLoaded', init);