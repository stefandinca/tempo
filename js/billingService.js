/**
 * js/billingService.js
 *
 * Gestionează logica pentru noua secțiune de Facturare.
 * UPDATED: Now uses pricing from event_types table
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
import { showCustomAlert, showCustomConfirm } from './uiService.js';
import { getEventTypes, getBasePrice } from './settingsService.js';

// --- Constante ---
const DEFAULT_RATE = 100; // Fallback rate if pricing data isn't loaded
const $ = (id) => document.getElementById(id);

// --- Stare locală ---
let currentBillingDate = new Date();
let eventTypes = [];

// --- Elemente DOM ---
const dom = {
    section: $('billingSection'),
    clientList: $('billingClientList'),
    prevBtn: $('billingPrevMonth'),
    nextBtn: $('billingNextMonth'),
    currentMonthLabel: $('billingCurrentMonth'),
    billingSearchBar: $('billingSearchBar'),
    
    // Modal Plată
    paymentModal: $('paymentModal'),
    paymentForm: $('paymentForm'),
    closePaymentModalBtn: $('closePaymentModal'),
    cancelPaymentBtn: $('cancelPaymentBtn'),
    paymentClientId: $('paymentClientId'),
    paymentMonthKey: $('paymentMonthKey'),
    paymentDate: $('paymentDate'),
    paymentAmount: $('paymentAmount'),
    paymentNotes: $('paymentNotes'),
    paymentModalTitle: $('paymentModalTitle'),
};

/**
 * Load event types pricing
 */
async function loadEventTypesPricing() {
    try {
        eventTypes = await api.loadEventTypes();
        console.log('Event types pricing loaded:', eventTypes);
    } catch (err) {
        console.error('Failed to load event types pricing:', err);
        // Try to get from settingsService if already loaded
        eventTypes = getEventTypes();
        if (eventTypes.length === 0) {
            // Use defaults
            eventTypes = [
                { id: 'therapy', basePrice: 100 },
                { id: 'group-therapy', basePrice: 80 },
                { id: 'coordination', basePrice: 50 },
                { id: 'pauza-masa', basePrice: 0 },
                { id: 'sedinta', basePrice: 0 },
                { id: 'day-off', basePrice: 0 }
            ];
        }
    }
}

/**
 * Get price per hour for an event type
 */
function getPricePerHour(eventType) {
    // Try to get from loaded event types
    const type = eventTypes.find(et => et.id === eventType);
    if (type) {
        return type.basePrice || 0;
    }
    
    // Try to get from settingsService
    try {
        return getBasePrice(eventType);
    } catch {
        // Fallback to default
        return DEFAULT_RATE;
    }
}

/**
 * Inițializează ascultătorii de evenimente pentru secțiunea de facturare.
 */
export async function init() {
    if (!dom.section) return;

    // Load event types pricing
    await loadEventTypesPricing();

    dom.prevBtn.addEventListener('click', () => navigateBillingMonth(-1));
    dom.nextBtn.addEventListener('click', () => navigateBillingMonth(1));
    dom.billingSearchBar.addEventListener('input', () => renderBillingView());

    // Payment modal listeners
    dom.closePaymentModalBtn.addEventListener('click', closePaymentModal);
    dom.cancelPaymentBtn.addEventListener('click', closePaymentModal);
    dom.paymentModal.addEventListener('click', (e) => {
        if (e.target === dom.paymentModal) closePaymentModal();
    });
    dom.paymentForm.addEventListener('submit', handleSavePayment);

    // Delegated event listener for actions
    dom.clientList.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        const action = actionBtn.dataset.action;
        const card = actionBtn.closest('.billing-card');
        const clientId = card.dataset.clientId;
        const monthKey = card.dataset.monthKey;

        if (action === 'add-payment') {
            openPaymentModal(clientId, monthKey);
        } else if (action === 'delete-payment') {
            const paymentId = actionBtn.dataset.paymentId;
            handleDeletePayment(clientId, monthKey, paymentId);
        }
    });
}

/**
 * Randează întreaga vizualizare de facturare pentru luna selectată.
 */
