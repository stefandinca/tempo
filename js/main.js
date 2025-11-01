/**
 * js/main.js
 *
 * Punctul principal de intrare (entry point) al aplicației.
 * Conectează toate modulele și gestionează fluxul principal de date și evenimente.
 */

// --- Importarea Modulelor ---
import * as api from './apiService.js';
import { calendarState } from './calendarState.js';
import * as ui from './uiService.js';
import * as view from './calendarView.js';

// --- Variabile DOM Globale ---
// Stocăm referințele la elementele DOM frecvent utilizate
const dom = {
    currentPeriod: document.getElementById('currentPeriod'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    todayBtn: document.getElementById('todayBtn'),
    viewBtns: document.querySelectorAll('.view-btn'),
    filtersContainer: document.getElementById('filters'),
    
    // Modale și Butoane
    addEventBtn: document.getElementById('addEventBtn'),
    closeModalBtn: document.getElementById('closeModal'),
    cancelModalBtn: document.getElementById('cancelBtn'),
    eventForm: document.getElementById('eventForm'),
    deleteEventBtn: document.getElementById('deleteBtn'),
    
    // Câmpuri din Modalul de Evenimente
    eventTypeSelect: document.getElementById('eventType'),
    clientSearch: document.getElementById('clientSearch'),
    programSearch: document.getElementById('programSearch'),
    
    // Butoane Admin
    manageTeamBtn: document.getElementById('manageTeamBtn'),
    manageClientsBtn: document.getElementById('manageClientsBtn'),
};

// --- Funcția Principală de Randare ---

/**
 * Funcția centrală de randare.
 * Actualizează eticheta perioadei și desenează vizualizarea calendarului.
 */
function render() {
    const { currentDate, currentView } = calendarState.getState();

    // 1. Actualizează eticheta perioadei curente (ex. "Noiembrie 2025")
    updateCurrentPeriodLabel(currentDate, currentView);

    // 2. Apelează funcția de randare corespunzătoare din calendarView
    if (currentView === 'month') {
        view.renderMonthView(handleDayClick);
    } else if (currentView === 'week') {
        view.renderWeekView(handleEventClick);
    } else if (currentView === 'day') {
        view.renderDayView(handleEventClick);
    }
}

/**
 * Actualizează textul pentru #currentPeriod.
 */
function updateCurrentPeriodLabel(date, view) {
    let label = '';
    if (view === 'month') {
        label = date.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
        const weekStart = getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        label = `${formatDate(weekStart, 'short')} - ${formatDate(weekEnd, 'short')}`;
    } else if (view === 'day') {
        label = date.toLocaleString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (dom.currentPeriod) dom.currentPeriod.textContent = label;
}

// --- Randare Componente UI Auxiliare ---

/**
 * Randează chip-urile de filtrare pentru membrii echipei.
 */
function renderFilters() {
    const { teamMembers, activeFilters } = calendarState.getState();
    if (!dom.filtersContainer) return;

    dom.filtersContainer.innerHTML = '';
    
    teamMembers.forEach(member => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.style.color = member.color;
        if (activeFilters.includes(member.id)) {
            chip.classList.add('active');
        }
        
        chip.innerHTML = `
            <span class="color-dot" style="background-color: ${member.color}"></span>
            <span>${member.name}</span>
        `;
        
        // Adaugă event listener pentru a comuta filtrul
        chip.addEventListener('click', () => {
            calendarState.toggleFilter(member.id);
            renderFilters(); // Re-randează filtrele
            render(); // Re-randează calendarul
        });
        
        dom.filtersContainer.appendChild(chip);
    });
}

// --- Gestionarea Evenimentelor (Handlers) ---

/**
 * Navighează calendarul (înainte, înapoi).
 */
function handleNavigation(direction) {
    const { currentDate, currentView } = calendarState.getState();
    const newDate = new Date(currentDate);

    if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
    } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() + (7 * direction));
    } else if (currentView === 'day') {
        newDate.setDate(newDate.getDate() + direction);
    }
    
    calendarState.setCurrentDate(newDate);
    render();
}

