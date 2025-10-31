// Calendar Application - Main JavaScript

// Custom modal helper functions
function showCustomAlert(message, title = 'Notificare') {
  return new Promise((resolve) => {
    const modal = document.getElementById('alertModal');
    const titleEl = document.getElementById('alertModalTitle');
    const messageEl = document.getElementById('alertModalMessage');
    const okBtn = document.getElementById('alertModalOk');
    const closeBtn = document.getElementById('closeAlertModal');
    
    if (!modal || !messageEl || !okBtn) {
      // Fallback to regular alert if modal not found
      alert(message);
      resolve();
      return;
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
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
    
    okBtn.addEventListener('click', handleClose);
    closeBtn.addEventListener('click', handleClose);
    modal.addEventListener('click', handleBackdrop);
  });
}

function showCustomConfirm(message, title = 'Confirma actiunea') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const okBtn = document.getElementById('confirmModalOk');
    const cancelBtn = document.getElementById('confirmModalCancel');
    const closeBtn = document.getElementById('closeConfirmModal');
    
    if (!modal || !messageEl || !okBtn || !cancelBtn) {
      // Fallback to regular confirm if modal not found
      resolve(confirm(message));
      return;
    }
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    const handleOk = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(false);
    };
    
    const handleBackdrop = (e) => {
      if (e.target === modal) handleCancel();
    };
    
    const cleanup = () => {
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      closeBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackdrop);
    };
    
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleBackdrop);
  });
}

function showRecurringDeleteModal(message = 'Acesta este un eveniment recurent. Ce doresti sa stergi?') {
  return new Promise((resolve) => {
    const modal = document.getElementById('recurringDeleteModal');
    const messageEl = document.getElementById('recurringDeleteModalMessage');
    const cancelBtn = document.getElementById('recurringDeleteCancel');
    const singleBtn = document.getElementById('recurringDeleteSingle');
    const allBtn = document.getElementById('recurringDeleteAll');
    const closeBtn = document.getElementById('closeRecurringDeleteModal');
    
    if (!modal || !messageEl || !cancelBtn || !singleBtn || !allBtn) {
      // Fallback to regular confirm if modal not found
      resolve('cancel');
      return;
    }
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    const handleCancel = () => {
      modal.style.display = 'none';
      cleanup();
      resolve('cancel');
    };
    
    const handleSingle = () => {
      modal.style.display = 'none';
      cleanup();
      resolve('single');
    };
    
    const handleAll = () => {
      modal.style.display = 'none';
      cleanup();
      resolve('all');
    };
    
    const handleBackdrop = (e) => {
      if (e.target === modal) handleCancel();
    };
    
    const cleanup = () => {
      cancelBtn.removeEventListener('click', handleCancel);
      singleBtn.removeEventListener('click', handleSingle);
      allBtn.removeEventListener('click', handleAll);
      closeBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('click', handleBackdrop);
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    singleBtn.addEventListener('click', handleSingle);
    allBtn.addEventListener('click', handleAll);
    closeBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleBackdrop);
  });
}

class Calendar {
  constructor(isAdminView = false) {
    this.selectedProgramIds = new Set();
    this.isAdminView = isAdminView;
    this.currentDate = new Date(); // Use actual current date
    this.currentView = 'month';
    this.teamMembers = [];
    this.clients = [];
    this.events = [];
    this.programs = [];
    this.activeFilters = [];
    this.editingEventId = null;
    this.editingMemberId = null;
    this.editingClientId = null;
    this.selectedProgramIds = new Set();

    // Romanian translations
    this.translations = {
      roles: {
        'therapist': 'Terapeut',
        'coordinator': 'Coordonator',
        'admin': 'Admin'
      }
    };
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    await this.loadEvolutionData();
    this.setupEventListeners();
    this.initThemeToggle();
    this.initFullscreenToggle();
    this.render();
  }

  monthHasEvents(dateObj) {
  // Beginning and end of that month
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const end   = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);

  // If you store start/end as ISO strings, normalize to Date for comparison
  const toDate = (v) => (v instanceof Date ? v : new Date(v));

  return (this.events || []).some(ev => {
    // Be resilient to different shapes: ev.date, ev.start, ev.startTime, etc.
    const startCandidate = ev.start || ev.date || ev.startTime || ev.datetime || ev.when;
    if (!startCandidate) return false;
    const d = toDate(startCandidate);
    return d >= start && d <= end;
  });
}

