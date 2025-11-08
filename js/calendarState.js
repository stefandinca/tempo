/**
 * js/calendarState.js
 *
 * Acționează ca "sursa unică a adevărului" (single source of truth)
 * pentru starea aplicației.
 *
 * Conține toate datele (evenimente, clienți) și starea UI
 * (data curentă, vizualizarea curentă).
 */

// 1. Definim starea inițială
const state = {
    isAdminView: false,
    currentDate: new Date(),
    currentView: 'month', // 'month', 'week', 'day'
    
    // Datele din API
    teamMembers: [],
    clients: [],
    events: [],
    programs: [],
    eventTypes: [], // <-- NOU: Adăugat
    evolutionData: {},
    billingsData: {},

    // Starea filtrelor
    activeFilters: [], // O listă de ID-uri ale membrilor echipei
    activeClientFilterId: null, // Filtru pentru un singur client

    // Starea modalelor (pentru a ști ce se editează)
    editingEventId: null,
    editingMemberId: null,
    editingClientId: null,
    editingEventTypeId: null, // <-- NOU: Adăugat
    
    // Starea selecției din modalul de evenimente
    selectedClientIds: new Set(),
    selectedProgramIds: new Set(),
};

// 2. Exportăm un "store" simplu
// Acest 'store' conține starea și funcțiile de actualizare
export const calendarState = {
    
    /**
     * Returnează o copie a stării curente (doar citire).
     */
    getState: () => {
        // Returnează o copie superficială pentru a preveni modificarea directă
        return { ...state }; 
    },

    /**
     * Setează datele inițiale încărcate din API.
     */
    initializeData: (data) => {
        state.teamMembers = data.teamMembers || [];
        state.clients = data.clients || [];
        state.events = data.events || [];
        state.eventTypes = data.event_types || []; // <-- NOU: Preluare din loadData
        // Setează filtrele active inițiale ca fiind toți membrii echipei
        state.activeFilters = state.teamMembers.map(m => m.id);
    },

    /**
     * Setează starea de admin.
     */
    setIsAdminView: (isAdmin) => {
        state.isAdminView = isAdmin;
    },

    /**
     * Setează programele încărcate.
     */
    setPrograms: (programs) => {
        state.programs = programs || [];
    },

    /**
     * NOU: Setează tipurile de evenimente (dacă sunt încărcate separat)
     */
    setEventTypes: (types) => {
        state.eventTypes = types || [];
    },

    /**
     * Setează datele de evoluție.
     */
    setEvolutionData: (data) => {
        // (MODIFICAT) Asigură-te că este un obiect
        if (Array.isArray(data)) {
            state.evolutionData = {};
        } else {
            state.evolutionData = data || {};
        }
    },

    /**
     * Setează datele de facturare.
     */
    setBillingsData: (data) => {
        // (MODIFICAT) Asigură-te că este un obiect
        if (Array.isArray(data)) {
            state.billingsData = {};
        } else {
            state.billingsData = data || {};
        }
    },

    /**
    * Setează data curentă a calendarului.
    * @param {Date} date - Noua dată curentă
    */
    setCurrentDate: (date) => {
        state.currentDate = date;
    },

    /**
    * Setează vizualizarea curentă.
    * @param {string} view - 'month', 'week', sau 'day'
    */
    setCurrentView: (view) => {
        state.currentView = view;
    },
    
    /**
     * Comută un filtru de membru al echipei.
     * @param {string} memberId - ID-ul membrului
     */
    toggleFilter: (memberId) => {
        const index = state.activeFilters.indexOf(memberId);
        if (index > -1) {
            state.activeFilters.splice(index, 1);
        } else {
            state.activeFilters.push(memberId);
        }
    },

    /**
     * Setează filtrul activ pentru client.
     * @param {string | null} clientId - ID-ul clientului sau null pentru "Toți"
     */
    setClientFilter: (clientId) => {
        state.activeClientFilterId = clientId || null;
    },
    
    // --- Getters (funcții de citire a datelor) ---
    
    /**
     * Returnează evenimentele filtrate pentru o anumită dată.
     * (Înlocuiește vechea funcție getEventsForDate)
     * @param {Date} dateObj - Obiectul Date pentru care se caută evenimente
     */
    getEventsForDate: (dateObj) => {
        // Folosim formatul YYYY-MM-DD pentru comparații sigure
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        return state.events.filter(event => {
            // 1. Verifică potrivirea datei
            if (event.date !== dateStr) {
                return false;
            }
            
            // 2. Verifică filtrul de TERAPEUT (activeFilters)
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            const hasMatchingMember = state.activeFilters.length === 0 || teamMemberIds.some(id => state.activeFilters.includes(id));

            if (!hasMatchingMember) {
                return false; // Nu se potrivește terapeutul, nu mai verifica clientul
            }

            // 3. Verifică filtrul de CLIENT (NOU)
            // Dacă un filtru de client este activ...
            if (state.activeClientFilterId) {
                const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
                // Verifică dacă evenimentul include clientul selectat
                const hasMatchingClient = clientIds.includes(state.activeClientFilterId);
                return hasMatchingClient; // Returnează true doar dacă se potrivește și clientul
            }
            
            // Dacă a trecut filtrul de terapeut și nu este setat niciun filtru de client, evenimentul este valid
            return true;
        });
    },
    
    /**
     * Returnează un eveniment după ID.
     */
    getEventById: (id) => {
        return state.events.find(e => e.id === id);
    },
    
    /**
     * Returnează un client după ID.
     */
    getClientById: (id) => {
        return state.clients.find(c => String(c.id) === String(id));
    },
    
    /**
     * Returnează un membru al echipei după ID.
     */
    getTeamMemberById: (id) => {
        return state.teamMembers.find(m => String(m.id) === String(id));
    },
    
    /**
     * Returnează un program după ID.
     */
    getProgramById: (id) => {
        return state.programs.find(p => String(p.id) === String(id));
    },

    /**
     * NOU: Returnează un tip de eveniment după ID.
     */
    getEventTypeById: (id) => {
        return state.eventTypes.find(t => t.id === id);
    },

    // --- Funcții pentru starea modalelor ---
    
    /**
     * Pregătește starea pentru deschiderea modalului de evenimente.
     * @param {string | null} eventId - ID-ul evenimentului de editat sau null pentru unul nou
     */
    openEventModal: (eventId) => {
        state.editingEventId = eventId;
        
        if (eventId) {
            const event = calendarState.getEventById(eventId);
            if (event) {
                // Pre-populează seturile de selecție
                state.selectedClientIds = new Set((event.clientIds || (event.clientId ? [event.clientId] : [])).map(String));
                state.selectedProgramIds = new Set((event.programIds || []).map(String));
            }
        } else {
            // Resetează pentru un eveniment nou
            state.selectedClientIds = new Set();
            state.selectedProgramIds = new Set();
        }
    },
    
    /**
     * Resetează starea la închiderea modalului de evenimente.
     */
    closeEventModal: () => {
        state.editingEventId = null;
        state.selectedClientIds = new Set();
        state.selectedProgramIds = new Set();
    },

    /**
     * Actualizează starea seturilor de selecție (folosit de căutarea în modal).
     */
    updateEventSelections: ({ clientIds, programIds }) => {
        if (clientIds) state.selectedClientIds = clientIds;
        if (programIds) state.selectedProgramIds = programIds;
    },
    
    // --- CRUD (Create, Read, Update, Delete) pentru date ---
    
    /**
     * Adaugă sau actualizează un eveniment (sau mai multe, pt. recurență).
     * @param {object | object[]} eventData - Un singur eveniment sau un array de evenimente
     */
    saveEvent: (eventData) => {
        if (Array.isArray(eventData)) {
            // Caz: Evenimente noi recurente
            state.events.push(...eventData);
        } else {
            // Caz: Editare sau eveniment nou unic
            const index = state.events.findIndex(e => e.id === eventData.id);
            if (index > -1) {
                // Editare
                state.events[index] = eventData;
            } else {
                // Adăugare
                state.events.push(eventData);
            }
        }
    },
    
    /**
     * Șterge un eveniment.
     * @param {string} eventId - ID-ul evenimentului de șters
     */
    deleteEvent: (eventId) => {
        const index = state.events.findIndex(e => e.id === eventId);
        if (index > -1) {
            state.events.splice(index, 1);
        }
    },
    
    /**
     * Șterge evenimente recurente.
     */
    deleteRecurringEvents: (criteria) => {
        // Filtrează toate evenimentele care NU se potrivesc cu criteriile de ștergere
        state.events = state.events.filter(e => 
            !(e.name === criteria.name && 
              JSON.stringify(e.teamMemberIds || [e.teamMemberId]) === JSON.stringify(criteria.teamMemberIds || [criteria.teamMemberId]) &&
              e.startTime === criteria.startTime && 
              e.duration === criteria.duration &&
              JSON.stringify(e.repeating) === JSON.stringify(criteria.repeating))
        );
    },

    /**
     * Actualizează toate evenimentele dintr-o serie recurentă.
     * @param {object} originalEvent - Evenimentul original care a fost editat.
     * @param {object} newEventBaseData - Noile date din formular (fără ID).
     */
    updateRecurringEvents: (originalEvent, newEventBaseData) => {
        // Define criteria to find matching recurring events
        const criteria = {
            name: originalEvent.name,
            teamMemberIds: originalEvent.teamMemberIds || (originalEvent.teamMemberId ? [originalEvent.teamMemberId] : []),
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
            repeating: originalEvent.repeating
        };

        const criteriaTeamIds = JSON.stringify(criteria.teamMemberIds.sort());
        const criteriaRepeating = JSON.stringify((criteria.repeating || []).map(d => parseInt(d)).sort());

        state.events.forEach((event, index) => {
            const eventTeamIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            const eventRepeating = (event.repeating || []).map(d => parseInt(d));

            const matches = 
                event.name === criteria.name &&
                event.startTime === criteria.startTime &&
                event.duration === criteria.duration &&
                JSON.stringify(eventTeamIds.sort()) === criteriaTeamIds &&
                JSON.stringify(eventRepeating.sort()) === criteriaRepeating;

            if (matches) {
                state.events[index] = {
                    ...event, 
                    ...newEventBaseData, 
                    id: event.id, 
                    date: event.date 
                };
            }
        });
    },

    /**
     * Salvează un membru al echipei.
     * @param {object} memberData - Datele membrului (include ID)
     */
    saveTeamMember: (memberData) => {
        const index = state.teamMembers.findIndex(m => m.id === memberData.id);
        if (index > -1) {
            state.teamMembers[index] = { ...state.teamMembers[index], ...memberData };
        } else {
            state.teamMembers.push(memberData);
            state.activeFilters.push(memberData.id); 
        }
    },
    
    /**
     * Șterge un membru al echipei și evenimentele asociate.
     * @param {string} memberId - ID-ul membrului
     */
    deleteTeamMember: (memberId) => {
        state.teamMembers = state.teamMembers.filter(m => m.id !== memberId);
        
        state.events = state.events.map(event => {
            if (event.teamMemberIds) {
                event.teamMemberIds = event.teamMemberIds.filter(id => id !== memberId);
            }
            if (event.teamMemberId === memberId) {
                delete event.teamMemberId;
            }
            return event;
        }).filter(event => (event.teamMemberIds && event.teamMemberIds.length > 0) || event.teamMemberId);
        
        state.activeFilters = state.activeFilters.filter(id => id !== memberId);
    },

   /**
     * Salvează un client.
     * @param {object} clientData - Datele clientului (include ID)
     */
    saveClient: (clientData) => {
        const originalId = state.editingClientId;
        const newId = clientData.id;

        if (originalId) {
            // --- MOD EDITARE ---
            const index = state.clients.findIndex(c => c.id === originalId);
            
            if (index > -1) {
                state.clients[index] = { ...state.clients[index], ...clientData }; 

                if (originalId !== newId) {
                    // --- ID-ul s-a schimbat, trebuie migrate datele ---
                    
                    // 1. Migrează datele din evolutionData
                    const legacyOriginalId = `client_${originalId}`;
                    if (state.evolutionData[originalId]) {
                        state.evolutionData[newId] = state.evolutionData[originalId];
                        delete state.evolutionData[originalId];
                    }
                    if (state.evolutionData[legacyOriginalId]) {
                        state.evolutionData[newId] = state.evolutionData[legacyOriginalId];
                        delete state.evolutionData[legacyOriginalId];
                    }
                    if (state.evolutionData[newId]) {
                        state.evolutionData[newId].name = clientData.name;
                    }
                    
                    // 2. Migrează referințele din 'events'
                    state.events.forEach(event => {
                        if (event.clientId === originalId) {
                            event.clientId = newId;
                        }
                        if (event.clientIds && event.clientIds.includes(originalId)) {
                            event.clientIds = event.clientIds.map(id => id === originalId ? newId : id);
                        }
                    });

                    // 3. Migrează datele din billingsData
                    if (state.billingsData[originalId]) {
                        state.billingsData[newId] = state.billingsData[originalId];
                        delete state.billingsData[originalId];
                    }
                    if (state.billingsData[legacyOriginalId]) {
                        state.billingsData[newId] = state.billingsData[legacyOriginalId];
                        delete state.billingsData[legacyOriginalId];
                    }
                }
            } else {
                state.clients.push(clientData);
            }
        } else {
            // --- MOD ADĂUGARE NOU ---
            const index = state.clients.findIndex(c => c.id === newId);
            if (index === -1) { 
                state.clients.push(clientData);
            }
        }
    },
    
    /**
     * Șterge un client.
     * @param {string} clientId - ID-ul clientului
     */
    deleteClient: (clientId) => {
        // 1. Șterge clientul din lista principală
        state.clients = state.clients.filter(c => c.id !== clientId);

        // 2. Modifică/Filtrează evenimentele
        state.events = state.events.map(event => {
            if (event.clientId === clientId) {
                delete event.clientId;
            }
            if (event.clientIds && event.clientIds.includes(clientId)) {
                event.clientIds = event.clientIds.filter(id => id !== clientId);
            }
            return event;
        }).filter(event => {
            // 3. FILTRU NOU: Șterge evenimentul dacă nu mai are clienți
            
            // (MODIFICAT) Verifică tipul dinamic
            const eventType = calendarState.getEventTypeById(event.type);
            // Presupune că e facturabil (necesită client) dacă tipul nu e găsit
            const requiresClient = eventType ? eventType.isBillable : true; 

            if (!requiresClient) {
                return true; // Păstrează evenimente non-facturabile (ședință, pauză)
            }
            
            // Verifică ambele câmpuri (vechi și nou)
            const hasOldClient = event.clientId;
            const hasNewClients = event.clientIds && event.clientIds.length > 0;
            
            // Păstrează evenimentul doar dacă MAI ARE cel puțin un client
            return hasOldClient || hasNewClients;
        });
        
        // --- SFÂRȘIT CORECȚIE ---
        
        // Șterge și datele de evoluție și facturare
        const legacyClientId = `client_${clientId}`;
        if (state.evolutionData[clientId]) delete state.evolutionData[clientId];
        if (state.evolutionData[legacyClientId]) delete state.evolutionData[legacyClientId];
        if (state.billingsData[clientId]) delete state.billingsData[clientId];
        if (state.billingsData[legacyClientId]) delete state.billingsData[legacyClientId];
    },

    /**
     * NOU: Salvează un tip de eveniment.
     * @param {object} typeData - Datele tipului (include ID)
     */
    saveEventType: (typeData) => {
        const index = state.eventTypes.findIndex(t => t.id === typeData.id);
        if (index > -1) {
            // Editare
            state.eventTypes[index] = { ...state.eventTypes[index], ...typeData };
        } else {
            // Adăugare
            state.eventTypes.push(typeData);
        }
    },

    /**
     * NOU: Șterge un tip de eveniment.
     * @param {string} typeId - ID-ul tipului
     */
    deleteEventType: (typeId) => {
        state.eventTypes = state.eventTypes.filter(t => t.id !== typeId);
        // Notă: Nu ștergem evenimentele asociate, ele vor afișa ID-ul
    },

    /**
     * Setează starea de editare pentru un membru/client/tip.
     */
    setEditingId: ({ memberId, clientId, eventTypeId }) => {
        if (memberId !== undefined) state.editingMemberId = memberId;
        if (clientId !== undefined) state.editingClientId = clientId;
        if (eventTypeId !== undefined) state.editingEventTypeId = eventTypeId; // <-- NOU
    }
};