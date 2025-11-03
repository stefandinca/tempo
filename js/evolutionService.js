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

    // 1. Verificăm DOAR dacă clientul există
    if (!client) {
        showCustomAlert('Clientul nu a fost găsit.', 'Eroare');
        return;
    }

    // 2. Creăm un obiect gol dacă nu există date, ÎN LOC SĂ AFIȘĂM ALERTA
    const clientData = evolutionData[clientId] || 
                     evolutionData[`client_${clientId}`] || 
                     { name: client.name, evaluations: {}, programHistory: [] };

    // Continuăm cu deschiderea modalului
    $('evolutionTitle').textContent = `Evoluție - ${client.name}`;
    evolutionModal.style.display = 'flex';
    
    // Asigură-te că primul tab este activ
    activateTab('tabGrafice');

    // Randează componentele (acestea vor gestiona starea goală)
    renderEvolutionChart(clientData);
    renderPortageSummary(clientData, client);
    renderProgramHistory(clientData);
    
    // Pregătește modalul de evaluare
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
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { padding: 10, boxWidth: 12 } },
                title: { display: true, text: `Evoluție Scoruri Portage`, font: { size: 14 } }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

// În fișierul: js/evolutionService.js

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
        // Folosim funcția getAgeInMonths() deja existentă în fișier
        const chronoAge = getAgeInMonths(birthDate, date); 
        if (chronoAge === 0) return; // Evităm împărțirea la zero
        const dq = (avgDevAge / chronoAge) * 100;
        results.push({ date, avgDevAge, chronoAge, dq });
    });

    if (results.length === 0) {
        summaryEl.innerHTML = '';
        return;
    }

    // --- MODIFICARE AICI ---
    // Am eliminat div-ul .evolution-summary și am adăugat stiluri 
    // direct pe titlu pentru a se potrivi cu restul modalului.
    summaryEl.innerHTML = `
        <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem; margin-top: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Evoluție generală Portage (DQ)</h3>
        <div class="evolution-table-container">
            <table class="evolution-table">
                <thead><tr><th>Data</th><th>Vârstă cronologică</th><th>Vârstă mentală</th><th>Indice dezvoltare (DQ)</th></tr></thead>
                <tbody>
                    ${results.map(r => {
                        const color = r.dq < 70 ? '#e74c3c' : r.dq < 85 ? '#f39c12' : '#27ae60';
                        // Adăugăm atributele data-label pentru CSS-ul responsiv
                        return `<tr>
                            <td data-label="Data">${r.date}</td>
                            <td data-label="Vârstă cronologică">${r.chronoAge.toFixed(1)} luni</td>
                            <td data-label="Vârstă mentală">${r.avgDevAge.toFixed(1)} luni</td>
                            <td data-label="Indice dezvoltare (DQ)" style="font-weight:600;color:${color};">${r.dq.toFixed(1)}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    // --- SFÂRȘIT MODIFICARE ---
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
        
        // Group items by age range
        const ageGroups = {};
        items.forEach(item => {
            const ageKey = item.age; // e.g., "0–3 luni", "13–15 luni"
            if (!ageGroups[ageKey]) {
                ageGroups[ageKey] = [];
            }
            ageGroups[ageKey].push(item);
        });

        // Check if there are any future items
        const hasFutureItems = items.some(item => item.months > ageMonths);
        const firstFutureMonth = items.find(item => item.months > ageMonths)?.months;

        // Build items HTML with age separators
        let itemsHtml = '';
        let showFutureButton = false;
        let futureItemsHtml = '';
        
        Object.entries(ageGroups).forEach(([ageRange, groupItems]) => {
            const firstItemInGroup = groupItems[0];
            const isFutureGroup = firstItemInGroup.months > ageMonths;
            
            // Format age separator
            let separatorText = formatAgeRange(ageRange, firstItemInGroup.months);
            
            // Start age group
            const groupHtml = `<div class="portage-age-separator">${separatorText}</div>`;
            
            // Build items for this group
            let groupItemsHtml = '';
            groupItems.forEach(item => {
                const isFuture = item.months > ageMonths;

                // --- START CORECȚIE 1: Logica pentru tag-ul [fin] ---
                let ageText = `(${item.age})`;
                if (ageText.includes('(fin)')) {
                    ageText = ageText.replace(/\(fin\)/gi, '<span class="portage-fin-tag">fin</span>');
                }
                // --- END CORECȚIE 1 ---

                groupItemsHtml += `
                    <div class="portage-item ${isFuture ? 'disabled' : ''}" data-months="${item.months}">
                        <input type="checkbox" data-domain="${domain}" data-id="${item.id}" ${isFuture ? 'disabled' : ''}>
                        <label>${item.text} <i>${ageText}</i></label>
                    </div>
                `;
            });
            
            if (isFutureGroup && !showFutureButton) {
                // This is the first future group - add warning and button
                showFutureButton = true;
                const ageYearsMonths = formatAgeInYearsMonths(ageMonths);
                futureItemsHtml = `
                    <div class="portage-future-warning">
                        <p>Unele iteme din secțiunile următoare sunt pentru vârste mai mari decât ${ageYearsMonths}.</p>
                        <button type="button" class="domain-toggle-btn portage-future-toggle">Arată iteme viitoare</button>
                    </div>
                    <div class="portage-future-items collapsed">
                        ${groupHtml}
                        ${groupItemsHtml}
                `;
            } else if (isFutureGroup) {
                // Continue adding to future items
                futureItemsHtml += groupHtml + groupItemsHtml;
            } else {
                // Current/past items
                itemsHtml += groupHtml + groupItemsHtml;
            }
        });
        
        if (showFutureButton) {
            futureItemsHtml += '</div>'; // Close portage-future-items
            itemsHtml += futureItemsHtml;
        }

        block.innerHTML = `
            <div class="domain-header">
                <span>${domain}</span>
                <button type="button" class="domain-toggle-btn">Arată</button>
            </div>
            <div class="checkbox-grid collapsed">${itemsHtml}</div>
        `;
        
        // Toggle domain visibility
        const grid = block.querySelector('.checkbox-grid');
        const toggleBtn = block.querySelector('.domain-header .domain-toggle-btn');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            grid.classList.toggle('collapsed');
            toggleBtn.textContent = grid.classList.contains('collapsed') ? 'Arată' : 'Ascunde';
        });
        
        // Make entire header clickable
        block.querySelector('.domain-header').addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                grid.classList.toggle('collapsed');
                toggleBtn.textContent = grid.classList.contains('collapsed') ? 'Arată' : 'Ascunde';
            }
        });
        
        // Toggle future items visibility
        const futureToggle = block.querySelector('.portage-future-toggle');
        if (futureToggle) {
            futureToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const futureItems = block.querySelector('.portage-future-items');
                futureItems.classList.toggle('collapsed');
                futureToggle.textContent = futureItems.classList.contains('collapsed') 
                    ? 'Arată iteme viitoare' 
                    : 'Ascunde iteme viitoare';
            });
        }

        // --- START CORECȚIE 2: Click pe întregul rând ---
        block.querySelectorAll('.portage-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (!checkbox) return;

            // 1. Listener pe tot item-ul (div)
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || checkbox.disabled) {
                    // Dacă s-a dat click direct pe checkbox, lasă-l să-și facă treaba
                    // Sau dacă e dezactivat, nu face nimic
                    return; 
                }
                
                // Comută manual starea checkbox-ului pentru click pe label/padding/etc.
                checkbox.checked = !checkbox.checked;
                // Comută și clasa vizuală
                item.classList.toggle('checked', checkbox.checked);
            });

            // 2. Listener direct pe checkbox (pentru a prinde și click-ul pe el)
            checkbox.addEventListener('change', (e) => {
                // Sincronizează clasa vizuală când checkbox-ul se schimbă
                item.classList.toggle('checked', e.target.checked);
            });
        });
        // --- END CORECȚIE 2 ---

        container.appendChild(block);
    });
}