export function renderBillingView() {
    const { clients, events } = calendarState.getState();
    const year = currentBillingDate.getFullYear();
    const month = currentBillingDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    dom.currentMonthLabel.textContent = currentBillingDate.toLocaleString('ro-RO', {
        month: 'long',
        year: 'numeric'
    });
    
    dom.clientList.innerHTML = '';

    const searchTerm = dom.billingSearchBar.value.toLowerCase();
    
    const filteredClients = clients.filter(client => {
        const nameMatch = client.name.toLowerCase().includes(searchTerm);
        const isSpecial = ['Pauza de masa', 'Sedinta', 'Concediu'].includes(client.name);
        return nameMatch && !isSpecial;
    });

    if (filteredClients.length === 0) {
        if (searchTerm) {
            dom.clientList.innerHTML = `<p class="empty-list-message">Niciun client nu corespunde termenului "${dom.billingSearchBar.value}".</p>`;
        } else {
            dom.clientList.innerHTML = '<p class="empty-list-message">Nu există clienți în sistem.</p>';
        }
        return;
    }

    filteredClients.forEach(client => {
        const hoursData = calculateClientHoursForMonth(client.id, year, month, events);
        const totalDue = hoursData.totalAmount;
        
        const card = document.createElement('div');
        card.className = 'billing-card';
        card.dataset.clientId = client.id;
        card.dataset.monthKey = monthKey;

        card.innerHTML = `
            <div class="billing-header">
                <span class="client-name">${client.name}</span>
                <span class="client-hours">${hoursData.billableHours.toFixed(1)} ore</span>
            </div>
            <div class="billing-body">
                ${generatePaymentSummary(client.id, monthKey, totalDue, hoursData)}
            </div>
            <div class="billing-actions">
                <button class="btn btn-primary btn-sm" data-action="add-payment">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-cash-coin" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8m5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0"/>
                        <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195z"/>
                        <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083q.088-.517.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1z"/>
                        <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 6 6 0 0 1 3.13-1.567"/>
                    </svg>
                    Adaugă Încasare
                </button>
            </div>
        `;
        dom.clientList.appendChild(card);
    });
}

/**
 * Generează HTML pentru rezumatul financiar cu breakdown pe tip eveniment
 */
function generatePaymentSummary(clientId, monthKey, totalDue, hoursData) {
    const { billingsData } = calendarState.getState();
    const payments = billingsData[clientId]?.[monthKey] || [];
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalDue - totalPaid;

    // Generate breakdown by event type
    let breakdownHtml = '';
    if (hoursData.hoursByType && Object.keys(hoursData.hoursByType).length > 0) {
        breakdownHtml = '<div class="billing-breakdown"><h5 style="margin: 0.5rem 0; font-size: 0.875rem; color: #666;">Detalii pe tip de serviciu:</h5><ul style="margin: 0; padding-left: 1.25rem; font-size: 0.875rem;">';
        
        for (const [type, hours] of Object.entries(hoursData.hoursByType)) {
            const pricePerHour = getPricePerHour(type);
            const amount = hours * pricePerHour;
            const typeName = getEventTypeLabel(type);
            
            if (hours > 0) {
                breakdownHtml += `<li>${typeName}: ${hours.toFixed(1)}h × ${pricePerHour.toFixed(0)} RON/h = ${amount.toFixed(2)} RON</li>`;
            }
        }
        
        breakdownHtml += '</ul></div>';
    }

    let paymentsHtml = '<p class="no-payments">Nicio încasare înregistrată.</p>';
    if (payments.length > 0) {
        paymentsHtml = payments.map(p => `
            <div class="payment-item">
                <span>📅 ${new Date(p.date).toLocaleDateString('ro-RO')}</span>
                <span class="payment-note">${p.notes || ''}</span>
                <span class="payment-amount">${p.amount.toFixed(2)} RON</span>
                <button class="btn-icon btn-delete-payment" data-action="delete-payment" data-payment-id="${p.id}" title="Șterge încasarea">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                </button>
            </div>
        `).join('');
    }

    return `
        <div class="financial-summary">
            <div class="summary-item total-due">
                <span class="label">Total de Plată</span>
                <span class="value">${totalDue.toFixed(2)} RON</span>
            </div>
            <div class="summary-item total-paid">
                <span class="label">Total Achitat</span>
                <span class="value">${totalPaid.toFixed(2)} RON</span>
            </div>
            <div class="summary-item balance ${balance > 0 ? 'due' : (balance <= 0 && totalDue > 0 ? 'paid' : '')}">
                <span class="label">Restant</span>
                <span class="value">${balance.toFixed(2)} RON</span>
            </div>
        </div>
        ${breakdownHtml}
        <div class="payments-list">
            <h4>Istoric Încasări</h4>
            ${paymentsHtml}
        </div>
    `;
}

