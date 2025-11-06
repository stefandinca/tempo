/**
 * js/calendarView.js
 *
 * Responsabil pentru randarea vizualizărilor calendarului (lună, săptămână, zi).
 * Citește datele din 'calendarState' și desenează HTML-ul.
 * Nu modifică starea, doar o citește.
 */

import { calendarState } from './calendarState.js';

// --- Funcții de randare principale ---

/**
 * Randează vizualizarea lunară.
 */
/**
 * Randează vizualizarea lunară.
 */
export function renderMonthView(onDayClick) {
   
    // 1. ADĂUGĂM "activeFilters" AICI
    const { currentDate, isAdminView, clients, activeFilters } = calendarState.getState();
    const container = document.getElementById('calendarView');
    container.innerHTML = ''; // Curăță vizualizarea anterioară

    const monthView = document.createElement('div');
    monthView.className = 'month-view';
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    // Adaugă headerele zilelor
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajustează data de început la cea mai apropiată zi de luni
    let startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay(); // Duminică=0, Luni=1
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - diff);

    // Randează 42 de celule (6 rânduri)
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';

        if (currentDay.getMonth() !== month) dayCell.classList.add('other-month');
        if (isWeekend(currentDay)) dayCell.classList.add('weekend');
        if (isToday(currentDay)) dayCell.classList.add('current-day');

        // Numărul zilei
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDay.getDate();
        dayCell.appendChild(dayNumber);

        // Obține evenimentele folosind 'calendarState'
        const dayEvents = calendarState.getEventsForDate(currentDay);

        if (dayEvents.length > 0) {
            // -- Doar Admin: Afișează numele clienților --
            if (isAdminView) {
                const clientNames = new Set();
                dayEvents.forEach(event => {
                    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
                    clientIds.forEach(clientId => {
                        const client = calendarState.getClientById(clientId);
                        if (client) clientNames.add(client.name);
                    });
                });

                if (clientNames.size > 0) {
                    const clientsContainer = document.createElement('div');
                    clientsContainer.className = 'day-clients';
                    clientsContainer.innerHTML = Array.from(clientNames).join('<br>');
                    dayCell.appendChild(clientsContainer);
                }
            }

            // -- Afișează punctele colorate --
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'event-dots';
            const addedMembers = new Set(); // Pentru a evita puncte duplicate

            dayEvents.forEach(event => {
                const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
                teamMemberIds.forEach(memberId => {
                    // Previne adăugarea mai multor puncte pentru același terapeut în aceeași zi
                    if (addedMembers.has(memberId)) return; 
                    
                    // 2. APLICĂM FILTRUL AICI
                    // Verifică dacă filtrul este activ PENTRU ACEST MEMBRU
                    // Sau dacă nu există filtre active (se afișează tot)
                    const isFilterActive = activeFilters.length === 0 || activeFilters.includes(memberId);

                    if (isFilterActive) { // <-- A fost adăugată această condiție
                        const member = calendarState.getTeamMemberById(memberId);
                        if (member) {
                            const dot = document.createElement('div');
                            dot.className = 'event-dot';
                            dot.style.backgroundColor = member.color;
                            dot.title = member.name;
                            dotsContainer.appendChild(dot);
                            addedMembers.add(memberId);
                        }
                    }
                });
            });
            dayCell.appendChild(dotsContainer);
        }

        // Adaugă event listener pentru click
        dayCell.addEventListener('click', () => onDayClick(currentDay));
        grid.appendChild(dayCell);
    }

    monthView.appendChild(grid);
    container.appendChild(monthView);
}

/**
 * Randează vizualizarea săptămânală.
 */
