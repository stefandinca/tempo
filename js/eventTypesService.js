/**
 * js/eventTypesService.js
 *
 * Gestionează UI-ul și logica pentru tipurile de evenimente.
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
import { showCustomAlert, showCustomConfirm } from './uiService.js';

// --- Elemente DOM ---
const $ = (id) => document.getElementById(id);
const dom = {
    section: $('eventTypesSection'),
    list: $('eventTypesList'),
    searchBar: $('eventTypeSearchBar'),
    addBtn: $('addEventTypeBtn'),
    
    // Modal
    modal: $('eventTypeModal'),
    modalTitle: $('eventTypeModalTitle'),
    form: $('eventTypeForm'),
    closeBtn: $('closeEventTypeModal'),
    cancelBtn: $('cancelEventTypeBtn'),
    deleteBtn: $('deleteEventTypeBtn'),
    
    // Form fields
    originalId: $('eventTypeOriginalId'),
    idField: $('eventTypeId'),
    labelField: $('eventTypeLabel'),
    isBillableField: $('eventTypeIsBillable'),
    requiresTimeField: $('eventTypeRequiresTime'),
    priceField: $('eventTypePrice')
};

/**
 * Inițializează serviciul de tipuri evenimente.
 */
export function init() {
    if (!dom.section) return;
    
    // Event listeners
    dom.addBtn.addEventListener('click', () => openModal());
    dom.closeBtn.addEventListener('click', closeModal);
    dom.cancelBtn.addEventListener('click', closeModal);
    dom.deleteBtn.addEventListener('click', handleDelete);
    dom.form.addEventListener('submit', handleSave);
    dom.searchBar.addEventListener('input', () => renderList());
    
    // Close modal on backdrop click
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeModal();
    });
    
    // Render initial list
    renderList();
}

/**
 * Randează lista de tipuri de evenimente.
 */
export function renderList() {
    const { eventTypes } = calendarState.getState();
    const searchTerm = dom.searchBar.value.toLowerCase();
    
    // Filtrare
    const filtered = eventTypes.filter(type => 
        type.label.toLowerCase().includes(searchTerm) ||
        type.id.toLowerCase().includes(searchTerm)
    );

    // Add event delegation for program cards
setTimeout(() => {
    const programsContainer = document.getElementById('programsListContainer');
    if (programsContainer) {
        programsContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('[data-action="edit-program"]');
            const deleteBtn = e.target.closest('[data-action="delete-program"]');
            
            if (editBtn) {
                const programId = editBtn.dataset.id;
                const { programs } = calendarState.getState();
                const program = programs.find(p => p.id === programId);
                if (program) openProgramModal(program);
            }
            
            if (deleteBtn) {
                const programId = deleteBtn.dataset.id;
                handleDeleteProgram(programId);
            }
        });
    }
}, 100);
    
    // Clear list
    dom.list.innerHTML = '';
    
    // Add Servicii section with collapse
    const serviciiSection = document.createElement('div');
    serviciiSection.innerHTML = `
        <div class="flex items-center justify-between mb-4 cursor-pointer bg-blue-100 py-4 px-6 rounded-lg" id="serviciiHeader">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Lista Servicii</h2>
            <div class="flex items-center gap-2">
                <button id="addServiceBtn" class="btn btn-primary flex items-center gap-2 px-3 py-2 text-sm" onclick="event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                    <span>Adaugă Serviciu</span>
                </button>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform rotate-180" id="serviciiChevron">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
        <div id="serviciiListContainer" class="space-y-4">
            ${filtered.length === 0 ? 
                `<div class="text-center py-8 text-gray-500">
                    ${searchTerm ? 'Niciun serviciu găsit pentru căutarea ta.' : 'Nu există servicii. Adaugă primul!'}
                </div>` :
                ''
            }
        </div>
    `;
    
    dom.list.appendChild(serviciiSection);
    
    // Add event type cards to the container
    const serviciiContainer = document.getElementById('serviciiListContainer');
    filtered.forEach(type => {
        const card = createEventTypeCard(type);
        serviciiContainer.appendChild(card);
    });
    
    // Add toggle functionality for servicii header
    const header = document.getElementById('serviciiHeader');
    const container = document.getElementById('serviciiListContainer');
    const chevron = document.getElementById('serviciiChevron');
    
    if (header && container && chevron) {
        header.addEventListener('click', () => {
            container.classList.toggle('hidden');
            chevron.classList.toggle('rotate-180');
        });
    }
    
    // Add click handler for add service button
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal();
        });
    }
    
    // Add programs section
    const programsSection = renderProgramsList();
    dom.list.appendChild(programsSection);
}


