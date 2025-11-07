<?php
// --- CONFIGURARE ---

// Terapeutii (din users.sql)
$team_members = ['alexandra', 'corina', 'dana', 'daniela'];

// Noii clienți (din clients (1).sql)
$client_ids = [
    'ana0812', 'cecilia2809', 'cella2211', 'constantin1902', 'elena1010', 
    'lucian0905', 'magda0704', 'mihai1501', 'nicolae1505', 'theodor0103'
];

$client_names = [
    'ana0812' => 'Ana Blandiana (Demo)',
    'cecilia2809' => 'Cecilia Storck (Demo)',
    'cella2211' => 'Cella Serghi (Demo)',
    'constantin1902' => 'Constantin Brancusi (Demo)',
    'elena1010' => 'Elena Farago (Demo)',
    'lucian0905' => 'Lucian Blaga (Demo)',
    'magda0704' => 'Magda Isanos (Demo)',
    'mihai1501' => 'Mihai Eminescu (Demo)',
    'nicolae1505' => 'Nicolae Grigorescu (Demo)',
    'theodor0103' => 'Theodor Aman (Demo)'
];

$year = 2025;
$month = 11; // Noiembrie
$work_start_hour = 9;
$work_end_hour = 19; // Termină la 19:00

// --- Program "recurent" simulat (actualizat cu noii clienți) ---
$repeating_schedule = [
    // Ziua 1 (Luni)
    ['client' => 'mihai1501', 'team' => 'corina', 'day' => 1, 'hour' => 9, 'duration' => 60],
    ['client' => 'theodor0103', 'team' => 'dana', 'day' => 1, 'hour' => 10, 'duration' => 120],
    ['client' => 'cecilia2809', 'team' => 'alexandra', 'day' => 1, 'hour' => 11, 'duration' => 60],
    ['client' => 'magda0704', 'team' => 'daniela', 'day' => 1, 'hour' => 14, 'duration' => 60],
    // Ziua 2 (Marți)
    ['client' => 'constantin1902', 'team' => 'corina', 'day' => 2, 'hour' => 10, 'duration' => 60],
    ['client' => 'nicolae1505', 'team' => 'daniela', 'day' => 2, 'hour' => 13, 'duration' => 120],
    ['client' => 'ana0812', 'team' => 'dana', 'day' => 2, 'hour' => 15, 'duration' => 60],
    // Ziua 3 (Miercuri)
    ['client' => 'mihai1501', 'team' => 'corina', 'day' => 3, 'hour' => 9, 'duration' => 60], // Repetiție
    ['client' => 'lucian0905', 'team' => 'alexandra', 'day' => 3, 'hour' => 11, 'duration' => 60],
    ['client' => 'elena1010', 'team' => 'daniela', 'day' => 3, 'hour' => 16, 'duration' => 60],
    // Ziua 4 (Joi)
    ['client' => 'constantin1902', 'team' => 'corina', 'day' => 4, 'hour' => 10, 'duration' => 60], // Repetiție
    ['client' => 'cella2211', 'team' => 'dana', 'day' => 4, 'hour' => 14, 'duration' => 120],
    // Ziua 5 (Vineri)
    ['client' => 'lucian0905', 'team' => 'alexandra', 'day' => 5, 'hour' => 11, 'duration' => 60], // Repetiție
    ['client' => 'elena1010', 'team' => 'daniela', 'day' => 5, 'hour' => 16, 'duration' => 60]  // Repetiție
];

// --- Inițializare script ---
header('Content-Type: text/plain');

// Golește tabelele de evenimente înainte de a insera altele noi
echo "-- Șterge evenimentele anterioare (demo)\n";
echo "SET FOREIGN_KEY_CHECKS = 0;\n";
echo "TRUNCATE TABLE events;\n";
echo "TRUNCATE TABLE event_clients;\n";
echo "TRUNCATE TABLE event_team_members;\n";
echo "SET FOREIGN_KEY_CHECKS = 1;\n\n";

echo "-- Începe generarea evenimentelor pentru Noiembrie 2025 --\n\n";

$start_date = new DateTime("$year-$month-01");
$end_date = new DateTime("$year-" . ($month + 1) . "-01");
$interval = new DateInterval('P1D');
$period = new DatePeriod($start_date, $interval, $end_date);

$event_inserts = [];
$team_inserts = [];
$client_inserts = [];