/**
 * Navighează la data curentă.
 */
function navigateToToday() {
    calendarState.setCurrentDate(new Date());
    render();
}

/**
 * Schimbă vizualizarea (lună, săptămână, zi).
 */
function handleViewChange(e) {
    const newView = e.target.dataset.view;
    if (newView) {
        calendarState.setCurrentView(newView);
        dom.viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        render();
    }
}

/**
 * Apelat când se dă click pe o zi (în vizualizarea lunară).
 * Trece la vizualizarea zilnică pentru acea zi.
 */
function handleDayClick(date) {
    calendarState.setCurrentDate(date);
    calendarState.setCurrentView('day');
    
    // Actualizează butoanele de vizualizare
    dom.viewBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-view="day"]').classList.add('active');
    
    render();
}

/**
 * Apelat când se dă click pe un eveniment (în vizualizarea săptămânală/zilnică).
 * Deschide modalul de detalii (pe care îl vom adăuga ulterior).
 */
function handleEventClick(eventId) {
    // TODO: Conectează la noul modal de detalii eveniment
    console.log('Event clicked:', eventId);
    // Deocamdată, deschidem modalul de editare (dacă suntem admin)
    const { isAdminView } = calendarState.getState();
    if (isAdminView) {
        ui.openEventModal(eventId);
    }
}

/**
 * Gestionează salvarea unui eveniment din modal.
 */
async function handleSaveEvent(e) {
    e.preventDefault();
    const { editingEventId } = calendarState.getState();
    const form = e.target;
    const formData = new FormData(form);

    const teamMemberIds = Array.from(formData.getAll('teamMemberCheckbox')); // Asigură-te că 'name' este corect în HTML
    const clientIds = Array.from(calendarState.getState().selectedClientIds);
    const programIds = Array.from(calendarState.getState().selectedProgramIds);
    
    // Obține zilele de recurență
    const repeatingDays = [];
    ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach((id, index) => {
        if (formData.has(id)) {
            repeatingDays.push(index + 1); // Luni=1
        }
    });
    
    const eventBase = {
        name: formData.get('eventName'),
        details: formData.get('eventDetails') || undefined,
        type: formData.get('eventType'),
        date: formData.get('eventDate'),
        startTime: formData.get('startTime') || '08:00', // Default
        duration: parseInt(formData.get('duration')) || 60, // Default
        isPublic: formData.has('isPublic'),
        isBillable: formData.has('isBillable'),
        teamMemberIds,
        clientIds: clientIds.length > 0 ? clientIds : undefined,
        programIds: programIds.length > 0 ? programIds : undefined,
        repeating: repeatingDays
    };

    if (editingEventId) {
        // --- Editare Eveniment ---
        const existingEvent = calendarState.getEventById(editingEventId);
        const updatedEvent = { ...existingEvent, ...eventBase, id: editingEventId };
        calendarState.saveEvent(updatedEvent);
        // TODO: Adaugă logica de actualizare a evenimentelor recurente
        
    } else {
        // --- Adăugare Eveniment Nou ---
        if (repeatingDays.length > 0) {
            // Caz recurent
            const newEvents = createRecurringEvents(eventBase);
            calendarState.saveEvent(newEvents);
        } else {
            // Caz unic
            const newEvent = { ...eventBase, id: generateEventId() };
            calendarState.saveEvent(newEvent);
        }
    }
    
    // Salvează pe server
    await api.saveData(calendarState.getState());
    
    ui.closeEventModal();
    render();
}

/**
 * Gestionează ștergerea unui eveniment din modal.
 */
