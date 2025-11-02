

/**
 * js/reportService.js
 *
 * Gestionează generarea și descărcarea rapoartelor
 * pentru clienți și membrii echipei.
 * Citește datele din 'calendarState'.
 */

import { calendarState } from './calendarState.js';
import { showCustomAlert } from './uiService.js';

/**
 * Generează și descarcă un raport HTML pentru un client.
 * (Modificat pentru a genera HTML cu date de evoluție)
 * @param {string} clientId
 */
export async function downloadClientReport(clientId) { // <-- Add async
    const client = calendarState.getClientById(clientId);
    if (!client) {
        showCustomAlert('Clientul nu a fost găsit.', 'Eroare');
        return;
    }

    const reportData = generateClientReportData(clientId); // This is now modified
    if (!reportData) {
        showCustomAlert('Nu s-au găsit date (sesiuni sau evoluție) pentru acest client.', 'Eroare'); // Modified message
        return;
    }

    // MODIFIED: Generate async HTML, then download as HTML
    try {
        const htmlContent = await generateClientHTML(reportData); // <-- Add await
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Raport_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showCustomAlert('Raportul HTML a fost descărcat.\nÎl puteți deschide în browser (graficul este inclus).', 'Descărcare finalizată'); // Modified message
        
        if (window.logActivity) {
            window.logActivity("Raport generat", client.name, 'report', clientId);
        }
    } catch (error) {
        console.error('Eroare la generarea raportului client HTML:', error);
        showCustomAlert('A apărut o eroare la generarea raportului.', 'Eroare');
    }
}


/**
 * Generează și descarcă un raport HTML pentru un membru al echipei.
 * @param {string} memberId
 */
export function downloadTeamMemberReport(memberId) {
    const member = calendarState.getTeamMemberById(memberId);
    if (!member) {
        showCustomAlert('Membrul echipei nu a fost găsit.', 'Eroare');
        return;
    }

    const reportData = generateTeamMemberReportData(memberId);
    if (!reportData) {
        showCustomAlert('Nu s-au găsit date pentru acest membru al echipei.', 'Eroare');
        return;
    }

    const htmlContent = generateTeamMemberHTML(reportData);
    
    // Create blob and download as HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raport_${member.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showCustomAlert('Raportul HTML a fost descărcat.\nÎl puteți deschide în browser și salva ca PDF (Print -> Save as PDF).', 'Descărcare finalizată');
}

/**
 * Trimite un raport prin email (funcție placeholder).
 * @param {string} clientId
 */
export function emailClientReport(clientId) {
    const client = calendarState.getClientById(clientId);
    if (!client) {
        showCustomAlert('Clientul nu a fost găsit.', 'Eroare');
        return;
    }

    if (!client.email) {
        showCustomAlert('Clientul nu are o adresă de email salvată. Vă rugăm adăugați un email în profilul clientului.', 'Eroare');
        return;
    }

    showCustomAlert(
        `Funcționalitate Email (Placeholder):\n\n` +
        `Într-o implementare completă, raportul HTML (sau un PDF generat pe server) ar fi trimis la:\n${client.email}\n\n` +
        `Acest lucru necesită un API de backend (ex: api.php) configurat cu un serviciu de trimitere email (SMTP, SendGrid, etc.).\n\n` +
        `Deocamdată, folosiți butonul "Descarcă Raport" pentru a salva HTML-ul manual.`,
        'Funcționalitate Neimplementată'
    );
}

// --- LOGICA INTERNĂ DE GENERARE RAPORT CLIENT ---

function generateClientReportData(clientId) {
    const { events, teamMembers, clients, currentDate, evolutionData } = calendarState.getState(); // <-- Add evolutionData
    const client = calendarState.getClientById(clientId);
    if (!client) return null;

    // --- Get Evolution Data ---
    const clientEvolution = evolutionData[clientId] || 
                          evolutionData[`client_${clientId}`] || 
                          { name: client.name, evaluations: {}, programHistory: [] };
    const hasEvolution = clientEvolution && (
        (clientEvolution.evaluations && Object.keys(clientEvolution.evaluations).length > 0) || 
        (clientEvolution.programHistory && clientEvolution.programHistory.length > 0)
    );

    // --- Get Event Data (current month) ---
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const clientEvents = events.filter(event => {
        const isClientEvent = (event.clientId === clientId) || 
                           (event.clientIds && event.clientIds.includes(clientId));
        if (!isClientEvent) return false;
        
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === currentYear && 
               eventDate.getMonth() === currentMonth;
    });

    const hasEvents = clientEvents.length > 0;
    
    // --- Check if any data exists ---
    if (!hasEvents && !hasEvolution) return null; // <-- Modified check

    const billableEvents = clientEvents.filter(e => e.isBillable !== false);
    const nonBillableEvents = clientEvents.filter(e => e.isBillable === false);

    const billableData = processEventsForClientReport(billableEvents, clientId);
    const nonBillableData = processEventsForClientReport(nonBillableEvents, clientId);

    return { client, billable: billableData, nonBillable: nonBillableData, currentDate, clientEvolution }; // <-- Add clientEvolution
}