export function renderWeekView(onEventClick) {
    const { currentDate } = calendarState.getState();
    const container = document.getElementById('calendarView');
    container.innerHTML = '';

    const weekView = document.createElement('div');
    weekView.className = 'week-view';

    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }

    // --- Header (Zilele) ---
    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = '<div></div>'; // Colțul gol pentru ore

    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header-week';
        dayHeader.innerHTML = `${day.toLocaleString('ro-RO', { weekday: 'short' })}<br>${day.getDate()}`;
        if (isToday(day)) dayHeader.classList.add('today');
        header.appendChild(dayHeader);
    });
    weekView.appendChild(header);

    // --- Grila de ore ---
    const timeGrid = document.createElement('div');
    timeGrid.className = 'time-grid-container';

    for (let hour = 8; hour <= 20; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = formatHour(hour);
        timeSlot.appendChild(timeLabel);

        days.forEach(day => {
            const hourCell = document.createElement('div');
            hourCell.className = 'hour-cell';
            // Adaugă un container pentru evenimente în fiecare celulă
            const eventContainer = document.createElement('div');
            eventContainer.className = 'event-container';
            eventContainer.dataset.date = formatDateISO(day); // Stochează data
            eventContainer.dataset.hour = hour; // Stochează ora
            hourCell.appendChild(eventContainer);
            timeSlot.appendChild(hourCell);
        });
        timeGrid.appendChild(timeSlot);
    }
    weekView.appendChild(timeGrid);
    
    // --- Randează evenimentele ---
    // Această funcție va popula grila goală
    renderEventsInGrid(days, weekView, onEventClick);

    
    
    container.appendChild(weekView);

    
}

/**
 * Randează vizualizarea zilnică.
 */
export function renderDayView(onEventClick) {
    const { currentDate } = calendarState.getState();
    const container = document.getElementById('calendarView');
    container.innerHTML = '';

    const dayView = document.createElement('div');
    dayView.className = 'day-view'; // Clasă diferită pentru stilare (ex. lățime)

    const days = [currentDate]; // Doar o zi

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'week-header'; // Folosim aceeași clasă ca la săptămână
    header.innerHTML = '<div></div>'; // Colț gol

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header-week';
    dayHeader.innerHTML = currentDate.toLocaleString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' });
    if (isToday(currentDate)) dayHeader.classList.add('today');
    header.appendChild(dayHeader);
    dayView.appendChild(header);

    // --- Grila de ore ---
    const timeGrid = document.createElement('div');
    timeGrid.className = 'time-grid-container';

    for (let hour = 8; hour <= 20; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = formatHour(hour);
        timeSlot.appendChild(timeLabel);

        const hourCell = document.createElement('div');
        hourCell.className = 'hour-cell';
        const eventContainer = document.createElement('div');
        eventContainer.className = 'event-container';
        eventContainer.dataset.date = formatDateISO(currentDate);
        eventContainer.dataset.hour = hour;
        hourCell.appendChild(eventContainer);
        timeSlot.appendChild(hourCell);
        
        timeGrid.appendChild(timeSlot);
    }
    dayView.appendChild(timeGrid);

    // --- Randează evenimentele ---
    renderEventsInGrid(days, dayView, onEventClick);

    

    container.appendChild(dayView);
}


// --- Funcție Helper pentru Evenimente (Săptămână/Zi) ---

/**
 * Plasează evenimentele în grila de ore pentru vizualizarea de săptămână/zi.
 * MODIFICAT: Fiecare terapeut are propriul track vertical.
 * @param {Date[]} days - Array-ul de zile de randat (7 pt. săptămână, 1 pt. zi)
 * @param {HTMLElement} viewElement - Elementul HTML (weekView sau dayView)
 * @param {Function} onEventClick - Funcția de apelat la click pe eveniment
 */