/**
 * Deschide modalul pentru adăugare/editare program
 */
function openProgramModal(program = null) {
    // Reuse the event type modal for programs
    if (program) {
        // Edit mode
        dom.modalTitle.textContent = 'Editează Program';
        dom.originalId.value = program.id;
        dom.idField.value = program.id;
        dom.idField.disabled = true;
        dom.labelField.value = program.title;
        dom.priceField.closest('.form-group').style.display = 'none'; // Hide price field
        dom.isBillableField.closest('.form-group').style.display = 'none'; // Hide billable field
        dom.requiresTimeField.closest('.form-group').style.display = 'none'; // Hide requires time field
        
        // Use the price field for description (hack, but works)
        dom.priceField.type = 'text';
        dom.priceField.value = program.description || '';
        const priceLabel = dom.priceField.closest('.form-group').querySelector('label');
        if (priceLabel) priceLabel.textContent = 'Descriere';
        dom.priceField.closest('.form-group').style.display = 'block';
        
        dom.deleteBtn.style.display = 'inline-flex';
        dom.deleteBtn.dataset.type = 'program'; // Mark as program delete
    } else {
        // Add mode
        dom.modalTitle.textContent = 'Adaugă Program';
        dom.form.reset();
        dom.originalId.value = '';
        dom.idField.disabled = false;
        dom.idField.placeholder = 'ex: prog_limbaj_expresiv';
        dom.labelField.placeholder = 'ex: Limbaj Expresiv';
        dom.priceField.type = 'text';
        dom.priceField.value = '';
        const priceLabel = dom.priceField.closest('.form-group').querySelector('label');
        if (priceLabel) priceLabel.textContent = 'Descriere';
        dom.priceField.placeholder = 'Descriere opțională a programului';
        dom.priceField.closest('.form-group').style.display = 'block';
        dom.isBillableField.closest('.form-group').style.display = 'none';
        dom.requiresTimeField.closest('.form-group').style.display = 'none';
        dom.deleteBtn.style.display = 'none';
    }
    
    dom.modal.style.display = 'flex';
    dom.idField.focus();
}

/**
 * Salvează programul (create sau update)
 */
async function handleSaveProgram(programData) {
    const isEdit = !!dom.originalId.value;
    
    try {
        if (isEdit) {
            await api.updateProgram(programData);
            showCustomAlert('Programul a fost actualizat cu succes!', 'Succes');
        } else {
            await api.createProgram(programData);
            showCustomAlert('Programul a fost creat cu succes!', 'Succes');
        }
        
        await reloadPrograms();
        closeModal();
        
    } catch (error) {
        console.error('Eroare la salvarea programului:', error);
        showCustomAlert(error.message || 'Nu s-a putut salva programul.', 'Eroare');
    }
}

/**
 * Șterge programul
 */
async function handleDeleteProgram(id) {
    const { programs } = calendarState.getState();
    const program = programs.find(p => p.id === id);
    
    const confirmed = await showCustomConfirm(
        `Sigur vrei să ștergi programul "${program.title}"?\n\nAceastă acțiune este permanentă și nu poate fi anulată.`,
        'Confirmare Ștergere'
    );
    
    if (!confirmed) return;
    
    try {
        await api.deleteProgram(id);
        showCustomAlert('Programul a fost șters cu succes!', 'Succes');
        
        await reloadPrograms();
        closeModal();
        
    } catch (error) {
        console.error('Eroare la ștergerea programului:', error);
        showCustomAlert(error.message || 'Nu s-a putut șterge programul.', 'Eroare');
    }
}

