/**
 * js/evolutionService.js
 *
 * Gestionează toată logica pentru modalele de Evoluție și Evaluare (Portage).
 * Include desenarea graficelor, randarea tabelelor și salvarea datelor.
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
import { showCustomAlert } from './uiService.js';

let portrigeData = null; // Cache pentru datele Portage
let currentClientId = null; // Clientul selectat curent
let evolutionChartInstance = null; // Instanța graficului Chart.js

// --- Elemente DOM ---
const $ = (id) => document.getElementById(id);
const evolutionModal = $('evolutionModal');
const addEvaluationModal = $('addEvaluationModal');

/**
 * Inițializează și afișează modalul de evoluție pentru un client.
 * @param {string} clientId
 */
export async function showEvolutionModal(clientId) {
    currentClientId = clientId;
    const { clients, evolutionData } = calendarState.getState();
    const client = calendarState.getClientById(clientId);
    const clientData = evolutionData[clientId] || evolutionData[`client_${clientId}`]; // Compatibilitate

    if (!client || !clientData) {
        showCustomAlert('Nu există date de evoluție pentru acest client.', 'Evoluție');
        return;
    }

    // Configurează modalul principal
    $('evolutionTitle').textContent = `Evoluție - ${client.name}`;
    evolutionModal.style.display = 'flex';
    
    // Asigură-te că primul tab este activ
    activateTab('tabGrafice');

    // Randează componentele
    renderEvolutionChart(clientData);
    renderPortageSummary(clientData, client);
    renderProgramHistory(clientData);
    
    // Pregătește modalul de evaluare (ascuns)
    await setupEvaluationTab(client);
}

/**
 * Închide modalul principal de evoluție.
 */
function closeEvolutionModal() {
    evolutionModal.style.display = 'none';
    if (evolutionChartInstance) {
        evolutionChartInstance.destroy();
        evolutionChartInstance = null;
    }
    currentClientId = null;
}

/**
 * Închide modalul de adăugare a evaluării.
 */
function closeEvaluationModal() {
    addEvaluationModal.style.display = 'none';
}

/**
 * Activează un tab specific în modalul de evoluție.
 * @param {string} tabId - ID-ul tab-ului de activat
 */
function activateTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// --- Secțiunea Grafice ---