function renderEventsInGrid(days, viewElement, onEventClick) {
    const { isAdminView, activeFilters, teamMembers } = calendarState.getState();
    
    // Determină terapeuții vizibili
    const visibleTherapists = activeFilters.length === 0 
        ? teamMembers 
        : teamMembers.filter(m => activeFilters.includes(m.id));
    
    if (visibleTherapists.length === 0) return;
    
    // Calculează lățimea fiecărui track (procent)
    const trackWidth = 100 / visibleTherapists.length;
    
    days.forEach((day) => {
        const dateStr = formatDateISO(day);
        // Obține evenimentele filtrate de la 'calendarState'
        const dayEvents = calendarState.getEventsForDate(day);
        
        // Grupează evenimentele pe terapeut
        const eventsByTherapist = {};
        visibleTherapists.forEach(therapist => {
            eventsByTherapist[therapist.id] = [];
        });
        
        dayEvents.forEach(event => {
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            teamMemberIds.forEach(memberId => {
                if (eventsByTherapist[memberId]) {
                    eventsByTherapist[memberId].push(event);
                }
            });
        });
        
        // Randează evenimentele pentru fiecare terapeut în track-ul lor
        visibleTherapists.forEach((therapist, therapistIndex) => {
            const therapistEvents = eventsByTherapist[therapist.id] || [];
            
            therapistEvents.forEach((event) => {
                // Parsare timp
                const timeParts = event.startTime.split(':').map(Number);
                const startHour = timeParts[0] || 0;
                const startMinute = timeParts[1] || 0;
                const formattedStartTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
                
                // Găsește containerul corect
                const containerSelector = `.event-container[data-date="${dateStr}"][data-hour="${startHour}"]`;
                const container = viewElement.querySelector(containerSelector);
                
                if (!container) return;
                
                // Creează blocul evenimentului
                const eventBlock = document.createElement('div');
                eventBlock.className = 'event-block';
                eventBlock.classList.add(`event-type-${event.type}`);
                
                // Stilizare Admin vs Public
                if (isAdminView) {
                    eventBlock.classList.add('admin-view');
                    eventBlock.style.backgroundColor = therapist.color;
                    eventBlock.style.borderLeft = `3px solid ${therapist.color}`;
                } else {
                    if (event.isPublic) {
                        eventBlock.classList.add('admin-view');
                        eventBlock.style.backgroundColor = therapist.color;
                        eventBlock.style.borderLeft = `3px solid ${therapist.color}`;
                    } else {
                        eventBlock.classList.add('public-view');
                        eventBlock.style.borderColor = therapist.color;
                        eventBlock.style.color = therapist.color;
                    }
                }
                
                // Poziționare și dimensiune
                const topOffset = (startMinute / 60) * 120;
                const height = (event.duration / 60) * 120;
                
                eventBlock.style.top = `${topOffset}px`;
                eventBlock.style.height = `${height}px`;
                
                // MODIFICARE PRINCIPALĂ: Poziționare în track-ul terapeutului
                eventBlock.style.width = `${trackWidth}%`;
                eventBlock.style.left = `${trackWidth * therapistIndex}%`;
                
                const endTime = calculateEndTime(event.startTime, event.duration);
                
                // Obține clienții
                const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
                const clientNames = clientIds.map(id => {
                    const client = calendarState.getClientById(id);
                    return client ? client.name : '';
                }).filter(Boolean).join(', ');
                
                // Badge-uri
                const publicBadge = event.isPublic ? '<span class="event-badge public">PUBLIC</span>' : '';
                const billableBadge = event.isBillable === false ? '<span class="event-badge non-billable" title="Non-billable">$</span>' : '';
                
                // Conținut
                if (isAdminView) {
                    eventBlock.innerHTML = `
                        <div class="event-time">${formattedStartTime} - ${endTime}</div>
                        <div class="event-title">${event.name}${publicBadge}${billableBadge}</div>
                        ${clientNames ? `<div class="event-clients">${clientNames}</div>` : ''}
                    `;
                    eventBlock.addEventListener('click', () => onEventClick(event.id));
                } else {
                    if (event.isPublic) {
                        eventBlock.innerHTML = `
                            <div class="event-time">${formattedStartTime} - ${endTime}</div>
                            <div class="event-title">${event.name}</div>
                            ${clientNames ? `<div class="event-clients">${clientNames}</div>` : ''}
                        `;
                        eventBlock.addEventListener('click', () => onEventClick(event.id));
                    } else {
                        eventBlock.innerHTML = `
                            <div class="event-time">${formattedStartTime} - ${endTime}</div>
                            <div class="event-title" style="font-style: italic;">Ocupat</div>
                        `;
                    }
                }
                
                container.appendChild(eventBlock);
            });
        });
    });
}

/**
 * Calculate the position of the current time indicator
 * @returns {Object} { hours, minutes, topPosition } or null if outside business hours
 */
function getCurrentTimePosition() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Only show indicator during business hours (8:00 - 20:00)
    if (hours < 8 || hours >= 20) {
        return null;
    }
    
    // Calculate position relative to 8:00 AM
    const hoursFromStart = hours - 8;
    const totalMinutes = (hoursFromStart * 60) + minutes;
    const topPosition = (totalMinutes / 60) * 120; // 60px per hour
    
    return { hours, minutes, topPosition };
}

/**
 * Format time for display (HH:MM)
 */