foreach ($period as $day) {
    $day_of_week = (int)$day->format('N'); // 1 (Luni) - 7 (Duminică)
    
    // Sărim peste weekend
    if ($day_of_week > 5) {
        continue;
    }

    $date_sql = $day->format('Y-m-d');
    
    // Pentru fiecare terapeut, umplem ziua
    foreach ($team_members as $team_member_id) {
        
        // Folosim un array pentru a marca orele ocupate (ex: 9, 10, 11...)
        $occupied_hours = [];
        
        // 1. Adaugă evenimentele "recurente" (fixe)
        foreach ($repeating_schedule as $item) {
            if ($item['day'] == $day_of_week && $item['team'] == $team_member_id) {
                $hour = $item['hour'];
                $duration = $item['duration'];
                
                // Verificăm dacă slotul e liber și nu depășește ora 19:00
                if (!isset($occupied_hours[$hour]) && ($hour + ($duration / 60)) <= $work_end_hour) {
                    $client_id = $item['client'];
                    $event_id = "evt_" . uniqid();
                    $start_time_sql = str_pad($hour, 2, '0', STR_PAD_LEFT) . ":00:00";
                    $event_name = "Terapie - " . $client_names[$client_id];

                    // Adaugă event
                    $event_inserts[] = "('$event_id', '$event_name', 'therapy', '$date_sql', '$start_time_sql', $duration, 0, 1, '[]')";
                    // Adaugă legăturile
                    $team_inserts[] = "('$event_id', '$team_member_id')";
                    $client_inserts[] = "('$event_id', '$client_id')";

                    // Marchează orele ca ocupate
                    for ($i = 0; $i < ($duration / 60); $i++) {
                        $occupied_hours[$hour + $i] = true;
                    }
                }
            }
        }
        
        // 2. Adaugă evenimente aleatorii pentru a umple 70%
        $current_hour = $work_start_hour;
        while ($current_hour < $work_end_hour) {
            
            // Dacă ora este deja ocupată, sărim peste ea
            if (isset($occupied_hours[$current_hour])) {
                $current_hour++;
                continue;
            }

            // Șansă de 70% de a umple un slot liber
            if (rand(1, 100) <= 70) {
                $duration = (rand(1, 100) <= 30) ? 120 : 60; // 30% șansă de 120 min
                
                // Ajustăm durata dacă depășește programul
                if (($current_hour + ($duration / 60)) > $work_end_hour) {
                    $duration = 60;
                }
                 // Dacă nici 60 min nu încap, oprim
                if (($current_hour + ($duration / 60)) > $work_end_hour) {
                    break;
                }

                $client_id = $client_ids[array_rand($client_ids)];
                $event_id = "evt_" . uniqid();
                $start_time_sql = str_pad($current_hour, 2, '0', STR_PAD_LEFT) . ":00:00";
                $event_name = (rand(1, 10) > 8) ? "Logopedie - " : "Terapie - "; // Diversificăm
                $event_name .= $client_names[$client_id];

                // Adaugă event
                $event_inserts[] = "('$event_id', '$event_name', 'therapy', '$date_sql', '$start_time_sql', $duration, 0, 1, '[]')";
                // Adaugă legăturile
                $team_inserts[] = "('$event_id', '$team_member_id')";
                $client_inserts[] = "('$event_id', '$client_id')";

                // Marchează orele ca ocupate și avansăm
                for ($i = 0; $i < ($duration / 60); $i++) {
                    $occupied_hours[$current_hour + $i] = true;
                }
                $current_hour += ($duration / 60);

            } else {
                // Lăsăm slotul liber și trecem la ora următoare
                $current_hour++;
            }
        }
    }
}

// --- Afișează SQL-ul final ---

echo "-- Inserare în tabela 'events' (" . count($event_inserts) . " înregistrări)\n";
echo "INSERT INTO `events` (`id`, `name`, `type`, `date`, `startTime`, `duration`, `isPublic`, `isBillable`, `repeating_json`) VALUES \n";
echo implode(",\n", $event_inserts) . ";\n\n";

echo "-- Inserare în tabela 'event_team_members' (" . count($team_inserts) . " înregistrări)\n";
echo "INSERT INTO `event_team_members` (`event_id`, `team_member_id`) VALUES \n";
echo implode(",\n", $team_inserts) . ";\n\n";

echo "-- Inserare în tabela 'event_clients' (" . count($client_inserts) . " înregistrări)\n";
echo "INSERT INTO `event_clients` (`event_id`, `client_id`) VALUES \n";
echo implode(",\n", $client_inserts) . ";\n\n";

echo "-- Gata! --\n";

?>