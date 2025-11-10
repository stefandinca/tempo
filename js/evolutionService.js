/**
 * js/evolutionService.js
 *
 * Gestionează toată logica pentru modalele de Evoluție și Evaluare (Portage).
 * Include desenarea graficelor, randarea tabelelor și salvarea datelor.
 */

import { calendarState } from './calendarState.js';
import * as api from './apiService.js';
// MODIFICAT: Am adăugat showCustomConfirm
import { showCustomAlert, showCustomConfirm } from './uiService.js';



let portrigeData = null; // Cache pentru datele Portage
let currentClientId = null; // Clientul selectat curent

// Queue to prevent race conditions when saving evolution data
let saveQueue = Promise.resolve();
let pendingSaveTimeout = null;

/**
 * Queued save wrapper to prevent race conditions
 */
async function queuedSaveEvolutionData(evolutionData) {
    // Clear any pending debounced save
    if (pendingSaveTimeout) {
        clearTimeout(pendingSaveTimeout);
    }
    
    // Add to queue
    saveQueue = saveQueue.then(async () => {
        try {
            await api.saveEvolutionData(evolutionData);
        } catch (err) {
            console.error('Error in queued save:', err);
            throw err; // Re-throw so caller can handle
        }
    });
    
    return saveQueue;
}

let evolutionChartInstance = null; // Instanța graficului Chart.js

// --- Elemente DOM ---
const $ = (id) => document.getElementById(id);
const evolutionModal = $('evolutionModal');
const addEvaluationModal = $('addEvaluationModal');


/**
 * Funcție Helper (ACTUALIZATĂ)
 * Generează HTML-ul pentru afișarea scorurilor (folosind stilul .score-btn)
 * @param {object | string} scoreData - Obiectul de scoruri (ex: {P: 1, +: 3}) sau un string (format vechi).
 */
function generateScoreHTML(scoreData) {
    let scores = scoreData;

    // 1. Verifică dacă datele sunt în formatul vechi (string) și convertește-le
    if (typeof scores === 'string') {
        // Convertește "P" în { P: 1 } sau "P (1), + (3)" în { P: 1, +: 3 }
        const convertedScores = { "0": 0, "-": 0, "P": 0, "+": 0 };
        if (scores.includes('(')) {
            // Format "P (1), + (3)"
            scores.split(',').forEach(part => {
                const match = part.match(/([0\-P+])\s*\((\d+)\)/);
                if (match && match[1] in convertedScores) {
                    convertedScores[match[1]] = parseInt(match[2], 10);
                }
            });
        } else if (scores.length > 0 && scores in convertedScores) {
            // Format vechi "P"
            convertedScores[scores] = 1;
        }
        scores = convertedScores;
    }

    // 2. Asigură-te că este un obiect valid, altfel creează unul gol
    if (typeof scores !== 'object' || scores === null) {
        scores = { "0": 0, "-": 0, "P": 0, "+": 0 };
    }

    // --- MODIFICARE AICI ---
    // Folosim clasa .program-score-display pentru aliniere (flex)
    // și .program-score-buttons pentru a prelua spațierea (gap)
    let html = '<div class="program-score-display program-score-buttons">';
    
    const scoreOrder = ['0', '-', 'P', '+'];
    
    scoreOrder.forEach(key => {
        const count = scores[key] || 0;
        if (count > 0) {
            // Folosim clasa .score-btn pentru a prelua stilul
            // dar folosim un <div> în loc de <button> și adăugăm cursor: default
            html += `
                <div class="score-btn" data-score="${key}" style="cursor: default;">
                    <span class="score-badge">${count}</span>
                    <span class="score-label">${key}</span>
                </div>
            `;
        }
    });

    html += '</div>';
    
    // Dacă nu există niciun scor, returnează un placeholder
    if (html === '<div class="program-score-display program-score-buttons"></div>') {
        return '<span class="note-program-no-score" style="font-weight: 600; color: #6b7280;">—</span>';
    }
    
    return html;
}


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
    renderEvaluationReportsList(clientData, client);
    renderProgramHistory(clientData);
    renderPrivateNotes(client.id);
    renderMonthlyThemeHistory(clientData);
    
    // Pregătește modalul de evaluare
    await setupEvaluationTab(client);
    setupMonthlyThemeTab();
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

/**
 * NOU: Randează lista de butoane pentru rapoartele de evaluare (înlocuiește renderPortageSummary)
 */