/**
 * Calculează orele facturabile și totalul pentru un client
 */
function calculateClientHoursForMonth(clientId, year, month, allEvents) {
    const monthEvents = allEvents.filter(event => {
        const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
        if (!clientIds.includes(clientId)) return false;
        
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    let billableMinutes = 0;
    let totalAmount = 0;
    const hoursByType = {};
    
    monthEvents.forEach(event => {
        const attendance = (event.attendance && event.attendance[clientId]) || 'present';
        if (event.isBillable !== false && attendance === 'present' && event.duration) {
            const minutes = Number(event.duration) || 0;
            const hours = minutes / 60;
            const eventType = event.type || 'therapy';
            const pricePerHour = getPricePerHour(eventType);
            
            billableMinutes += minutes;
            totalAmount += hours * pricePerHour;
            
            if (!hoursByType[eventType]) {
                hoursByType[eventType] = 0;
            }
            hoursByType[eventType] += hours;
        }
    });
    
    return {
        billableHours: billableMinutes / 60,
        totalAmount: totalAmount,
        hoursByType: hoursByType
    };
}

function getEventTypeLabel(type) {
    const labels = {
        'therapy': 'Terapie individuală',
        'group-therapy': 'Terapie de grup',
        'coordination': 'Coordonare',
        'pauza-masa': 'Pauză de masă',
        'sedinta': 'Ședință',
        'day-off': 'Zi liberă'
    };
    return labels[type] || type;
}

function navigateBillingMonth(direction) {
    currentBillingDate.setMonth(currentBillingDate.getMonth() + direction);
    renderBillingView();
}

function openPaymentModal(clientId, monthKey) {
    dom.paymentModalTitle.textContent = `Adaugă Încasare (${monthKey})`;
    dom.paymentForm.reset();
    dom.paymentClientId.value = clientId;
    dom.paymentMonthKey.value = monthKey;
    dom.paymentDate.valueAsDate = new Date();
    dom.paymentModal.style.display = 'flex';
    dom.paymentAmount.focus();
}

function closePaymentModal() {
    dom.paymentModal.style.display = 'none';
    dom.paymentForm.reset();
}

async function handleSavePayment(e) {
    e.preventDefault();
    const clientId = dom.paymentClientId.value;
    const monthKey = dom.paymentMonthKey.value;
    const amount = parseFloat(dom.paymentAmount.value);
    const date = dom.paymentDate.value;
    const notes = dom.paymentNotes.value || '';

    if (!clientId || !monthKey || isNaN(amount) || !date) {
        showCustomAlert('Vă rugăm completați toate câmpurile corect.', 'Eroare');
        return;
    }

    const { billingsData } = calendarState.getState();

    if (!billingsData[clientId]) {
        billingsData[clientId] = {};
    }
    if (!billingsData[clientId][monthKey]) {
        billingsData[clientId][monthKey] = [];
    }

    billingsData[clientId][monthKey].push({
        id: `pay_${Date.now()}`,
        date: date,
        amount: amount,
        notes: notes
    });

    billingsData[clientId][monthKey].sort((a, b) => new Date(a.date) - new Date(b.date));

    try {
        await api.saveBillingsData(billingsData);
        calendarState.setBillingsData(billingsData);
        renderBillingView();
        closePaymentModal();
    } catch (err) {
        console.error('Eroare la salvarea încasării:', err);
        showCustomAlert('Nu s-a putut salva încasarea.', 'Eroare API');
    }
}

async function handleDeletePayment(clientId, monthKey, paymentId) {
    const confirmed = await showCustomConfirm('Sunteți sigur că doriți să ștergeți această încasare?', 'Confirmare Ștergere');
    if (!confirmed) return;

    const { billingsData } = calendarState.getState();

    if (!billingsData[clientId] || !billingsData[clientId][monthKey]) return;

    billingsData[clientId][monthKey] = billingsData[clientId][monthKey].filter(p => p.id !== paymentId);

    try {
        await api.saveBillingsData(billingsData);
        calendarState.setBillingsData(billingsData);
        renderBillingView();
    } catch (err) {
        console.error('Eroare la ștergerea încasării:', err);
        showCustomAlert('Nu s-a putut șterge încasarea.', 'Eroare API');
    }
}