function processEventsForClientReport(events, clientId) {
    const { teamMembers } = calendarState.getState();
    const therapistTotals = {};
    let totalHours = 0;
    let presentHours = 0;
    let absentHours = 0;

    events.forEach(event => {
        if (!event.startTime || !event.duration) return;

        const hours = event.duration / 60;
        const attendance = (event.attendance && event.attendance[clientId]) || 'present';
        const isPresent = attendance === 'present';

        if (isPresent) presentHours += hours;
        else absentHours += hours;
        totalHours += hours;
        
        const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
        
        teamMemberIds.forEach(memberId => {
            const member = calendarState.getTeamMemberById(memberId);
            if (member) {
                const therapistName = member.name;
                if (!therapistTotals[therapistName]) {
                    therapistTotals[therapistName] = { total: 0, present: 0, absent: 0 };
                }
                therapistTotals[therapistName].total += hours;
                if (isPresent) therapistTotals[therapistName].present += hours;
                else therapistTotals[therapistName].absent += hours;
            }
        });
    });

    return { therapistTotals, grandTotal: totalHours, presentTotal: presentHours, absentTotal: absentHours };
}

async function generateClientHTML(reportData) { // <-- Add async
    const { client, billable, nonBillable, currentDate, clientEvolution } = reportData; // <-- Add clientEvolution
    const monthName = currentDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });

    // --- Generate sections ---
    const createSummaryTable = (title, data, color) => {
        if (data.grandTotal === 0) return '';
        
        let therapistRows = '';
        Object.entries(data.therapistTotals)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([name, stats]) => {
                therapistRows += `
                    <tr>
                        <td>${name}</td>
                        <td style="text-align: right;">${stats.total.toFixed(1)} ore</td>
                        <td style="text-align: right; color: #059669;">${stats.present.toFixed(1)} ore</td>
                        <td style="text-align: right; color: #dc2626;">${stats.absent.toFixed(1)} ore</td>
                    </tr>
                `;
            });

        return `
            <div class="summary-box" style="border-left-color: ${color}; background: ${color}10;">
                <h3 style="color: ${color};">${title}</h3>
                <table>
                    <thead>
                        <tr style="background: ${color}; color: white;">
                            <th>Terapeut</th>
                            <th style="text-align: right;">Total Ore</th>
                            <th style="text-align: right;">Ore Prezent</th>
                            <th style="text-align: right;">Ore Absent</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${therapistRows}
                    </tbody>
                    <tfoot>
                        <tr class="total-row" style="background: ${color}20; border-top-color: ${color};">
                            <td>TOTAL</td>
                            <td style="text-align: right;">${data.grandTotal.toFixed(1)} ore</td>
                            <td style="text-align: right; color: #059669;">${data.presentTotal.toFixed(1)} ore</td>
                            <td style="text-align: right; color: #dc2626;">${data.absentTotal.toFixed(1)} ore</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    };
    
    const billableSection = createSummaryTable('Sesiuni Facturabile (Luna Curentă)', billable, '#3b82f6');
    const nonBillableSection = createSummaryTable('Sesiuni Non-Facturabile (Luna Curentă)', nonBillable, '#6b7280');
    const combinedTotal = billable.grandTotal + nonBillable.grandTotal;
    const combinedPresent = billable.presentTotal + nonBillable.presentTotal;
    const combinedAbsent = billable.absentTotal + nonBillable.absentTotal;

    // --- Generate NEW sections ---
    let evolutionChartHTML = '';
    try {
        const chartImageBase64 = await generateChartImage(clientEvolution);
        if (chartImageBase64) {
            evolutionChartHTML = `
                <h2 style="color: #10b981; border-bottom-color: #10b98150;">Evoluție Portage (Grafic)</h2>
                <div class="summary-box" style="padding: 10px; text-align: center; border-left-color: #10b981; background: #f0fdf4;">
                    <img src="${chartImageBase64}" alt="Grafic Evoluție" style="max-width: 100%; height: auto; border-radius: 8px;">
                </div>
            `;
        }
    } catch (err) {
        console.error("Eroare la generarea imaginii graficului:", err);
        evolutionChartHTML = '<h2 style="color: #dc2626;">Graficul nu a putut fi generat.</h2>';
    }

    const portageSummaryHTML = generatePortageSummaryHTML(clientEvolution, client);
    const programHistoryHTML = generateProgramHistoryHTML(clientEvolution.programHistory);


    // --- Build Final HTML (using team member report style as base) ---
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Raport Terapie - ${client.name}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.6; }
                .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4A90E2; }
                h1 { color: #4A90E2; margin: 0; font-size: 28px; }
                h2 { margin: 30px 0 15px 0; font-size: 20px; border-bottom: 2px solid; padding-bottom: 8px; }
                .client-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4A90E2; }
                .client-info p { margin: 5px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                th { background: #4A90E2; color: white; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                tbody tr:nth-child(even) { background: #f9fafb; }
                tbody tr:hover { background: #f3f4f6; }
                .total-row td { font-weight: bold; font-size: 16px; padding: 15px 12px; border-top-width: 2px; border-top-style: solid; }
                .summary-box { padding: 20px; margin: 20px 0; border-radius: 8px; border-left-width: 4px; border-left-style: solid; }
                .summary-box h3 { margin: 0 0 15px 0; }
                .summary-box table { box-shadow: none; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
                /* Specific for program history */
                .program-history-score { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; width: 28px; height: 28px; border-radius: 0.25rem; border: 2px solid; }
                .program-history-score[data-score="0"] { color: #ef4444; border-color: #ef4444; }
                .program-history-score[data-score="-"] { color: #f59e0b; border-color: #f59e0b; }
                .program-history-score[data-score="P"] { color: #3b82f6; border-color: #3b82f6; }
                .program-history-score[data-score="+"] { color: #10b981; border-color: #10b981; }
                .program-history-empty { color: #6b7280; text-align: center; padding: 2rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <div><h1>Raport Terapie</h1></div>
                <div style="text-align: right;"><p style="margin: 0; color: #6b7280;">Generat: ${new Date().toLocaleDateString('ro-RO')}</p></div>
            </div>
            <div class="client-info">
                <h2 style="margin-top: 0; color: #4A90E2; border-bottom: none;">Informații Client</h2>
                <p><strong>Nume:</strong> ${client.name}</p>
                ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
                ${client.phone ? `<p><strong>Telefon:</strong> ${client.phone}</p>` : ''}
                ${client.birthDate ? `<p><strong>Data nașterii:</strong> ${new Date(client.birthDate).toLocaleDateString('ro-RO')}</p>` : ''}
            </div>

            <h2 style="color: #3b82f6; border-bottom-color: #3b82f650;">Rezumat Sesiuni (${monthName})</h2>
            ${billableSection}
            ${nonBillableSection}
            ${ (billable.grandTotal > 0 || nonBillable.grandTotal > 0) ?
            `<div class="summary-box" style="border-left-color: #10b981; background: #f0fdf4;">
                <h3 style="color: #065f46;">Total General (${monthName})</h3>
                <table style="box-shadow: none;">
                    <tbody>
                        <tr class="total-row" style="background: #dcfce7; border-top-color: #10b981;">
                            <td>Total Ore Prezente</td>
                            <td style="text-align: right;">${combinedPresent.toFixed(1)} ore</td>
                        </tr>
                        <tr class="total-row" style="background: #fee2e2; border-top-color: #ef4444;">
                            <td>Total Ore Absente</td>
                            <td style="text-align: right;">${combinedAbsent.toFixed(1)} ore</td>
                        </tr>
                        <tr class="total-row" style="background: #e0f2fe; border-top-color: #3b82f6;">
                            <td>Total Ore Programate</td>
                            <td style="text-align: right;">${combinedTotal.toFixed(1)} ore</td>
                        </tr>
                    </tbody>
                </table>
            </div>` : '<p style="text-align: center; color: #6b7280;">Nu există sesiuni programate pentru luna curentă.</p>'}
            
            ${evolutionChartHTML}
            
            ${portageSummaryHTML}
            
            ${programHistoryHTML}

            <div class="footer"><p>Raport generat automat - Tempo</p></div>
        </body>
        </html>
    `;
}


