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
    
    // Clear list
    dom.list.innerHTML = '';
    
    if (filtered.length === 0) {
        dom.list.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                ${searchTerm ? 'Niciun tip găsit pentru căutarea ta.' : 'Nu există tipuri de evenimente. Adaugă primul!'}
            </div>
        `;
        return;
    }
    
    // Render cards
    filtered.forEach(type => {
        const card = createEventTypeCard(type);
        dom.list.appendChild(card);
    });
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
        dom.modalTitle.textContent = 'Editează Tip Eveniment';
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
        dom.modalTitle.textContent = 'Adaugă Tip Eveniment';
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
        
        // Reîncarcă tipurile și actualizează UI
        await reloadEventTypes();
        closeModal();
        
    } catch (error) {
        console.error('Eroare la salvarea tipului:', error);
        showCustomAlert(error.message || 'Nu s-a putut salva tipul de eveniment.', 'Eroare');
    }
}

/**
 * Șterge tipul de eveniment.
 */
async function handleDelete() {
    const id = dom.originalId.value;
    if (!id) return;
    
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
        
        // Reîncarcă tipurile și actualizează UI
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