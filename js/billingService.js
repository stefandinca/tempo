/**
 * js/billingService.js
 *
 * Gestionează logica pentru noua secțiune de Facturare.
 * Calculează orele, totalurile și gestionează încasările.
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
import { showCustomAlert, showCustomConfirm } from './uiService.js';

// --- Constante ---
const BILLING_RATE_PER_HOUR = 100;
const $ = (id) => document.getElementById(id);

// --- Stare locală ---
let currentBillingDate = new Date(); // Începe cu luna curentă

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
 * Inițializează ascultătorii de evenimente pentru secțiunea de facturare.
 * Chemată din main.js.
 */
export function init() {
    if (!dom.section) return; // Nu inițializa dacă secțiunea nu există

    dom.prevBtn.addEventListener('click', () => navigateBillingMonth(-1));
    dom.nextBtn.addEventListener('click', () => navigateBillingMonth(1));
    dom.billingSearchBar.addEventListener('input', () => renderBillingView());

    // Ascultători pentru modalul de plată
    dom.closePaymentModalBtn.addEventListener('click', closePaymentModal);
    dom.cancelPaymentBtn.addEventListener('click', closePaymentModal);
    dom.paymentModal.addEventListener('click', (e) => {
        if (e.target === dom.paymentModal) closePaymentModal();
    });
    dom.paymentForm.addEventListener('submit', handleSavePayment);

    // Ascultător principal pentru acțiunile din listă (delegare evenimente)
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

    // Actualizează eticheta lunii
    dom.currentMonthLabel.textContent = currentBillingDate.toLocaleString('ro-RO', {
        month: 'long',
        year: 'numeric'
    });
    
    dom.clientList.innerHTML = ''; // Curăță lista

    // Obține termenul de căutare
    const searchTerm = dom.billingSearchBar.value.toLowerCase();
    
    // Filtrează clienții
    const filteredClients = clients.filter(client => {
        // 1. Filtrează după nume
        const nameMatch = client.name.toLowerCase().includes(searchTerm);
        // 2. Nu afișa clienți "speciali" (ex: Pauza, Sedinta)
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
        const totalDue = hoursData.billableHours * BILLING_RATE_PER_HOUR;
        
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all hover:border-primary hover:shadow-md';        card.dataset.clientId = client.id;
        card.dataset.monthKey = monthKey;

       card.innerHTML = `
            <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <span class="font-semibold text-lg text-gray-900 dark:text-white">${client.name}</span>
                <span class="font-medium text-gray-500 dark:text-gray-400">${hoursData.billableHours.toFixed(1)} ore</span>
            </div>
            <div class="p-4 md:p-6">
                ${generatePaymentSummary(client.id, monthKey, totalDue)}
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <button class="btn btn-primary btn-sm" data-action="add-payment">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cash-coin" viewBox="0 0 16 16">
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
 * Generează HTML pentru rezumatul financiar (Total, Achitat, Restant) și lista plăților.
 */
function generatePaymentSummary(clientId, monthKey, totalDue) {
    const { billingsData } = calendarState.getState();
    const payments = billingsData[clientId]?.[monthKey] || [];
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalDue - totalPaid;

    let paymentsHtml = `<p class="text-sm text-gray-500 dark:text-gray-400 p-4 text-center bg-gray-100 dark:bg-gray-700/50 rounded-md">Nicio încasare înregistrată.</p>`;
    if (payments.length > 0) {
        paymentsHtml = payments.map(p => `
            <div class="flex items-center gap-4 p-3 rounded-md odd:bg-gray-100 dark:odd:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <span class="text-sm text-gray-900 dark:text-white">📅 ${new Date(p.date).toLocaleDateString('ro-RO')}</span>
                <span class="text-sm italic text-gray-500 dark:text-gray-400 flex-1">${p.notes || ''}</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">${p.amount.toFixed(2)} RON</span>
                <button class="btn-icon btn-delete-payment w-8 h-8 !border-transparent text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400" data-action="delete-payment" data-payment-id="${p.id}" title="Șterge încasarea">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                </button>
            </div>
        `).join('');
    }

    const balanceColor = balance > 0 ? 'text-red-600 dark:text-red-400' : (balance <= 0 && totalDue > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300');
    const balanceBorder = balance > 0 ? 'border-l-red-500' : (balance <= 0 && totalDue > 0 ? 'border-l-green-500' : 'border-l-gray-400');

    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-dashed border-gray-200 dark:border-gray-700">
            <div class="p-4 rounded-md bg-gray-100 dark:bg-gray-700/50 border-l-4 border-l-yellow-500">
                <span class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Total de Plată</span>
                <span class="block text-2xl font-bold text-gray-900 dark:text-white">${totalDue.toFixed(2)} RON</span>
            </div>
            <div class="p-4 rounded-md bg-gray-100 dark:bg-gray-700/50 border-l-4 border-l-green-500">
                <span class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Total Achitat</span>
                <span class="block text-2xl font-bold text-gray-900 dark:text-white">${totalPaid.toFixed(2)} RON</span>
            </div>
            <div class="p-4 rounded-md bg-gray-100 dark:bg-gray-700/50 border-l-4 ${balanceBorder}">
                <span class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Restant</span>
                <span class="block text-2xl font-bold ${balanceColor}">${balance.toFixed(2)} RON</span>
            </div>
        </div>
        <div class="space-y-2">
            <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Istoric Încasări</h4>
            ${paymentsHtml}
        </div>
    `;
}

/**
 * Calculează orele facturabile pentru un client într-o lună specificată.
 */
function calculateClientHoursForMonth(clientId, year, month, allEvents) {
    const monthEvents = allEvents.filter(event => {
        const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
        if (!clientIds.includes(clientId)) return false;
        
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    let billableMinutes = 0;
    
    monthEvents.forEach(event => {
        // Este facturabil ȘI clientul a fost prezent
        const attendance = (event.attendance && event.attendance[clientId]) || 'present';
        if (event.isBillable !== false && attendance === 'present' && event.duration) {
            billableMinutes += event.duration;
        }
    });
    
    return {
        billableHours: billableMinutes / 60
    };
}

// --- Navigare Lunară ---

function navigateBillingMonth(direction) {
    currentBillingDate.setMonth(currentBillingDate.getMonth() + direction);
    renderBillingView();
}

// --- Management Plăți ---

function openPaymentModal(clientId, monthKey) {
    dom.paymentModalTitle.textContent = `Adaugă Încasare (${monthKey})`;
    dom.paymentForm.reset();
    dom.paymentClientId.value = clientId;
    dom.paymentMonthKey.value = monthKey;
    dom.paymentDate.valueAsDate = new Date(); // Setează data la ziua de azi
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

    // Asigură că structura există
    if (!billingsData[clientId]) {
        billingsData[clientId] = {};
    }
    if (!billingsData[clientId][monthKey]) {
        billingsData[clientId][monthKey] = [];
    }

    // Adaugă noua plată
    billingsData[clientId][monthKey].push({
        id: `pay_${Date.now()}`,
        date: date,
        amount: amount,
        notes: notes
    });

    // Sortează plățile după dată
    billingsData[clientId][monthKey].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Salvează și rerandează
    try {
        await api.saveBillingsData(billingsData);
        calendarState.setBillingsData(billingsData); // Actualizează starea
        renderBillingView(); // Rerandează lista de facturare
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

    // Filtrează plata
    billingsData[clientId][monthKey] = billingsData[clientId][monthKey].filter(p => p.id !== paymentId);

    // Salvează și rerandează
    try {
        await api.saveBillingsData(billingsData);
        calendarState.setBillingsData(billingsData);
        renderBillingView();
    } catch (err) {
        console.error('Eroare la ștergerea încasării:', err);
        showCustomAlert('Nu s-a putut șterge încasarea.', 'Eroare API');
    }
}