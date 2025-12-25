<?php
// admin_absences.php - Statistiques et historique des absences
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

try {
    // Paramètres de filtrage optionnels
    $date = $_GET['date'] ?? null;
    $busId = $_GET['bus_id'] ?? null;
    $busGroup = $_GET['bus_group'] ?? null;
    $period = $_GET['period'] ?? null;

    // Construction de la requête avec filtres
    $where = ["a.status = 'absent'"];
    $params = [];

    if ($date) {
        $where[] = "a.date = :date";
        $params['date'] = $date;
    }
    if ($busId) {
        $where[] = "a.bus_id = :bus_id";
        $params['bus_id'] = $busId;
    }
    if ($busGroup) {
        $where[] = "a.bus_group = :bus_group";
        $params['bus_group'] = $busGroup;
    }
    if ($period) {
        $where[] = "a.period = :period";
        $params['period'] = $period;
    }

    $whereClause = implode(' AND ', $where);

    // Récupérer les absences avec détails
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.student_id as studentId,
            a.bus_id as busId,
            a.date,
            a.period,
            a.status,
            a.bus_group as busGroup,
            s.first_name as studentFirstName,
            s.last_name as studentLastName,
            s.class as studentClass,
            s.gender as studentGender,
            b.bus_id as busName
        FROM attendance a
        INNER JOIN students s ON a.student_id = s.id
        INNER JOIN buses b ON a.bus_id = b.id
        WHERE $whereClause
        ORDER BY a.date DESC, a.created_at DESC
        LIMIT 500
    ");
    $stmt->execute($params);
    $absences = $stmt->fetchAll();

    // Enrichir les données
    foreach ($absences as &$absence) {
        $absence['studentName'] = $absence['studentFirstName'] . ' ' . $absence['studentLastName'];
        unset($absence['studentFirstName'], $absence['studentLastName']);
    }

    // Statistiques globales
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as totalAbsences,
            COUNT(DISTINCT student_id) as studentsWithAbsences
        FROM attendance
        WHERE status = 'absent'
    ");
    $globalStats = $stmt->fetch();

    $stmt = $pdo->query("
        SELECT COUNT(*) as totalPresences
        FROM attendance
        WHERE status = 'present'
    ");
    $presenceStats = $stmt->fetch();

    // Top 10 élèves les plus absents
    $stmt = $pdo->query("
        SELECT 
            s.id,
            CONCAT(s.first_name, ' ', s.last_name) as name,
            s.class,
            COUNT(a.id) as absences
        FROM students s
        INNER JOIN attendance a ON s.id = a.student_id
        WHERE a.status = 'absent'
        GROUP BY s.id
        ORDER BY absences DESC
        LIMIT 10
    ");
    $mostAbsent = $stmt->fetchAll();

    foreach ($mostAbsent as &$student) {
        $student['absences'] = (int)$student['absences'];
    }

    // Top 10 élèves les plus présents (moins d'absences)
    $stmt = $pdo->query("
        SELECT 
            s.id,
            CONCAT(s.first_name, ' ', s.last_name) as name,
            s.class,
            s.absence_count as absences
        FROM students s
        WHERE s.status = 'approved'
        ORDER BY s.absence_count ASC
        LIMIT 10
    ");
    $mostPresent = $stmt->fetchAll();

    foreach ($mostPresent as &$student) {
        $student['absences'] = (int)$student['absences'];
    }

    // Statistiques par bus
    $stmt = $pdo->query("
        SELECT 
            b.bus_id as busName,
            COUNT(a.id) as absences
        FROM attendance a
        INNER JOIN buses b ON a.bus_id = b.id
        WHERE a.status = 'absent'
        GROUP BY b.id
        ORDER BY absences DESC
    ");
    $absByBus = $stmt->fetchAll();

    $response = [
        'absences' => $absences,
        'stats' => [
            'totalAbsences' => (int)$globalStats['totalAbsences'],
            'totalPresences' => (int)$presenceStats['totalPresences'],
            'studentsWithAbsences' => (int)$globalStats['studentsWithAbsences']
        ],
        'mostAbsent' => $mostAbsent,
        'mostPresent' => $mostPresent,
        'byBus' => $absByBus
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des absences', 500);
}
?>