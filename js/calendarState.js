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
    evolutionData: {},
    billingsData: {},
    eventTypes: [], // Tipuri de evenimente din baza de date
    discountThresholds: [], // Praguri de discount pentru facturare

    // Starea filtrelor
    activeFilters: [], // O listă de ID-uri ale membrilor echipei
    activeClientFilterId: null, // Filtru pentru un singur client

    // Starea modalelor (pentru a ști ce se editează)
    editingEventId: null,
    editingMemberId: null,
    editingClientId: null,
    
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
     * Setează tipurile de evenimente încărcate.
     */
    setEventTypes: (eventTypes) => {
        state.eventTypes = eventTypes || [];
    },

    /**
     * Obține label-ul pentru un tip de eveniment pe baza ID-ului.
     * @param {string} typeId - ID-ul tipului de eveniment
     * @returns {string} - Label-ul tipului sau ID-ul dacă nu se găsește
     */
    getEventTypeLabel: (typeId) => {
        const eventType = state.eventTypes.find(t => t.id === typeId);
        return eventType ? eventType.label : typeId;
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
     * Setează pragurile de discount pentru facturare.
     * @param {array} thresholds - Array de obiecte {hours, discount}
     */
    setDiscountThresholds: (thresholds) => {
        state.discountThresholds = thresholds || [];
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
    // Aceștia vor înlocui logica de filtrare din interiorul funcțiilor de randare
    
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
    // Aceste funcții vor înlocui manipularea directă a array-urilor
    
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
        // IMPORTANT: Include verificarea lunii pentru a afecta doar evenimentele din aceeași lună
        state.events = state.events.filter(e => {
            // Extract month from event date (YYYY-MM)
            const eventMonth = e.date ? e.date.substring(0, 7) : null;
            const criteriaMonth = criteria.month || null;

            return !(e.name === criteria.name &&
              JSON.stringify(e.teamMemberIds || [e.teamMemberId]) === JSON.stringify(criteria.teamMemberIds || [criteria.teamMemberId]) &&
              e.startTime === criteria.startTime &&
              e.duration === criteria.duration &&
              JSON.stringify(e.repeating) === JSON.stringify(criteria.repeating) &&
              eventMonth === criteriaMonth); // Doar evenimentele din aceeași lună
        });
    },

    /**
     * Actualizează toate evenimentele dintr-o serie recurentă.
     * @param {object} originalEvent - Evenimentul original care a fost editat.
     * @param {object} newEventBaseData - Noile date din formular (fără ID).
     */
    updateRecurringEvents: (originalEvent, newEventBaseData) => {
        // Define criteria to find matching recurring events
        // Based on deleteRecurringEvents logic
        const criteria = {
            name: originalEvent.name,
            teamMemberIds: originalEvent.teamMemberIds || (originalEvent.teamMemberId ? [originalEvent.teamMemberId] : []),
            startTime: originalEvent.startTime,
            duration: originalEvent.duration,
            repeating: originalEvent.repeating,
            month: originalEvent.date ? originalEvent.date.substring(0, 7) : null // YYYY-MM
        };

        // Normalize criteria teamMemberIds for comparison
        const criteriaTeamIds = JSON.stringify(criteria.teamMemberIds.sort());
        const criteriaRepeating = JSON.stringify((criteria.repeating || []).map(d => parseInt(d)).sort());

        state.events.forEach((event, index) => {
            // Check if this event matches the original criteria
            const eventTeamIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            const eventRepeating = (event.repeating || []).map(d => parseInt(d));
            const eventMonth = event.date ? event.date.substring(0, 7) : null;

            const matches =
                event.name === criteria.name &&
                event.startTime === criteria.startTime &&
                event.duration === criteria.duration &&
                JSON.stringify(eventTeamIds.sort()) === criteriaTeamIds &&
                JSON.stringify(eventRepeating.sort()) === criteriaRepeating &&
                eventMonth === criteria.month; // DOAR evenimentele din aceeași lună

            if (matches) {
                // Found a matching event in the series. Update it.
                // Preserve the original event's ID and Date
                // Apply all other new data from the form
                state.events[index] = {
                    ...event, // Preserves id, date, attendance, programScores, comments
                    ...newEventBaseData, // Applies new name, details, type, time, duration, members, clients, programs, repeating
                    id: event.id, // Explicitly preserve ID
                    date: event.date // Explicitly preserve Date
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
            // Editare
            state.teamMembers[index] = { ...state.teamMembers[index], ...memberData };
        } else {
            // Adăugare
            state.teamMembers.push(memberData);
            state.activeFilters.push(memberData.id); // Activează filtrul by default
        }
    },
    
    /**
     * Șterge un membru al echipei și evenimentele asociate.
     * @param {string} memberId - ID-ul membrului
     */
    deleteTeamMember: (memberId) => {
        state.teamMembers = state.teamMembers.filter(m => m.id !== memberId);
        
        // Elimină membrul din evenimente
        state.events = state.events.map(event => {
            // Formatul nou
            if (event.teamMemberIds) {
                event.teamMemberIds = event.teamMemberIds.filter(id => id !== memberId);
            }
            // Formatul vechi
            if (event.teamMemberId === memberId) {
                delete event.teamMemberId;
            }
            return event;
        // La final, filtrează evenimentele care au rămas fără niciun terapeut
        }).filter(event => (event.teamMemberIds && event.teamMemberIds.length > 0) || event.teamMemberId);
        
        state.activeFilters = state.activeFilters.filter(id => id !== memberId);
    },

   /**
     * Salvează un client.
     * @param {object} clientData - Datele clientului (include ID)
     */
    saveClient: (clientData) => {
        // Verifică dacă suntem în modul de editare (dacă state.editingClientId este setat)
        const originalId = state.editingClientId;
        const newId = clientData.id;

        if (originalId) {
            // --- MOD EDITARE ---
            // Caută clientul după ID-ul original
            const index = state.clients.findIndex(c => c.id === originalId);
            
            if (index > -1) {
                // Actualizează clientul în array-ul 'clients'
                state.clients[index] = { ...state.clients[index], ...clientData }; // Acest pas actualizează și ID-ul dacă a fost schimbat

                // Verifică dacă ID-ul a fost schimbat
                if (originalId !== newId) {
                    // --- ID-ul s-a schimbat, trebuie migrate datele ---
                    
                    // 1. Migrează datele din evolutionData (evaluări)
                    const legacyOriginalId = `client_${originalId}`;
                    if (state.evolutionData[originalId]) {
                        state.evolutionData[newId] = state.evolutionData[originalId];
                        delete state.evolutionData[originalId];
                    }
                    // Verifică și cheia veche
                    if (state.evolutionData[legacyOriginalId]) {
                        state.evolutionData[newId] = state.evolutionData[legacyOriginalId];
                        delete state.evolutionData[legacyOriginalId];
                    }
                    
                    // De asemenea, actualizează numele în datele de evoluție migrate
                    if (state.evolutionData[newId]) {
                        state.evolutionData[newId].name = clientData.name;
                    }
                    
                    // 2. Migrează referințele din 'events' (istoricul programelor)
                    state.events.forEach(event => {
                        // Câmpul vechi (dacă există)
                        if (event.clientId === originalId) {
                            event.clientId = newId;
                        }
                        // Câmpul nou (array)
                        if (event.clientIds && event.clientIds.includes(originalId)) {
                            event.clientIds = event.clientIds.map(id => id === originalId ? newId : id);
                        }
                    });

                    // 3. (MODIFICAT) Migrează datele din billingsData (plăți)
                    if (state.billingsData[originalId]) {
                        state.billingsData[newId] = state.billingsData[originalId];
                        delete state.billingsData[originalId];
                    }
                    // Verifică și cheia veche
                    if (state.billingsData[legacyOriginalId]) {
                        state.billingsData[newId] = state.billingsData[legacyOriginalId];
                        delete state.billingsData[legacyOriginalId];
                    }
                }
            } else {
                // Fallback: dacă clientul original nu e găsit, adaugă-l ca nou
                state.clients.push(clientData);
            }
        } else {
            // --- MOD ADĂUGARE NOU ---
            // Verifică să nu existe deja (deși main.js face asta, e bine să fie și aici)
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
        // --- CORECȚIE BUG EVENIMENTE ORFANE ---
        
        // 1. Șterge clientul din lista principală
        state.clients = state.clients.filter(c => c.id !== clientId);

        // 2. Modifică/Filtrează evenimentele
        state.events = state.events.map(event => {
            // Elimină referința din câmpul vechi (dacă există)
            if (event.clientId === clientId) {
                delete event.clientId;
            }
            
            // Elimină referința din câmpul nou (array)
            if (event.clientIds && event.clientIds.includes(clientId)) {
                event.clientIds = event.clientIds.filter(id => id !== clientId);
            }
            return event;
        }).filter(event => {
            // 3. FILTRU NOU: Șterge evenimentul dacă nu mai are clienți
            
            // Păstrează evenimentele care nu sunt de tip 'terapie' (ex: pauză, ședință)
            // chiar dacă nu au client
            if (event.type !== 'therapy' && event.type !== 'group-therapy') {
                return true; 
            }
            
            // Verifică ambele câmpuri (vechi și nou)
            const hasOldClient = event.clientId;
            const hasNewClients = event.clientIds && event.clientIds.length > 0;
            
            // Păstrează evenimentul doar dacă MAI ARE cel puțin un client
            return hasOldClient || hasNewClients;
        });
        
        // --- SFÂRȘIT CORECȚIE ---

        
        // Șterge și datele de evoluție și facturare, verificând ambele formate
        const legacyClientId = `client_${clientId}`;

        if (state.evolutionData[clientId]) {
            delete state.evolutionData[clientId];
        }
        if (state.evolutionData[legacyClientId]) {
            delete state.evolutionData[legacyClientId];
        }

        if (state.billingsData[clientId]) {
            delete state.billingsData[clientId];
        }
        if (state.billingsData[legacyClientId]) {
            delete state.billingsData[legacyClientId];
        }
    },

    /**
     * Setează starea de editare pentru un membru/client.
     */
    setEditingId: ({ memberId, clientId }) => {
        if (memberId !== undefined) state.editingMemberId = memberId;
        if (clientId !== undefined) state.editingClientId = clientId;
    }
};