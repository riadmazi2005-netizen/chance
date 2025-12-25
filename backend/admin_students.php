<?php
// admin_students.php - Liste de tous les élèves approuvés
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

try {
    $stmt = $pdo->query("
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
            ut.cin as tutorCin,
            CONCAT(ut.first_name, ' ', ut.last_name) as tutorName,
            b.bus_id as busName
        FROM students s
        INNER JOIN tutors t ON s.tutor_id = t.id
        INNER JOIN users ut ON t.user_id = ut.id
        LEFT JOIN buses b ON s.bus_id = b.id
        WHERE s.status = 'approved'
        ORDER BY s.last_name, s.first_name
    ");
    
    $students = $stmt->fetchAll();

    // Convertir les valeurs
    foreach ($students as &$student) {
        $student['age'] = (int)$student['age'];
        $student['absenceCount'] = (int)$student['absenceCount'];
    }

    sendResponse(['students' => $students]);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des élèves', 500);
}
?>