autoSelectRelevantMonth() {
  if (!Array.isArray(this.events) || this.events.length === 0) return;

  // If current month already has events, do nothing
  if (this.monthHasEvents(this.currentDate)) return;

  // Build a list of event dates
  const eventDates = [];
  for (const ev of this.events) {
    const val = ev.start || ev.date || ev.startTime || ev.datetime || ev.when;
    if (!val) continue;
    const d = new Date(val);
    if (isNaN(d)) continue;
    // store normalized "first day of month"
    eventDates.push(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  if (eventDates.length === 0) return;

  // Find the date closest to "today"
  const today = new Date();
  let closest = eventDates[0];
  let bestDiff = Math.abs(closest - today);

  for (let i = 1; i < eventDates.length; i++) {
    const diff = Math.abs(eventDates[i] - today);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = eventDates[i];
    }
  }

  // Jump calendar to that month
  this.currentDate = closest;
}

  
  updateEventTitle() {
    const eventNameInput = document.getElementById('eventName');
    const eventTypeSelect = document.getElementById('eventType');
    
    if (!eventNameInput || !eventTypeSelect) return;
    
    // Get selected clients
    const selectedClientIds = Array.from(this.selectedClientIds || []);
    const selectedClients = selectedClientIds
      .map(id => this.clients.find(c => String(c.id) === String(id)))
      .filter(c => c);
    
    // Get event type label
    const eventType = eventTypeSelect.value;
    const typeLabel = this.getEventTypeLabel(eventType);
    
    // Build title if we have clients and type
    if (selectedClients.length > 0 && eventType) {
      let title = '';
      
      if (selectedClients.length === 1) {
        title = `${typeLabel} - ${selectedClients[0].name}`;
      } else if (selectedClients.length === 2) {
        title = `${typeLabel} - ${selectedClients[0].name} si ${selectedClients[1].name}`;
      } else if (selectedClients.length > 2) {
        title = `${typeLabel} - ${selectedClients[0].name} si ${selectedClients.length - 1} altii`;
      }
      
      eventNameInput.value = title;
    } else if (eventType && eventType === 'day-off') {
      // For day-off, just use the type label
      eventNameInput.value = typeLabel;
    }
  }
  
  initThemeToggle() {
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('calendar-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('calendar-theme', newTheme);
      });
    }
  }

  initFullscreenToggle() {
  const fullscreenBtn = document.getElementById('fullscreenToggle');
  if (!fullscreenBtn) return;

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Eroare la activarea ecranului complet: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Optional: change icon when entering/leaving fullscreen
  document.addEventListener('fullscreenchange', () => {
    const isFull = !!document.fullscreenElement;
    fullscreenBtn.title = isFull ? 'Ieși din ecran complet' : 'Ecran complet';
  });
}

  
  async loadData() {
    try {
      // Try clean URL first
      let response = await fetch('api.php?path=data');
      
      // If 404, try direct PHP path (fallback for when .htaccess doesn't work)
      if (!response.ok && response.status === 404) {
        response = await fetch('/calendar-app/api.php?path=data');
      }
      
      // If still not found, try relative path
      if (!response.ok && response.status === 404) {
        response = await fetch('api.php?path=data');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

this.teamMembers = data.teamMembers || [];
this.clients = data.clients || [];
this.events = data.events || [];
this.activeFilters = this.teamMembers.map(m => m.id);

// Auto-select a relevant month if the current one has no events
this.autoSelectRelevantMonth();

// Load programs (so program filters show up right away)
await this.loadPrograms();

    } catch (error) {
      console.error('Error loading data:', error);
      await showCustomAlert('Failed to load data. Please check:\n1. Is api.php uploaded?\n2. Is data.json readable?\n3. Check browser console for details.', 'Eroare la incarcare');
    }
  }
  
  async loadPrograms() {
    try {
      console.log('Loading programs...');
      const response = await fetch('programs.json');
      console.log('Programs fetch response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        this.programs = data.programs || [];
        console.log(`Loaded ${this.programs.length} programs:`, this.programs);
      } else {
        console.error('Failed to load programs.json:', response.status, response.statusText);
        this.programs = [];
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      this.programs = [];
    }
  }
  
  async saveData() {
    try {
      const data = {
        teamMembers: this.teamMembers,
        clients: this.clients,
        events: this.events
      };
      
      // Try clean URL first
      let response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // If 404, try direct PHP path
      if (!response.ok && response.status === 404) {
        response = await fetch('/calendar-app/api.php?path=data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }
      
      // If still not found, try relative path
      if (!response.ok && response.status === 404) {
        response = await fetch('api.php?path=data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      await showCustomAlert('Failed to save data to server.', 'Eroare la salvare');
    }
  }
  
  setupEventListeners() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentView = e.target.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.render();
      });
    });
    
    // Navigation
    document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
    document.getElementById('todayBtn').addEventListener('click', () => this.navigateToToday());
    document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));
    
    // Filters
    this.renderFilters();
    
    // Event Details Modal (works in both admin and public view)
    const closeDetailsBtn = document.getElementById('closeEventDetailsModal');
    const closeDetailsBtn2 = document.getElementById('closeEventDetails');
    
    if (closeDetailsBtn) {
      closeDetailsBtn.addEventListener('click', () => this.closeEventDetailsModal());
    }
    if (closeDetailsBtn2) {
      closeDetailsBtn2.addEventListener('click', () => this.closeEventDetailsModal());
    }
    
    // Modal
    if (this.isAdminView) {
      document.getElementById('addEventBtn').addEventListener('click', () => this.openModal());
      document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
      document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
      document.getElementById('eventForm').addEventListener('submit', (e) => this.saveEvent(e));
      
      // Make time/duration optional for day-off events
      document.getElementById('eventType').addEventListener('change', (e) => {
        const startTimeField = document.getElementById('startTime');
        const durationField = document.getElementById('duration');
        const isDayOff = e.target.value === 'day-off';
        
        if (isDayOff) {
          // Make optional for day-off
          startTimeField.removeAttribute('required');
          durationField.removeAttribute('required');
          startTimeField.style.opacity = '0.7';
          durationField.style.opacity = '0.7';
        } else {
          // Make required for other event types
          startTimeField.setAttribute('required', 'required');
          durationField.setAttribute('required', 'required');
          startTimeField.style.opacity = '1';
          durationField.style.opacity = '1';
        }
      });
      
      // Team Management
      document.getElementById('manageTeamBtn').addEventListener('click', () => this.openTeamModal());
      document.getElementById('closeTeamModal').addEventListener('click', () => this.closeTeamModal());
      document.getElementById('cancelMemberBtn').addEventListener('click', () => {
        this.resetTeamForm();
        this.closeTeamModal();
      });
      document.getElementById('teamMemberForm').addEventListener('submit', (e) => this.saveTeamMember(e));
      
      // Client Management
      document.getElementById('manageClientsBtn').addEventListener('click', () => this.openClientModal());
      document.getElementById('closeClientModal').addEventListener('click', () => this.closeClientModal());
      document.getElementById('cancelClientBtn').addEventListener('click', () => {
        this.resetClientForm();
        this.closeClientModal();
      });
      document.getElementById('clientForm').addEventListener('submit', (e) => this.saveClient(e));
      document.getElementById('addNewClientBtn').addEventListener('click', () => this.openQuickAddClient());
      
      // Client search
      const clientSearch = document.getElementById('clientSearch');
      if (clientSearch) {
        clientSearch.addEventListener('input', (e) => this.filterClients(e.target.value));
      }
      
      // Program search
      const programSearch = document.getElementById('programSearch');
      if (programSearch) {
        programSearch.addEventListener('input', (e) => this.filterPrograms(e.target.value));
      }
      
      // Color picker sync
      document.getElementById('memberColor').addEventListener('input', (e) => {
        document.getElementById('memberColorHex').value = e.target.value.toUpperCase();
      });
      document.getElementById('memberColorHex').addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          document.getElementById('memberColor').value = hex;
        }
      });
      
      
      // Admin-only Event Details Modal actions
      const editBtn = document.getElementById('editEventFromDetails');
      const deleteBtn = document.getElementById('deleteEventFromDetails');
      const commentsArea = document.getElementById('eventComments');
      
      if (editBtn) editBtn.addEventListener('click', () => this.editEventFromDetails());
      if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteEventFromDetails());
      if (commentsArea) commentsArea.addEventListener('blur', () => this.saveEventComments());
    }
  }
    
  
  
  navigate(direction) {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + (7 * direction));
    } else if (this.currentView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + direction);
    }
    this.render();
  }
  
  navigateToToday() {
    this.currentDate = new Date();
    this.render();
  }
  
  renderFilters() {
    const filtersContainer = document.getElementById('filters');
    filtersContainer.innerHTML = '';
    
    this.teamMembers.forEach(member => {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.style.color = member.color;
      if (this.activeFilters.includes(member.id)) {
        chip.classList.add('active');
      }
      
      chip.innerHTML = `
        <span class="color-dot" style="background-color: ${member.color}"></span>
        <span>${member.name}</span>
      `;
      
      chip.addEventListener('click', () => {
        const index = this.activeFilters.indexOf(member.id);
        if (index > -1) {
          this.activeFilters.splice(index, 1);
        } else {
          this.activeFilters.push(member.id);
        }
        this.renderFilters();
        this.render();
      });
      
      filtersContainer.appendChild(chip);
    });
  }
  
  render() {
    this.updateCurrentPeriodLabel();
    
    if (this.currentView === 'month') {
      this.renderMonthView();
    } else if (this.currentView === 'week') {
      this.renderWeekView();
    } else if (this.currentView === 'day') {
      this.renderDayView();
    }
  }
  
  updateCurrentPeriodLabel() {
    const label = document.getElementById('currentPeriod');
    
    if (this.currentView === 'month') {
      const monthName = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      label.textContent = monthName;
    } else if (this.currentView === 'week') {
      const weekStart = this.getWeekStart(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      label.textContent = `${this.formatDate(weekStart, 'short')} - ${this.formatDate(weekEnd, 'short')}`;
    } else if (this.currentView === 'day') {
      label.textContent = this.formatDate(this.currentDate, 'long');
    }
  }
  
  renderMonthView() {
    const container = document.getElementById('calendarView');
    container.innerHTML = '';
    
    const monthView = document.createElement('div');
    monthView.className = 'month-view';
    
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    // Day headers
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(day => {
      const header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = day;
      grid.appendChild(header);
    });
    
    // Get first day of month
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust to start from Monday
    let startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - diff);
    
    // Render days
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      
      const dayCell = document.createElement('div');
      dayCell.className = 'day-cell';
      
      if (currentDay.getMonth() !== month) {
        dayCell.classList.add('other-month');
      }
      
      if (currentDay.getDay() === 0 || currentDay.getDay() === 6) {
        dayCell.classList.add('weekend');
      }
      
      // Highlight current day
      if (this.isToday(currentDay)) {
        dayCell.classList.add('current-day');
      }
      
      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = currentDay.getDate();
      dayCell.appendChild(dayNumber);
      
      // Add events as dots
      const dayEvents = this.getEventsForDate(currentDay);
      if (dayEvents.length > 0) {
        // Collect unique client names for this day (ADMIN VIEW ONLY)
        if (this.isAdminView) {
          const clientNames = new Set();
          dayEvents.forEach(event => {
            const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
            clientIds.forEach(clientId => {
              const client = this.clients.find(c => c.id === clientId);
              if (client) {
                clientNames.add(client.name);
              }
            });
          });
          
          // Display client names (admin only)
          if (clientNames.size > 0) {
            const clientsContainer = document.createElement('div');
            clientsContainer.className = 'day-clients';
            clientsContainer.innerHTML = Array.from(clientNames).join('<br>');
            dayCell.appendChild(clientsContainer);
          }
        }
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'event-dots';
        
        dayEvents.forEach(event => {
          // Get all team members for this event
          const teamMemberIds = event.teamMemberIds || [event.teamMemberId];
          
          teamMemberIds.forEach(memberId => {
            const member = this.teamMembers.find(m => m.id === memberId);
            // Show dot if no filters active, or if member is in active filters
            if (member && (this.activeFilters.length === 0 || this.activeFilters.includes(memberId))) {
              const dot = document.createElement('div');
              dot.className = 'event-dot';
              dot.style.backgroundColor = member.color;
              dot.title = member.name;
              dotsContainer.appendChild(dot);
            }
          });
        });
        
        dayCell.appendChild(dotsContainer);
      }
      
      // Make day clickable to switch to day view (both admin and public)
      dayCell.addEventListener('click', () => {
        this.currentDate = new Date(currentDay);
        this.currentView = 'day';
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-view="day"]').classList.add('active');
        this.render();
      });
      
      grid.appendChild(dayCell);
    }
    
    monthView.appendChild(grid);
    container.appendChild(monthView);
  }
  
  renderWeekView() {
    const container = document.getElementById('calendarView');
    container.innerHTML = '';
    
    const weekView = document.createElement('div');
    weekView.className = 'week-view';
    
    const weekStart = this.getWeekStart(this.currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = '<div></div>'; // Empty corner
    
    days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header-week';
      const dayName = day.toLocaleString('default', { weekday: 'short' });
      const dayNum = day.getDate();
      dayHeader.innerHTML = `${dayName}<br>${dayNum}`;
      
      if (this.isToday(day)) {
        dayHeader.classList.add('today');
      }
      
      header.appendChild(dayHeader);
    });
    
    weekView.appendChild(header);
    
    // Time slots
    const timeGrid = document.createElement('div');
    timeGrid.className = 'time-grid-container';
    
    for (let hour = 8; hour <= 20; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.className = 'time-slot';
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'time-label';
      timeLabel.textContent = this.formatHour(hour);
      timeSlot.appendChild(timeLabel);
      
      days.forEach(day => {
        const hourCell = document.createElement('div');
        hourCell.className = 'hour-cell';
        
        const container = document.createElement('div');
        container.className = 'event-container';
        
        hourCell.appendChild(container);
        timeSlot.appendChild(hourCell);
      });
      
      timeGrid.appendChild(timeSlot);
    }
    
    weekView.appendChild(timeGrid);
    
    // Render events
    this.renderWeekEvents(days, weekView);
    
    container.appendChild(weekView);
  }
  
  renderWeekEvents(days, weekView) {
    const containers = weekView.querySelectorAll('.event-container');
    const isDayView = days.length === 1;
    
    days.forEach((day, dayIndex) => {
      const dayEvents = this.getEventsForDate(day);
      
      // Group events by their time overlap
      const eventGroups = this.groupOverlappingEvents(dayEvents);
      
      eventGroups.forEach(group => {
        const overlapCount = group.length;
        
        group.forEach((event, eventIndex) => {
          const [startHour, startMinute] = event.startTime.split(':').map(Number);
          const containerIndex = (startHour - 8) * days.length + dayIndex;
          const container = containers[containerIndex];
          
          if (!container) return;
          
          // Get all team members for this event
          const teamMemberIds = event.teamMemberIds || [event.teamMemberId];
          const members = teamMemberIds.map(id => this.teamMembers.find(m => m.id === id)).filter(m => m);
          
          // Get visible team members (those in active filters, or all if no filters)
          const visibleMembers = this.activeFilters.length === 0 
            ? members 
            : members.filter(m => this.activeFilters.includes(m.id));
          const primaryMember = visibleMembers[0] || members[0];
          
          if (!primaryMember) return;
          
          const eventBlock = document.createElement('div');
          eventBlock.className = 'event-block';
          
          // Add event type class for styling
          if (event.type) {
            eventBlock.classList.add(`event-type-${event.type}`);
          }
          
          // Single border for primary member (always use first visible member's color)
          eventBlock.style.borderLeft = `3px solid ${primaryMember.color}`;
          
          if (this.isAdminView) {
            eventBlock.classList.add('admin-view');
            eventBlock.style.backgroundColor = primaryMember.color;
          } else {
            // Public view
            if (event.isPublic) {
              // Public events: solid background color like admin view
              eventBlock.classList.add('admin-view');
              eventBlock.style.backgroundColor = primaryMember.color;
            } else {
              // Private events: bordered style
              eventBlock.classList.add('public-view');
              eventBlock.style.borderColor = primaryMember.color;
              eventBlock.style.color = primaryMember.color;
            }
          }
          
          // Calculate position and height
          const startMinutes = startHour * 60 + startMinute;
          const topOffset = ((startMinutes - (startHour * 60)) / 60) * 60;
          const height = (event.duration / 60) * 60;
          
          eventBlock.style.top = `${topOffset}px`;
          eventBlock.style.height = `${height}px`;
          
          // Handle overlapping - side by side
          if (overlapCount > 1) {
            const widthPercent = 100 / overlapCount;
            const leftPercent = widthPercent * eventIndex;
            eventBlock.style.width = `${widthPercent}%`;
            eventBlock.style.left = `${leftPercent}%`;
          } else {
            eventBlock.style.width = '100%';
            eventBlock.style.left = '0';
          }
          
          const endTime = this.calculateEndTime(event.startTime, event.duration);
          
          // Create initials badges for top-right corner
          const initialsHtml = visibleMembers.map(m => 
            `<span class="therapist-initials-badge" style="background-color: ${m.color};" title="${m.name}">${m.initials}</span>`
          ).join('');
          
          if (this.isAdminView) {
            const publicBadge = event.isPublic ? '<span style="background: #4CAF50; color: white; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.625rem; margin-left: 0.25rem;">PUBLIC</span>' : '';
            const billableBadge = event.isBillable === false ? '<span style=" color: white; padding: 0.125rem 0.375rem;  font-size: 0.625rem; margin-left: 0.25rem;" title="Non-billable"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-piggy-bank-fill" viewBox="0 0 16 16"><path d="M7.964 1.527c-2.977 0-5.571 1.704-6.32 4.125h-.55A1 1 0 0 0 .11 6.824l.254 1.46a1.5 1.5 0 0 0 1.478 1.243h.263c.3.513.688.978 1.145 1.382l-.729 2.477a.5.5 0 0 0 .48.641h2a.5.5 0 0 0 .471-.332l.482-1.351c.635.173 1.31.267 2.011.267.707 0 1.388-.095 2.028-.272l.543 1.372a.5.5 0 0 0 .465.316h2a.5.5 0 0 0 .478-.645l-.761-2.506C13.81 9.895 14.5 8.559 14.5 7.069q0-.218-.02-.431c.261-.11.508-.266.705-.444.315.306.815.306.815-.417 0 .223-.5.223-.461-.026a1 1 0 0 0 .09-.255.7.7 0 0 0-.202-.645.58.58 0 0 0-.707-.098.74.74 0 0 0-.375.562c-.024.243.082.48.32.654a2 2 0 0 1-.259.153c-.534-2.664-3.284-4.595-6.442-4.595m7.173 3.876a.6.6 0 0 1-.098.21l-.044-.025c-.146-.09-.157-.175-.152-.223a.24.24 0 0 1 .117-.173c.049-.027.08-.021.113.012a.2.2 0 0 1 .064.199m-8.999-.65a.5.5 0 1 1-.276-.96A7.6 7.6 0 0 1 7.964 3.5c.763 0 1.497.11 2.18.315a.5.5 0 1 1-.287.958A6.6 6.6 0 0 0 7.964 4.5c-.64 0-1.255.09-1.826.254ZM5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0"/></svg></span>' : '';
            eventBlock.innerHTML = `
              <div class="event-initials-container">${initialsHtml}</div>
              <div class="event-time">${event.startTime} - ${endTime}</div>
              <div class="event-title">${event.name}${publicBadge}${billableBadge}</div>
            `;
            
            eventBlock.addEventListener('click', () => this.showEventDetails(event.id));
          } else {
            // Public view: show full info for public events, just time for private
            if (event.isPublic) {
              eventBlock.innerHTML = `
                <div class="event-initials-container">${initialsHtml}</div>
                <div class="event-time">${event.startTime} - ${endTime}</div>
                <div class="event-title">${event.name}</div>
                `;
              // Add click handler for public events in public view
              eventBlock.addEventListener('click', () => this.showEventDetails(event.id));
            } else {
              eventBlock.innerHTML = `
                <div class="event-initials-container">${initialsHtml}</div>
                <div class="event-time">${event.startTime} - ${endTime}</div>
                <div class="event-title" style="font-style: italic;">Ocupat</div>
              `;
            }
          }
          
          container.appendChild(eventBlock);
        });
      });
    });
  }
  
  groupOverlappingEvents(events) {
    if (events.length === 0) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => {
      const [aHour, aMinute] = a.startTime.split(':').map(Number);
      const [bHour, bMinute] = b.startTime.split(':').map(Number);
      return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
    });
    
    const groups = [];
    let currentGroup = [sortedEvents[0]];
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const [currStartHour, currStartMinute] = currentEvent.startTime.split(':').map(Number);
      const currStartMinutes = currStartHour * 60 + currStartMinute;
      
      // Check if current event overlaps with any event in current group
      let overlaps = false;
      for (const groupEvent of currentGroup) {
        const [groupStartHour, groupStartMinute] = groupEvent.startTime.split(':').map(Number);
        const groupStartMinutes = groupStartHour * 60 + groupStartMinute;
        const groupEndMinutes = groupStartMinutes + groupEvent.duration;
        const currEndMinutes = currStartMinutes + currentEvent.duration;
        
        // Check for overlap
        if (currStartMinutes < groupEndMinutes && currEndMinutes > groupStartMinutes) {
          overlaps = true;
          break;
        }
      }
      
      if (overlaps) {
        currentGroup.push(currentEvent);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentEvent];
      }
    }
    
    groups.push(currentGroup);
    return groups;
  }
  
  renderDayView() {
    const container = document.getElementById('calendarView');
    container.innerHTML = '';
    
    const dayView = document.createElement('div');
    dayView.className = 'day-view';
    
    // Header
    const header = document.createElement('div');
    header.className = 'week-header';
    const dayName = this.currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' });
    header.innerHTML = `<div></div><div class="day-header-week">${dayName}</div>`;
    dayView.appendChild(header);
    
    // Time slots container
    const timeSlotsWrapper = document.createElement('div');
    
    for (let hour = 8; hour <= 20; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.className = 'time-slot';
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'time-label';
      timeLabel.textContent = this.formatHour(hour);
      timeSlot.appendChild(timeLabel);
      
      const hourCell = document.createElement('div');
      hourCell.className = 'hour-cell';
      
      const eventContainer = document.createElement('div');
      eventContainer.className = 'event-container';
      hourCell.appendChild(eventContainer);
      
      timeSlot.appendChild(hourCell);
      timeSlotsWrapper.appendChild(timeSlot);
    }
    
    dayView.appendChild(timeSlotsWrapper);
    container.appendChild(dayView);
    
    // Render events
    this.renderWeekEvents([this.currentDate], dayView);
  }
  
  getEventsForDate(date) {
    const dateStr = this.formatDateISO(date);
    return this.events.filter(event => {
      // If no filters are active, show all events
      if (this.activeFilters.length === 0) {
        return event.date === dateStr;
      }
      
      // Check if event has any team member that matches active filters
      let hasMatchingMember = false;
      
      if (event.teamMemberIds && Array.isArray(event.teamMemberIds)) {
        // New format: check if any team member is in active filters
        hasMatchingMember = event.teamMemberIds.some(id => this.activeFilters.includes(id));
      } else if (event.teamMemberId) {
        // Old format: backward compatibility
        hasMatchingMember = this.activeFilters.includes(event.teamMemberId);
      }
      
      if (!hasMatchingMember) {
        return false;
      }
      
      return event.date === dateStr;
    });
  }
  
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  
  isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  formatDate(date, format = 'short') {
    if (format === 'short') {
      return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    } else if (format === 'long') {
      return date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString();
  }
  
  formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatHour(hour) {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${suffix}`;
  }
  
  calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }
  
  // Admin-only methods
  async openModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const deleteBtn = document.getElementById('deleteBtn');
    
    this.editingEventId = eventId;
    
    // Populate team member checkboxes
    this.populateTeamMemberCheckboxes();
    
    // Initialize selected clients set
    this.selectedClientIds = new Set();
    
    // Populate client checkboxes
    this.populateClientCheckboxes();
    
    // Ensure programs are loaded; we'll populate after we set selectedProgramIds
      await this.loadPrograms();
      this.selectedProgramIds = new Set();
    
    // Reset repeating checkboxes
    ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach(id => {
      document.getElementById(id).checked = false;
    });
    
    if (eventId) {
      const event = this.events.find(e => e.id === eventId);
      if (event) {
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDetails').value = event.details || '';
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('startTime').value = event.startTime;
        document.getElementById('duration').value = event.duration;
        
        // Set public checkbox
        const isPublicCheckbox = document.getElementById('isPublic');
        if (isPublicCheckbox) {
          isPublicCheckbox.checked = event.isPublic || false;
        }
        
        // Set billable checkbox
        const isBillableCheckbox = document.getElementById('isBillable');
        if (isBillableCheckbox) {
          isBillableCheckbox.checked = event.isBillable !== false; // Default to true if not set
        }
        
        // Check team member checkboxes
        const teamMemberIds = event.teamMemberIds || [event.teamMemberId];
        teamMemberIds.forEach(id => {
          const checkbox = document.querySelector(`#teamMemberCheckboxes input[value="${id}"]`);
          if (checkbox) checkbox.checked = true;
        });
        
        // Preserve selected clients using state, then render the list
        if (event.clientIds) {
          this.selectedClientIds = new Set(event.clientIds.map(String));
        } else if (event.clientId) {
          // Backward compatibility with old single clientId
          this.selectedClientIds = new Set([String(event.clientId)]);
        }
        this.populateClientCheckboxes('');
        
        // Set repeating checkboxes
        if (event.repeating && event.repeating.length > 0) {
          const checkboxIds = ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'];
          event.repeating.forEach(day => {
            if (day >= 1 && day <= 5) {
              document.getElementById(checkboxIds[day - 1]).checked = true;
            }
          });
        }
        
        // Preserve selected programs using state, then render the list
        this.selectedProgramIds = new Set((event.programIds || []).map(String));
        this.populateProgramCheckboxes('');
        
        deleteBtn.style.display = 'block';
      }
    } else {
      form.reset();
      this.populateTeamMemberCheckboxes();
      this.selectedClientIds = new Set();
      this.populateClientCheckboxes();
      this.selectedProgramIds = new Set();
      this.populateProgramCheckboxes('');
      document.getElementById('eventDate').value = this.formatDateISO(this.currentDate);
      
      // Set default values for new events
      document.getElementById('eventType').value = 'therapy';
      document.getElementById('duration').value = '60';
      
      deleteBtn.style.display = 'none';
    }
    
    // Clear client search bar
    const clientSearchInput = document.getElementById('clientSearch');
    if (clientSearchInput) {
      clientSearchInput.value = '';
    }
    
    // Add event listener for event type changes to update title
    const eventTypeSelect = document.getElementById('eventType');
    if (eventTypeSelect) {
      // Remove any existing listener first
      const newEventTypeSelect = eventTypeSelect.cloneNode(true);
      eventTypeSelect.parentNode.replaceChild(newEventTypeSelect, eventTypeSelect);
      
      newEventTypeSelect.addEventListener('change', () => {
        this.updateEventTitle();
        
        // Auto-uncheck billable for pauza-masa and sedinta
        const isBillableCheckbox = document.getElementById('isBillable');
        if (newEventTypeSelect.value === 'pauza-masa' || newEventTypeSelect.value === 'sedinta') {
          if (isBillableCheckbox) {
            isBillableCheckbox.checked = false;
          }
        } else if (newEventTypeSelect.value !== 'day-off') {
          // Re-check billable for other types (except day-off)
          if (isBillableCheckbox) {
            isBillableCheckbox.checked = true;
          }
        }
      });
    }
    
    modal.classList.add('active');
  }

  
  
  populateTeamMemberCheckboxes() {
    const container = document.getElementById('teamMemberCheckboxes');
    container.innerHTML = '';
    
    if (this.teamMembers.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">Nu exista membri ai echipei</p>';
      return;
    }
    
    this.teamMembers.forEach(member => {
      const div = document.createElement('div');
      div.className = 'checkbox-item';
      div.innerHTML = `
        <input type="checkbox" id="team_${member.id}" value="${member.id}">
        <label for="team_${member.id}" style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${member.color};"></span>
          ${member.name}
        </label>
      `;
      container.appendChild(div);
    });
  }
  
  populateClientCheckboxes(searchTerm = '') {
    const container = document.getElementById('clientCheckboxes');
    if (!container) return;
    
    // Initialize selected clients set if not exists
    if (!this.selectedClientIds) this.selectedClientIds = new Set();
    
    container.innerHTML = '';
    
    if (this.clients.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">Nu exista clienti</p>';
      return;
    }
    
    // Filter clients based on search term
    const term = (searchTerm || '').toLowerCase();
    const filteredClients = term
      ? this.clients.filter(client =>
          client.name.toLowerCase().includes(term) ||
          (client.email && client.email.toLowerCase().includes(term)) ||
          (client.phone && client.phone.toLowerCase().includes(term))
        )
      : this.clients;
    
    if (filteredClients.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">Nu s-au gasit clienti.</p>';
      return;
    }
    
    filteredClients.forEach(client => {
      const idStr = String(client.id);
      const isChecked = this.selectedClientIds.has(idStr);
      
      const div = document.createElement('div');
      div.className = 'checkbox-item';
      div.innerHTML = `
        <input type="checkbox" id="client_${idStr}" value="${idStr}" ${isChecked ? 'checked' : ''}>
        <label for="client_${idStr}">${client.name}</label>
      `;
      container.appendChild(div);
    });
    
    // Keep the set in sync when user checks/unchecks
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idStr = String(e.target.value);
        if (e.target.checked) {
          this.selectedClientIds.add(idStr);
        } else {
          this.selectedClientIds.delete(idStr);
        }
        // Update event title based on selections
        this.updateEventTitle();
      });
    });
  }
  
  populateProgramCheckboxes(searchTerm = '') {
  const container = document.getElementById('programCheckboxes');
  if (!container) return;

  if (!this.selectedProgramIds) this.selectedProgramIds = new Set();

  container.innerHTML = '';

  if (!Array.isArray(this.programs) || this.programs.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary);">Nu exista programe disponibile.</p>';
    return;
  }

  const term = (searchTerm || '').toLowerCase();
  const filtered = term
    ? this.programs.filter(p =>
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      )
    : this.programs;

  filtered.forEach(program => {
    const idStr = String(program.id);
    const isChecked = this.selectedProgramIds.has(idStr);

    const div = document.createElement('div');
    div.className = 'checkbox-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'flex-start';
    div.style.padding = '0.5rem';
    div.style.marginBottom = '0.5rem';
    div.style.borderRadius = '0.25rem';

    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;width:100%;">
        <input type="checkbox" id="program_${idStr}" value="${idStr}" ${isChecked ? 'checked' : ''}>
        <label for="program_${idStr}" style="font-weight:600;cursor:pointer;flex:1;">${program.title || 'Program'}</label>
      </div>
      ${program.description ? `<p style="font-size:0.75rem;color:var(--text-secondary);margin:0.25rem 0 0 1.5rem;line-height:1.4;">${program.description}</p>` : ''}
    `;

    container.appendChild(div);
  });

  // Keep the set in sync when user checks/unchecks after any search
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const idStr = String(e.target.value);
      if (e.target.checked) {
        this.selectedProgramIds.add(idStr);
      } else {
        this.selectedProgramIds.delete(idStr);
      }
    });
  });
}
  
filterPrograms(searchTerm) {
  // Persist current checkbox states before re-rendering (handles typing/backspace)
  const container = document.getElementById('programCheckboxes');
  if (container) {
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const idStr = String(cb.value);
      if (cb.checked) {
        this.selectedProgramIds.add(idStr);
      } else {
        this.selectedProgramIds.delete(idStr);
      }
    });
  }
  this.populateProgramCheckboxes(searchTerm || '');
}

filterClients(searchTerm) {
  // Persist current checkbox states before re-rendering
  const container = document.getElementById('clientCheckboxes');
  if (container) {
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const idStr = String(cb.value);
      if (cb.checked) {
        this.selectedClientIds.add(idStr);
      } else {
        this.selectedClientIds.delete(idStr);
      }
    });
  }
  this.populateClientCheckboxes(searchTerm || '');
}

  closeModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('active');
    this.editingEventId = null;
  }
  
  editEvent(eventId) {
    this.openModal(eventId);
  }
  
  
  saveEvent(e) {
    e.preventDefault();

    // === 1. Collect selected values ===
    const teamMemberCheckboxes = document.querySelectorAll('#teamMemberCheckboxes input[type="checkbox"]:checked');
    const teamMemberIds = Array.from(teamMemberCheckboxes).map(cb => cb.value);

    if (teamMemberIds.length === 0) {
      showCustomAlert('Te rog selecteaza cel putin un membru al echipei', 'Validare');
      return;
    }

    const clientCheckboxes = document.querySelectorAll('#clientCheckboxes input[type="checkbox"]:checked');
    const clientIds = Array.from(clientCheckboxes).map(cb => cb.value);

    const programIds = Array.from(this.selectedProgramIds);

    const eventType = document.getElementById('eventType').value;
    const isPublic = document.getElementById('isPublic')?.checked || false;
    
    // Set isBillable based on event type - pauza-masa and sedinta are non-billable by default
    let isBillable;
    if (eventType === 'pauza-masa' || eventType === 'sedinta') {
      isBillable = false;
    } else {
      isBillable = document.getElementById('isBillable')?.checked !== false;
    }

    let startTime = document.getElementById('startTime').value;
    let duration = parseInt(document.getElementById('duration').value);

    // === 2. Handle day-off, pauza-masa, and sedinta events ===
    if (eventType === 'day-off' || eventType === 'pauza-masa' || eventType === 'sedinta') {
      if (!startTime) startTime = '08:00';
      if (!duration || isNaN(duration)) duration = 60; // Default to 1 hour for breaks/meetings
    }

    // === 3. Validation for other events ===
    if (eventType !== 'day-off' && eventType !== 'pauza-masa' && eventType !== 'sedinta') {
      if (!startTime) {
        showCustomAlert('Te rog selecteaza ora de incepere', 'Validare');
        return;
      }
      if (!duration || isNaN(duration)) {
        showCustomAlert('Te rog selecteaza durata', 'Validare');
        return;
      }
    }

    // === 4. Gather repeating days ===
    const repeatingDays = [];
    ['repeatMon', 'repeatTue', 'repeatWed', 'repeatThu', 'repeatFri'].forEach((id, index) => {
      if (document.getElementById(id).checked) {
        repeatingDays.push(index + 1); // Monday=1
      }
    });

    // === 5. Build the form data object ===
    const eventDetails = document.getElementById('eventDetails').value.trim();
    const formData = {
      name: document.getElementById('eventName').value,
      details: eventDetails || undefined, // Only include if not empty
      teamMemberIds,
      clientIds: clientIds.length > 0 ? clientIds : undefined,
      programIds: programIds.length > 0 ? programIds : undefined,
      type: eventType,
      isPublic,
      isBillable,
      date: document.getElementById('eventDate').value,
      startTime,
      duration,
      repeating: repeatingDays
    };

    // === 6. EDIT EXISTING EVENT ===
    if (this.editingEventId) {
      const index = this.events.findIndex(e => e.id === this.editingEventId);
      if (index > -1) {
        const oldEvent = this.events[index];

        const updatedEvent = {
          ...oldEvent,
          ...formData,
          id: this.editingEventId,
          clientIds: clientIds.length > 0 ? clientIds : oldEvent.clientIds,
          programIds: programIds.length > 0 ? programIds : oldEvent.programIds,
          comments: oldEvent.comments || ''
        };

        if (!updatedEvent.teamMemberIds && oldEvent.teamMemberId) {
          updatedEvent.teamMemberIds = [oldEvent.teamMemberId];
        }
        if (!updatedEvent.clientIds && oldEvent.clientId) {
          updatedEvent.clientIds = [oldEvent.clientId];
        }

        this.events[index] = updatedEvent;
        
        // If this is a recurring event, update all occurrences
        if (oldEvent.repeating && oldEvent.repeating.length > 0) {
          // Find all other events that match this recurring pattern
          const recurringEvents = this.events.filter(e => 
            e.id !== this.editingEventId && // Exclude the one we just updated
            e.name === oldEvent.name &&
            JSON.stringify(e.teamMemberIds || [e.teamMemberId]) === JSON.stringify(oldEvent.teamMemberIds || [oldEvent.teamMemberId]) &&
            e.startTime === oldEvent.startTime &&
            e.duration === oldEvent.duration &&
            JSON.stringify(e.repeating) === JSON.stringify(oldEvent.repeating)
          );
          
          // Update all matching recurring events
          recurringEvents.forEach(event => {
            const eventIndex = this.events.findIndex(e => e.id === event.id);
            if (eventIndex > -1) {
              this.events[eventIndex] = {
                ...this.events[eventIndex],
                name: formData.name,
                details: formData.details,
                teamMemberIds: formData.teamMemberIds,
                clientIds: formData.clientIds || this.events[eventIndex].clientIds,
                programIds: formData.programIds || this.events[eventIndex].programIds,
                type: formData.type,
                isPublic: formData.isPublic,
                isBillable: formData.isBillable,
                startTime: formData.startTime,
                duration: formData.duration,
                repeating: formData.repeating
              };
            }
          });
        }
      }

    // === 7. CREATE NEW EVENT(S) ===
    } else {
      if (repeatingDays.length > 0) {
        const startDate = new Date(formData.date);
        const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        let currentDate = new Date(startDate);

        while (currentDate <= endOfMonth) {
          const dayOfWeek = currentDate.getDay();
          const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
          if (repeatingDays.includes(adjustedDay)) {
            const newEvent = {
              id: 'evt' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              ...formData,
              date: this.formatDateISO(currentDate)
            };
            this.events.push(newEvent);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        const newEvent = {
          id: 'evt' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          ...formData
        };
        this.events.push(newEvent);
      }
    }

    // === 8. Finalize ===
    this.closeModal();
    this.render();
    this.saveData();

    console.log('Event saved successfully:', {
      editing: !!this.editingEventId,
      ...formData
    });
  }


  async deleteEvent() {
    if (this.editingEventId) {
      const event = this.events.find(e => e.id === this.editingEventId);
      
      if (event && event.repeating && event.repeating.length > 0) {
        // It's a repeating event - show three-button modal
        const choice = await showRecurringDeleteModal();
        
        if (choice === 'cancel') {
          // User cancelled - do nothing
          return;
        } else if (choice === 'all') {
          // Delete all occurrences
          this.events = this.events.filter(e => 
            !(e.name === event.name && 
              e.teamMemberId === event.teamMemberId && 
              e.startTime === event.startTime && 
              e.duration === event.duration &&
              JSON.stringify(e.repeating) === JSON.stringify(event.repeating))
          );
        } else if (choice === 'single') {
          // Delete only this occurrence
          const eventIndex = this.events.findIndex(e => e.id === this.editingEventId);
          if (eventIndex > -1) {
            this.events.splice(eventIndex, 1);
          }
        }
      } else {
        // Single event - just delete it
        const eventIndex = this.events.findIndex(e => e.id === this.editingEventId);
        if (eventIndex > -1) {
          this.events.splice(eventIndex, 1);
        }
      }
      
      this.closeModal();
      this.render();
      this.saveData(); // Persist changes
      console.log('Event deleted');
    }
  }
  
  // Team Management Methods
  openTeamModal() {
    const modal = document.getElementById('teamModal');
    this.renderTeamMembersList();
    this.resetTeamForm();
    modal.classList.add('active');
  }
  
  closeTeamModal() {
    const modal = document.getElementById('teamModal');
    modal.classList.remove('active');
    this.editingMemberId = null;
    this.resetTeamForm();
  }
  
  renderTeamMembersList() {
    const container = document.getElementById('teamMembersList');
    container.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Current Team Members</h3>';
    
    this.teamMembers.forEach(member => {
      const card = document.createElement('div');
      card.className = 'team-member-card';
      
      card.innerHTML = `
        <div class="team-member-info">
          <div class="team-member-avatar" style="background-color: ${member.color}">
            ${member.initials}
          </div>
          <div class="team-member-details">
            <div class="team-member-name">${member.name}</div>
            <div class="team-member-role">${this.translations.roles[member.role] || member.role}</div>
          </div>
        </div>
        <div class="team-member-actions">
          <button class="btn-icon btn-report" onclick="window.calendar.downloadTeamMemberReport('${member.id}')" title="Descarca Raport PDF">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="btn-icon" onclick="window.calendar.editTeamMember('${member.id}')" title="Editeaza">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon btn-delete" onclick="window.calendar.confirmDeleteMember('${member.id}')" title="Sterge">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      `;
      
      container.appendChild(card);
    });
  }
  
  editTeamMember(memberId) {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    this.editingMemberId = memberId;
    
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberInitials').value = member.initials;
    document.getElementById('memberColor').value = member.color;
    document.getElementById('memberColorHex').value = member.color.toUpperCase();
    document.getElementById('memberRole').value = member.role;
    
    document.getElementById('teamFormTitle').textContent = 'Edit Team Member';
    document.getElementById('deleteMemberBtn').style.display = 'block';
    
    // Scroll to form
    document.getElementById('teamMemberForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  resetTeamForm() {
  try {
    const form = document.getElementById('teamMemberForm');
    if (!form) return;

    // Ensure color input has a valid default before reset
    const colorInput = form.querySelector('input[type="color"]');
    if (colorInput && (!colorInput.value || !/^#[0-9A-F]{6}$/i.test(colorInput.value))) {
      colorInput.value = '#4f46e5'; // default Tempo blue-purple
    }

    form.reset();
    document.getElementById('teamFormTitle').textContent = 'Add New Team Member';
    document.getElementById('deleteMemberBtn').style.display = 'none';
    this.editingMemberId = null;

  } catch (err) {
    console.warn('⚠️ resetTeamForm skipped invalid color reset:', err);
  }
}

  
  saveTeamMember(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('memberName').value,
      initials: document.getElementById('memberInitials').value,
      color: document.getElementById('memberColor').value.toUpperCase(),
      role: document.getElementById('memberRole').value
    };
    
    if (this.editingMemberId) {
      // Edit existing member
      const memberIndex = this.teamMembers.findIndex(m => m.id === this.editingMemberId);
      if (memberIndex > -1) {
        this.teamMembers[memberIndex] = { 
          ...this.teamMembers[memberIndex], 
          ...formData 
        };
      }
    } else {
      // Add new member
      const newMember = {
        id: 'member_' + Date.now(),
        ...formData
      };
      this.teamMembers.push(newMember);
      
      // Add to active filters
      this.activeFilters.push(newMember.id);
    }
    
    // Update team member select in event form
    this.updateTeamMemberSelect();
    
    // Re-render everything
    this.renderTeamMembersList();
    this.renderFilters();
    this.render();
    this.resetTeamForm();
    this.saveData(); // Persist changes
    
    console.log('Team member saved:', formData);
  }
  
  async confirmDeleteMember(memberId) {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Check if member has events
    const memberEvents = this.events.filter(e => e.teamMemberId === memberId);
    
    let confirmMessage = `Esti sigur ca vrei sa stergi pe ${member.name}?`;
    if (memberEvents.length > 0) {
      confirmMessage += `\n\nAceasta va sterge si ${memberEvents.length} eveniment(e) asociat(e) cu acest membru al echipei.`;
    }
    
    const confirmed = await showCustomConfirm(confirmMessage, 'Sterge membru echipa');
    if (confirmed) {
      this.deleteTeamMember(memberId);
    }
  }
  
  deleteTeamMember(memberId) {
    // Remove member
    const memberIndex = this.teamMembers.findIndex(m => m.id === memberId);
    if (memberIndex > -1) {
      this.teamMembers.splice(memberIndex, 1);
    }
    
    // Remove member's events
    this.events = this.events.filter(e => e.teamMemberId !== memberId);
    
    // Remove from active filters
    const filterIndex = this.activeFilters.indexOf(memberId);
    if (filterIndex > -1) {
      this.activeFilters.splice(filterIndex, 1);
    }
    
    // Update UI
    this.updateTeamMemberSelect();
    this.renderTeamMembersList();
    this.renderFilters();
    this.render();
    this.resetTeamForm();
    this.saveData(); // Persist changes
    
    console.log('Team member deleted:', memberId);
  }
  
  updateTeamMemberSelect() {
    const select = document.getElementById('teamMember');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a team member</option>';
    
    this.teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.id;
      option.textContent = member.name;
      select.appendChild(option);
    });
    
    // Restore selection if still valid
    if (this.teamMembers.find(m => m.id === currentValue)) {
      select.value = currentValue;
    }
  }
  
  // Client Management Methods
  openClientModal() {
    const modal = document.getElementById('clientModal');
    this.renderClientsList();
    this.resetClientForm();
    
    // Setup search bar listener
    const searchBar = document.getElementById('clientSearchBar');
    if (searchBar) {
      // Remove old listener if exists
      searchBar.replaceWith(searchBar.cloneNode(true));
      const newSearchBar = document.getElementById('clientSearchBar');
      
      newSearchBar.addEventListener('input', (e) => {
        this.renderClientsList(e.target.value);
      });
      
      // Clear search on modal open
      newSearchBar.value = '';
    }
    
    modal.style.display = 'flex';
  modal.classList.add('active');
  }
  
  // ============================================