/**
 * Reîncarcă programele și actualizează UI
 */
async function reloadPrograms() {
    try {
        const programsData = await api.loadPrograms();
        calendarState.setPrograms(programsData.programs);
        renderList();
    } catch (error) {
        console.error('Eroare la reîncărcarea programelor:', error);
    }
}

/**
 * Randează lista de programe (collapsible)
 */
/**
 * Randează lista de programe (collapsible)
 */
function renderProgramsList() {
    const { programs } = calendarState.getState();
    const searchTerm = dom.searchBar.value.toLowerCase();
    
    // Filter programs
    const filtered = programs.filter(prog => 
        prog.title.toLowerCase().includes(searchTerm) ||
        (prog.description && prog.description.toLowerCase().includes(searchTerm))
    );
    
    // Create programs section
    const programsSection = document.createElement('div');
    programsSection.className = 'mt-8';
    programsSection.innerHTML = `
        <div class="flex items-center justify-between mb-4 cursor-pointer bg-blue-100 py-4 px-6 rounded-lg" id="programsHeader">
            <h2 class="text-xl font-semibold text-gray-900 ">Programe</h2>
            <div class="flex items-center gap-2">
                <button id="addProgramBtn" class="btn btn-primary flex items-center gap-2 px-3 py-2 text-sm" onclick="event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                    <span>Adaugă Program</span>
                </button>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform" id="programsChevron">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
        <div id="programsListContainer" class=" space-y-3">
            ${filtered.length === 0 ? 
                '<div class="text-center py-8 text-gray-500">Nu există programe.</div>' :
                filtered.map(prog => createProgramCard(prog)).join('')
            }
        </div>
    `;
    
    // Add toggle functionality
    setTimeout(() => {
        const header = document.getElementById('programsHeader');
        const container = document.getElementById('programsListContainer');
        const chevron = document.getElementById('programsChevron');
        
        if (header && container && chevron) {
            header.addEventListener('click', () => {
                container.classList.toggle('hidden');
                chevron.classList.toggle('rotate-180');
            });
        }
        
        // Add click handler for add program button
        const addProgramBtn = document.getElementById('addProgramBtn');
        if (addProgramBtn) {
            addProgramBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openProgramModal();
            });
        }
    }, 0);
    
    return programsSection;
}

/**
 * Creează un card pentru un program
 */
