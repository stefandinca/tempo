<?php
// Include conexiunea la DB
include 'db.php';

echo "Începere migrare...<br>";

try {
    // 0. Dezactivează verificările cheilor străine și golește tabelele
    echo "Se golesc tabelele vechi...<br>";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE event_team_members;");
    $pdo->exec("TRUNCATE TABLE event_clients;");
    $pdo->exec("TRUNCATE TABLE event_programs;");
    $pdo->exec("TRUNCATE TABLE program_history;");
    $pdo->exec("TRUNCATE TABLE portage_evaluations;");
    $pdo->exec("TRUNCATE TABLE logopedic_evaluations;");
    $pdo->exec("TRUNCATE TABLE monthly_themes;");
    $pdo->exec("TRUNCATE TABLE payments;");
    $pdo->exec("TRUNCATE TABLE events;");
    $pdo->exec("TRUNCATE TABLE clients;");
    $pdo->exec("TRUNCATE TABLE team_members;");
    $pdo->exec("TRUNCATE TABLE programs;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    echo "Tabelele au fost golite.<br><br>";


    // --- Migrare data.json ---
    $data = json_decode(file_get_contents('data.json'), true);
    
    // --- Migrare programs.json ---
    $programsData = json_decode(file_get_contents('programs.json'), true);
    $all_programs = $programsData['programs'] ?? [];

    // --- Migrare evolution.json ---
    $evoData = json_decode(file_get_contents('evolution.json'), true);
    
    // --- Migrare billings.json ---
    $billData = json_decode(file_get_contents('billings.json'), true);


    // CREEAZĂ LISTE DE VALIDARE
    $valid_team_ids = array_column($data['teamMembers'], 'id');
    $valid_client_ids = array_column($data['clients'], 'id');
    $valid_program_ids = array_column($all_programs, 'id');


    echo "Migrare Team Members...<br>";
    $stmt = $pdo->prepare("INSERT INTO team_members (id, name, color, initials, role) VALUES (?, ?, ?, ?, ?)");
    foreach ($data['teamMembers'] as $m) {
        $stmt->execute([$m['id'], $m['name'], $m['color'], $m['initials'], $m['role']]);
    }

    echo "Migrare Clients...<br>";
    $stmt = $pdo->prepare("INSERT INTO clients (id, name, email, phone, birthDate, medical) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($data['clients'] as $c) {
        $birthDate = !empty($c['birthDate']) ? $c['birthDate'] : null;
        $medical = $c['medical'] ?? ($c['Alergii sau medicatie'] ?? null); // Verifică și noul câmp
        $stmt->execute([$c['id'], $c['name'], $c['email'], $c['phone'], $birthDate, $medical]);
    }
    
    echo "Migrare Programs...<br>";
    $stmt = $pdo->prepare("INSERT INTO programs (id, title, description) VALUES (?, ?, ?)");
    foreach ($all_programs as $p) {
        $stmt->execute([$p['id'], $p['title'], $p['description']]);
    }

    echo "Migrare Events...<br>";
    $stmt_evt = $pdo->prepare("INSERT INTO events (id, name, details, type, date, startTime, duration, isPublic, isBillable, repeating_json, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_evt_team = $pdo->prepare("INSERT INTO event_team_members (event_id, team_member_id) VALUES (?, ?)");
    $stmt_evt_client = $pdo->prepare("INSERT INTO event_clients (event_id, client_id) VALUES (?, ?)");
    $stmt_evt_prog = $pdo->prepare("INSERT INTO event_programs (event_id, program_id) VALUES (?, ?)");

    foreach ($data['events'] as $e) {
        // Asigură-te că event ID nu e gol
        if (empty($e['id'])) continue; 

        $stmt_evt->execute([
            $e['id'], $e['name'] ?? null, $e['details'] ?? null, $e['type'] ?? 'therapy', 
            $e['date'], $e['startTime'] ?? null, $e['duration'] ?? null,
            isset($e['isPublic']) ? (int)$e['isPublic'] : 0, 
            isset($e['isBillable']) ? (int)$e['isBillable'] : 1, 
            json_encode($e['repeating'] ?? []), $e['comments'] ?? null
        ]);
        
        // **AICI ESTE CORECȚIA**
        foreach ($e['teamMemberIds'] ?? [] as $id) { 
            if (in_array($id, $valid_team_ids)) { // Verifică dacă ID-ul există
                $stmt_evt_team->execute([$e['id'], $id]); 
            }
        }
        foreach ($e['clientIds'] ?? [] as $id) { 
            if (in_array($id, $valid_client_ids)) { // Verifică dacă ID-ul există
                $stmt_evt_client->execute([$e['id'], $id]); // Aici se producea eroarea
            }
        }
        foreach ($e['programIds'] ?? [] as $id) { 
            if (in_array($id, $valid_program_ids)) { // Verifică dacă ID-ul există
                $stmt_evt_prog->execute([$e['id'], $id]); 
            }
        }
    }

    echo "Migrare Evolution Data...<br>";
    $stmt_portage = $pdo->prepare("INSERT INTO portage_evaluations (client_id, domain, eval_date, score) VALUES (?, ?, ?, ?)");
    $stmt_history = $pdo->prepare("INSERT INTO program_history (client_id, event_id, program_id, score, eval_date) VALUES (?, ?, ?, ?, ?)");
    $stmt_logo = $pdo->prepare("INSERT INTO logopedic_evaluations (client_id, eval_date, scores_json, comments) VALUES (?, ?, ?, ?)");
    $stmt_theme = $pdo->prepare("INSERT INTO monthly_themes (client_id, month_key, theme_text) VALUES (?, ?, ?)");

    foreach ($evoData as $clientId => $clientData) {
        // Verifică dacă clientul există înainte de a adăuga date
        if (!in_array($clientId, $valid_client_ids)) continue;

        foreach ($clientData['evaluations'] ?? [] as $domain => $dates) {
            foreach ($dates as $date => $score) {
                $stmt_portage->execute([$clientId, $domain, $date, $score]);
            }
        }
        foreach ($clientData['programHistory'] ?? [] as $entry) {
            // Verifică dacă programul există
            if (in_array($entry['programId'], $valid_program_ids)) {
                $stmt_history->execute([$clientId, $entry['eventId'] ?? null, $entry['programId'], $entry['score'], $entry['date']]);
            }
        }
        foreach ($clientData['evaluationsLogopedica'] ?? [] as $date => $entry) {
            $stmt_logo->execute([$clientId, $date, json_encode($entry['scores']), $entry['comments']]);
        }
        foreach ($clientData['monthlyThemes'] ?? [] as $monthKey => $text) {
            $stmt_theme->execute([$clientId, $monthKey, $text]);
        }
    }

    echo "Migrare Billings...<br>";
    $stmt = $pdo->prepare("INSERT INTO payments (id, client_id, month_key, payment_date, amount, notes) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($billData as $clientId => $months) {
        // Verifică dacă clientul există
        if (!in_array($clientId, $valid_client_ids)) continue;

        foreach ($months as $monthKey => $payments) {
            foreach ($payments as $payment) {
                $stmt->execute([$payment['id'], $clientId, $monthKey, $payment['date'], $payment['amount'], $payment['notes']]);
            }
        }
    }
    
    echo "<br><b>MIGRARE COMPLETĂ!</b>";

} catch (Exception $e) {
    echo "EROARE ÎN TIMPUL MIGRĂRII: " . $e->getMessage();
}
?>