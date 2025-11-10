/**
 * js/settingsService.js
 *
 * Gestionează logica pentru secțiunea de Setări.
 * Include management pentru tipuri de evenimente și prețuri.
 */

import * as api from './apiService.js';
import { showCustomAlert } from './uiService.js';

// --- Stare locală ---
let eventTypesData = [];

// --- Elemente DOM ---
const $ = (id) => document.getElementById(id);

/**
 * Inițializează ascultătorii de evenimente pentru secțiunea de setări.
 * Chemată din main.js.
 */
export async function init() {
    const section = $('settingsSection');
    if (!section) return;

    // Load event types data
    await loadEventTypes();

    // Tab switching
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.settingsTab;
            switchSettingsTab(tabName);
        });
    });

    // Save button
    const saveBtn = $('saveEventTypesBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveEventTypes);
    }

    // Render initial view
    renderEventTypesTable();
}

/**
 * Switch between settings tabs
 */
function switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.settingsTab === tabName);
    });

    // Update panels
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const targetPanel = document.querySelector(`#${tabName}Panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

/**
 * Load event types from database
 */
async function loadEventTypes() {
    try {
        eventTypesData = await api.loadEventTypes();
        console.log('Event types loaded:', eventTypesData);
    } catch (err) {
        console.error('Failed to load event types:', err);
        showCustomAlert('Nu s-au putut încărca tipurile de evenimente.', 'Eroare');
        
        // Use default data if loading fails
        eventTypesData = [
            { id: 'therapy', label: 'Terapie', isBillable: true, requiresTime: true, basePrice: 100 },
            { id: 'group-therapy', label: 'Terapie de grup', isBillable: true, requiresTime: true, basePrice: 80 },
            { id: 'coordination', label: 'Coordonare', isBillable: true, requiresTime: true, basePrice: 50 },
            { id: 'pauza-masa', label: 'Pauză de masă', isBillable: false, requiresTime: false, basePrice: 0 },
            { id: 'sedinta', label: 'Ședință', isBillable: false, requiresTime: true, basePrice: 0 },
            { id: 'day-off', label: 'Zi liberă', isBillable: false, requiresTime: false, basePrice: 0 }
        ];
    }
}

/**
 * Render the event types table
 */
function renderEventTypesTable() {
    const tbody = $('eventTypesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    eventTypesData.forEach((eventType, index) => {
        const row = document.createElement('tr');
        row.dataset.eventTypeId = eventType.id;
        row.dataset.index = index;

        // Event Type Icon
        const icon = getEventTypeIcon(eventType.id);

        row.innerHTML = `
            <td>
                <div class="event-type-label">
                    <div class="event-type-icon">${icon}</div>
                    <div>
                        <div class="font-semibold text-gray-900 dark:text-white">${eventType.label}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${eventType.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           data-field="isBillable" 
                           ${eventType.isBillable ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           data-field="requiresTime" 
                           ${eventType.requiresTime ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <div class="price-input-wrapper">
                    <input type="number" 
                           class="price-input" 
                           data-field="basePrice"
                           value="${eventType.basePrice.toFixed(2)}" 
                           min="0" 
                           step="0.01"
                           ${!eventType.isBillable ? 'disabled' : ''}>
                    <span class="price-currency">RON</span>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners for changes
    attachEventListeners();
}

/**
 * Attach event listeners to table inputs
 */
function attachEventListeners() {
    const tbody = $('eventTypesTableBody');
    if (!tbody) return;

    // Listen for changes to isBillable checkbox
    tbody.querySelectorAll('input[data-field="isBillable"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            const index = parseInt(row.dataset.index);
            const priceInput = row.querySelector('input[data-field="basePrice"]');
            
            eventTypesData[index].isBillable = e.target.checked;
            
            // Enable/disable price input based on isBillable
            if (priceInput) {
                priceInput.disabled = !e.target.checked;
                if (!e.target.checked) {
                    priceInput.value = '0.00';
                    eventTypesData[index].basePrice = 0;
                }
            }
        });
    });

    // Listen for changes to requiresTime checkbox
    tbody.querySelectorAll('input[data-field="requiresTime"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            const index = parseInt(row.dataset.index);
            eventTypesData[index].requiresTime = e.target.checked;
        });
    });

    // Listen for changes to price input
    tbody.querySelectorAll('input[data-field="basePrice"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const row = e.target.closest('tr');
            const index = parseInt(row.dataset.index);
            const value = parseFloat(e.target.value) || 0;
            eventTypesData[index].basePrice = value;
            e.target.value = value.toFixed(2);
        });
    });
}

/**
 * Handle save event types button click
 */
async function handleSaveEventTypes() {
    const saveBtn = $('saveEventTypesBtn');
    if (!saveBtn) return;

    // Disable button and show loading state
    saveBtn.disabled = true;
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Se salvează...
    `;

    try {
        await api.saveEventTypes(eventTypesData);
        
        // Success feedback
        saveBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Salvat!
        `;
        
        showCustomAlert('Tipurile de evenimente au fost salvate cu succes!', 'Succes');

        // Log activity
        if (window.logActivity) {
            window.logActivity("Setări actualizate", "Tipuri de evenimente și prețuri", 'generic', null);
        }

        // Restore button after 2 seconds
        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.disabled = false;
        }, 2000);

    } catch (err) {
        console.error('Failed to save event types:', err);
        showCustomAlert('Nu s-au putut salva modificările. Vă rugăm încercați din nou.', 'Eroare');
        
        // Restore button
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
    }
}

/**
 * Get icon SVG for event type
 */
function getEventTypeIcon(eventTypeId) {
    const icons = {
        'therapy': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>',
        'group-therapy': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        'coordination': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>',
        'pauza-masa': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
        'sedinta': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        'day-off': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    };
    
    return icons[eventTypeId] || icons['therapy'];
}

/**
 * Get current event types data (for use by other modules)
 */
export function getEventTypes() {
    return eventTypesData;
}

/**
 * Get base price for a specific event type
 */
export function getBasePrice(eventTypeId) {
    const eventType = eventTypesData.find(et => et.id === eventTypeId);
    return eventType ? eventType.basePrice : 100;
}