//  Close Client Modal
// ============================================
closeClientModal() {
  const modal = document.getElementById('clientModal');
  if (!modal) return;

  // Hide modal
  modal.style.display = 'none';
  modal.classList.remove('active');

  // Reset form and clear edit state
  this.resetClientForm();
  this.editingClientId = null;

  console.log('👋 Client modal closed');
}

  
  openQuickAddClient() {
    this.closeModal(); // Close event modal
    this.openClientModal(); // Open client modal
  }
  
  renderClientsList(searchTerm = '') {
    const container = document.getElementById('clientsList');
    container.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Current Clients</h3>';
    
    if (this.clients.length === 0) {
      container.innerHTML += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No clients yet. Add your first client below.</p>';
      return;
    }
    
    // Filter clients based on search term
    const term = searchTerm.toLowerCase();
    const filteredClients = term 
      ? this.clients.filter(client => 
          client.name.toLowerCase().includes(term) ||
          (client.email && client.email.toLowerCase().includes(term)) ||
          (client.phone && client.phone.toLowerCase().includes(term))
        )
      : this.clients;
    
    if (filteredClients.length === 0) {
      container.innerHTML += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Nu s-au gasit clienti care sa corespunda cautarii.</p>';
      return;
    }
    
    filteredClients.forEach(client => {
      // Calculate hours for current month
      const monthHours = this.calculateClientHours(client.id);
      
      const card = document.createElement('div');
      card.className = 'client-card';
      
      const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      

      /// CLIENT CARD ////
      // Helper: format date as DD.MM.YYYY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Helper: calculate age from birthdate
function getAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}


      card.innerHTML = `
  <div class="client-info">
    <div class="client-avatar">${initials}</div>
    <div class="client-details">
      <div class="client-name">${client.name}</div>
      ${
        client.birthDate
          ? `<div class="client-birthday"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cake2-fill" viewBox="0 0 16 16">
  <path d="m2.899.804.595-.792.598.79A.747.747 0 0 1 4 1.806v4.886q-.532-.09-1-.201V1.813a.747.747 0 0 1-.1-1.01ZM13 1.806v4.685a15 15 0 0 1-1 .201v-4.88a.747.747 0 0 1-.1-1.007l.595-.792.598.79A.746.746 0 0 1 13 1.806m-3 0a.746.746 0 0 0 .092-1.004l-.598-.79-.595.792A.747.747 0 0 0 9 1.813v5.17q.512-.02 1-.055zm-3 0v5.176q-.512-.018-1-.054V1.813a.747.747 0 0 1-.1-1.01l.595-.79.598.789A.747.747 0 0 1 7 1.806"/>
  <path d="M4.5 6.988V4.226a23 23 0 0 1 1-.114V7.16c0 .131.101.24.232.25l.231.017q.498.037 1.02.055l.258.01a.25.25 0 0 0 .26-.25V4.003a29 29 0 0 1 1 0V7.24a.25.25 0 0 0 .258.25l.259-.009q.52-.018 1.019-.055l.231-.017a.25.25 0 0 0 .232-.25V4.112q.518.047 1 .114v2.762a.25.25 0 0 0 .292.246l.291-.049q.547-.091 1.033-.208l.192-.046a.25.25 0 0 0 .192-.243V4.621c.672.184 1.251.409 1.677.678.415.261.823.655.823 1.2V13.5c0 .546-.408.94-.823 1.201-.44.278-1.043.51-1.745.696-1.41.376-3.33.603-5.432.603s-4.022-.227-5.432-.603c-.702-.187-1.305-.418-1.745-.696C.408 14.44 0 14.046 0 13.5v-7c0-.546.408-.94.823-1.201.426-.269 1.005-.494 1.677-.678v2.067c0 .116.08.216.192.243l.192.046q.486.116 1.033.208l.292.05a.25.25 0 0 0 .291-.247M1 8.82v1.659a1.935 1.935 0 0 0 2.298.43.935.935 0 0 1 1.08.175l.348.349a2 2 0 0 0 2.615.185l.059-.044a1 1 0 0 1 1.2 0l.06.044a2 2 0 0 0 2.613-.185l.348-.348a.94.94 0 0 1 1.082-.175c.781.39 1.718.208 2.297-.426V8.833l-.68.907a.94.94 0 0 1-1.17.276 1.94 1.94 0 0 0-2.236.363l-.348.348a1 1 0 0 1-1.307.092l-.06-.044a2 2 0 0 0-2.399 0l-.06.044a1 1 0 0 1-1.306-.092l-.35-.35a1.935 1.935 0 0 0-2.233-.362.935.935 0 0 1-1.168-.277z"/>
</svg> ${formatDate(client.birthDate)} (${getAge(client.birthDate)} ani)</div>`
          : ''
      }
      <div class="client-contact">
        ${client.email ? `<span>${client.email}</span>` : '<span>No email</span>'}
        ${client.phone ? `<span class="contact-separator">⦁</span><span>${client.phone}</span>` : ''}
      </div>
    </div>
  </div>
  <div class="client-stats">
    <div class="client-hours">${monthHours}</div>
    <div class="client-hours-label">hours this month</div>
  </div>
  <div class="client-actions">
    <button class="btn-icon" onclick="window.calendar.showEvolution('${client.id}')" title="Evolutie">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18"/><path d="M18 17V9l-5 5-4-4-6 6"/>
      </svg>
    </button>
    <button class="btn-icon btn-report" onclick="window.calendar.downloadReport('${client.id}')" title="Descarca Raport PDF">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </button>
    <button class="btn-icon btn-email" onclick="window.calendar.emailReport('${client.id}')" title="Trimite Raport pe Email">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    </button>
    <button class="btn-icon" onclick="window.calendar.editClient('${client.id}')" title="Editeaza">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
    <button class="btn-icon btn-delete" onclick="window.calendar.confirmDeleteClient('${client.id}')" title="Sterge">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    </button>
  </div>
`;

      
      container.appendChild(card);
    });
  }
  
  calculateClientHours(clientId) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const monthEvents = this.events.filter(event => {
      // Check both old clientId and new clientIds array
      const hasClient = event.clientId === clientId || 
                       (event.clientIds && event.clientIds.includes(clientId));
      if (!hasClient) return false;
      
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
    
    const totalMinutes = monthEvents.reduce((sum, event) => sum + event.duration, 0);
    return (totalMinutes / 60).toFixed(1);
  }
  
  editClient(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    this.editingClientId = clientId;
    
    document.getElementById('clientFullName').value = client.name;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientBirthdayInput').value = client.birthDate || '';
    
    document.getElementById('clientFormTitle').textContent = 'Edit Client';
    document.getElementById('deleteClientBtn').style.display = 'block';
    
    // Scroll to form
    document.getElementById('clientForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  resetClientForm() {
    document.getElementById('clientForm').reset();
    document.getElementById('clientFormTitle').textContent = 'Add New Client';
    document.getElementById('deleteClientBtn').style.display = 'none';
    this.editingClientId = null;
  }

  // ============================================
// Save or update a client
// ============================================
async saveClient(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('clientFullName').value.trim(),
    email: document.getElementById('clientEmail').value.trim(),
    phone: document.getElementById('clientPhone').value.trim(),
    birthDate: document.getElementById('clientBirthdayInput')?.value || null
  };

  if (!formData.name) {
    alert('Introduceți numele complet al clientului.');
    return;
  }

  if (this.editingClientId) {
    const clientIndex = this.clients.findIndex(c => c.id === this.editingClientId);
    if (clientIndex > -1) {
      this.clients[clientIndex] = { ...this.clients[clientIndex], ...formData };
    }
  } else {
    const newClient = { id: 'client_' + Date.now(), ...formData };
    this.clients.push(newClient);
  }

  // Refresh UI
  this.updateClientSelect();
  this.renderClientsList();

  // Persist
  await this.saveData();

  // Reset everything cleanly
  this.resetClientForm();
  this.editingClientId = null; // ✅ ensure no stale edit state
  document.getElementById('clientModal').style.display = 'none';
}


  

// Save the entire dataset (clients, team members, events) to the backend
async saveData() {
  try {
    const payload = {
      teamMembers: this.teamMembers || [],
      clients: this.clients || [],
      events: this.events || []
    };

    console.log('💾 Saving data to server...', payload);

    const response = await fetch('api.php?path=data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Server response:', text);
      throw new Error(`Save failed (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ Data saved successfully:', result);
    return true;
  } catch (err) {
    console.error('❌ Error saving data:', err);
    alert('Eroare la salvarea datelor. Verificați conexiunea la server.');
    return false;
  }
}



  
  async confirmDeleteClient(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Check if client has events
    const clientEvents = this.events.filter(e => e.clientId === clientId);
    
    let confirmMessage = `Esti sigur ca vrei sa stergi pe ${client.name}?`;
    if (clientEvents.length > 0) {
      confirmMessage += `\n\nAcest client are ${clientEvents.length} eveniment(e). Evenimentele vor ramane dar nu vor mai fi legate de un client.`;
    }
    
    const confirmed = await showCustomConfirm(confirmMessage, 'Sterge client');
    if (confirmed) {
      this.deleteClient(clientId);
    }
  }
  
  deleteClient(clientId) {
    // Remove client
    const clientIndex = this.clients.findIndex(c => c.id === clientId);
    if (clientIndex > -1) {
      this.clients.splice(clientIndex, 1);
    }
    
    // Remove clientId from events (but keep the events)
    this.events.forEach(event => {
      if (event.clientId === clientId) {
        delete event.clientId;
      }
    });
    
    // Update UI
    this.updateClientSelect();
    this.renderClientsList();
    this.resetClientForm();
    this.saveData(); // Persist changes
    
    console.log('Client deleted:', clientId);
  }
  
  // Report Generation Methods
  downloadReport(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      showCustomAlert('Client negasit.', 'Eroare');
      return;
    }

    // Generate report data
    const reportData = this.generateClientReport(clientId);
    if (!reportData) {
      showCustomAlert('Nu s-au gasit date pentru acest client in luna curenta.', 'Eroare');
      return;
    }

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlReport;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    document.body.appendChild(tempDiv);
    
    // Use html2canvas and jsPDF to generate PDF
    const content = tempDiv.querySelector('body') || tempDiv;
    
    html2canvas(content, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794, // A4 width in pixels at 96 DPI
      windowWidth: 794
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Get current month name for filename
      const monthName = this.currentDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');
      const filename = `Raport_${client.name.replace(/\s+/g, '_')}_${monthName}.pdf`;
      
      // Auto-download the PDF
      pdf.save(filename);
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      showCustomAlert('Raportul a fost descarcat cu succes!', 'Success');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      document.body.removeChild(tempDiv);
      showCustomAlert('Eroare la generarea PDF-ului. Va rugam incercati din nou.', 'Eroare');
    });
  }

  emailReport(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      alert('Clientul nu a fost gasit.');
      return;
    }

    if (!client.email) {
      alert('Clientul nu are o adresa de email salvata. Va rugam adaugati un email in profilul clientului.');
      return;
    }

    const reportData = this.generateClientReport(clientId);
    if (!reportData) {
      alert('Nu s-au gasit date pentru acest client.');
      return;
    }

    const confirmed = confirm(
      `Doriti sa trimiteti raportul la ${client.email}?\n\n` +
      `Nota: Pentru a functiona, este nevoie de configurare backend pentru trimitere email.`
    );

    if (!confirmed) return;

    alert(
      `Functionalitate Email:\n\n` +
      `In implementarea completa, raportul PDF ar fi trimis la:\n${client.email}\n\n` +
      `Pentru a activa aceasta functie, este nevoie de:\n` +
      `1. Un server backend (Node.js/PHP/Python)\n` +
      `2. Serviciu de email (SendGrid/AWS SES/SMTP)\n` +
      `3. API endpoint pentru generare PDF si trimitere email\n\n` +
      `Deocamdata, folositi butonul "Descarca Raport" pentru a salva PDF-ul manual.`
    );
  }

  // Team Member Report Functions
  downloadTeamMemberReport(memberId) {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (!member) {
      alert('Membrul echipei nu a fost gasit.');
      return;
    }

    const reportData = this.generateTeamMemberReport(memberId);
    if (!reportData) {
      alert('Nu s-au gasit date pentru acest membru al echipei.');
      return;
    }

    const htmlContent = this.generateTeamMemberHTMLReport(reportData);
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raport_${member.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Raportul a fost descarcat!\n\nPuteti deschide fisierul HTML in browser si apoi salva ca PDF folosind Print â†’ Save as PDF.');
  }

  generateTeamMemberReport(memberId) {
    const member = this.teamMembers.find(m => m.id === memberId);
    if (!member) return null;

    // Get all events for this team member
    const memberEvents = this.events.filter(event => {
      const teamMemberIds = event.teamMemberIds || [event.teamMemberId];
      return teamMemberIds.includes(memberId);
    });

    if (memberEvents.length === 0) {
      return null;
    }

    // Separate billable and non-billable events
    const billableEvents = memberEvents.filter(e => e.isBillable !== false && e.type !== 'day-off' && e.type !== 'pauza-masa' && e.type !== 'sedinta');
    const nonBillableEvents = memberEvents.filter(e => e.isBillable === false || e.type === 'day-off' || e.type === 'pauza-masa' || e.type === 'sedinta');

    // Process events grouped by client
    const billableData = this.processTeamMemberEventsForReport(billableEvents, memberId);
    const nonBillableData = this.processTeamMemberEventsForReport(nonBillableEvents, memberId);

    return {
      member,
      billable: billableData,
      nonBillable: nonBillableData
    };
  }

  processTeamMemberEventsForReport(events, memberId) {
    const monthlyData = {};
    const clientTotals = {};
    let totalHours = 0;

    events.forEach(event => {
      if (!event.startTime || !event.duration) return;

      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = eventDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthName,
          clients: {},
          total: 0
        };
      }

      // Calculate hours for this event
      const hours = event.duration / 60;

      // Get client names
      const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
      
      if (clientIds.length === 0) {
        // For events without clients (like coordination, day-off)
        const eventLabel = this.getEventTypeLabel(event.type) || event.name;
        
        if (!monthlyData[monthKey].clients[eventLabel]) {
          monthlyData[monthKey].clients[eventLabel] = 0;
        }
        monthlyData[monthKey].clients[eventLabel] += hours;
        
        if (!clientTotals[eventLabel]) {
          clientTotals[eventLabel] = 0;
        }
        clientTotals[eventLabel] += hours;
      } else {
        // For events with clients
        clientIds.forEach(clientId => {
          const client = this.clients.find(c => c.id === clientId);
          const clientName = client ? client.name : 'Client necunoscut';

          if (!monthlyData[monthKey].clients[clientName]) {
            monthlyData[monthKey].clients[clientName] = 0;
          }
          monthlyData[monthKey].clients[clientName] += hours;

          if (!clientTotals[clientName]) {
            clientTotals[clientName] = 0;
          }
          clientTotals[clientName] += hours;
        });
      }

      monthlyData[monthKey].total += hours;
      totalHours += hours;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();

    return {
      monthlyData,
      clientTotals,
      sortedMonths,
      grandTotal: totalHours
    };
  }

  generateTeamMemberHTMLReport(reportData) {
    const { member, billable, nonBillable } = reportData;

    // Generate billable section
    let billableMonthRows = '';
    if (billable.sortedMonths.length > 0) {
      billable.sortedMonths.forEach(monthKey => {
        const month = billable.monthlyData[monthKey];
        const clientsList = Object.entries(month.clients)
          .sort((a, b) => b[1] - a[1])
          .map(([name, hours]) => `${name}: ${hours.toFixed(1)}h`)
          .join('<br>');

        billableMonthRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${month.monthName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${clientsList}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <div style="font-weight: 600;">${month.total.toFixed(1)} ore</div>
            </td>
          </tr>
        `;
      });
    }

    let billableClientSummary = '';
    if (Object.keys(billable.clientTotals).length > 0) {
      Object.entries(billable.clientTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, hours]) => {
          billableClientSummary += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <div style="font-weight: 600;">${hours.toFixed(1)} ore</div>
              </td>
            </tr>
          `;
        });
    }

    // Generate non-billable section
    let nonBillableMonthRows = '';
    if (nonBillable.sortedMonths.length > 0) {
      nonBillable.sortedMonths.forEach(monthKey => {
        const month = nonBillable.monthlyData[monthKey];
        const clientsList = Object.entries(month.clients)
          .sort((a, b) => b[1] - a[1])
          .map(([name, hours]) => `${name}: ${hours.toFixed(1)}h`)
          .join('<br>');

        nonBillableMonthRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${month.monthName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${clientsList}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <div style="font-weight: 600;">${month.total.toFixed(1)} ore</div>
            </td>
          </tr>
        `;
      });
    }

    let nonBillableClientSummary = '';
    if (Object.keys(nonBillable.clientTotals).length > 0) {
      Object.entries(nonBillable.clientTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, hours]) => {
          nonBillableClientSummary += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <div style="font-weight: 600;">${hours.toFixed(1)} ore</div>
              </td>
            </tr>
          `;
        });
    }

    const billableSection = billableMonthRows ? `
      <h2>Sesiuni Facturabile</h2>
      <table>
        <thead>
          <tr>
            <th>Luna</th>
            <th>Clienti</th>
            <th style="text-align: right;">Total Ore</th>
          </tr>
        </thead>
        <tbody>
          ${billableMonthRows}
          <tr class="total-row">
            <td colspan="2">TOTAL FACTURABIL</td>
            <td style="text-align: right;">${billable.grandTotal.toFixed(1)} ore</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box">
        <h3>Rezumat Facturabil pe Clienti</h3>
        <table style="box-shadow: none;">
          <thead>
            <tr>
              <th>Client</th>
              <th style="text-align: right;">Total Ore</th>
            </tr>
          </thead>
          <tbody>
            ${billableClientSummary}
          </tbody>
        </table>
      </div>
    ` : '';

    const nonBillableSection = nonBillableMonthRows ? `
      <h2 style="margin-top: 40px;">Sesiuni Non-Facturabile (Gratuite/Admin/Concedii)</h2>
      <table>
        <thead>
          <tr>
            <th>Luna</th>
            <th>Clienti / Activitati</th>
            <th style="text-align: right;">Total Ore</th>
          </tr>
        </thead>
        <tbody>
          ${nonBillableMonthRows}
          <tr class="total-row" style="background: #f3f4f6 !important;">
            <td colspan="2">TOTAL NON-FACTURABIL</td>
            <td style="text-align: right;">${nonBillable.grandTotal.toFixed(1)} ore</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box" style="background: #f9fafb; border-left-color: #9ca3af;">
        <h3 style="color: #6b7280;">Rezumat Non-Facturabil</h3>
        <table style="box-shadow: none;">
          <thead>
            <tr>
              <th style="background: #9ca3af;">Client / Activitate</th>
              <th style="background: #9ca3af; text-align: right;">Total Ore</th>
            </tr>
          </thead>
          <tbody>
            ${nonBillableClientSummary}
          </tbody>
        </table>
      </div>
    ` : '';

    const combinedTotal = billable.grandTotal + nonBillable.grandTotal;
    
    const grandTotalSection = combinedTotal > 0 ? `
      <div class="summary-box" style="background: #dbeafe; border-left-color: ${member.color}; margin-top: 30px;">
        <h3 style="color: #1e40af;">Total General (Toate Sesiunile)</h3>
        <table style="box-shadow: none;">
          <tbody>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Total Ore Lucrate:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${combinedTotal.toFixed(1)} ore</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Ore Facturabile:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${billable.grandTotal.toFixed(1)} ore</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Ore Non-Facturabile:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${nonBillable.grandTotal.toFixed(1)} ore</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Raport Activitate - ${member.name}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${member.color};
          }
          .logo {
            height: 60px;
          }
          h1 {
            color: ${member.color};
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          h2 {
            color: #1f2937;
            margin: 30px 0 15px 0;
            font-size: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .member-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid ${member.color};
          }
          .member-info p {
            margin: 8px 0;
            font-size: 14px;
          }
          .member-info strong {
            color: ${member.color};
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th {
            background: ${member.color};
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:hover {
            background: #f9fafb;
          }
          .total-row {
            background: #e0f2fe !important;
            font-weight: bold;
            font-size: 16px;
          }
          .total-row td {
            padding: 15px 12px !important;
            border-top: 2px solid ${member.color};
          }
          .summary-box {
            background: #f0f9ff;
            border-left: 4px solid ${member.color};
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .summary-box h3 {
            margin: 0 0 15px 0;
            color: ${member.color};
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="logo.png" alt="Live Better Life" style="height: 60px; width: auto;" onerror="this.style.display='none'">
            <div>
              
            </div>
          </div>
          <div style="text-align: right;">
            <h1>Raport Activitate</h1>
            <p style="margin: 0; color: #6b7280;">Generat: ${new Date().toLocaleDateString('ro-RO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>

        <div class="member-info">
          <h2 style="margin-top: 0;">Informatii Terapeut</h2>
          <p><strong>Nume:</strong> ${member.name}</p>
          <p><strong>Rol:</strong> ${this.translations.roles[member.role] || member.role}</p>
          <p><strong>Initiale:</strong> ${member.initials}</p>
        </div>

        ${billableSection}
        ${nonBillableSection}
        ${grandTotalSection}

        <div class="footer">
          <p><strong>Live Better Life</strong> - Raport generat automat</p>
          <p>Pentru intrebari, va rugam contactati echipa noastra</p>
        </div>
      </body>
      </html>
    `;
  }

  emailReport(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      alert('Client negasit.');
      return;
    }

    if (!client.email) {
      alert('Clientul nu are o adresa de email salvata. Va rugam adaugati un email in profilul clientului.');
      return;
    }

    const reportData = this.generateClientReport(clientId);
    if (!reportData) {
      alert('Nu s-au gasit date pentru acest client.');
      return;
    }

    const confirmed = confirm(
      `Doriti sa trimiteti raportul la ${client.email}?\n\n` +
      `Nota: Pentru a functiona, este nevoie de configurare backend pentru trimitere email.`
    );

    if (!confirmed) return;

    alert(
      `Functionalitate Email:\n\n` +
      `In implementarea completa, raportul PDF ar fi trimis la:\n${client.email}\n\n` +
      `Pentru a activa aceasta functie, este nevoie de:\n` +
      `1. Un server backend (Node.js/PHP/Python)\n` +
      `2. Serviciu de email (SendGrid/AWS SES/SMTP)\n` +
      `3. API endpoint pentru generare PDF si trimitere email\n\n` +
      `Deocamdata, folositi butonul "Descarca Raport" pentru a salva PDF-ul manual.`
    );
  }

  generateClientReport(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return null;

    // Get the current displayed month/year
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth();

    // Get all events for this client filtered by current month
    const clientEvents = this.events.filter(event => {
      const isClientEvent = (event.clientId === clientId) || 
                           (event.clientIds && event.clientIds.includes(clientId));
      
      if (!isClientEvent) return false;
      
      // Filter by current month
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === currentYear && 
             eventDate.getMonth() === currentMonth;
    });

    if (clientEvents.length === 0) {
      return null;
    }

    // Separate billable and non-billable events
    const billableEvents = clientEvents.filter(e => e.isBillable !== false);
    const nonBillableEvents = clientEvents.filter(e => e.isBillable === false);

    // Process billable events with clientId for attendance tracking
    const billableData = this.processEventsForReport(billableEvents, clientId);
    
    // Process non-billable events with clientId for attendance tracking
    const nonBillableData = this.processEventsForReport(nonBillableEvents, clientId);

    return {
      client,
      billable: billableData,
      nonBillable: nonBillableData
    };
  }

  processEventsForReport(events, clientId) {
    const monthlyData = {};
    const therapistTotals = {};
    let totalHours = 0;
    let presentHours = 0;
    let absentHours = 0;

    events.forEach(event => {
      if (!event.startTime || !event.duration) return;

      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = eventDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthName,
          therapists: {},
          total: 0,
          present: 0,
          absent: 0
        };
      }

      // Calculate hours for this event
      const hours = event.duration / 60;
      
      // Check attendance status for this specific client
      const attendance = (event.attendance && event.attendance[clientId]) || 'present';
      const isPresent = attendance === 'present';

      // Get therapist names - handle both old and new structure
      const teamMemberIds = event.teamMemberIds || event.teamMembers || (event.teamMember ? [event.teamMember] : []);
      
      // Add to monthly total ONCE per event (not per therapist)
      monthlyData[monthKey].total += hours;
      if (isPresent) {
        monthlyData[monthKey].present += hours;
        presentHours += hours;
      } else {
        monthlyData[monthKey].absent += hours;
        absentHours += hours;
      }
      totalHours += hours;
      
      // Then distribute to therapists
      teamMemberIds.forEach(memberId => {
        const member = this.teamMembers.find(m => m.id === memberId);
        if (member) {
          const therapistName = member.name;

          // Add to monthly therapist data
          if (!monthlyData[monthKey].therapists[therapistName]) {
            monthlyData[monthKey].therapists[therapistName] = {
              total: 0,
              present: 0,
              absent: 0
            };
          }
          monthlyData[monthKey].therapists[therapistName].total += hours;
          if (isPresent) {
            monthlyData[monthKey].therapists[therapistName].present += hours;
          } else {
            monthlyData[monthKey].therapists[therapistName].absent += hours;
          }

          // Add to therapist totals
          if (!therapistTotals[therapistName]) {
            therapistTotals[therapistName] = {
              total: 0,
              present: 0,
              absent: 0
            };
          }
          therapistTotals[therapistName].total += hours;
          if (isPresent) {
            therapistTotals[therapistName].present += hours;
          } else {
            therapistTotals[therapistName].absent += hours;
          }
        }
      });
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();

    return {
      monthlyData,
      therapistTotals,
      sortedMonths,
      grandTotal: totalHours,
      presentTotal: presentHours,
      absentTotal: absentHours
    };
  }

  generateHTMLReport(reportData) {
    const { client, billable, nonBillable } = reportData;

    // Generate billable section
    let billableMonthRows = '';
    if (billable.sortedMonths.length > 0) {
      billable.sortedMonths.forEach(monthKey => {
        const month = billable.monthlyData[monthKey];
        const therapistsList = Object.entries(month.therapists)
          .map(([name, stats]) => `${name}: ${stats.total.toFixed(1)}h (P: ${stats.present.toFixed(1)}h, A: ${stats.absent.toFixed(1)}h)`)
          .join('<br>');

        billableMonthRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${month.monthName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${therapistsList}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <div style="font-weight: 600;">${month.total.toFixed(1)} ore</div>
              <div style="font-size: 0.75rem; color: #6b7280;">
                P: ${month.present.toFixed(1)}h | A: ${month.absent.toFixed(1)}h
              </div>
            </td>
          </tr>
        `;
      });
    }

    let billableTherapistSummary = '';
    if (Object.keys(billable.therapistTotals).length > 0) {
      Object.entries(billable.therapistTotals)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, stats]) => {
          billableTherapistSummary += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <div style="font-weight: 600;">${stats.total.toFixed(1)} ore</div>
                <div style="font-size: 0.75rem; color: #6b7280;">
                  Prezent: ${stats.present.toFixed(1)}h | Absent: ${stats.absent.toFixed(1)}h
                </div>
              </td>
            </tr>
          `;
        });
    }

    // Generate non-billable section
    let nonBillableMonthRows = '';
    if (nonBillable.sortedMonths.length > 0) {
      nonBillable.sortedMonths.forEach(monthKey => {
        const month = nonBillable.monthlyData[monthKey];
        const therapistsList = Object.entries(month.therapists)
          .map(([name, stats]) => `${name}: ${stats.total.toFixed(1)}h (P: ${stats.present.toFixed(1)}h, A: ${stats.absent.toFixed(1)}h)`)
          .join('<br>');

        nonBillableMonthRows += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${month.monthName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${therapistsList}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
              <div style="font-weight: 600;">${month.total.toFixed(1)} ore</div>
              <div style="font-size: 0.75rem; color: #6b7280;">
                P: ${month.present.toFixed(1)}h | A: ${month.absent.toFixed(1)}h
              </div>
            </td>
          </tr>
        `;
      });
    }

    let nonBillableTherapistSummary = '';
    if (Object.keys(nonBillable.therapistTotals).length > 0) {
      Object.entries(nonBillable.therapistTotals)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, stats]) => {
          nonBillableTherapistSummary += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <div style="font-weight: 600;">${stats.total.toFixed(1)} ore</div>
                <div style="font-size: 0.75rem; color: #6b7280;">
                  Prezent: ${stats.present.toFixed(1)}h | Absent: ${stats.absent.toFixed(1)}h
                </div>
              </td>
            </tr>
          `;
        });
    }

    const billableSection = billableMonthRows ? `
      <h2>Sesiuni Facturabile</h2>
      <table>
        <thead>
          <tr>
            <th>Luna</th>
            <th>Terapeuti</th>
            <th style="text-align: right;">Total Ore</th>
          </tr>
        </thead>
        <tbody>
          ${billableMonthRows}
          <tr class="total-row">
            <td colspan="2">TOTAL FACTURABIL</td>
            <td style="text-align: right;">${billable.grandTotal.toFixed(1)} ore</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box">
        <h3>Rezumat Facturabil pe Terapeuti</h3>
        <table style="box-shadow: none;">
          <thead>
            <tr>
              <th>Terapeut</th>
              <th style="text-align: right;">Total Ore</th>
            </tr>
          </thead>
          <tbody>
            ${billableTherapistSummary}
          </tbody>
        </table>
      </div>
    ` : '';

    const nonBillableSection = nonBillableMonthRows ? `
      <h2 style="margin-top: 40px;">Sesiuni Non-Facturabile (Gratuite/Admin)</h2>
      <table>
        <thead>
          <tr>
            <th>Luna</th>
            <th>Terapeuti</th>
            <th style="text-align: right;">Total Ore</th>
          </tr>
        </thead>
        <tbody>
          ${nonBillableMonthRows}
          <tr class="total-row" style="background: #f3f4f6 !important;">
            <td colspan="2">TOTAL NON-FACTURABIL</td>
            <td style="text-align: right;">${nonBillable.grandTotal.toFixed(1)} ore</td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box" style="background: #f9fafb; border-left-color: #9ca3af;">
        <h3 style="color: #6b7280;">Rezumat Non-Facturabil pe Terapeuti</h3>
        <table style="box-shadow: none;">
          <thead>
            <tr>
              <th style="background: #9ca3af;">Terapeut</th>
              <th style="background: #9ca3af; text-align: right;">Total Ore</th>
            </tr>
          </thead>
          <tbody>
            ${nonBillableTherapistSummary}
          </tbody>
        </table>
      </div>
    ` : '';

    const combinedTotal = billable.grandTotal + nonBillable.grandTotal;
    const combinedPresent = billable.presentTotal + nonBillable.presentTotal;
    const combinedAbsent = billable.absentTotal + nonBillable.absentTotal;
    
    const grandTotalSection = combinedTotal > 0 ? `
      <div class="summary-box" style="background: #dbeafe; border-left-color: #3b82f6; margin-top: 30px;">
        <h3 style="color: #1e40af;">Total General (Toate Sesiunile)</h3>
        <table style="box-shadow: none;">
          <tbody>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Total Ore:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${combinedTotal.toFixed(1)} ore</td>
            </tr>
            <tr style="background: #e0f2fe;">
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; padding-left: 24px;">Ore Prezent:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">${combinedPresent.toFixed(1)} ore</td>
            </tr>
            <tr style="background: #e0f2fe;">
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; padding-left: 24px;">Ore Absent:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #dc2626;">${combinedAbsent.toFixed(1)} ore</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Ore Facturabile:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${billable.grandTotal.toFixed(1)} ore</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Ore Non-Facturabile:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${nonBillable.grandTotal.toFixed(1)} ore</td>
            </tr>
          </tbody>
        </table>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Raport Terapie - ${client.name}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4A90E2;
          }
          .logo {
            height: 60px;
          }
          h1 {
            color: #4A90E2;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          h2 {
            color: #1f2937;
            margin: 30px 0 15px 0;
            font-size: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .client-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .client-info p {
            margin: 8px 0;
            font-size: 14px;
          }
          .client-info strong {
            color: #4A90E2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th {
            background: #4A90E2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          tr:hover {
            background: #f9fafb;
          }
          .total-row {
            background: #e0f2fe !important;
            font-weight: bold;
            font-size: 16px;
          }
          .total-row td {
            padding: 15px 12px !important;
            border-top: 2px solid #4A90E2;
          }
          .summary-box {
            background: #f0f9ff;
            border-left: 4px solid #4A90E2;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .summary-box h3 {
            margin: 0 0 15px 0;
            color: #4A90E2;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="logo.png" alt="Live Better Life" style="height: 60px; width: auto;" onerror="this.style.display='none'">
            <div>
              
            </div>
          </div>
          <div style="text-align: right;">
            <h1>Raport Terapie</h1>
            <p style="margin: 0; color: #6b7280;">Generat: ${new Date().toLocaleDateString('ro-RO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>

        <div class="client-info">
          <h2 style="margin-top: 0;">Informatii Client</h2>
          <p><strong>Nume:</strong> ${client.name}</p>
          ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
          ${client.phone ? `<p><strong>Telefon:</strong> ${client.phone}</p>` : ''}
        </div>

        ${billableSection}
        ${nonBillableSection}
        ${grandTotalSection}

        <div class="footer">
          <p><strong>Live Better Life</strong> - Raport generat automat</p>
          <p>Pentru intrebari, va rugam contactati echipa noastra</p>
        </div>
      </body>
      </html>
    `;
  }
  
  updateClientSelect() {
    const select = document.getElementById('clientName');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a client</option>';
    
    this.clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      select.appendChild(option);
    });
    
    // Restore selection if still valid
    if (this.clients.find(c => c.id === currentValue)) {
      select.value = currentValue;
    }
  }

async loadEvolutionData() {
  try {
    const res = await fetch('evolution.json');
    if (!res.ok) throw new Error('Cannot load evolution data');
    this.evolutionData = await res.json();
  } catch (err) {
    console.error('Failed to load evolution data:', err);
    this.evolutionData = {};
  }
}

async saveProgramHistory(event) {
  // Only save if event has program scores and clients
  if (!event.programScores || Object.keys(event.programScores).length === 0) return;
  if (!event.clientIds || event.clientIds.length === 0) return;
  
  // Load evolution data if not loaded
  if (!this.evolutionData) await this.loadEvolutionData();
  
  const eventDate = event.date;
  
  // For each client in the event
  event.clientIds.forEach(clientId => {
    if (!this.evolutionData[clientId]) {
      this.evolutionData[clientId] = {
        name: this.clients.find(c => c.id === clientId)?.name || 'Unknown',
        evaluations: {},
        programHistory: []
      };
    }
    
    if (!this.evolutionData[clientId].programHistory) {
      this.evolutionData[clientId].programHistory = [];
    }
    
    // Add/update program scores for this date
    Object.entries(event.programScores).forEach(([programId, score]) => {
      const program = this.programs.find(p => p.id === programId);
      if (!program) return;
      
      // Check if entry already exists for this date and program
      const existingIndex = this.evolutionData[clientId].programHistory.findIndex(
        h => h.date === eventDate && h.programId === programId
      );
      
      const historyEntry = {
        date: eventDate,
        programId: programId,
        programTitle: program.title,
        score: score,
        eventId: event.id
      };
      
      if (existingIndex >= 0) {
        // Update existing entry
        this.evolutionData[clientId].programHistory[existingIndex] = historyEntry;
      } else {
        // Add new entry
        this.evolutionData[clientId].programHistory.push(historyEntry);
      }
    });
    
    // Sort by date descending
    this.evolutionData[clientId].programHistory.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  });
  
  // Save to server
  try {
    await fetch('api.php?path=evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.evolutionData)
    });
  } catch (err) {
    console.warn('Could not save evolution data to server:', err);
  }
}


// SHOW EVOLUTION MODAL
async showEvolution(clientId) {

  // Store current client for use in the Add Evaluation modal
calendar.selectedClient = this.clients.find(c => c.id === clientId);
window.currentChildId = clientId;
  // Load data if missing
  if (!this.evolutionData) await this.loadEvolutionData();

  const clientData = this.evolutionData[`client_${clientId}`] || this.evolutionData[clientId];

  if (!clientData) {
    await showCustomAlert('Nu exista date de evolutie pentru acest client.', 'Evolutie');
    return;
  }

  // Elements
  const modal = document.getElementById('evolutionModal');
  const title = document.getElementById('evolutionTitle');
  const chartCanvas = document.getElementById('evolutionChart');
  const closeBtn = document.getElementById('closeEvolutionModal');
  const editBtn = document.getElementById('editEvolutionBtn'); // may not exist anymore
  const editor = document.getElementById('evolutionEditor');
  const chartContainer = document.getElementById('evolutionChartContainer');
  const tbody = document.getElementById('evolutionEditRows');
  const saveBtn = document.getElementById('saveEvolutionBtn');
  const cancelBtn = document.getElementById('cancelEvolutionEdit');

  // Safety check
  if (!modal || !chartCanvas) {
    console.error('Evolution modal elements missing (modal or chart).');
    return;
  }

  // Show modal
  modal.style.display = 'flex';
  title.textContent = `Evolutie - ${clientData.name}`;
  const ctx = chartCanvas.getContext('2d');

  // Destroy previous chart safely
  if (window.evolutionChart && typeof window.evolutionChart.destroy === 'function') {
    try { window.evolutionChart.destroy(); } catch (e) {}
    window.evolutionChart = null;
  }

  // === Chart drawing ===
// === Chart drawing ===
const renderChart = () => {
  const colors = ['#4A90E2', '#FF6B6B', '#12C4D9', '#9B59B6', '#1DD75B', '#FFA500', '#E91E63'];
  const datasets = [];
  const allDates = new Set();

  // Gather all unique dates
  Object.values(clientData.evaluations).forEach(values => {
    Object.keys(values).forEach(date => allDates.add(date));
  });

  const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

  // Build datasets
  Object.entries(clientData.evaluations).forEach(([test, values], i) => {
    const color = colors[i % colors.length];
    const dataPoints = sortedDates.map(date => values[date] ?? null);
    datasets.push({
      label: test,
      data: dataPoints,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    });
  });

  // === Create Chart ===
  window.evolutionChart = new Chart(ctx, {
    type: 'line',
    data: { labels: sortedDates, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false // we'll inject a custom one
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff'
        },
        title: {
          display: true,
          text: clientData.name || 'Evoluție Portage',
          font: { size: 16, weight: '700' },
          color:
            getComputedStyle(document.documentElement).getPropertyValue('--text-primary') ||
            '#111'
        }
      },
      scales: {
        x: {
          ticks: {
            color:
              getComputedStyle(document.documentElement).getPropertyValue('--text-primary') ||
              '#111'
          },
          grid: {
            color:
              getComputedStyle(document.documentElement).getPropertyValue('--border-color') ||
              '#ccc'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 5,
            color:
              getComputedStyle(document.documentElement).getPropertyValue('--text-primary') ||
              '#111'
          },
          grid: {
            color:
              getComputedStyle(document.documentElement).getPropertyValue('--border-color') ||
              '#ccc'
          }
        }
      }
    },

    // === Provide custom legend callback ===
    // (this defines the HTML structure for generateLegend)
    plugins: [
      {
        id: 'customLegend',
        afterUpdate(chart) {
          const container = document.getElementById('evolutionChartContainer');
          if (!container) return;

          // Remove old legend
          const oldLegend = container.querySelector('.chartjs-legend');
          if (oldLegend) oldLegend.remove();

          // Build new legend HTML
          const legend = document.createElement('div');
          legend.classList.add('chartjs-legend');

          const ul = document.createElement('ul');
          chart.data.datasets.forEach((ds, i) => {
            const li = document.createElement('li');
            li.style.color = ds.borderColor;
            li.innerHTML = `<span style="background:${ds.borderColor}"></span>${ds.label}`;
            li.addEventListener('click', () => {
              chart.setDatasetVisibility(i, !chart.isDatasetVisible(i));
              li.classList.toggle('hidden', !chart.isDatasetVisible(i));
              chart.update();
            });
            ul.appendChild(li);
          });

          legend.appendChild(ul);
          // Insert legend right after the canvas element
const chartCanvas = container.querySelector('#evolutionChart');
chartCanvas.insertAdjacentElement('afterend', legend);

        }
      }
    ]
  });
};



 renderChart();

// === Add Portage IQ summary below chart ===
const client = this.clients.find(c => c.id === clientId);
if (client && client.birthDate) {
  const birthDate = new Date(client.birthDate);
  const summaryEl = document.getElementById('evolutionSummary');
  if (summaryEl) {
    summaryEl.innerHTML = ''; // clear previous
  }

  // Collect all evaluation dates
  const allDates = new Set();
  Object.values(clientData.evaluations).forEach(domain => {
    Object.keys(domain).forEach(date => allDates.add(date));
  });

  const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  const results = [];

  sortedDates.forEach(date => {
    const evalValues = Object.values(clientData.evaluations)
      .map(domain => domain[date])
      .filter(v => typeof v === 'number' && !isNaN(v));
    if (evalValues.length === 0) return;

    const avgDevAge = evalValues.reduce((a, b) => a + b, 0) / evalValues.length;
    const chronoAge = (new Date(date) - birthDate) / (1000 * 60 * 60 * 24 * 30.44);
    const dq = (avgDevAge / chronoAge) * 100;

    results.push({ date, avgDevAge, chronoAge, dq });
  });

  if (summaryEl && results.length) {
  const latest = results.at(-1);

  summaryEl.innerHTML = `
    <div class="evolution-summary">
      <h3 style="
        font-size:1.1rem;
        font-weight:600;
        margin-bottom:0.75rem;
        color:var(--text-primary);
      ">
        Evoluție generală Portage
      </h3>

      <div class="evolution-table-container">
        <table class="evolution-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Vârstă cronologică</th>
              <th>Vârstă mentală</th>
              <th>Indice dezvoltare (DQ)</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => {
              const color =
                r.dq < 70 ? '#e74c3c' :
                r.dq < 85 ? '#f39c12' :
                r.dq <= 115 ? '#27ae60' : '#8e44ad';
              return `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.chronoAge.toFixed(1)} luni</td>
                  <td>${r.avgDevAge.toFixed(1)} luni</td>
                  <td style="font-weight:600;color:${color};">${r.dq.toFixed(1)}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  }
}


this.renderProgramHistory(clientData);

  // === Edit Mode Logic (optional old feature) ===
  const populateEditor = () => {
    tbody.innerHTML = '';
    const timeRanges = ['1m', '3m', '6m', '9m', '12m'];

    Object.entries(clientData.evaluations).forEach(([test, scores]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding:0.5rem;">${test}</td>
        ${timeRanges.map(r => `
          <td style="padding:0.5rem;">
            <input type="number" min="0" max="100" step="1"
              value="${scores[r] ?? ''}"
              data-test="${test}" data-range="${r}"
              style="width:60px;padding:0.25rem;border:1px solid var(--border-color);
                     border-radius:0.25rem;background:var(--bg-card);color:var(--text-primary);">
          </td>`).join('')}`;
      tbody.appendChild(row);
    });
  };

  const toggleEditor = (show) => {
    editor.style.display = show ? 'block' : 'none';
    chartContainer.style.display = show ? 'none' : 'block';
    if (editBtn) editBtn.textContent = show ? 'Vizualizeaza grafic' : 'Editeaza scoruri';
  };

  if (editBtn) {
    editBtn.onclick = () => {
      const editing = editor.style.display === 'block';
      if (editing) {
        toggleEditor(false);
        renderChart(); // redraw chart
      } else {
        populateEditor();
        toggleEditor(true);
      }
    };
  }

  if (cancelBtn) cancelBtn.onclick = () => toggleEditor(false);

  if (saveBtn) saveBtn.onclick = async () => {
    const inputs = tbody.querySelectorAll('input');
    inputs.forEach(input => {
      const test = input.dataset.test;
      const range = input.dataset.range;
      const val = parseFloat(input.value);
      if (!isNaN(val)) clientData.evaluations[test][range] = val;
    });

    toggleEditor(false);
    requestAnimationFrame(() => this.refreshEvolutionChart(clientData));

    try {
      await fetch('api.php?path=evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.evolutionData)
      });
    } catch {
      console.warn('Could not save to server; local only.');
    }
  };

  

  // === NEW: Bind "Adaugă evaluare" button ===
  setTimeout(() => {
    const addEvaluationBtn = document.getElementById('addEvaluationBtn');
    if (addEvaluationBtn) {
      addEvaluationBtn.addEventListener('click', async () => {
        const evalModal = document.getElementById('addEvaluationModal');
        if (!evalModal) return;

        evalModal.style.display = 'flex';
        document.getElementById('evaluationDateInput').valueAsDate = new Date();

        const client = this.clients.find(c => c.id === clientId);
        if (client && client.birthDate) {
          document.getElementById('childBirthDateInput').value = client.birthDate;
          updateChildAgeDisplay(client.birthDate);
        }

        await loadPortrigeData();
        renderPortageDomains();
      });
    }
  }, 300);

  // === Close Logic (Evolution Modal only) ===
  const closeModal = () => {
    modal.style.display = 'none';
    if (window.evolutionChart && typeof window.evolutionChart.destroy === 'function') {
      try { window.evolutionChart.destroy(); } catch (e) {}
      window.evolutionChart = null;
    }
    closeBtn?.removeEventListener('click', closeModal);
    modal.removeEventListener('click', backdropHandler);
  };

  const backdropHandler = (e) => { if (e.target === modal) closeModal(); };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', backdropHandler);
}









  
  // Event Details Modal Methods
  showEventDetails(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventDetailsModal');
    const content = document.getElementById('eventDetailsContent');
    const commentsArea = document.getElementById('eventComments');
    
    // Load event comments
    commentsArea.value = event.comments || '';
    
    // Get team members
    const teamMemberIds = event.teamMemberIds || [event.teamMemberId];
    const members = teamMemberIds.map(id => this.teamMembers.find(m => m.id === id)).filter(m => m);
    
    // Get clients
    const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
    const clients = clientIds.map(id => this.clients.find(c => c.id === id)).filter(c => c);
    
    // Get programs
    const programs = event.programIds 
      ? event.programIds.map(id => this.programs.find(p => p.id === id)).filter(p => p)
      : [];
    
    // Format date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Calculate end time
    const endTime = this.calculateEndTime(event.startTime, event.duration);
    
    // Build HTML
    let html = `
      <div class="event-details-section">
        <h3>Informatii generale</h3>
        <div class="event-details-grid">
          <div class="event-detail-item">
            <div class="event-detail-label">Nume eveniment</div>
            <div class="event-detail-value">${event.name}</div>
          </div>
          <div class="event-detail-item">
            <div class="event-detail-label">Tip</div>
            <div class="event-detail-value">${this.getEventTypeLabel(event.type)}</div>
          </div>
          <div class="event-detail-item">
            <div class="event-detail-label">Data</div>
            <div class="event-detail-value">${formattedDate}</div>
          </div>
          <div class="event-detail-item">
            <div class="event-detail-label">Ora</div>
            <div class="event-detail-value">${event.startTime} - ${endTime}</div>
          </div>
        </div>
      </div>
    `;
    
    if (members.length > 0) {
      html += `
        <div class="event-details-section">
          <h3>Terapeuti</h3>
          <div class="event-therapists-list">
            ${members.map(m => `
              <div class="therapist-badge" style="background-color: ${m.color};">
                ${m.name}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (clients.length > 0) {
      // Initialize attendance if not exists
      if (!event.attendance) {
        event.attendance = {};
        clients.forEach(c => {
          event.attendance[c.id] = 'present'; // Default to present
        });
      }
      
      html += `
        <div class="event-details-section">
          <h3>Clienti & Prezenta</h3>
          <div class="attendance-list">
            ${clients.map(c => {
              const attendance = event.attendance[c.id] || 'present';
              return `
                <div class="attendance-item">
                  <div class="client-name-attendance">${c.name}</div>
                  <div class="attendance-toggle">
                    <button class="attendance-btn ${attendance === 'present' ? 'active' : ''}" 
                            data-client-id="${c.id}" 
                            data-status="present"
                            ${!this.isAdminView ? 'disabled' : ''}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Prezent
                    </button>
                    <button class="attendance-btn ${attendance === 'absent' ? 'active' : ''}" 
                            data-client-id="${c.id}" 
                            data-status="absent"
                            ${!this.isAdminView ? 'disabled' : ''}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Absent
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    if (programs.length > 0) {
      // Initialize program scores if not exists
      if (!event.programScores) {
        event.programScores = {};
      }
      
      html += `
        <div class="event-details-section">
          <h3>Programe terapeutice ${this.isAdminView ? '& Evaluare' : ''}</h3>
          ${this.isAdminView ? `
            <div id="programScoresContainer">
              ${programs.map(p => {
                const currentScore = event.programScores[p.id] || '';
                return `
                  <div class="program-score-item">
                    <div class="program-score-name">${p.title}</div>
                    <div class="program-score-buttons">
                      <button class="score-btn ${currentScore === '0' ? 'active' : ''}" 
                              data-program-id="${p.id}" 
                              data-score="0">0</button>
                      <button class="score-btn ${currentScore === '-' ? 'active' : ''}" 
                              data-program-id="${p.id}" 
                              data-score="-">-</button>
                      <button class="score-btn ${currentScore === 'P' ? 'active' : ''}" 
                              data-program-id="${p.id}" 
                              data-score="P">P</button>
                      <button class="score-btn ${currentScore === '+' ? 'active' : ''}" 
                              data-program-id="${p.id}" 
                              data-score="+">+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : programs.map(p => `
            <div class="program-item">
              <h4>${p.title}</h4>
              <p>${p.description}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    const additionalInfo = [];
    
    // Add event details first if it's a public event and has details
    if (event.isPublic && event.details) {
      additionalInfo.push(event.details);
    }
    
    if (event.isPublic) additionalInfo.push('Eveniment public');
    if (event.isBillable === false) additionalInfo.push('Non-facturabil');
    if (event.repeating && event.repeating.length > 0) {
      const days = ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri'];
      const repeatDays = event.repeating.map(d => days[d-1]).join(', ');
      additionalInfo.push(`Se repeta: ${repeatDays}`);
    }
    
    if (additionalInfo.length > 0) {
      // If we have event details, display them separately from the other info
      let additionalInfoHtml = '';
      
      if (event.isPublic && event.details) {
        additionalInfoHtml = `
          <div class="event-detail-value" style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-hover); border-radius: 0.375rem; white-space: pre-wrap;">${event.details}</div>
        `;
        // Remove details from additionalInfo array since we're displaying it separately
        additionalInfo.shift();
      }
      
      if (additionalInfo.length > 0) {
        additionalInfoHtml += `<div class="event-detail-value">${additionalInfo.join(' ⦁ ')}</div>`;
      }
      
      html += `
        <div class="event-details-section">
          <h3>Informatii suplimentare</h3>
          ${additionalInfoHtml}
        </div>
      `;
    }
    
    content.innerHTML = html;
    this.currentDetailsEventId = eventId;
    
    // Add attendance toggle listeners (admin only)
    if (this.isAdminView && clients.length > 0) {
      const attendanceBtns = content.querySelectorAll('.attendance-btn');
      attendanceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const clientId = e.currentTarget.dataset.clientId;
          const status = e.currentTarget.dataset.status;
          
          // Update attendance
          if (!event.attendance) event.attendance = {};
          event.attendance[clientId] = status;
          
          // Update UI
          const container = e.currentTarget.closest('.attendance-toggle');
          container.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          
          // Save immediately
          this.saveData();
        });
      });
    }
    
    // Add program score button listeners (admin only)
    if (this.isAdminView && programs.length > 0) {
      const scoreBtns = content.querySelectorAll('.score-btn');
      scoreBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const programId = e.currentTarget.dataset.programId;
          const score = e.currentTarget.dataset.score;
          
          // Initialize programScores if not exists
          if (!event.programScores) event.programScores = {};
          
          // Toggle score (click again to unset)
          if (event.programScores[programId] === score) {
            delete event.programScores[programId];
          } else {
            event.programScores[programId] = score;
          }
          
          // Update UI
          const container = e.currentTarget.closest('.program-score-buttons');
          container.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));
          if (event.programScores[programId]) {
            e.currentTarget.classList.add('active');
          }
          
          // Save to events data
          await this.saveData();
          
          // Save to program history for evolution tracking
          await this.saveProgramHistory(event);
        });
      });
    }
    
    // Hide edit/delete buttons and comments section in public view
    if (!this.isAdminView) {
      const editBtn = document.getElementById('editEventFromDetails');
      const deleteBtn = document.getElementById('deleteEventFromDetails');
      const commentsSection = commentsArea.closest('.event-details-section');
      
      if (editBtn) editBtn.style.display = 'none';
      if (deleteBtn) deleteBtn.style.display = 'none';
      if (commentsSection) commentsSection.style.display = 'none';
    } else {
      // Show buttons in admin view
      const editBtn = document.getElementById('editEventFromDetails');
      const deleteBtn = document.getElementById('deleteEventFromDetails');
      const commentsSection = commentsArea.closest('.event-details-section');
      
      if (editBtn) editBtn.style.display = '';
      if (deleteBtn) deleteBtn.style.display = '';
      if (commentsSection) commentsSection.style.display = '';
    }
    
    modal.classList.add('active');
  }

  refreshEvolutionChart(clientData) {
  const chartCanvas = document.getElementById('evolutionChart');
  const ctx = chartCanvas.getContext('2d');

  // Destroy previous chart
  if (window.evolutionChart && typeof window.evolutionChart.destroy === 'function') {
    try { window.evolutionChart.destroy(); } catch (e) {}
    window.evolutionChart = null;
  }

  const timeRanges = ['1m', '3m', '6m', '9m', '12m'];
  const timeLabels = ['1 luna', '3 luni', '6 luni', '9 luni', '1 an'];
  const colors = ['#4A90E2', '#FF6B6B', '#12C4D9', '#9B59B6', '#1DD75B', '#FFA500', '#E91E63'];

  const datasets = Object.entries(clientData.evaluations).map(([test, values], i) => {
    const color = colors[i % colors.length];
    const dataPoints = timeRanges.map(r => values[r] ?? null);
    return {
      label: test,
      data: dataPoints,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    };
  });

  window.evolutionChart = new Chart(ctx, {
  type: 'line',
  data: { labels: sortedDates, datasets },
  options: {
    responsive: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
  legend: {
    display: false, // we’ll generate it manually
    position: 'bottom',
    labels: {
      usePointStyle: true,
      pointStyle: 'circle',
      boxWidth: 12,
      padding: 18,
      color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#111',
      font: {
        size: 14,
        weight: '600'
      },
      generateLabels: (chart) => {
        const datasets = chart.data.datasets;
        return datasets.map((ds, i) => ({
          text: ds.label,
          fillStyle: ds.borderColor,
          strokeStyle: ds.borderColor,
          lineWidth: 3,
          hidden: !chart.isDatasetVisible(i),
          datasetIndex: i
        }));
      }
    },
    onClick: (e, legendItem, legend) => {
      const index = legendItem.datasetIndex;
      const chart = legend.chart;
      chart.setDatasetVisibility(index, !chart.isDatasetVisible(index));
      chart.update();
    }
  },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    titleColor: '#fff',
    bodyColor: '#fff'
  },
  title: {
    display: true,
    text: clientData.name || 'Evoluție Portage',
    font: { size: 16, weight: '700' },
    color: getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary') || '#111'
  }
},

      scales: {
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary') || '#111'
          },
          grid: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--border-color') || '#ccc'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 5,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary') || '#111'
          },
          grid: {
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--border-color') || '#ccc'
          }
        }
      }
    }
  });

  // === Force rebuild of legend for custom CSS ===