function renderEvaluationReportsList(clientData, client) {
    const container = $('evolutionSummary');
    if (!container) return;

    // --- MODIFICARE: Apelăm funcția de generare a sumarului ---
    const summaryTableHTML = generatePortageSummaryHTML(clientData, client);

    const allEvaluations = [];

    // 1. Adaugă evaluările Portage
    // Grupăm după dată, deoarece o evaluare Portage conține mai multe domenii la aceeași dată
    if (clientData.evaluations) {
        Object.keys(clientData.evaluations).forEach(domain => {
            Object.keys(clientData.evaluations[domain]).forEach(date => {
                // Adăugăm data doar o singură dată
                if (!allEvaluations.some(e => e.type === 'portage' && e.date === date)) {
                    allEvaluations.push({
                        type: 'portage',
                        date: date,
                        title: 'Evaluare Portage'
                    });
                }
            });
        });
    }

    // 2. Adaugă evaluările Logopedice
    if (clientData.evaluationsLogopedica) {
        Object.keys(clientData.evaluationsLogopedica).forEach(date => {
            allEvaluations.push({
                type: 'logopedica',
                date: date,
                title: 'Evaluare Logopedică'
            });
        });
    }

    // 3. Sortează evaluările (cele mai noi primele)
    allEvaluations.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. Generează HTML
    if (allEvaluations.length === 0) {
        container.innerHTML = `
            ${summaryTableHTML} 
            <h3 class="evolution-summary-title">Rapoarte Evaluări Salvate</h3>
            <p class="empty-list-message" style="margin-top: 1rem; text-align: center;">Nu există evaluări salvate pentru acest client.</p>
        `;
        return;
    }

    const buttonsHTML = allEvaluations.map(ev => {
        const formattedDate = new Date(ev.date).toLocaleDateString('ro-RO', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        // Pictograme diferite pentru fiecare tip de raport
        const icon = ev.type === 'portage' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9l-5 5-4-4-6 6"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-megaphone" viewBox="0 0 16 16"><path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1h-.548a1 1 0 0 1-.916-.599l-1.85-3.49-.202-.003A2.014 2.014 0 0 1 0 9V7a2.02 2.02 0 0 1 1.992-2.013 75 75 0 0 0 2.483-.075c3.043-.154 6.148-.849 8.525-2.199zm1 0v11a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-1 0m-1 1.35c-2.344 1.205-5.209 1.842-8 2.033v4.233q.27.015.537.036c2.568.189 5.093.744 7.463 1.993zm-9 6.215v-4.13a95 95 0 0 1-1.992.052A1.02 1.02 0 0 0 1 7v2c0 .55.448 1.002 1.006 1.009A61 61 0 0 1 4 10.065m-.657.975 1.609 3.037.01.024h.548l-.002-.014-.443-2.966a68 68 0 0 0-1.722-.082z"/></svg>';

        return `
            <button class="btn btn-action-text evaluation-report-button" data-type="${ev.type}" data-date="${ev.date}">
                ${icon}
                <span>${ev.title} - ${formattedDate}</span>
            </button>
        `;
    }).join('');

    // --- MODIFICARE: Adăugăm sumarul HTML înaintea listei de butoane ---
    container.innerHTML = `
        ${summaryTableHTML} 
        <h3 class="evolution-summary-title">Rapoarte Evaluări Salvate</h3>
        <div class="evaluation-report-list">
            ${buttonsHTML}
        </div>
    `;

    // 5. Adaugă event listener (delegare)
    // Asigură-te că nu adaugi listeneri multipli
    container.removeEventListener('click', handleEvaluationReportDownload); 
    container.addEventListener('click', handleEvaluationReportDownload);
}

/**
 * NOU: Handler pentru click pe butoanele de descărcare
 */
async function handleEvaluationReportDownload(e) {
    const button = e.target.closest('.evaluation-report-button');
    if (!button) return;

    // Dezactivează butonul temporar pentru a preveni click-uri duble
    button.disabled = true;
    button.querySelector('span').textContent = 'Se generează...';

    const type = button.dataset.type;
    const date = button.dataset.date;
    
    const { evolutionData } = calendarState.getState();
    const client = calendarState.getClientById(currentClientId);
    const clientData = evolutionData[currentClientId];

    if (!client || !clientData) {
        showCustomAlert('Eroare: Datele clientului nu au fost găsite.', 'Eroare');
        button.disabled = false; // Reactivează butonul
        return;
    }

    let htmlContent = '';
    let fileName = `Raport_${client.name.replace(/\s+/g, '_')}_${date}.html`;

    try {
        if (type === 'portage') {
            htmlContent = generatePortageReportHTML(client, clientData, date);
            fileName = `Raport_Portage_${fileName}`;
        } else if (type === 'logopedica') {
            htmlContent = generateLogopedicaReportHTML(client, clientData, date);
            fileName = `Raport_Logopedic_${fileName}`;
        } else {
            return;
        }

        // Generează și descarcă fișierul
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Eroare la generarea raportului:', err);
        showCustomAlert('A apărut o eroare la generarea fișierului HTML.', 'Eroare');
    } finally {
        // Reactivează butonul
        button.disabled = false;
        const formattedDate = new Date(date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        button.querySelector('span').textContent = `${type === 'portage' ? 'Evaluare Portage' : 'Evaluare Logopedică'} - ${formattedDate}`;
    }
}

/**
 * NOU: Generator HTML pentru Raport Portage Individual (printabil)
 */
function generatePortageReportHTML(client, clientData, date) {
    const birthDate = new Date(client.birthDate);
    const evalDate = new Date(date);
    const chronoAge = getAgeInMonths(birthDate, evalDate);
    const domains = clientData.evaluations;

    let domainRows = '';
    let totalDA = 0;
    let domainCount = 0;

    // Iterăm doar domeniile care au o intrare pentru data respectivă
    Object.keys(domains).forEach(domainName => {
        if (domains[domainName] && domains[domainName][date] !== undefined) {
            const da = domains[domainName][date];
            const dq = chronoAge > 0 ? (da / chronoAge) * 100 : 0;
            const color = dq < 70 ? '#e74c3c' : dq < 85 ? '#f39c12' : '#27ae60';
            
            domainRows += `
                <tr>
                    <td>${domainName.replace('Portrige - ', '')}</td>
                    <td style="text-align: right;">${da.toFixed(1)} luni</td>
                    <td style="text-align: right; color: ${color}; font-weight: 600;">${dq.toFixed(1)}</td>
                </tr>
            `;
            totalDA += da;
            domainCount++;
        }
    });

    const avgDA = domainCount > 0 ? totalDA / domainCount : 0;
    const avgDQ = chronoAge > 0 ? (avgDA / chronoAge) * 100 : 0;
    const avgColor = avgDQ < 70 ? '#e74c3c' : avgDQ < 85 ? '#f39c12' : '#27ae60';

    return `
        <!DOCTYPE html>
        <html lang="ro">
        <head>
            <meta charset="UTF-8">
            <title>Raport Portage - ${client.name}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; color: #333; line-height: 1.5; }
                .container { max-width: 800px; margin: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .header { background: #4A90E2; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 1.8rem; }
                .header p { margin: 0.25rem 0 0; font-size: 1rem; opacity: 0.9; }
                .content { padding: 1.5rem; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: #f9f9f9; padding: 1rem; border-radius: 8px; }
                .info-item { display: flex; flex-direction: column; }
                .info-label { font-size: 0.8rem; color: #666; text-transform: uppercase; font-weight: 600; }
                .info-value { font-size: 1.1rem; font-weight: 500; }
                h2 { font-size: 1.3rem; color: #4A90E2; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #eee; text-align: left; }
                th { background: #f4f4f4; font-weight: 600; }
                tr:last-child td { border: 0; }
                tfoot td { font-weight: 700; font-size: 1.1rem; background: #f9f9f9; border-top: 2px solid #ddd; }
                @media print {
                    body { padding: 0; }
                    .container { border: 0; box-shadow: none; max-width: 100%; }
                    .header { background: #4A90E2 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    th, tfoot td, .info-grid { background: #f9f9f9 !important; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Raport Evaluare Portage</h1>
                    <p>Client: ${client.name}</p>
                </div>
                <div class="content">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Data Evaluării</span>
                            <span class="info-value">${evalDate.toLocaleDateString('ro-RO')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Data Nașterii</span>
                            <span class="info-value">${birthDate.toLocaleDateString('ro-RO')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Vârstă Cronologică (CA)</span>
                            <span class="info-value">${chronoAge.toFixed(1)} luni</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Vârstă Mentală (Medie DA)</span>
                            <span class="info-value">${avgDA.toFixed(1)} luni</span>
                        </div>
                    </div>
                    
                    <h2>Rezultate pe Domenii</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Domeniu</th>
                                <th style="text-align: right;">Vârstă Dezvoltare (DA)</th>
                                <th style="text-align: right;">Indice Dezvoltare (DQ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${domainRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>Total (Medie)</td>
                                <td style="text-align: right;">${avgDA.toFixed(1)} luni</td>
                                <td style="text-align: right; color: ${avgColor};">${avgDQ.toFixed(1)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * NOU: Generator HTML pentru Raport Logopedic Individual (printabil)
 */
function generateLogopedicaReportHTML(client, clientData, date) {
    const evalData = clientData.evaluationsLogopedica?.[date];
    if (!evalData) return '<h1>Eroare: Evaluarea logopedică nu a fost găsită.</h1>';

    const scores = evalData.scores || {};
    const comments = evalData.comments || 'Niciun comentariu.';
    
    // Funcție helper pentru a obține scorul
    const getScore = (id) => {
        const score = scores[id];
        return score ? `<span class="logo-score">${score}</span>` : '—';
    };

    return `
        <!DOCTYPE html>
        <html lang="ro">
        <head>
            <meta charset="UTF-8">
            <title>Evaluare Logopedică - ${client.name}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; color: #333; line-height: 1.5; }
                .container { max-width: 800px; margin: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .header { background: #9B59B6; color: white; padding: 1.5rem; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 1.8rem; }
                .header p { margin: 0.25rem 0 0; font-size: 1rem; opacity: 0.9; }
                .content { padding: 1.5rem; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: #f9f9f9; padding: 1rem; border-radius: 8px; }
                .info-item { display: flex; flex-direction: column; }
                .info-label { font-size: 0.8rem; color: #666; text-transform: uppercase; font-weight: 600; }
                .info-value { font-size: 1.1rem; font-weight: 500; }
                h2 { font-size: 1.3rem; color: #9B59B6; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 2rem; }
                .comments-section p { white-space: pre-wrap; background: #f9f9f9; padding: 1rem; border-radius: 8px; line-height: 1.6; }
                .logopedica-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
                .logopedica-table th, .logopedica-table td { padding: 0.5rem; border: 1px solid #ddd; text-align: center; vertical-align: middle; }
                .logopedica-table th { background: #f4f4f4; font-weight: 600; }
                .logopedica-table td:first-child { font-weight: 700; font-size: 1.25rem; width: 80px; }
                .logo-example-text { display: block; font-size: 0.75rem; color: #777; font-style: italic; }
                .logo-score { font-weight: 600; font-size: 1rem; color: #4A90E2; }
                @media print {
                    body { padding: 0; }
                    .container { border: 0; box-shadow: none; max-width: 100%; }
                    .header { background: #9B59B6 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    th, .info-grid, .comments-section p { background: #f9f9f9 !important; -webkit-print-color-adjust: exact; }
                    .logopedica-table th, .logopedica-table td { border: 1px solid #ccc; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Evaluare Logopedică</h1>
                    <p>Client: ${client.name}</p>
                </div>
                <div class="content">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Data Evaluării</span>
                            <span class="info-value">${new Date(date).toLocaleDateString('ro-RO')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Data Nașterii</span>
                            <span class="info-value">${client.birthDate ? new Date(client.birthDate).toLocaleDateString('ro-RO') : 'N/A'}</span>
                        </div>
                    </div>

                    <h2>Rezultate Evaluare</h2>
                    <div class="logopedica-table-container">
                        <table class="logopedica-table">
                            <thead>
                                <tr>
                                    <th>Sunet</th>
                                    <th>Poziție Inițială</th>
                                    <th>Poziție Mediană</th>
                                    <th>Poziție Finală</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>A</td>
                                    <td><span class="logo-example-text">arici</span>${getScore('logo_A_init')}</td>
                                    <td><span class="logo-example-text">vaca</span>${getScore('logo_A_med')}</td>
                                    <td><span class="logo-example-text">perdea</span>${getScore('logo_A_fin')}</td>
                                </tr>
                                <tr>
                                    <td>O</td>
                                    <td><span class="logo-example-text">olita</span>${getScore('logo_O_init')}</td>
                                    <td><span class="logo-example-text">foc</span>${getScore('logo_O_med')}</td>
                                    <td><span class="logo-example-text">radio</span>${getScore('logo_O_fin')}</td>
                                </tr>
                                <tr>
                                    <td>U</td>
                                    <td><span class="logo-example-text">umbrela</span>${getScore('logo_U_init')}</td>
                                    <td><span class="logo-example-text">pui</span>${getScore('logo_U_med')}</td>
                                    <td><span class="logo-example-text">cadou</span>${getScore('logo_U_fin')}</td>
                                </tr>
                                <tr>
                                    <td>E</td>
                                    <td><span class="logo-example-text">elefant</span>${getScore('logo_E_init')}</td>
                                    <td><span class="logo-example-text">peste</span>${getScore('logo_E_med')}</td>
                                    <td><span class="logo-example-text">rosie</span>${getScore('logo_E_fin')}</td>
                                </tr>
                                <tr>
                                    <td>I</td>
                                    <td><span class="logo-example-text">iepure</span>${getScore('logo_I_init')}</td>
                                    <td><span class="logo-example-text">lingura</span>${getScore('logo_I_med')}</td>
                                    <td><span class="logo-example-text">ardei</span>${getScore('logo_I_fin')}</td>
                                </tr>
                                <tr>
                                    <td>Ă</td>
                                    <td><span class="logo-example-text">ăla</span>${getScore('logo_A2_init')}</td>
                                    <td><span class="logo-example-text">mănuși</span>${getScore('logo_A2_med')}</td>
                                    <td><span class="logo-example-text">casă</span>${getScore('logo_A2_fin')}</td>
                                </tr>
                                <tr>
                                    <td>Â/Î</td>
                                    <td><span class="logo-example-text">îngeraș</span>${getScore('logo_A3_init')}</td>
                                    <td><span class="logo-example-text">pâine</span>${getScore('logo_A3_med')}</td>
                                    <td><span class="logo-example-text">a coborî</span>${getScore('logo_A3_fin')}</td>
                                </tr>
                                <tr>
                                    <td>P</td>
                                    <td><span class="logo-example-text">pară</span>${getScore('logo_P_init')}</td>
                                    <td><span class="logo-example-text">șarpe</span>${getScore('logo_P_med')}</td>
                                    <td><span class="logo-example-text">dulap</span>${getScore('logo_P_fin')}</td>
                                </tr>
                                <tr>
                                    <td>B</td>
                                    <td><span class="logo-example-text">balon</span>${getScore('logo_B_init')}</td>
                                    <td><span class="logo-example-text">albină</span>${getScore('logo_B_med')}</td>
                                    <td><span class="logo-example-text">cerb</span>${getScore('logo_B_fin')}</td>
                                </tr>
                                <tr>
                                    <td>M</td>
                                    <td><span class="logo-example-text">mașină</span>${getScore('logo_M_init')}</td>
                                    <td><span class="logo-example-text">bomboană</span>${getScore('logo_M_med')}</td>
                                    <td><span class="logo-example-text">pom</span>${getScore('logo_M_fin')}</td>
                                </tr>
                                <tr>
                                    <td>T</td>
                                    <td><span class="logo-example-text">tobă</span>${getScore('logo_T_init')}</td>
                                    <td><span class="logo-example-text">autobuz</span>${getScore('logo_T_med')}</td>
                                    <td><span class="logo-example-text">pat</span>${getScore('logo_T_fin')}</td>
                                </tr>
                                <tr>
                                    <td>D</td>
                                    <td><span class="logo-example-text">dinozaur</span>${getScore('logo_D_init')}</td>
                                    <td><span class="logo-example-text">crocodil</span>${getScore('logo_D_med')}</td>
                                    <td><span class="logo-example-text">brad</span>${getScore('logo_D_fin')}</td>
                                </tr>
                                <tr>
                                    <td>N</td>
                                    <td><span class="logo-example-text">nor</span>${getScore('logo_N_init')}</td>
                                    <td><span class="logo-example-text">cană</span>${getScore('logo_N_med')}</td>
                                    <td><span class="logo-example-text">scaun</span>${getScore('logo_N_fin')}</td>
                                </tr>
                                <tr>
                                    <td>L</td>
                                    <td><span class="logo-example-text">leu</span>${getScore('logo_L_init')}</td>
                                    <td><span class="logo-example-text">melc</span>${getScore('logo_L_med')}</td>
                                    <td><span class="logo-example-text">cal</span>${getScore('logo_L_fin')}</td>
                                </tr>
                                <tr>
                                    <td>F</td>
                                    <td><span class="logo-example-text">floare</span>${getScore('logo_F_init')}</td>
                                    <td><span class="logo-example-text">telefon</span>${getScore('logo_F_med')}</td>
                                    <td><span class="logo-example-text">cartof</span>${getScore('logo_F_fin')}</td>
                                </tr>
                                <tr>
                                    <td>V</td>
                                    <td><span class="logo-example-text">vapor</span>${getScore('logo_V_init')}</td>
                                    <td><span class="logo-example-text">avion</span>${getScore('logo_V_med')}</td>
                                    <td><span class="logo-example-text">morcov</span>${getScore('logo_V_fin')}</td>
                                </tr>
                                <tr>
                                    <td>S</td>
                                    <td><span class="logo-example-text">sanie</span>${getScore('logo_S_init')}</td>
                                    <td><span class="logo-example-text">pisică</span>${getScore('logo_S_med')}</td>
                                    <td><span class="logo-example-text">urs</span>${getScore('logo_S_fin')}</td>
                                </tr>
                                <tr>
                                    <td>Z</td>
                                    <td><span class="logo-example-text">zebră</span>${getScore('logo_Z_init')}</td>
                                    <td><span class="logo-example-text">frunză</span>${getScore('logo_Z_med')}</td>
                                    <td><span class="logo-example-text">autobuz</span>${getScore('logo_Z_fin')}</td>
                                </tr>
                                <tr>
                                    <td>Ț</td>
                                    <td><span class="logo-example-text">țap</span>${getScore('logo_T2_init')}</td>
                                    <td><span class="logo-example-text">maimuță</span>${getScore('logo_T2_med')}</td>
                                    <td><span class="logo-example-text">căluț</span>${getScore('logo_T2_fin')}</td>
                                </tr>
                                <tr>
                                    <td>Ș</td>
                                    <td><span class="logo-example-text">șervețel</span>${getScore('logo_S2_init')}</td>
                                    <td><span class="logo-example-text">ușă</span>${getScore('logo_S2_med')}</td>
                                    <td><span class="logo-example-text">cocoș</span>${getScore('logo_S2_fin')}</td>
                                </tr>
                                <tr>
                                    <td>J</td>
                                    <td><span class="logo-example-text">jucării</span>${getScore('logo_J_init')}</td>
                                    <td><span class="logo-example-text">păianjen</span>${getScore('logo_J_med')}</td>
                                    <td><span class="logo-example-text">ruj</span>${getScore('logo_J_fin')}</td>
                                </tr>
                                <tr>
                                    <td>C</td>
                                    <td><span class="logo-example-text">câine</span>${getScore('logo_C_init')}</td>
                                    <td><span class="logo-example-text">muscă</span>${getScore('logo_C_med')}</td>
                                    <td><span class="logo-example-text">porc</span>${getScore('logo_C_fin')}</td>
                                </tr>
                                <tr>
                                    <td>G</td>
                                    <td><span class="logo-example-text">găină</span>${getScore('logo_G_init')}</td>
                                    <td><span class="logo-example-text">papagal</span>${getScore('logo_G_med')}</td>
                                    <td><span class="logo-example-text">steag</span>${getScore('logo_G_fin')}</td>
                                </tr>
                                <tr>
                                    <td>H</td>
                                    <td><span class="logo-example-text">hipopotam</span>${getScore('logo_H_init')}</td>
                                    <td><span class="logo-example-text">pahar</span>${getScore('logo_H_med')}</td>
                                    <td><span class="logo-example-text">șah</span>${getScore('logo_H_fin')}</td>
                                </tr>
                                <tr>
                                    <td>R</td>
                                    <td><span class="logo-example-text">rață</span>${getScore('logo_R_init')}</td>
                                    <td><span class="logo-example-text">carte</span>${getScore('logo_R_med')}</td>
                                    <td><span class="logo-example-text">fular</span>${getScore('logo_R_fin')}</td>
                                </tr>
                                <tr>
                                    <td>X</td>
                                    <td><span class="logo-example-text">xilofon</span>${getScore('logo_X_init')}</td>
                                    <td><span class="logo-example-text">boxer</span>${getScore('logo_X_med')}</td>
                                    <td><span class="logo-example-text">pix</span>${getScore('logo_X_fin')}</td>
                                </tr>
                                <tr>
                                    <td>ce</td>
                                    <td><span class="logo-example-text">ceas</span>${getScore('logo_CE_init')}</td>
                                    <td><span class="logo-example-text">rinocer</span>${getScore('logo_CE_med')}</td>
                                    <td><span class="logo-example-text">șoarece</span>${getScore('logo_CE_fin')}</td>
                                </tr>
                                <tr>
                                    <td>ci</td>
                                    <td><span class="logo-example-text">citește</span>${getScore('logo_CI_init')}</td>
                                    <td><span class="logo-example-text">bicicletă</span>${getScore('logo_CI_med')}</td>
                                    <td><span class="logo-example-text">papuci</span>${getScore('logo_CI_fin')}</td>
                                </tr>
                                <tr>
                                    <td>ge</td>
                                    <td><span class="logo-example-text">geam</span>${getScore('logo_GE_init')}</td>
                                    <td><span class="logo-example-text">deget</span>${getScore('logo_GE_med')}</td>
                                    <td><span class="logo-example-text">minge</span>${getScore('logo_GE_fin')}</td>
                                </tr>
                                <tr>
                                    <td>gi</td>
                                    <td><span class="logo-example-text">girafă</span>${getScore('logo_GI_init')}</td>
                                    <td><span class="logo-example-text">frigider</span>${getScore('logo_GI_med')}</td>
                                    <td><span class="logo-example-text">covrigi</span>${getScore('logo_GI_fin')}</td>
                                </tr>
                                <tr>
                                    <td>che</td>
                                    <td><span class="logo-example-text">cheie</span>${getScore('logo_CHE_init')}</td>
                                    <td><span class="logo-example-text">ochelari</span>${getScore('logo_CHE_med')}</td>
                                    <td><span class="logo-example-text">ridiche</span>${getScore('logo_CHE_fin')}</td>
                                </tr>
                                <tr>
                                    <td>chi</td>
                                    <td><span class="logo-example-text">chibrituri</span>${getScore('logo_CHI_init')}</td>
                                    <td><span class="logo-example-text">rochie</span>${getScore('logo_CHI_med')}</td>
                                    <td><span class="logo-example-text">ochi</span>${getScore('logo_CHI_fin')}</td>
                                </tr>
                                <tr>
                                    <td>ghe</td>
                                    <td><span class="logo-example-text">ghete</span>${getScore('logo_GHE_init')}</td>
                                    <td><span class="logo-example-text">înghețată</span>${getScore('logo_GHE_med')}</td>
                                    <td><span class="logo-example-text">Gheorghe</span>${getScore('logo_GHE_fin')}</td>
                                </tr>
                                <tr>
                                    <td>ghi</td>
                                    <td><span class="logo-example-text">ghiozdan</span>${getScore('logo_GHI_init')}</td>
                                    <td><span class="logo-example-text">unghie</span>${getScore('logo_GHI_med')}</td>
                                    <td><span class="logo-example-text">triunghi</span>${getScore('logo_GHI_fin')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                        
                    <div class="comments-section">
                        <h2>Comentarii Evaluare Logopedică</h2>
                        <p>${comments}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}




// --- Secțiunea Istoric Programe ---

// În: js/evolutionService.js

// ... (adaugă funcția generateScoreHTML de mai sus aici) ...

// În: js/evolutionService.js
// ROL: Afișează istoricul în modalul "Evoluție" (Tab-ul "Istoric Programe")

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
            <thead><tr><th>Program</th><th>Data</th><th style="text-align: left;">Scor</th></tr></thead>
            <tbody>
    `;
    
    Object.entries(grouped).forEach(([programTitle, entries]) => {
        entries.slice(0, 10).forEach((entry, index) => { // Limitează la ultimele 10
            const formattedDate = new Date(entry.date).toLocaleDateString('ro-RO');
            
            // --- MODIFICARE AICI ---
            const scoreHtml = generateScoreHTML(entry.score); // Folosim noul helper
            // --- SFÂRȘIT MODIFICARE ---
            
            html += `<tr>`;
            if (index === 0) {
                html += `<td rowspan="${Math.min(entries.length, 10)}">${programTitle}</td>`;
            }
            html += `<td>${formattedDate}</td>`;
            
            // --- MODIFICARE AICI ---
            html += `<td style="text-align: left;">${scoreHtml}</td>`; // Afișăm HTML-ul generat
            // --- SFÂRȘIT MODIFICARE ---
            html += `</tr>`;
        });
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * NOU: Funcție copiată din reportService.js pentru a genera sumarul DQ.
 * Generează HTML pentru tabelul sumar Portage DQ.
 */
function generatePortageSummaryHTML(clientData, client) {
    // Verifică dacă există datele necesare
    if (!client.birthDate || !clientData.evaluations || Object.keys(clientData.evaluations).length === 0) {
        return ''; // Nu afișa nimic dacă nu există date
    }

    const birthDate = new Date(client.birthDate);
    const allDates = new Set();
    // Adună toate datele de evaluare unice
    Object.values(clientData.evaluations).forEach(domain => {
        Object.keys(domain).forEach(date => allDates.add(date));
    });
    // Sortează datele cronologic
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
    
    const results = [];
    sortedDates.forEach(date => {
        // Obține toate scorurile (DA) pentru o anumită dată
        const evalValues = Object.values(clientData.evaluations)
            .map(domain => domain[date])
            .filter(v => typeof v === 'number' && !isNaN(v));
        
        if (evalValues.length === 0) return; // Continuă dacă nu există scoruri pentru această dată

        // Calculează media DA (Vârsta Dezvoltării)
        const avgDevAge = evalValues.reduce((a, b) => a + b, 0) / evalValues.length;
        // Calculează CA (Vârsta Cronologică) în luni la data evaluării
        const chronoAge = getAgeInMonths(birthDate, date); 
        
        if (chronoAge === 0) return; // Evită împărțirea la zero
        
        // Calculează DQ (Coeficientul de Dezvoltare)
        const dq = (avgDevAge / chronoAge) * 100;
        results.push({ date, avgDevAge, chronoAge, dq });
    });

    if (results.length === 0) {
        return ''; // Nu s-au putut calcula rezultate
    }

    // Generează rândurile tabelului
    // Folosim clasa 'evolution-table' pentru a prelua stilurile
    const tableRows = results.map(r => {
        const color = r.dq < 70 ? '#e74c3c' : r.dq < 85 ? '#f39c12' : '#27ae60'; // Roșu, Galben, Verde
        // Adăugăm atributele data-label pentru responsivitate (preluat din styles.css)
        return `<tr>
            <td data-label="Data">${new Date(r.date).toLocaleDateString('ro-RO')}</td>
            <td data-label="Vârstă Cronologică">${r.chronoAge.toFixed(1)} luni</td>
            <td data-label="Vârstă Mentală">${r.avgDevAge.toFixed(1)} luni</td>
            <td data-label="Indice Dezvoltare (DQ)" style="font-weight:600;color:${color};">${r.dq.toFixed(1)}</td>
        </tr>`;
    }).join('');

    // Returnează HTML-ul complet al tabelului
    // Folosim clasele CSS existente
    return `
        <h3 class="evolution-summary-title">Evoluție Generală Portage (DQ)</h3>
        <div class="evolution-table-container" style="margin-top: 0; padding-top: 0;">
            <table class="evolution-table">
                <thead>
                    <tr>
                        <th>Data Evaluării</th>
                        <th>Vârstă Cronologică (CA)</th>
                        <th>Vârstă Mentală (DA)</th>
                        <th>Indice Dezvoltare (DQ)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

// În: js/evolutionService.js
// ROL: Afișează notițele private (inclusiv scorurile) în modalul "Evoluție"

function renderPrivateNotes(clientId) {
    const container = $('privateNotesContainer');
    if (!container) return;

    const { events } = calendarState.getState();

    // 1. Filtrează evenimentele care au comentarii pentru acest client
    const eventsWithComments = events.filter(event => {
        const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
        const hasClient = clientIds.includes(clientId);
        const hasComment = event.comments && event.comments.trim() !== '';
        return hasClient && hasComment;
    });

    // 2. Sortează (cele mai noi primele)
    eventsWithComments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
        return dateB - dateA; // Sortare descrescătoare
    });

    // 3. Randează HTML-ul
    if (eventsWithComments.length === 0) {
        container.innerHTML = '<p class="private-notes-empty">Nu există notițe private salvate pentru acest client.</p>';
        return;
    }

    container.innerHTML = eventsWithComments.map(event => {
        // Găsește terapeuții
        const memberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
        const members = memberIds
            .map(id => calendarState.getTeamMemberById(id))
            .filter(Boolean) // Elimină membrii negăsiți
            .map(m => m.name)
            .join(', ');

        // Formatează data și ora
        const formattedDate = new Date(event.date).toLocaleDateString('ro-RO', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const time = event.startTime || 'N/A';

        // --- AICI E MODIFICAREA ---
        let scoresHtml = '';
        const programIds = event.programIds || [];
        const programScores = event.programScores || {}; // Acesta conține obiectele de scor

        if (programIds.length > 0) {
            let scoreItemsHtml = '';
            programIds.forEach(pId => {
                const program = calendarState.getProgramById(pId);
                const scoreData = programScores[pId]; // Acesta este {P: 1, +: 3} etc.
                
                if (program) { // Afișăm doar dacă programul există
                    scoreItemsHtml += `
                        <div class="note-score-item">
                            <span class="note-program-title">${program.title}</span>
                            ${generateScoreHTML(scoreData)} 
                        </div>
                    `;
                }
            });

            if (scoreItemsHtml) {
                 scoresHtml = `<div class="private-note-scores">${scoreItemsHtml}</div>`;
            }
        }
        // --- SFÂRȘIT MODIFICARE ---

        return `
            <div class="private-note-item">
                <div class="private-note-header">
                    <span class="note-meta-item">
                        Terapeut: <strong>${members || 'Nespecificat'}</strong>
                    </span>
                    <span class="note-meta-item">
                        Data: <strong>${formattedDate}</strong>
                    </span>
                    <span class="note-meta-item">
                        Ora: <strong>${time}</strong>
                    </span>
                </div>
                <div class="private-note-body">
                    ${scoresHtml} 
                    ${event.comments || ''}
                </div>
            </div>
        `;
    }).join('');
}

    // --- Secțiunea Temă Lunară ---

/**
 * NOU: Randează istoricul temelor lunare în tab-ul corespunzător.
 * @param {object} clientData Datele de evoluție complete ale clientului.
 */
function renderMonthlyThemeHistory(clientData) {
    const container = $('monthlyThemeHistoryContainer');
    if (!container) return;

    const themes = clientData.monthlyThemes || {};
    // Sortează lunile în ordine cronologică inversă (cele mai noi primele)
    const sortedMonths = Object.keys(themes).sort((a, b) => b.localeCompare(a));

    if (sortedMonths.length === 0) {
        container.innerHTML = '<p class="empty-list-message" style="text-align: center; margin-top: 1rem;">Nu există teme lunare salvate.</p>';
        return;
    }

    // Helper pentru a formata "YYYY-MM" în "Luna An" (ex: "Noiembrie 2025")
    const formatMonth = (monthKey) => {
        const [year, month] = monthKey.split('-');
        // Creăm o dată sigură (folosind ziua 1)
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('ro-RO', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    // MODIFICAT: Adăugat buton de editare
    container.innerHTML = sortedMonths.map(monthKey => {
        const themeText = themes[monthKey]
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
            
        return `
            <div class="monthly-theme-item">
                <div class="monthly-theme-header">
                    <span class="monthly-theme-month">${formatMonth(monthKey)}</span>
                    <button 
                        class="btn btn-secondary btn-sm monthly-theme-edit-btn" 
                        data-month-key="${monthKey}"
                        style="padding: 0.25rem 0.75rem; font-size: 0.75rem;"
                    >
                        Editează
                    </button>
                </div>
                <p class="monthly-theme-text">${themeText}</p>
            </div>
        `;
    }).join('');

    // NOU: Adaugă event listener pentru butoanele de editare
    const handleEditThemeClick = (e) => {
        const button = e.target.closest('.monthly-theme-edit-btn');
        if (!button) return;

        const monthKey = button.dataset.monthKey;
        const { evolutionData } = calendarState.getState();
        const themeText = evolutionData[currentClientId]?.monthlyThemes?.[monthKey];

        if (themeText) {
            $('monthlyThemeMonth').value = monthKey;
            $('monthlyThemeText').value = themeText;
            $('monthlyThemeText').focus(); // Focus pe text
        }
    };
    
    container.removeEventListener('click', handleEditThemeClick); // Previne listeneri multipli
    container.addEventListener('click', handleEditThemeClick);
}


/**
 * NOU: Inițializează valorile implicite pentru tab-ul "Temă Lunară".
 * Setează luna curentă în input și golește câmpul de text.
 */
function setupMonthlyThemeTab() {
    const monthInput = $('monthlyThemeMonth');
    if (monthInput) {
        const now = new Date();
        const year = now.getFullYear();
        // Adaugă '0' la început pentru lunile 1-9
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        monthInput.value = `${year}-${month}`;
    }
    
    const textInput = $('monthlyThemeText');
    if (textInput) {
        textInput.value = ''; // Golește textul la deschiderea modalului
    }
}

/**
 * NOU: Salvează tema lunara pentru clientul curent.
 * MODIFICAT: Adăugată verificare de suprascriere.
 */
async function saveMonthlyTheme() {
    const month = $('monthlyThemeMonth').value;
    const text = $('monthlyThemeText').value;

    if (!currentClientId) {
        showCustomAlert('Eroare: Niciun client selectat.', 'Eroare');
        return;
    }
    if (!month) {
        showCustomAlert('Selectați luna pentru care doriți să salvați tema.', 'Atenție');
        return;
    }
    if (!text.trim()) {
        showCustomAlert('Introduceți textul temei.', 'Atenție');
        return;
    }

    const { evolutionData } = calendarState.getState();
    const client = calendarState.getClientById(currentClientId);

    // Asigură-te că structura de bază există în obiectul evolutionData
    if (!evolutionData[currentClientId]) {
        evolutionData[currentClientId] = { 
            name: client.name, 
            evaluations: {}, 
            programHistory: [], 
            monthlyThemes: {} 
        };
    }
    if (!evolutionData[currentClientId].monthlyThemes) {
        evolutionData[currentClientId].monthlyThemes = {};
    }

    // --- NOU: VERIFICARE SUPRASCRIERE ---
    const existingTheme = evolutionData[currentClientId].monthlyThemes[month];
    const newText = text.trim();
    
    // Verificăm dacă există o temă ȘI dacă textul nou este DIFERIT de cel vechi
    if (existingTheme && existingTheme !== newText) {
        const confirmed = await showCustomConfirm(
            "O temă pentru această lună există deja. Ești sigur că vrei să suprascrii tema curentă?",
            "Confirmare Suprascriere"
        );
        
        // Dacă utilizatorul anulează, oprim funcția
        if (!confirmed) {
            return; 
        }
    }
    // --- SFÂRȘIT VERIFICARE ---

    // Salvează sau actualizează tema pentru luna respectivă
    evolutionData[currentClientId].monthlyThemes[month] = newText;

    // Actualizează starea locală
    calendarState.setEvolutionData(evolutionData);

   try {
    await queuedSaveEvolutionData(evolutionData);
    showCustomAlert('Tema lunară a fost salvată cu succes!', 'Succes');

    renderMonthlyThemeHistory(evolutionData[currentClientId]);
    $('monthlyThemeText').value = '';
    setupMonthlyThemeTab();

    if (window.logActivity) {
        window.logActivity("Temă lunară salvată", client.name, 'evaluation', currentClientId);
    }

} catch (err) {
    console.error('Eroare la salvarea temei lunare:', err);
    showCustomAlert('Nu s-a putut salva tema lunară pe server.', 'Eroare');
}
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
            
            // --- MODIFICARE: Creare groupKey unic ---
            const groupKey = `${domain}_${ageRange.replace(/[^a-z0-9]/gi, '_')}`;
            
            // Format age separator
            let separatorText = formatAgeRange(ageRange, firstItemInGroup.months);
            
            // --- MODIFICARE: Adăugare checkbox la separator ---
            const groupHtml = `
                <div class="portage-age-separator">
                    <input type="checkbox" class="portage-group-toggle" data-group-key="${groupKey}" id="toggle_${groupKey}">
                    <label for="toggle_${groupKey}">${separatorText}</label>
                </div>
            `;
            
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

                // --- MODIFICARE: Adăugare data-group-key la item ---
                groupItemsHtml += `
                    <div class="portage-item ${isFuture ? 'disabled' : ''}" data-months="${item.months}" data-group-key="${groupKey}">
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
                // Sincronizează clasa vizuală când checkbox-ul se change
                item.classList.toggle('checked', e.target.checked);
            });
        });
        // --- END CORECȚIE 2 ---

        // --- NOU: Adaugă listener pentru toggle-ul de grup de vârstă ---
        block.querySelectorAll('.portage-group-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const groupKey = e.target.dataset.groupKey;
                const isChecked = e.target.checked;

                // Găsește toate item-urile care aparțin acestui grup *în interiorul* blocului de domeniu
                const itemsInGroup = block.querySelectorAll(`.portage-item[data-group-key="${groupKey}"]`);
                
                itemsInGroup.forEach(item => {
                    const itemCheckbox = item.querySelector('input[type="checkbox"]');
                    // Bifează/debifează doar item-urile care nu sunt dezactivate (nu sunt din viitor)
                    if (itemCheckbox && !itemCheckbox.disabled) {
                        itemCheckbox.checked = isChecked;
                        // Sincronizează și clasa vizuală 'checked'
                        item.classList.toggle('checked', isChecked);
                    }
                });
            });
        });
        // --- SFÂRȘIT NOU ---

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

    // --- START CORECȚIE BUG SUPRASCRIERE ---
    // Ne asigurăm că întreaga structură de date există ÎNAINTE de a crea referința
    
    // 1. Asigură-te că obiectul clientului există în evolutionData
    if (!evolutionData[currentClientId]) {
        evolutionData[currentClientId] = { name: client.name, evaluations: {}, programHistory: [] };
    }
    // 2. Asigură-te că sub-obiectul `evaluations` există
    if (!evolutionData[currentClientId].evaluations) {
        evolutionData[currentClientId].evaluations = {};
    }

    // 3. Acum `clientEvals` este o referință SIGURĂ la obiectul din state care trebuie modificat
    const clientEvals = evolutionData[currentClientId].evaluations;
    
    // Calculează vârsta de dezvoltare și salvează scorul
    for (const domain in domainScores) {
        const items = portrigeData[domain].filter(item => item.months <= ageMonths);
        let developmentalAge = 0;
        if (items.length > 0) {
            // (logica de calculare a vârstei rămâne neschimbată)
            const checkedItems = domainItems[domain].filter(cb => cb.checked).map(cb => cb.closest('.portage-item'));
            if(checkedItems.length > 0) {
                const lastCheckedItem = checkedItems[checkedItems.length-1];
                developmentalAge = parseInt(lastCheckedItem.dataset.months) || 0;
            }
        }
        
        const key = `Portrige - ${domain}`; // Cheia pentru grafic
        
        // 4. Asigură-te că domeniul (ex: "Portrige - Limbaj") există
        if (!clientEvals[key]) {
            clientEvals[key] = {};
        }
        
        // 5. Adaugă/Actualizează data evaluării FĂRĂ a suprascrie întregul domeniu
        clientEvals[key][evalDate] = developmentalAge;
    }
    
    // `evolutionData` a fost deja modificat prin referință
    calendarState.setEvolutionData(evolutionData);
    
    // --- SFÂRȘIT CORECȚIE BUG SUPRASCRIERE ---
    
    // Salvează pe server
   try {
    await queuedSaveEvolutionData(evolutionData);
    showCustomAlert('Evaluarea Portage a fost salvată cu succes!', 'Succes');
    
    if (window.logActivity) {
        window.logActivity("Evaluare salvată", client.name, 'evaluation', currentClientId);
    }
    
    renderEvaluationReportsList(evolutionData[currentClientId], client);
    activateTab('tabGrafice');

} catch (err) {
    console.error('Eroare la salvarea evaluării:', err);
    showCustomAlert('Nu s-a putut salva evaluarea pe server.', 'Eroare');
}
}

/**
 * NOU: Salvează datele evaluării Logopedice.
 */
/**
 * Salvează datele evaluării Logopedice.
 */
async function saveLogopedicaEvaluation() {
    const { evolutionData } = calendarState.getState();
    const evalDate = $('evaluationDateInput').value;
    const client = calendarState.getClientById(currentClientId);

    if (!client || !evalDate) {
        showCustomAlert('Completați data nașterii și data evaluării.', 'Eroare');
        return;
    }

    // 1. Colectează datele din inputuri
    const scores = {};
    const inputs = document.querySelectorAll('#logopedicaFormContainer .logo-input');
    inputs.forEach(input => {
        // Salvăm doar dacă există o valoare
        if (input.value.trim() !== '') {
            scores[input.id] = input.value.trim();
        }
    });

    // 2. Colectează comentariile
    const comments = $('logoComentarii').value || '';

    // 3. Verifică dacă există date de salvat
    if (Object.keys(scores).length === 0 && comments.trim() === '') {
        showCustomAlert('Nu a fost introdusă nicio dată pentru evaluarea logopedică.', 'Atenție');
        return;
    }

    // 4. Pregătește structura de date
    if (!evolutionData[currentClientId]) {
        evolutionData[currentClientId] = { name: client.name, evaluations: {}, programHistory: [], evaluationsLogopedica: {} };
    }
    if (!evolutionData[currentClientId].evaluationsLogopedica) {
        evolutionData[currentClientId].evaluationsLogopedica = {};
    }

    // 5. Adaugă/Actualizează datele pentru data evaluării
    // Vom salva datele logopedice într-un câmp separat 'evaluationsLogopedica'
    // pentru a nu le amesteca cu datele Portage folosite pentru grafic.
    evolutionData[currentClientId].evaluationsLogopedica[evalDate] = {
        scores: scores,
        comments: comments
    };

    // 6. Actualizează starea locală
    calendarState.setEvolutionData(evolutionData);
    
    // 7. Salvează pe server
    try {
    await queuedSaveEvolutionData(evolutionData);
    showCustomAlert('Evaluarea logopedică a fost salvată cu succes!', 'Succes');

    if (window.logActivity) {
        window.logActivity("Evaluare Logopedică salvată", client.name, 'evaluation', currentClientId);
    }
    
    renderEvaluationReportsList(evolutionData[currentClientId], client);
    activateTab('tabGrafice');

} catch (err) {
    console.error('Eroare la salvarea evaluării logopedice:', err);
    showCustomAlert('Nu s-a putut salva evaluarea logopedică pe server.', 'Eroare');
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

// Listener pentru salvarea temei lunare
$('saveMonthlyThemeBtn')?.addEventListener('click', saveMonthlyTheme);

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
        saveLogopedicaEvaluation();
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