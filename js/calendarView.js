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
 * @param {Date[]} days - Array-ul de zile de randat (7 pt. săptămână, 1 pt. zi)
 * @param {HTMLElement} viewElement - Elementul HTML (weekView sau dayView)
 * @param {Function} onEventClick - Funcția de apelat la click pe eveniment
 */
function renderEventsInGrid(days, viewElement, onEventClick) {
    const { isAdminView, activeFilters } = calendarState.getState();
    
    days.forEach((day) => {
        const dateStr = formatDateISO(day);
        // Obține evenimentele filtrate de la 'calendarState'
        const dayEvents = calendarState.getEventsForDate(day);
        
        // Grupează evenimentele care se suprapun
        const eventGroups = groupOverlappingEvents(dayEvents);

        eventGroups.forEach(group => {
            const overlapCount = group.length;
            
            group.forEach((event, eventIndex) => {
                // --- MODIFICARE 1: Parsare mai robustă a orei ---
            // În loc de: const [startHour, startMinute] = event.startTime.split(':').map(Number);
            const timeParts = event.startTime.split(':').map(Number);
            const startHour = timeParts[0] || 0;
            const startMinute = timeParts[1] || 0;

            // --- MODIFICARE 2: Creăm un string formatat pentru afișare ---
            const formattedStartTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
            
            // Găsește containerul corect (celula orei de început)
            // Această logică este acum corectă deoarece startHour este parsat corect
            const containerSelector = `.event-container[data-date="${dateStr}"][data-hour="${startHour}"]`;
            const container = viewElement.querySelector(containerSelector);
            
            if (!container) return; // Evenimentul este în afara orelor (ex. înainte de 8:00)

            // --- Obține membrii vizibili ---
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            const members = teamMemberIds.map(id => calendarState.getTeamMemberById(id)).filter(m => m);
            
            const visibleMembers = activeFilters.length === 0 
                ? members 
                : members.filter(m => activeFilters.includes(m.id));
            
            // Dacă niciun membru vizibil (din cauza filtrării), nu randa evenimentul
            if (visibleMembers.length === 0) return;
            
            const primaryMember = visibleMembers[0]; // Folosim primul membru vizibil pentru culoare
            
            // --- Creează blocul evenimentului ---
            const eventBlock = document.createElement('div');
            eventBlock.className = 'event-block';
            eventBlock.classList.add(`event-type-${event.type}`); // Pentru stilare (ex. zi liberă)
            
            // --- Stilizare Admin vs Public ---
            if (isAdminView) {
                eventBlock.classList.add('admin-view');
                eventBlock.style.backgroundColor = primaryMember.color;
                eventBlock.style.borderLeft = `3px solid ${primaryMember.color}`;
            } else {
                if (event.isPublic) {
                    eventBlock.classList.add('admin-view'); // Stil public=admin
                    eventBlock.style.backgroundColor = primaryMember.color;
                    eventBlock.style.borderLeft = `3px solid ${primaryMember.color}`;
                } else {
                    eventBlock.classList.add('public-view'); // Stil privat
                    eventBlock.style.borderColor = primaryMember.color;
                    eventBlock.style.color = primaryMember.color;
                }
            }
            
            // --- Poziționare și dimensiune ---
            // Poziția 'top' este relativă la începutul orei (ex. 8:30)
            const topOffset = (startMinute / 60) * 60; // 60px = înălțimea unei ore (din CSS)
            const height = (event.duration / 60) * 60;
            
            eventBlock.style.top = `${topOffset}px`;
            eventBlock.style.height = `${height}px`;

            // Lățime și poziție 'left' pentru suprapuneri
            if (overlapCount > 1) {
                const widthPercent = 100 / overlapCount;
                const leftPercent = widthPercent * eventIndex;
                eventBlock.style.width = `${widthPercent}%`;
                eventBlock.style.left = `${leftPercent}%`;
            } else {
                eventBlock.style.width = '100%';
                eventBlock.style.left = '0';
            }

            const endTime = calculateEndTime(event.startTime, event.duration);
            
            // --- Conținutul blocului ---
            const initialsHtml = visibleMembers.map(m => 
                `<span class="therapist-initials-badge" style="background-color: ${m.color};" title="${m.name}">${m.initials}</span>`
            ).join('');
            
            if (isAdminView) {
                const publicBadge = event.isPublic ? '<span class="event-badge public">PUBLIC</span>' : '';
                const billableBadge = event.isBillable === false ? '<span class="event-badge non-billable" title="Non-billable"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bluesky" viewBox="0 0 16 16"><path d="M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692-.572 2.04-2.653 2.561-4.504 2.246 3.236.551 4.06 2.375 2.281 4.2-3.376 3.464-4.852-.87-5.23-1.98-.07-.204-.103-.3-.103-.218 0-.081-.033.014-.102.218-.379 1.11-1.855 5.444-5.231 1.98-1.778-1.825-.955-3.65 2.28-4.2-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632 0 .186 2.145.955 3.468 1.948"/></svg></span>' : ''; // Simbol $ sau â‚
                
                // --- MODIFICARE 3: Folosim formattedStartTime ---
                eventBlock.innerHTML = `
                    <div class="event-initials-container">${initialsHtml}</div>
                    <div class="event-time">${formattedStartTime} - ${endTime}</div>
                    <div class="event-title">${event.name}${publicBadge}${billableBadge}</div>
                `;
                // Click handler pentru admin
                eventBlock.addEventListener('click', () => onEventClick(event.id));
                
            } else {
                // Public view
                if (event.isPublic) {
                    // --- MODIFICARE 4: Folosim formattedStartTime ---
                    eventBlock.innerHTML = `
                        <div class="event-initials-container">${initialsHtml}</div>
                        <div class="event-time">${formattedStartTime} - ${endTime}</div>
                        <div class="event-title">${event.name}</div>
                    `;
                    // Click handler pentru evenimente publice
                    eventBlock.addEventListener('click', () => onEventClick(event.id));
                } else {
                    // --- MODIFICARE 5: Folosim formattedStartTime ---
                    eventBlock.innerHTML = `
                        <div class="event-initials-container">${initialsHtml}</div>
                        <div class="event-time">${formattedStartTime} - ${endTime}</div>
                        <div class="event-title" style="font-style: italic;">Ocupat</div>
                    `;
                    // Fără click handler pentru evenimente private
                }
            }
                
                container.appendChild(eventBlock);
            });
        });
    });
}

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

    // Sortează evenimentele după ora de început
    const sortedEvents = [...events].sort((a, b) => getStartMinutes(a) - getStartMinutes(b));

    const groups = [];
    if (sortedEvents.length === 0) return [];

    let currentGroup = [];
    let maxEndInGroup = 0; // Urmărește cea mai recentă oră de sfârșit din grupul curent

    sortedEvents.forEach(event => {
        const startMinutes = getStartMinutes(event);
        
        // Verifică dacă evenimentul începe înainte de sfârșitul maxim al grupului curent
        if (currentGroup.length === 0 || startMinutes < maxEndInGroup) {
            // Evenimentul se suprapune cu grupul curent (sau e primul event)
            currentGroup.push(event);
            // Actualizează ora de sfârșit maximă a grupului
            maxEndInGroup = Math.max(maxEndInGroup, getEndMinutes(event));
        } else {
            // Evenimentul NU se suprapune, deci grupul anterior e gata
            groups.push(currentGroup);
            // Începe un grup nou cu acest eveniment
            currentGroup = [event];
            maxEndInGroup = getEndMinutes(event);
        }
    });

    // Adaugă ultimul grup
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    return groups;
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
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24; // % 24 pentru siguranță
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}