const container = document.getElementById('evolutionChartContainer');
if (container) {
  const existingLegend = container.querySelector('.chartjs-legend');
  if (existingLegend) existingLegend.remove();

  const legend = window.evolutionChart.generateLegend();
  container.insertAdjacentHTML('beforeend', legend);
}

}

renderProgramHistory(clientData) {
  const container = document.getElementById('programHistoryContainer');
  if (!container) return;
  
  const programHistory = clientData.programHistory || [];
  
  if (programHistory.length === 0) {
    container.innerHTML = '<div class="program-history-empty">Nu exista istoric de programe pentru acest client.</div>';
    return;
  }
  
  // Filter to last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentHistory = programHistory.filter(h => new Date(h.date) >= oneYearAgo);
  
  if (recentHistory.length === 0) {
    container.innerHTML = '<div class="program-history-empty">Nu exista istoric de programe in ultimul an.</div>';
    return;
  }
  
  // Group by program
  const groupedByProgram = {};
  recentHistory.forEach(entry => {
    if (!groupedByProgram[entry.programTitle]) {
      groupedByProgram[entry.programTitle] = [];
    }
    groupedByProgram[entry.programTitle].push(entry);
  });
  
  // Build table
  let html = '<table class="program-history-table"><thead><tr>';
  html += '<th>Program</th>';
  html += '<th>Data</th>';
  html += '<th>Scor</th>';
  html += '</tr></thead><tbody>';
  
  Object.entries(groupedByProgram).forEach(([programTitle, entries]) => {
    // Sort by date descending
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only last 10 entries per program
    entries.slice(0, 10).forEach((entry, index) => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('ro-RO', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      
      html += '<tr>';
      if (index === 0) {
        html += `<td rowspan="${Math.min(entries.length, 10)}" style="font-weight: 600; vertical-align: top;">${programTitle}</td>`;
      }
      html += `<td>${formattedDate}</td>`;
      html += `<td><span class="program-history-score" data-score="${entry.score}">${entry.score}</span></td>`;
      html += '</tr>';
    });
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

  
  getEventTypeLabel(type) {
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
  
  closeEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    if (this.currentDetailsEventId) {
      this.saveEventComments();
    }
    modal.classList.remove('active');
    this.currentDetailsEventId = null;
  }
  
  saveEventComments() {
    if (!this.currentDetailsEventId) return;
    const event = this.events.find(e => e.id === this.currentDetailsEventId);
    if (!event) return;
    const comments = document.getElementById('eventComments').value;
    event.comments = comments;
    this.saveData();
  }
  
  editEventFromDetails() {
    const id = this.currentDetailsEventId;
    this.saveEventComments();
    this.closeEventDetailsModal();
    this.openModal(id);
  }
  
  async deleteEventFromDetails() {
    const confirmed = await showCustomConfirm('Esti sigur ca vrei sa stergi acest eveniment?', 'Sterge eveniment');
    if (confirmed) {
      const eventId = this.currentDetailsEventId;
      this.closeEventDetailsModal();
      this.editingEventId = eventId;
      await this.deleteEvent();
    }
  }
}

// === Add Evaluation Modal Logic ===

// Open and close modal
const addEvaluationBtn = document.getElementById('addEvaluationBtn');

const closeEvaluationModal = document.getElementById('closeAddEvaluationModal');
const cancelEvaluationBtn = document.getElementById('cancelEvaluationBtn');


let portrigeData = {};
let currentChildId = null;

// Open modal
if (addEvaluationBtn) {
  addEvaluationBtn.addEventListener('click', async () => {
    addEvaluationModal.style.display = 'flex';
    document.getElementById('evaluationDateInput').valueAsDate = new Date();

    // Pre-fill date of birth if available
    const client = calendar.selectedClient;
    if (client && client.birthDate) {
      document.getElementById('childBirthDateInput').value = client.birthDate;
      updateChildAgeDisplay(client.birthDate);
    }

    // Load portrige data
    await loadPortrigeData();
    renderPortageDomains();
  });
}

// Close modal
[closeEvaluationModal, cancelEvaluationBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', () => {
    addEvaluationModal.style.display = 'none';
  });
});