async function handleDeleteEvent() {
    const { editingEventId } = calendarState.getState();
    if (!editingEventId) return;

    const event = calendarState.getEventById(editingEventId);
    let choice = 'single'; // Default

    if (event.repeating && event.repeating.length > 0) {
        choice = await ui.showRecurringDeleteModal();
    }
    
    if (choice === 'cancel') {
        return;
    }

    if (choice === 'all') {
        // Șterge toate evenimentele recurente
        const criteria = {
            name: event.name,
            teamMemberIds: event.teamMemberIds || [event.teamMemberId],
            startTime: event.startTime,
            duration: event.duration,
            repeating: event.repeating
        };
        calendarState.deleteRecurringEvents(criteria);
    } else {
        // Șterge doar evenimentul singular
        calendarState.deleteEvent(editingEventId);
    }

    // Salvează pe server
    await api.saveData(calendarState.getState());
    
    ui.closeEventModal();
    render();
}


// --- Funcții Helper pentru Evenimente ---

function createRecurringEvents(eventBase) {
    const events = [];
    const startDate = new Date(eventBase.date);
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    let currentDate = new Date(startDate);

    while (currentDate <= endOfMonth) {
        const dayOfWeek = currentDate.getDay(); // Duminică=0, Luni=1
        const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        if (eventBase.repeating.includes(adjustedDay)) {
            events.push({
                ...eventBase,
                id: generateEventId(),
                date: formatDate(currentDate, 'iso')
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return events;
}

function generateEventId() {
    return 'evt' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// --- Funcții Helper pentru Date ---

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date, format = 'short') {
    if (format === 'short') {
        return date.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' });
    } else if (format === 'iso') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return date.toLocaleDateString('ro-RO');
}

// --- Funcția de Inițializare ---

/**
 * Inițializează aplicația.
 */
async function init() {
    console.log('Inițializare aplicație Tempo...');
    
    // Setează modul admin (simplificat)
    const isAdmin = window.location.pathname.includes('admin.html');
    calendarState.setIsAdminView(isAdmin);

    // Încarcă datele
    try {
        const data = await api.loadData();
        calendarState.initializeData(data);
        
        // Încarcă datele auxiliare
        const programs = await api.loadPrograms();
        calendarState.setPrograms(programs.programs); // 'programs.json' are un array 'programs'
        
        const evolutionData = await api.loadEvolutionData();
        calendarState.setEvolutionData(evolutionData);
        
        // TODO: Încarcă datele Portrige dacă este necesar
        // await api.loadPortrigeData();

    } catch (error) {
        console.error('Eroare critică la încărcarea datelor:', error);
        ui.showCustomAlert('Nu s-au putut încărca datele. Te rog verifică conexiunea și reîmprospătează pagina.', 'Eroare fatală');
        return; // Oprește execuția
    }

    // Atașează event listeners
    dom.prevBtn.addEventListener('click', () => handleNavigation(-1));
    dom.nextBtn.addEventListener('click', () => handleNavigation(1));
    dom.todayBtn.addEventListener('click', navigateToToday);
    dom.viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));

    if (isAdmin) {
        // Listeners specifici pentru admin
        dom.addEventBtn.addEventListener('click', () => ui.openEventModal(null));
        dom.closeModalBtn.addEventListener('click', ui.closeEventModal);
        dom.cancelModalBtn.addEventListener('click', ui.closeEventModal);
        dom.eventForm.addEventListener('submit', handleSaveEvent);
        dom.deleteEventBtn.addEventListener('click', handleDeleteEvent);

        // Listeners pentru actualizarea UI-ului din modal
        dom.eventTypeSelect.addEventListener('change', (e) => {
            ui.updateEventTypeDependencies(e.target.value);
            ui.updateEventTitle();
        });
        dom.clientSearch.addEventListener('input', (e) => ui.filterClientsInModal(e.target.value));
        dom.programSearch.addEventListener('input', (e) => ui.filterProgramsInModal(e.target.value));
        
        // TODO: Conectează butoanele 'manageTeamBtn' și 'manageClientsBtn' la modalele lor
        // dom.manageTeamBtn.addEventListener('click', ...);
        // dom.manageClientsBtn.addEventListener('click', ...);
    }

    // Randează starea inițială
    renderFilters();
    render();
}

// --- Pornirea Aplicației ---
document.addEventListener('DOMContentLoaded', init);