/**
 * Format age range with years and months for ranges > 10-12 months
 */
function formatAgeRange(ageRange, monthsValue) {
    // Extract month values from range like "13–15 luni"
    const match = ageRange.match(/(\d+)–(\d+)/);
    if (!match) return ageRange;
    
    const startMonth = parseInt(match[1]);
    const endMonth = parseInt(match[2]);
    
    if (startMonth <= 12) {
        return ageRange;
    }
    
    // Calculate years and months
    const startYears = Math.floor(startMonth / 12);
    const startRemMonths = startMonth % 12;
    const endYears = Math.floor(endMonth / 12);
    const endRemMonths = endMonth % 12;
    
    const startText = formatYearsMonths(startYears, startRemMonths);
    const endText = formatYearsMonths(endYears, endRemMonths);
    
    return `${ageRange} (${startText} - ${endText})`;
}

/**
 * Format years and months in Romanian
 */
function formatYearsMonths(years, months) {
    if (years === 0) {
        return `${months} ${months === 1 ? 'luna' : 'luni'}`;
    }
    if (months === 0) {
        return `${years} ${years === 1 ? 'an' : 'ani'}`;
    }
    const yearText = years === 1 ? 'an' : 'ani';
    const monthText = months === 1 ? 'luna' : 'luni';
    return `${years} ${yearText} si ${months} ${monthText}`;
}