function formatCurrentTime(hours, minutes) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Render the current time indicator in the calendar
 */
function renderCurrentTimeIndicator() {
    const timeGrid = document.querySelector('.time-grid-container');
    if (!timeGrid) return;
    
    // Remove existing indicator if any
    const existingIndicator = timeGrid.querySelector('.current-time-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const timePos = getCurrentTimePosition();
    if (!timePos) return; // Don't show outside business hours
    
    const indicator = document.createElement('div');
    indicator.className = 'current-time-indicator';
    indicator.style.top = `${timePos.topPosition}px`;
    
    const label = document.createElement('div');
    label.className = 'current-time-label';
    label.textContent = formatCurrentTime(timePos.hours, timePos.minutes);
    indicator.appendChild(label);
    
    timeGrid.appendChild(indicator);
}

/**
 * Start updating the current time indicator every minute
 */
let timeIndicatorInterval = null;

function startTimeIndicatorUpdates() {
    // Clear any existing interval
    if (timeIndicatorInterval) {
        clearInterval(timeIndicatorInterval);
    }
    
    // Update immediately
    renderCurrentTimeIndicator();
    
    // Update every minute
    timeIndicatorInterval = setInterval(() => {
        renderCurrentTimeIndicator();
    }, 60000); // 60 seconds
}

function stopTimeIndicatorUpdates() {
    if (timeIndicatorInterval) {
        clearInterval(timeIndicatorInterval);
        timeIndicatorInterval = null;
    }
}

// Export these functions if using modules
export { renderCurrentTimeIndicator, startTimeIndicatorUpdates, stopTimeIndicatorUpdates };


/**
 * Grupează evenimentele care se suprapun ca timp.
 * @param {object[]} events - Array-ul de evenimente pentru o zi
 * @returns {object[][]} - Un array de grupuri (array-uri) de evenimente
 */
function groupOverlappingEvents(events) {
    if (!events || events.length === 0) return [];

    // Helper to get end time in minutes from 00:00
    const getEndMinutes = (event) => {
        if (!event.startTime || !event.duration) return 0;
        const [startH, startM] = event.startTime.split(':').map(Number);
        return (startH * 60 + startM) + (event.duration || 0);
    };

    // Helper to get start time in minutes
    const getStartMinutes = (event) => {
        if (!event.startTime) return 0;
        const [startH, startM] = event.startTime.split(':').map(Number);
        return (startH * 60 + startM);
    };

    // === FIX: Check if events are for the SAME THERAPIST ===
    // Events should only stack if they're for DIFFERENT therapists at the SAME time
    // If they're the same therapist at different times, they should be in separate groups
    
    // First, group by therapist
    const byTherapist = {};
    events.forEach(event => {
        const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
        const therapistKey = teamMemberIds.sort().join(',') || 'none'; // Create unique key for therapist combo
        
        if (!byTherapist[therapistKey]) {
            byTherapist[therapistKey] = [];
        }
        byTherapist[therapistKey].push(event);
    });
    
    // Now check for overlaps ONLY within events at the same time for DIFFERENT therapists
    const allGroups = [];
    
    // Process events by start time
    const eventsByTime = {};
    events.forEach(event => {
        const startMinutes = getStartMinutes(event);
        if (!eventsByTime[startMinutes]) {
            eventsByTime[startMinutes] = [];
        }
        eventsByTime[startMinutes].push(event);
    });
    
    // Group events that start at the exact same time
    Object.keys(eventsByTime).forEach(startTime => {
        const sameTimeEvents = eventsByTime[startTime];
        
        if (sameTimeEvents.length > 1) {
            // Multiple events at same time - they should stack
            allGroups.push(sameTimeEvents);
        } else {
            // Single event at this time - put in its own group
            allGroups.push([sameTimeEvents[0]]);
        }
    });
    
    return allGroups;
}

// --- Funcții Helper Utilitare (private) ---

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay(); // Duminică=0, Luni=1
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustează la Luni
    return new Date(d.setDate(diff));
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sâmbătă=6, Duminică=0
}

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatHour(hour) {
    const h = hour > 12 ? hour - 12 : hour;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${suffix}`;
}

function calculateEndTime(startTime, durationMinutes) {
    if (!startTime) return "N/A";
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + parseInt(durationMinutes, 10);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}