function createProgramCard(program) {
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${program.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">${program.id}</code></p>
                    ${program.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-2">${program.description}</p>` : ''}
                </div>
                
                <div class="flex gap-2 ml-4">
                    <button class="btn-icon hover:bg-gray-100 dark:hover:bg-gray-700" data-action="edit-program" data-id="${program.id}" title="Editează">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="btn-icon hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400" data-action="delete-program" data-id="${program.id}" title="Șterge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Creează un card pentru un tip de eveniment.
 */
function createEventTypeCard(type) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow';
    
    card.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${type.label}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">${type.id}</code></p>
                
                <div class="flex gap-2 mt-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.isBillable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                        ${type.isBillable ? '💰 Facturabil' : '❌ Nefacturabil'}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.requiresTime ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                        ${type.requiresTime ? '⏰ Necesită timp' : '⏸️  Timp opțional'}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        💳 ${type.base_price || 0} RON
                    </span>
                </div>
            </div>
            
            <button class="btn-icon hover:bg-gray-100 dark:hover:bg-gray-700" data-action="edit" data-id="${type.id}" title="Editează">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
        </div>
    `;
    
    // Edit button handler
    const editBtn = card.querySelector('[data-action="edit"]');
    editBtn.addEventListener('click', () => openModal(type));
    
    return card;
}

/**
 * Deschide modalul pentru adăugare/editare.
 */
function openModal(type = null) {
    if (type) {
        // Edit mode
        dom.modalTitle.textContent = 'Editează Serviciu';
        dom.originalId.value = type.id;
        dom.idField.value = type.id;
        dom.idField.disabled = true; // ID nu se poate schimba
        dom.labelField.value = type.label;
        dom.isBillableField.checked = type.isBillable;
        dom.requiresTimeField.checked = type.requiresTime;
        dom.priceField.value = type.base_price || 0;
        dom.deleteBtn.style.display = 'inline-flex';
    } else {
        // Add mode
        dom.modalTitle.textContent = 'Adaugă Serviciu';
        dom.form.reset();
        dom.originalId.value = '';
        dom.idField.disabled = false;
        dom.priceField.value = 0;
        dom.deleteBtn.style.display = 'none';
    }
    
    dom.modal.style.display = 'flex';
    dom.idField.focus();
}

/**
 * Închide modalul.
 */
function closeModal() {
    dom.modal.style.display = 'none';
    dom.form.reset();
}

/**
 * Salvează tipul de eveniment (create sau update).
 */
async function handleSave(e) {
    e.preventDefault();
    
    // Check if we're editing a program (based on hidden fields)
    const isProgram = dom.isBillableField.closest('.form-group').style.display === 'none';
    
    if (isProgram) {
        const programData = {
            id: dom.idField.value.trim().toLowerCase(),
            title: dom.labelField.value.trim(),
            description: dom.priceField.value.trim() // Using price field for description
        };
        
        // Validate ID format for programs
        if (!programData.id.startsWith('prog_')) {
            showCustomAlert('ID-ul programului trebuie să înceapă cu "prog_"', 'Eroare');
            return;
        }
        
        await handleSaveProgram(programData);
    } else {
        // Original event type save logic
        const eventType = {
            id: dom.idField.value.trim().toLowerCase(),
            label: dom.labelField.value.trim(),
            isBillable: dom.isBillableField.checked,
            requiresTime: dom.requiresTimeField.checked,
            base_price: parseFloat(dom.priceField.value) || 0
        };
        
        const isEdit = !!dom.originalId.value;
        
        try {
            if (isEdit) {
                await api.updateEventType(eventType);
                showCustomAlert('Tipul de eveniment a fost actualizat cu succes!', 'Succes');
            } else {
                await api.createEventType(eventType);
                showCustomAlert('Tipul de eveniment a fost creat cu succes!', 'Succes');
            }
            
            await reloadEventTypes();
            closeModal();
            
        } catch (error) {
            console.error('Eroare la salvarea tipului:', error);
            showCustomAlert(error.message || 'Nu s-a putut salva tipul de eveniment.', 'Eroare');
        }
    }
}

/**
 * Șterge tipul de eveniment.
 */
async function handleDelete() {
    const id = dom.originalId.value;
    if (!id) return;
    
    // Check if deleting a program
    if (dom.deleteBtn.dataset.type === 'program') {
        await handleDeleteProgram(id);
        return;
    }
    
    // Original event type delete logic
    const { eventTypes } = calendarState.getState();
    const type = eventTypes.find(t => t.id === id);
    
    const confirmed = await showCustomConfirm(
        `Sigur vrei să ștergi tipul "${type.label}"?\n\nAceastă acțiune este permanentă și nu poate fi anulată.`,
        'Confirmare Ștergere'
    );
    
    if (!confirmed) return;
    
    try {
        await api.deleteEventType(id);
        showCustomAlert('Tipul de eveniment a fost șters cu succes!', 'Succes');
        
        await reloadEventTypes();
        closeModal();
        
    } catch (error) {
        console.error('Eroare la ștergerea tipului:', error);
        showCustomAlert(error.message || 'Nu s-a putut șterge tipul de eveniment.', 'Eroare');
    }
}

/**
 * Reîncarcă tipurile de evenimente și actualizează toate componentele.
 */
async function reloadEventTypes() {
    try {
        const eventTypes = await api.loadEventTypes();
        calendarState.setEventTypes(eventTypes);
        
        // Actualizează dropdown-ul din modalul de evenimente
        if (window.populateEventTypeDropdown) {
            window.populateEventTypeDropdown(eventTypes);
        }
        
        // Actualizează lista
        renderList();
        
    } catch (error) {
        console.error('Eroare la reîncărcarea tipurilor:', error);
    }
}