// === Load portrige.json dynamically ===
async function loadPortrigeData() {
  try {
    const response = await fetch('api.php?path=portrige.json');
    portrigeData = await response.json();
  } catch (error) {
    console.error('Eroare la încărcarea portrige.json:', error);
  }
}

// === Calculate child age (in months) ===
function getAgeInMonths(birthDate) {
  const now = new Date();
  const birth = new Date(birthDate);
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  return years * 12 + months;
}

function updateChildAgeDisplay(birthDate) {
  const span = document.getElementById('childAgeDisplay');
  if (!birthDate) {
    span.textContent = '–';
    return;
  }
  const months = getAgeInMonths(birthDate);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  span.textContent = `${years} ani și ${rem} luni (${months} luni)`;
}

// === Render domains based on age ===
function renderPortageDomains() {
  const container = document.getElementById('portageDomainsContainer');
  container.innerHTML = '';

  const birthDate = document.getElementById('childBirthDateInput').value;
  const evalDate =
    document.getElementById('evaluationDateInput')?.value ||
    new Date().toISOString().split('T')[0];

  if (!birthDate) {
    container.innerHTML =
      '<p>Introduceți data nașterii pentru a afișa itemii corespunzători.</p>';
    return;
  }

  const ageMonths = getAgeInMonths(birthDate, evalDate);

  function formatAgeText(months) {
    if (months < 12) return `${months} ${months === 1 ? 'lună' : 'luni'}`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (remaining === 0) return `${years} ${years === 1 ? 'an' : 'ani'}`;
    if (remaining === 1)
      return `${years} ${years === 1 ? 'an' : 'ani'} și 1 lună`;
    return `${years} ${years === 1 ? 'an' : 'ani'} și ${remaining} luni`;
  }

  let warningShown = false;

  Object.keys(portrigeData).forEach(domain => {
    const items = portrigeData[domain];

    // Domain block wrapper
    const block = document.createElement('div');
    block.className = 'domain-block';

    // Header
    const header = document.createElement('div');
    header.className = 'domain-header';

    const title = document.createElement('span');
    title.textContent = domain;

    const toggleDomainBtn = document.createElement('button');
    toggleDomainBtn.className = 'domain-toggle-btn';
    toggleDomainBtn.textContent = 'Ascunde domeniul';

    header.appendChild(title);
    header.appendChild(toggleDomainBtn);

    // Grid with all age groups
    const grid = document.createElement('div');
    grid.className = 'checkbox-grid';

    // ✅ Move the event listener HERE (after grid is defined)
    toggleDomainBtn.addEventListener('click', () => {
  console.log('🟢 Domain toggle clicked:', domain);

  if (!grid) {
    console.error('❌ Grid not found for domain:', domain);
    return;
  }

  grid.classList.toggle('collapsed');
  console.log('📦 New class list on grid:', grid.classList.toString());

  const isCollapsed = grid.classList.contains('collapsed');
  toggleDomainBtn.textContent = isCollapsed ? 'Arată domeniul' : 'Ascunde domeniul';

  console.log(isCollapsed ? '🔻 Domain collapsed' : '🔺 Domain expanded');
});


    // Group items by age from JSON
    const grouped = {};
    items.forEach(item => {
      const groupLabel = item.age || 'Fără interval';
      if (!grouped[groupLabel]) grouped[groupLabel] = [];
      grouped[groupLabel].push(item);
    });

    // Render each age group
    Object.entries(grouped).forEach(([ageLabelRaw, groupItems]) => {
      const hasFin = ageLabelRaw.toLowerCase().includes('(fin)');
      const ageLabel = ageLabelRaw.replace(/\(fin\)/gi, '').trim();

      const match = ageLabel.match(/(\d+)[–-](\d+)/);
      let annotation = '';
      let isFuture = false;

      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        annotation = ` (${formatAgeText(min)} – ${formatAgeText(max)})`;
        if (ageMonths < min) isFuture = true;
      }

      const sep = document.createElement('div');
      sep.className = 'portage-age-separator';
      sep.innerHTML = `— ${ageLabel}${annotation}${
        hasFin ? ' <span class="portage-fin-badge">FIN</span>' : ''
      } —`;

      const groupContainer = document.createElement('div');
      groupContainer.className = 'portage-group-container';

      // Handle future groups (collapsible)
      if (isFuture) {
        groupContainer.classList.add('collapsed');

        if (!warningShown) {
          const warn = document.createElement('div');
          warn.className = 'portage-warning';
          warn.innerHTML = `⚠️ Unele iteme din secțiunile următoare sunt pentru vârste mai mari decât <strong>${formatAgeText(
            ageMonths
          )}</strong>.`;
          grid.appendChild(warn);
          warningShown = true;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'portage-toggle-btn';
        toggleBtn.textContent = 'Arată itemele viitoare';
        toggleBtn.addEventListener('click', () => {
          groupContainer.classList.toggle('collapsed');
          toggleBtn.textContent = groupContainer.classList.contains('collapsed')
            ? 'Arată itemele viitoare'
            : 'Ascunde itemele viitoare';
        });
        grid.appendChild(toggleBtn);
      }

      grid.appendChild(sep);
      grid.appendChild(groupContainer);

      groupItems.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'portage-item';
        if (isFuture) wrapper.classList.add('disabled');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.domain = domain;
        checkbox.dataset.id = item.id;
        checkbox.disabled = isFuture;

        const label = document.createElement('label');
        label.textContent = item.text;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        groupContainer.appendChild(wrapper);

        if (!isFuture) {
          wrapper.addEventListener('click', e => {
            if (e.target.tagName.toLowerCase() !== 'input') {
              checkbox.checked = !checkbox.checked;
            }
            wrapper.classList.toggle('checked', checkbox.checked);
          });
        }
      });
    });

    // Collapse all domains by default
grid.classList.add('collapsed');
toggleDomainBtn.textContent = 'Arată domeniul';

block.appendChild(header);
block.appendChild(grid);
container.appendChild(block);

  });
}












