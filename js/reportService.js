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
 * Generează și descarcă un raport PDF pentru un client.
 * @param {string} clientId
 */
export function downloadClientReport(clientId) {
    const { clients } = calendarState.getState();
    const client = calendarState.getClientById(clientId);
    if (!client) {
        showCustomAlert('Clientul nu a fost găsit.', 'Eroare');
        return;
    }

    const reportData = generateClientReportData(clientId);
    if (!reportData) {
        showCustomAlert('Nu s-au găsit date pentru acest client în luna curentă.', 'Eroare');
        return;
    }

    const htmlReport = generateClientHTML(reportData);
    generatePdfFromHtml(htmlReport, `Raport_${client.name.replace(/\s+/g, '_')}`);
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
        `Într-o implementare completă, raportul PDF ar fi generat și trimis la:\n${client.email}\n\n` +
        `Acest lucru necesită un API de backend (ex: api.php) configurat cu un serviciu de trimitere email (SMTP, SendGrid, etc.).\n\n` +
        `Deocamdată, folosiți butonul "Descarcă Raport" pentru a salva PDF-ul manual.`,
        'Funcționalitate Neimplementată'
    );
}

// --- LOGICA INTERNĂ DE GENERARE RAPORT CLIENT ---

function generateClientReportData(clientId) {
    const { events, teamMembers, clients, currentDate } = calendarState.getState();
    const client = calendarState.getClientById(clientId);
    if (!client) return null;

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

    if (clientEvents.length === 0) return null;

    const billableEvents = clientEvents.filter(e => e.isBillable !== false);
    const nonBillableEvents = clientEvents.filter(e => e.isBillable === false);

    const billableData = processEventsForClientReport(billableEvents, clientId);
    const nonBillableData = processEventsForClientReport(nonBillableEvents, clientId);

    return { client, billable: billableData, nonBillable: nonBillableData, currentDate };
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

function generateClientHTML(reportData) {
    const { client, billable, nonBillable, currentDate } = reportData;
    const monthName = currentDate.toLocaleString('ro-RO', { month: 'long', year: 'numeric' });

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
                        <tr>
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

    const billableSection = createSummaryTable('Sesiuni Facturabile', billable, '#3b82f6');
    const nonBillableSection = createSummaryTable('Sesiuni Non-Facturabile (Gratuite/Admin)', nonBillable, '#6b7280');

    const combinedTotal = billable.grandTotal + nonBillable.grandTotal;
    const combinedPresent = billable.presentTotal + nonBillable.presentTotal;
    const combinedAbsent = billable.absentTotal + nonBillable.absentTotal;

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
                h2 { color: #1f2937; margin: 20px 0 10px 0; font-size: 22px; }
                .client-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4A90E2; }
                .client-info p { margin: 5px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                th { background: #4A90E2; color: white; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                tbody tr:nth-child(even) { background: #f9fafb; }
                tbody tr:hover { background: #f3f4f6; }
                .total-row td { font-weight: bold; font-size: 16px; padding: 15px 12px; }
                .summary-box { padding: 20px; margin: 20px 0; border-radius: 8px; border-left-width: 4px; border-left-style: solid; }
                .summary-box h3 { margin: 0 0 15px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div><h1>Raport Terapie</h1><p style="margin: 0; font-size: 16px;">${monthName}</p></div>
                <div style="text-align: right;"><p style="margin: 0; color: #6b7280;">Generat: ${new Date().toLocaleDateString('ro-RO')}</p></div>
            </div>
            <div class="client-info">
                <h2 style="margin-top: 0;">Informații Client</h2>
                <p><strong>Nume:</strong> ${client.name}</p>
                ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
                ${client.phone ? `<p><strong>Telefon:</strong> ${client.phone}</p>` : ''}
                ${client.birthDate ? `<p><strong>Data nașterii:</strong> ${new Date(client.birthDate).toLocaleDateString('ro-RO')}</p>` : ''}
            </div>
            ${billableSection}
            ${nonBillableSection}
            <div class="summary-box" style="border-left-color: #10b981; background: #f0fdf4;">
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
            </div>
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

function generatePdfFromHtml(htmlContent, filename) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    document.body.appendChild(tempDiv);
    
    const content = tempDiv.querySelector('body') || tempDiv;
    
    html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794, // A4 width in pixels
        windowWidth: 794
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save(`${filename}.pdf`);
        document.body.removeChild(tempDiv);
        showCustomAlert('Raportul PDF a fost descărcat!', 'Succes');
    }).catch(error => {
        console.error('Eroare la generarea PDF-ului:', error);
        document.body.removeChild(tempDiv);
        showCustomAlert('Eroare la generarea PDF-ului. Vă rugăm încercați din nou.', 'Eroare');
    });
}