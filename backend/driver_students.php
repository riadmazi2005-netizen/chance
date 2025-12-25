<?php
// driver_students.php - Récupération de la liste des élèves du chauffeur
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

if (!isset($_GET['driver_id'])) {
    sendError('ID du chauffeur requis');
}

$driverId = $_GET['driver_id'];

try {
    // Récupérer le bus du chauffeur
    $stmt = $pdo->prepare("
        SELECT id, bus_id
        FROM buses
        WHERE driver_id = :driver_id
        LIMIT 1
    ");
    $stmt->execute(['driver_id' => $driverId]);
    $bus = $stmt->fetch();

    if (!$bus) {
        sendResponse(['students' => [], 'bus' => null]);
        exit;
    }

    // Récupérer tous les élèves approuvés du bus avec leurs tuteurs
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.first_name as firstName,
            s.last_name as lastName,
            s.class,
            s.age,
            s.gender,
            s.zone as quarter,
            s.transport_type as transportType,
            s.subscription_type as subscriptionType,
            s.bus_group as busGroup,
            s.absence_count as absenceCount,
            s.payment_status as paymentStatus,
            s.tutor_id as tutorId,
            ut.phone as tutorPhone,
            ut.email as tutorEmail,
            CONCAT(ut.first_name, ' ', ut.last_name) as tutorName
        FROM students s
        INNER JOIN tutors t ON s.tutor_id = t.id
        INNER JOIN users ut ON t.user_id = ut.id
        WHERE s.bus_id = :bus_id AND s.status = 'approved'
        ORDER BY s.last_name, s.first_name
    ");
    $stmt->execute(['bus_id' => $bus['id']]);
    $students = $stmt->fetchAll();

    // Convertir les valeurs numériques
    foreach ($students as &$student) {
        $student['age'] = (int)$student['age'];
        $student['absenceCount'] = (int)$student['absenceCount'];
    }

    sendResponse([
        'students' => $students,
        'bus' => [
            'id' => $bus['id'],
            'busId' => $bus['bus_id']
        ]
    ]);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des élèves', 500);
}
?>