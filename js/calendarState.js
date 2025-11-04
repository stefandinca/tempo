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

    // Starea filtrelor
    activeFilters: [], // O listă de ID-uri ale membrilor echipei

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
     * Setează datele de evoluție.
     */
    setEvolutionData: (data) => {
        state.evolutionData = data || {};
    },

    /**
     * Setează datele de facturare.
     */
    setBillingsData: (data) => {
        state.billingsData = data || {};
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
            
            // 2. Verifică potrivirea filtrelor
            // Dacă nu există filtre active, arată tot
            if (state.activeFilters.length === 0) {
                return true;
            }
            
            // Verifică formatul nou (teamMemberIds array) și cel vechi (teamMemberId)
            const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
            const hasMatchingMember = teamMemberIds.some(id => state.activeFilters.includes(id));
            
            return hasMatchingMember;
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
        state.events = state.events.filter(e => 
            !(e.name === criteria.name && 
              JSON.stringify(e.teamMemberIds || [e.teamMemberId]) === JSON.stringify(criteria.teamMemberIds || [criteria.teamMemberId]) &&
              e.startTime === criteria.startTime && 
              e.duration === criteria.duration &&
              JSON.stringify(e.repeating) === JSON.stringify(criteria.repeating))
        );
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
                    if (state.evolutionData[originalId]) {
                        state.evolutionData[newId] = state.evolutionData[originalId];
                        delete state.evolutionData[originalId];
                        
                        // De asemenea, actualizează numele în datele de evoluție migrate
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
        state.clients = state.clients.filter(c => c.id !== clientId);
        // Elimină referința din evenimente
        state.events.forEach(event => {
            if (event.clientId === clientId) {
                delete event.clientId;
            }
            if (event.clientIds && event.clientIds.includes(clientId)) {
                event.clientIds = event.clientIds.filter(id => id !== clientId);
            }
        });
    },

    /**
     * Setează starea de editare pentru un membru/client.
     */
    setEditingId: ({ memberId, clientId }) => {
        if (memberId !== undefined) state.editingMemberId = memberId;
        if (clientId !== undefined) state.editingClientId = clientId;
    }
};