function renderEvolutionChart(clientData) {
    const chartCanvas = $('evolutionChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    if (evolutionChartInstance) evolutionChartInstance.destroy();

    const colors = ['#4A90E2', '#FF6B6B', '#12C4D9', '#9B59B6', '#1DD75B', '#FFA500', '#E91E63'];
    const datasets = [];
    const allDates = new Set();
    
    if (!clientData.evaluations) {
        clientData.evaluations = {};
    }

    Object.values(clientData.evaluations).forEach(values => {
        Object.keys(values).forEach(date => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    Object.entries(clientData.evaluations).forEach(([test, values], i) => {
        const color = colors[i % colors.length];
        datasets.push({
            label: test,
            data: sortedDates.map(date => values[date] ?? null),
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    });

    evolutionChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: sortedDates, datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { padding: 20 } },
                title: { display: true, text: `Evoluție Scoruri Portage`, font: { size: 16 } }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function renderPortageSummary(clientData, client) {
    const summaryEl = $('evolutionSummary');
    if (!summaryEl || !client.birthDate || !clientData.evaluations) {
        if (summaryEl) summaryEl.innerHTML = '';
        return;
    }

    const birthDate = new Date(client.birthDate);
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
        const chronoAge = (new Date(date) - birthDate) / (1000 * 60 * 60 * 24 * 30.44); // Luni
        const dq = (avgDevAge / chronoAge) * 100;
        results.push({ date, avgDevAge, chronoAge, dq });
    });

    if (results.length === 0) {
        summaryEl.innerHTML = '';
        return;
    }

    summaryEl.innerHTML = `
        <div class="evolution-summary">
            <h3>Evoluție generală Portage (DQ)</h3>
            <div class="evolution-table-container">
                <table class="evolution-table">
                    <thead><tr><th>Data</th><th>Vârstă cronologică</th><th>Vârstă mentală</th><th>Indice dezvoltare (DQ)</th></tr></thead>
                    <tbody>
                        ${results.map(r => {
                            const color = r.dq < 70 ? '#e74c3c' : r.dq < 85 ? '#f39c12' : '#27ae60';
                            return `<tr>
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

// --- Secțiunea Istoric Programe ---

function renderProgramHistory(clientData) {
    const container = $('programHistoryContainer');
    if (!container) return;

    const programHistory = clientData.programHistory || [];
    if (programHistory.length === 0) {
        container.innerHTML = '<div class="program-history-empty">Nu există istoric de programe pentru acest client.</div>';
        return;
    }

    // Sortare și grupare
    programHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    const grouped = {};
    programHistory.forEach(entry => {
        if (!grouped[entry.programTitle]) grouped[entry.programTitle] = [];
        grouped[entry.programTitle].push(entry);
    });

    let html = `
        <table class="program-history-table">
            <thead><tr><th>Program</th><th>Data</th><th>Scor</th></tr></thead>
            <tbody>
    `;
    
    Object.entries(grouped).forEach(([programTitle, entries]) => {
        entries.slice(0, 10).forEach((entry, index) => { // Limitează la ultimele 10
            const formattedDate = new Date(entry.date).toLocaleDateString('ro-RO');
            html += `<tr>`;
            if (index === 0) {
                html += `<td rowspan="${Math.min(entries.length, 10)}">${programTitle}</td>`;
            }
            html += `<td>${formattedDate}</td>`;
            html += `<td><span class="program-history-score" data-score="${entry.score}">${entry.score}</span></td>`;
            html += `</tr>`;
        });
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// --- Secțiunea Evaluare (Portage) ---

/**
 * Pregătește tab-ul de adăugare a evaluării.
 */
async function setupEvaluationTab(client) {
    if (client.birthDate) {
        $('childBirthDateInput').value = client.birthDate;
        updateChildAgeDisplay(client.birthDate);
    }
    $('evaluationDateInput').valueAsDate = new Date();
    
    // Încarcă datele Portage (dacă nu sunt deja încărcate)
    if (!portrigeData) {
        try {
            portrigeData = await api.loadPortrigeData();
        } catch (e) {
            console.error("Eroare la încărcarea datelor Portage:", e);
            $('portageDomainsContainer').innerHTML = '<p>Eroare la încărcarea datelor Portage.</p>';
            return;
        }
    }
    
    // Randează domeniile
    renderPortageDomains();
}

/**
 * Calculează vârsta în luni.
 */
function getAgeInMonths(birthDate, evalDate) {
    const birth = new Date(birthDate);
    const evalD = evalDate ? new Date(evalDate) : new Date();
    let months = (evalD.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += evalD.getMonth();
    return months <= 0 ? 0 : months;
}

function updateChildAgeDisplay(birthDate) {
    const span = $('childAgeDisplay');
    const evalDate = $('evaluationDateInput').value;
    if (!birthDate) {
        span.textContent = '–';
        return;
    }
    const months = getAgeInMonths(birthDate, evalDate);
    const years = Math.floor(months / 12);
    const rem = months % 12;
    span.textContent = `${years} ani și ${rem} luni (${months} luni)`;
}

/**
 * Randează domeniile și itemii Portage în container.
 */
function renderPortageDomains() {
    const container = $('portageDomainsContainer');
    container.innerHTML = '';
    const birthDate = $('childBirthDateInput').value;
    const evalDate = $('evaluationDateInput').value;

    if (!birthDate) {
        container.innerHTML = '<p>Introduceți data nașterii pentru a afișa itemii.</p>';
        return;
    }
    if (!portrigeData || Object.keys(portrigeData).length === 0) {
        container.innerHTML = '<p>Datele Portage nu sunt disponibile.</p>';
        return;
    }

    const ageMonths = getAgeInMonths(birthDate, evalDate);

    Object.keys(portrigeData).forEach(domain => {
        const items = portrigeData[domain];
        const block = document.createElement('div');
        block.className = 'domain-block';
        
        let itemsHtml = '';
        items.forEach(item => {
            const isFuture = item.months > ageMonths;
            itemsHtml += `
                <div class="portage-item ${isFuture ? 'disabled' : ''}" data-months="${item.months}">
                    <input type="checkbox" data-domain="${domain}" data-id="${item.id}" ${isFuture ? 'disabled' : ''}>
                    <label>${item.text} <i>(${item.age})</i></label>
                </div>
            `;
        });

        block.innerHTML = `
            <div class="domain-header">
                <span>${domain}</span>
                <button type="button" class="domain-toggle-btn">Ascunde</button>
            </div>
            <div class="checkbox-grid">${itemsHtml}</div>
        `;
        
        // Adaugă logica de toggle
        const grid = block.querySelector('.checkbox-grid');
        block.querySelector('.domain-toggle-btn').addEventListener('click', (e) => {
            grid.classList.toggle('collapsed');
            e.target.textContent = grid.classList.contains('collapsed') ? 'Arată' : 'Ascunde';
        });

        container.appendChild(block);
    });
}

/**
 * Salvează datele evaluării Portage.
 */
async function savePortageEvaluation() {
    const { evolutionData } = calendarState.getState();
    const birthDate = $('childBirthDateInput').value;
    const evalDate = $('evaluationDateInput').value;
    const client = calendarState.getClientById(currentClientId);

    if (!client || !birthDate || !evalDate) {
        showCustomAlert('Completați data nașterii și data evaluării.', 'Eroare');
        return;
    }

    const ageMonths = getAgeInMonths(birthDate, evalDate);
    
    // Calculează scorurile
    const domainScores = {};
    const domainItems = {};
    
    // Adună toate itemele relevante (nu viitoare)
    $('portageDomainsContainer').querySelectorAll('.portage-item:not(.disabled) input').forEach(cb => {
        const domain = cb.dataset.domain;
        if (!domainScores[domain]) {
            domainScores[domain] = { checked: 0 };
            domainItems[domain] = [];
        }
        domainItems[domain].push(cb);
        if (cb.checked) {
            domainScores[domain].checked++;
        }
    });

    const clientEvals = evolutionData[currentClientId]?.evaluations || {};
    
    // Calculează vârsta de dezvoltare și salvează scorul
    for (const domain in domainScores) {
        const items = portrigeData[domain].filter(item => item.months <= ageMonths);
        let developmentalAge = 0;
        if (items.length > 0) {
            const checkedCount = domainScores[domain].checked;
            // Găsește ultimul item bifat
            const checkedItems = domainItems[domain].filter(cb => cb.checked).map(cb => cb.closest('.portage-item'));
            if(checkedItems.length > 0) {
                const lastCheckedItem = checkedItems[checkedItems.length-1];
                developmentalAge = parseInt(lastCheckedItem.dataset.months) || 0;
            }
        }
        
        const key = `Portrige - ${domain}`; // Cheia pentru grafic
        if (!clientEvals[key]) clientEvals[key] = {};
        clientEvals[key][evalDate] = developmentalAge; // Salvează vârsta de dezvoltare (în luni)
    }
    
    // Actualizează starea locală
    if (!evolutionData[currentClientId]) {
        evolutionData[currentClientId] = { name: client.name, evaluations: {}, programHistory: [] };
    }
    evolutionData[currentClientId].evaluations = clientEvals;
    calendarState.setEvolutionData(evolutionData);
    
    // Salvează pe server
    try {
        await api.saveEvolutionData(evolutionData);
        showCustomAlert('Evaluarea Portage a fost salvată cu succes!', 'Succes');
        
        // Re-randează graficele și închide
        renderEvolutionChart(evolutionData[currentClientId]);
        renderPortageSummary(evolutionData[currentClientId], client);
        activateTab('tabGrafice');

    } catch (err) {
        console.error('Eroare la salvarea evaluării:', err);
        showCustomAlert('Nu s-a putut salva evaluarea pe server.', 'Eroare');
    }
}


// --- Inițializare Event Listeners ---

// Listeners pentru modalul principal de evoluție
$('closeEvolutionModal')?.addEventListener('click', closeEvolutionModal);
evolutionModal?.addEventListener('click', (e) => {
    if (e.target === evolutionModal) closeEvolutionModal();
});
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// Listeners pentru tab-ul de evaluare
$('childBirthDateInput')?.addEventListener('change', () => {
    updateChildAgeDisplay($('childBirthDateInput').value);
    renderPortageDomains();
});
$('evaluationDateInput')?.addEventListener('change', () => {
    updateChildAgeDisplay($('childBirthDateInput').value);
    renderPortageDomains();
});
$('saveEvaluationBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    savePortageEvaluation();
});
$('cancelEvaluationBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab('tabGrafice'); // Revino la grafice
});