// === Update displayed age dynamically ===
document.getElementById('childBirthDateInput')?.addEventListener('change', (e) => {
  updateChildAgeDisplay(e.target.value);
  renderPortageDomains();
});

// === Tab switching logic ===
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});


// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const addEvaluationModal = document.getElementById('addEvaluationModal');
  const saveEvaluationBtn = document.getElementById('saveEvaluationBtn');
  const isAdminView = window.location.pathname.includes('admin.html');
  window.calendar = new Calendar(isAdminView);
  
  if (isAdminView) {
    document.getElementById('deleteBtn').addEventListener('click', async () => {
      const confirmed = await showCustomConfirm('Esti sigur ca vrei sa stergi acest eveniment?', 'Sterge eveniment');
      if (confirmed) {
        window.calendar.deleteEvent();
      }
    });
    
    document.getElementById('deleteMemberBtn').addEventListener('click', () => {
      if (window.calendar.editingMemberId) {
        window.calendar.confirmDeleteMember(window.calendar.editingMemberId);
      }
    });
    
    document.getElementById('deleteClientBtn').addEventListener('click', () => {
      if (window.calendar.editingClientId) {
        window.calendar.confirmDeleteClient(window.calendar.editingClientId);
      }
    });
  }

   if (saveEvaluationBtn) {
    // Overwrite any previous listeners to avoid duplicates
    saveEvaluationBtn.onclick = async () => {
      console.log('Step 1: Save Evaluation button clicked!');

      const birthDate = document.getElementById('childBirthDateInput').value;
      const evalDate  = document.getElementById('evaluationDateInput').value;

      if (!birthDate || !evalDate) {
        alert('Completați data nașterii și data evaluării.');
        return;
      }
      console.log('Step 2: Dates validated');

      // Compute Portage domain results
      const checkboxes   = document.querySelectorAll('#portageDomainsContainer input[type="checkbox"]');
      const domainScores = {};
      checkboxes.forEach(cb => {
        const domain = cb.dataset.domain;
        if (!domainScores[domain]) domainScores[domain] = { total: 0, checked: 0 };
        domainScores[domain].total++;
        if (cb.checked) domainScores[domain].checked++;
      });
      const result = {};
      for (const [domain, data] of Object.entries(domainScores)) {
        result[domain] = Math.round((data.checked / data.total) * 100);
      }
      console.log('Step 3: Computed domain results:', result);

      try {
        console.log('Step 4: Preparing to fetch…');
        const client = calendar.selectedClient || calendar.clients.find(c => c.id === window.currentChildId);
        console.log('Step 4.1: Found client:', client);
        if (!client) {
          console.error('No client found!');
          return;
        }

        if (!calendar.evolutionData) await calendar.loadEvolutionData();
        if (!calendar.evolutionData[client.id]) {
          calendar.evolutionData[client.id] = { name: client.name, evaluations: {} };
        }

        for (const [domain, score] of Object.entries(result)) {
          const key = `Portrige - ${domain}`;
          if (!calendar.evolutionData[client.id].evaluations[key]) {
            calendar.evolutionData[client.id].evaluations[key] = {};
          }
          calendar.evolutionData[client.id].evaluations[key][evalDate] = score;
        }

        console.log('Step 5: About to POST to API…');
        const response = await fetch('api.php?path=evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calendar.evolutionData)
        });
        console.log('Step 6: Response status:', response.status);
        const data = await response.json();
        console.log('Step 7: Response body:', data);

        // ✅ Close modal immediately after save succeeds
        if (addEvaluationModal) addEvaluationModal.style.display = 'none';

        // Optional reset
        document.getElementById('portageDomainsContainer').innerHTML = '';
        document.getElementById('childBirthDateInput').value = '';
        document.getElementById('childAgeDisplay').textContent = '–';

        // Refresh chart
        if (calendar.refreshEvolutionChart) {
          calendar.refreshEvolutionChart(calendar.evolutionData[client.id]);
        }

        // Show success AFTER closing the modal
        await showCustomAlert('Evaluarea Portage a fost salvată cu succes!', 'Succes');

      } catch (err) {
        console.error('Step X: Error caught in try/catch:', err);
        await showCustomAlert('Nu s-a putut salva evaluarea pe server.', 'Eroare');
      } finally {
        // 🔒 Belt-and-suspenders: ensure modal is closed
        if (addEvaluationModal) addEvaluationModal.style.display = 'none';
      }
    };
  }
});