/**
 * Format age in years and months (e.g., "4 ani și 9 luni")
 */
function formatAgeInYearsMonths(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return formatYearsMonths(years, months);
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

        if (window.logActivity) {
            window.logActivity("Evaluare salvată", client.name, 'evaluation', currentClientId);
        }
        
        // Re-randează graficele și închide
        renderEvolutionChart(evolutionData[currentClientId]);
        renderPortageSummary(evolutionData[currentClientId], client);
        activateTab('tabGrafice');

    } catch (err) {
        console.error('Eroare la salvarea evaluării:', err);
        showCustomAlert('Nu s-a putut salva evaluarea pe server.', 'Eroare');
    }
}

/**
 * NOU: Salvează datele evaluării Logopedice.
 */
async function saveLogopedicEvaluation() {
    const { evolutionData } = calendarState.getState();
    const evalDate = $('evaluationDateInput').value;
    const client = calendarState.getClientById(currentClientId);

    if (!client || !evalDate) {
        showCustomAlert('Completați data nașterii și data evaluării.', 'Eroare');
        return;
    }

    // 1. Colectează datele din tabel
    const sunete = {
        A: {
            init: $('logo_A_init').value,
            med: $('logo_A_med').value,
            fin: $('logo_A_fin').value
        },
        O: {
            init: $('logo_O_init').value,
            med: $('logo_O_med').value,
            fin: $('logo_O_fin').value
        },
        U: {
            init: $('logo_U_init').value,
            med: $('logo_U_med').value,
            fin: $('logo_U_fin').value
        }
    };

    // 2. Colectează comentariile
    const comentarii = $('logoComentarii').value;

    // 3. Creează obiectul de salvare
    const evaluationEntry = {
        sunete: sunete,
        comentarii: comentarii
    };

    // 4. Actualizează starea locală
    if (!evolutionData[currentClientId]) {
        evolutionData[currentClientId] = { name: client.name, evaluations: {}, programHistory: [], logopedicEvaluations: {} };
    }
    if (!evolutionData[currentClientId].logopedicEvaluations) {
        evolutionData[currentClientId].logopedicEvaluations = {};
    }
    
    // Suprascrie sau adaugă evaluarea pentru data respectivă
    evolutionData[currentClientId].logopedicEvaluations[evalDate] = evaluationEntry;
    calendarState.setEvolutionData(evolutionData);

    // 5. Salvează pe server
    try {
        await api.saveEvolutionData(evolutionData);
        showCustomAlert('Evaluarea logopedică a fost salvată cu succes!', 'Succes');

        if (window.logActivity) {
            window.logActivity("Evaluare logopedică salvată", client.name, 'evaluation', currentClientId);
        }
        
        // Re-randează graficele (pentru a prelua orice alte modificări) și închide
        renderEvolutionChart(evolutionData[currentClientId]);
        renderPortageSummary(evolutionData[currentClientId], client);
        activateTab('tabGrafice'); // Revino la tabul principal

    } catch (err) {
        console.error('Eroare la salvarea evaluării logopedice:', err);
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
    
    const selectedType = $('evaluationTypeSelect').value;
    
    if (selectedType === 'portage') {
        savePortageEvaluation(); // Apelăm funcția existentă pentru Portage
    } else if (selectedType === 'logopedica') {
        // Deocamdată afișăm o alertă, deoarece logica de salvare nu a fost specificată
        showCustomAlert('Salvarea pentru evaluarea logopedică nu este încă implementată.', 'Funcționalitate în lucru');
        // Aici s-ar adăuga logica de salvare pentru câmpurile logoInput1, 2, 3
    }
});
$('cancelEvaluationBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab('tabGrafice'); // Revino la grafice
});

//Listener pentru dropdown-ul de tip evaluare
const evalTypeSelect = $('evaluationTypeSelect');
if (evalTypeSelect) {
    evalTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        const portageContainer = $('portageFormContainer');
        const logopedicaContainer = $('logopedicaFormContainer');

        if (selectedType === 'portage') {
            if (portageContainer) portageContainer.style.display = 'block';
            if (logopedicaContainer) logopedicaContainer.style.display = 'none';
        } else if (selectedType === 'logopedica') {
            if (portageContainer) portageContainer.style.display = 'none';
            if (logopedicaContainer) logopedicaContainer.style.display = 'block';
        }
    });
}