// --- LOGICA INTERNĂ DE GENERARE RAPORT ECHIPĂ ---

function generateTeamMemberReportData(memberId) {
    const { events, clients } = calendarState.getState();
    const member = calendarState.getTeamMemberById(memberId);
    if (!member) return null;

    const memberEvents = events.filter(event => {
        const teamMemberIds = event.teamMemberIds || (event.teamMemberId ? [event.teamMemberId] : []);
        return teamMemberIds.includes(memberId);
    });

    if (memberEvents.length === 0) return null;

    const billableEvents = memberEvents.filter(e => e.isBillable !== false && e.type !== 'day-off' && e.type !== 'pauza-masa' && e.type !== 'sedinta');
    const nonBillableEvents = memberEvents.filter(e => e.isBillable === false || e.type === 'day-off' || e.type === 'pauza-masa' || e.type === 'sedinta');

    return {
        member,
        billable: processEventsForTeamReport(billableEvents),
        nonBillable: processEventsForTeamReport(nonBillableEvents)
    };
}

function processEventsForTeamReport(events) {
    const { clients } = calendarState.getState();
    const monthlyData = {};
    const clientTotals = {};
    let totalHours = 0;

    events.forEach(event => {
        if (!event.startTime || !event.duration) return;

        const eventDate = new Date(event.date);
        const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = eventDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { monthName, clients: {}, total: 0 };
        }

        const hours = event.duration / 60;
        const clientIds = event.clientIds || (event.clientId ? [event.clientId] : []);
        
        if (clientIds.length === 0) {
            const eventLabel = getEventTypeLabel(event.type) || event.name;
            if (!monthlyData[monthKey].clients[eventLabel]) monthlyData[monthKey].clients[eventLabel] = 0;
            monthlyData[monthKey].clients[eventLabel] += hours;
            if (!clientTotals[eventLabel]) clientTotals[eventLabel] = 0;
            clientTotals[eventLabel] += hours;
        } else {
            clientIds.forEach(clientId => {
                const client = calendarState.getClientById(clientId);
                const clientName = client ? client.name : 'Client necunoscut';
                if (!monthlyData[monthKey].clients[clientName]) monthlyData[monthKey].clients[clientName] = 0;
                monthlyData[monthKey].clients[clientName] += hours;
                if (!clientTotals[clientName]) clientTotals[clientName] = 0;
                clientTotals[clientName] += hours;
            });
        }
        monthlyData[monthKey].total += hours;
        totalHours += hours;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    return { monthlyData, clientTotals, sortedMonths, grandTotal: totalHours };
}

function generateTeamMemberHTML(reportData) {
    const { member, billable, nonBillable } = reportData;

    const createSection = (title, data, color) => {
        if (data.sortedMonths.length === 0) return '';
        
        let monthRows = '';
        data.sortedMonths.forEach(monthKey => {
            const month = data.monthlyData[monthKey];
            const clientsList = Object.entries(month.clients)
                .sort((a, b) => b[1] - a[1])
                .map(([name, hours]) => `${name}: ${hours.toFixed(1)}h`)
                .join('<br>');
            monthRows += `
                <tr>
                    <td>${month.monthName}</td>
                    <td>${clientsList}</td>
                    <td style="text-align: right; font-weight: 600;">${month.total.toFixed(1)} ore</td>
                </tr>
            `;
        });

        let clientSummaryRows = '';
        Object.entries(data.clientTotals)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, hours]) => {
                clientSummaryRows += `
                    <tr>
                        <td>${name}</td>
                        <td style="text-align: right; font-weight: 600;">${hours.toFixed(1)} ore</td>
                    </tr>
                `;
            });

        return `
            <h2 style="color: ${color}; border-bottom-color: ${color}50;">${title}</h2>
            <table>
                <thead><tr style="background: ${color};"><th>Lună</th><th>Clienți / Activități</th><th style="text-align: right;">Total Ore</th></tr></thead>
                <tbody>${monthRows}</tbody>
                <tfoot>
                    <tr class="total-row" style="background: ${color}20; border-top-color: ${color};">
                        <td colspan="2">TOTAL</td>
                        <td style="text-align: right;">${data.grandTotal.toFixed(1)} ore</td>
                    </tr>
                </tfoot>
            </table>
            <div class="summary-box" style="border-left-color: ${color}; background: ${color}10;">
                <h3 style="color: ${color};">Rezumat pe Client/Activitate</h3>
                <table>
                    <thead><tr style="background: ${color};"><th>Nume</th><th style="text-align: right;">Total Ore</th></tr></thead>
                    <tbody>${clientSummaryRows}</tbody>
                </table>
            </div>
        `;
    };

    const billableSection = createSection('Sesiuni Facturabile', billable, member.color || '#3b82f6');
    const nonBillableSection = createSection('Sesiuni Non-Facturabile (Admin/Concedii)', nonBillable, '#6b7280');
    const combinedTotal = billable.grandTotal + nonBillable.grandTotal;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Raport Activitate - ${member.name}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.6; }
                .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${member.color}; }
                h1 { color: ${member.color}; margin: 0; font-size: 28px; }
                h2 { margin: 30px 0 15px 0; font-size: 20px; border-bottom: 2px solid; padding-bottom: 8px; }
                .member-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${member.color}; }
                .member-info p { margin: 5px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                th { color: white; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                tbody tr:nth-child(even) { background: #f9fafb; }
                tbody tr:hover { background: #f3f4f6; }
                .total-row td { font-weight: bold; font-size: 16px; padding: 15px 12px; border-top-width: 2px; border-top-style: solid; }
                .summary-box { padding: 20px; margin: 20px 0; border-radius: 8px; border-left-width: 4px; border-left-style: solid; }
                .summary-box h3 { margin: 0 0 15px 0; }
                .summary-box table { box-shadow: none; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div><h1>Raport Activitate</h1></div>
                <div style="text-align: right;"><p style="margin: 0; color: #6b7280;">Generat: ${new Date().toLocaleDateString('ro-RO')}</p></div>
            </div>
            <div class="member-info">
                <h2 style="margin-top: 0;">Informații Terapeut</h2>
                <p><strong>Nume:</strong> ${member.name}</p>
                <p><strong>Rol:</strong> ${getRoleLabel(member.role)}</p>
                <p><strong>Initiale:</strong> ${member.initials}</p>
            </div>
            ${billableSection}
            ${nonBillableSection}
            <div class="summary-box" style="border-left-color: #10b981; background: #f0fdf4;">
                <h3 style="color: #065f46;">Total General (Toate Sesiunile)</h3>
                <table style="box-shadow: none;">
                    <tbody>
                        <tr class="total-row" style="background: #dcfce7; border-top-color: #10b981;">
                            <td>Total Ore Lucrate</td>
                            <td style="text-align: right;">${combinedTotal.toFixed(1)} ore</td>
                        </tr>
                        <tr class="total-row" style="background: #e0f2fe; border-top-color: #3b82f6;">
                            <td>Ore Facturabile</td>
                            <td style="text-align: right;">${billable.grandTotal.toFixed(1)} ore</td>
                        </tr>
                        <tr class="total-row" style="background: #f3f4f6; border-top-color: #6b7280;">
                            <td>Ore Non-Facturabile</td>
                            <td style="text-align: right;">${nonBillable.grandTotal.toFixed(1)} ore</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="footer"><p>Raport generat automat - Tempo</p></div>
        </body>
        </html>
    `;
}

// --- NEW HELPERS FOR CLIENT HTML REPORT ---

/**
 * Renders the evolution chart to an offscreen canvas and returns a Base64 image.
 */
async function generateChartImage(clientData) {
    if (!clientData || !clientData.evaluations || Object.keys(clientData.evaluations).length === 0) {
        return null; // No data to chart
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const colors = ['#4A90E2', '#FF6B6B', '#12C4D9', '#9B59B6', '#1DD75B', '#FFA500', '#E91E63'];
    const datasets = [];
    const allDates = new Set();
    
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

    return new Promise((resolve) => {
        // Asigură-te că Chart.js este disponibil în scope-ul global (este încărcat în admin.html)
        if (typeof Chart === 'undefined') {
            console.error('Chart.js nu este încărcat. Nu se poate genera graficul.');
            resolve(null);
            return;
        }

        const chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: sortedDates, datasets },
            options: {
                responsive: false, // Important for offscreen canvas
                animation: {
                    duration: 0, // No animation
                },
                events: [], // Dezactivează evenimentele pentru randare statică
                plugins: {
                    legend: { display: true, position: 'bottom', labels: { padding: 20 } },
                    title: { display: true, text: `Evoluție Scoruri Portage`, font: { size: 16 } }
                },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        // Este posibil ca graficul să nu fie randat instantaneu, deși am dezactivat animațiile.
        // Folosim un mic timeout pentru a ne asigura că randarea s-a finalizat.
        setTimeout(() => {
            const dataUrl = canvas.toDataURL('image/png');
            chartInstance.destroy(); // Clean up
            resolve(dataUrl);
        }, 250); // Un sfert de secundă ar trebui să fie suficient
    });
}


/**
 * Generates HTML for the Portage DQ summary table.
 * Copied and modified from evolutionService.js
 */
function generatePortageSummaryHTML(clientData, client) {
    if (!client.birthDate || !clientData.evaluations || Object.keys(clientData.evaluations).length === 0) {
        return '';
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
        const chronoAge = getAgeInMonths(birthDate, date); // Use helper
        if (chronoAge === 0) return; // Avoid division by zero
        const dq = (avgDevAge / chronoAge) * 100;
        results.push({ date, avgDevAge, chronoAge, dq });
    });

    if (results.length === 0) {
        return '';
    }

    const tableRows = results.map(r => {
        const color = r.dq < 70 ? '#e74c3c' : r.dq < 85 ? '#f39c12' : '#27ae60';
        return `<tr>
            <td>${new Date(r.date).toLocaleDateString('ro-RO')}</td>
            <td>${r.chronoAge.toFixed(1)} luni</td>
            <td>${r.avgDevAge.toFixed(1)} luni</td>
            <td style="font-weight:600;color:${color};">${r.dq.toFixed(1)}</td>
        </tr>`;
    }).join('');

    return `
        <h2 style="color: #9B59B6; border-bottom-color: #9B59B650;">Evoluție Generală Portage (DQ)</h2>
        <div class="summary-box" style="border-left-color: #9B59B6; background: #fdf4ff;">
            <table style="box-shadow: none;">
                <thead><tr style="background: #e9d5ff; color: #581c87;"><th>Data</th><th>Vârstă cronologică</th><th>Vârstă mentală</th><th>Indice dezvoltare (DQ)</th></tr></thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Generates HTML for the program history table.
 * Copied and modified from evolutionService.js
 */
function generateProgramHistoryHTML(programHistory) {
    if (!programHistory || programHistory.length === 0) {
        return `
            <h2 style="color: #FF6B6B; border-bottom-color: #FF6B6B50;">Istoric Programe Recente</h2>
            <div class="program-history-empty">Nu există istoric de programe pentru acest client.</div>
        `;
    }

    // Sortare și grupare
    programHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    const grouped = {};
    programHistory.forEach(entry => {
        if (!grouped[entry.programTitle]) grouped[entry.programTitle] = [];
        grouped[entry.programTitle].push(entry);
    });

    let tableRows = '';
    Object.entries(grouped).forEach(([programTitle, entries]) => {
        entries.slice(0, 10).forEach((entry, index) => { // Limitează la ultimele 10
            const formattedDate = new Date(entry.date).toLocaleDateString('ro-RO');
            tableRows += `<tr>`;
            if (index === 0) {
                tableRows += `<td rowspan="${Math.min(entries.length, 10)}">${programTitle}</td>`;
            }
            tableRows += `<td>${formattedDate}</td>`;
            tableRows += `<td style="text-align: center;"><span class="program-history-score" data-score="${entry.score}">${entry.score}</span></td>`;
            tableRows += `</tr>`;
        });
    });
    
    return `
        <h2 style="color: #FF6B6B; border-bottom-color: #FF6B6B50;">Istoric Programe Recente</h2>
        <div class="summary-box" style="border-left-color: #FF6B6B; background: #fff5f5;">
            <table style="box-shadow: none;">
                <thead><tr style="background: #fee2e2; color: #991b1b;"><th>Program</th><th>Data</th><th style="text-align: center;">Scor</th></tr></thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

// --- Helpers copiate din evolutionService.js ---

function getAgeInMonths(birthDate, evalDate) {
    const birth = new Date(birthDate);
    const evalD = evalDate ? new Date(evalDate) : new Date();
    let months = (evalD.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += evalD.getMonth();
    return months <= 0 ? 0 : months;
}

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

function formatAgeInYearsMonths(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return formatYearsMonths(years, months);
}

// --- END NEW HELPERS ---


// --- HELPERS ---

function getRoleLabel(role) {
    const roles = { 'therapist': 'Terapeut', 'coordinator': 'Coordonator', 'admin': 'Admin' };
    return roles[role] || role;
}

function getEventTypeLabel(type) {
    const types = {
        'therapy': 'Terapie',
        'group-therapy': 'Terapie de grup',
        'coordination': 'Coordonare',
        'day-off': 'Zi liberă',
        'pauza-masa': 'Pauză de masă',
        'sedinta': 'Ședință'
    };
    return types[type] || type;
}